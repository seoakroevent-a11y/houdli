import { NextResponse } from "next/server";
import { z } from "zod";
import { linaLanguages } from "@/lib/lina-languages";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

const MODELS = ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"];
const VOICE = "Kore";
const rateLimited = createRateLimiter(30);
const bodySchema = z.object({ text: z.string().trim().min(1).max(800) });

/** Les phrases d'accueil ne changent pas : on garde leur voix en mémoire au lieu de la régénérer à chaque appel. */
const greetings = new Set(Object.values(linaLanguages).map((language) => language.greeting.trim()));
const greetingCache = new Map<string, { bytes: Buffer; type: string }>();

function audioResponse({ bytes, type }: { bytes: Buffer; type: string }) {
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": type, "Cache-Control": "no-store" } });
}

/** Voix féminine de Lina, générée par Gemini. */
export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const cached = greetingCache.get(parsed.data.text);
  if (cached) return audioResponse(cached);

  for (const model of MODELS) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: parsed.data.text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
      signal: AbortSignal.timeout(12_000),
    }).catch(() => null);
    if (!response?.ok) {
      console.error(`[lina] ${model} a refusé la synthèse :`, response?.status ?? "délai dépassé");
      continue;
    }
    const data = await response.json();
    const audio = data.candidates?.[0]?.content?.parts?.find((part: { inlineData?: unknown }) => part.inlineData)?.inlineData;
    if (!audio?.data) continue;
    const voice = { bytes: Buffer.from(audio.data, "base64"), type: audio.mimeType || "audio/wav" };
    if (greetings.has(parsed.data.text)) greetingCache.set(parsed.data.text, voice);
    return audioResponse(voice);
  }
  return NextResponse.json({ error: "unavailable" }, { status: 503 });
}
