import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

const MODELS = ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"];
const VOICE = "Kore";
const rateLimited = createRateLimiter(30);
const bodySchema = z.object({ text: z.string().trim().min(1).max(800) });

/** Voix féminine de Lina, générée par Gemini. */
export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

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
    return new Response(Buffer.from(audio.data, "base64"), {
      headers: { "Content-Type": audio.mimeType || "audio/wav", "Cache-Control": "no-store" },
    });
  }
  return NextResponse.json({ error: "unavailable" }, { status: 503 });
}
