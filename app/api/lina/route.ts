import { NextResponse } from "next/server";
import { z } from "zod";
import { linaPrompt, linaTools } from "@/lib/lina";
import { linaLanguages, type LinaLanguage } from "@/lib/lina-languages";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

const MAX_BODY = 60_000;
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const FALLBACK_MODEL = "gemini-flash-lite-latest";
const rateLimited = createRateLimiter(30);

const part = z.object({
  text: z.string().max(2_000).optional(),
  functionCall: z
    .object({ id: z.string().max(100).optional(), name: z.string().max(60), args: z.record(z.string(), z.unknown()).optional() })
    .optional(),
  functionResponse: z
    .object({ id: z.string().max(100).optional(), name: z.string().max(60), response: z.record(z.string(), z.unknown()) })
    .optional(),
  thoughtSignature: z.string().max(20_000).optional(),
});

const bodySchema = z.object({
  language: z.enum(Object.keys(linaLanguages) as [LinaLanguage, ...LinaLanguage[]]),
  contents: z
    .array(z.object({ role: z.enum(["user", "model"]), parts: z.array(part).min(1).max(8) }))
    .min(1)
    .max(60),
});

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "too_long" }, { status: 413 });
  let parsed;
  try {
    parsed = bodySchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { language, contents } = parsed.data;

  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: `${linaPrompt(language)}\n\nVous avez déjà accueilli la personne avec : « ${linaLanguages[language].greeting} »` }],
    },
    contents,
    tools: [{ functionDeclarations: linaTools }],
    generationConfig: { maxOutputTokens: 800, thinkingConfig: { thinkingLevel: "minimal" } },
  });

  let response: Response | null = null;
  const failures: string[] = [];
  for (const model of [process.env.GEMINI_MODEL || DEFAULT_MODEL, FALLBACK_MODEL]) {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body,
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null);
    if (response?.ok) break;
    failures.push(`${model}:${response?.status ?? "timeout"}`);
    console.error(`[lina] ${model} a refusé la requête :`, response?.status ?? "délai dépassé", response ? (await response.text()).slice(0, 200) : "");
  }

  if (!response?.ok) {
    return NextResponse.json({ error: response?.status === 429 ? "quota" : "unavailable", failures }, { status: 503 });
  }
  const data = await response.json();
  const content = data.candidates?.[0]?.content;
  if (!content?.parts?.length) return NextResponse.json({ error: "empty" }, { status: 502 });
  return NextResponse.json({ content: { role: "model", parts: content.parts } });
}
