import { after, NextResponse } from "next/server";
import { z } from "zod";
import { LINA_AUDIO_BUCKET, LINA_AUDIO_MAX_BYTES, LINA_RETENTION_DAYS } from "@/lib/lina-conversations";
import { linaLanguages, type LinaLanguage } from "@/lib/lina-languages";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/server";

const rateLimited = createRateLimiter(6);
const MAX_META = 120_000;

const conversationMetaSchema = z.object({
  language: z.enum(Object.keys(linaLanguages) as [LinaLanguage, ...LinaLanguage[]]),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  page: z.string().max(200).regex(/^\//).optional(),
  transcript: z
    .array(z.object({ role: z.enum(["client", "lina", "action"]), text: z.string().trim().min(1).max(2_000), at: z.number().min(0).max(3_600) }))
    .max(200),
});

type Supabase = NonNullable<ReturnType<typeof createServiceSupabase>>;

/** Vérifie la signature du fichier : on ne stocke que de vrais conteneurs audio. */
function audioType(bytes: Uint8Array) {
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "audio/webm";
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return "audio/ogg";
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "audio/mp4";
  return null;
}

const extensions = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a" } as const;

async function purgeExpired(supabase: Supabase) {
  const limit = new Date(Date.now() - LINA_RETENTION_DAYS * 86_400_000).toISOString();
  const { data } = await supabase.from("lina_conversations").select("id,audio_path").lt("started_at", limit).limit(200);
  if (!data?.length) return;
  const paths = data.flatMap((row) => (row.audio_path ? [row.audio_path] : []));
  if (paths.length) await supabase.storage.from(LINA_AUDIO_BUCKET).remove(paths);
  await supabase.from("lina_conversations").delete().in("id", data.map((row) => row.id));
}

/** Enregistre une conversation avec Lina : le texte des échanges et, si disponible, l'audio de l'appel. */
export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const rawMeta = form?.get("meta");
  if (typeof rawMeta !== "string" || rawMeta.length > MAX_META) return NextResponse.json({ error: "invalid" }, { status: 400 });
  let parsed;
  try {
    parsed = conversationMetaSchema.safeParse(JSON.parse(rawMeta));
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const meta = parsed.data;
  if (!meta.transcript.some((entry) => entry.role === "client")) return NextResponse.json({ ok: true, skipped: true });

  const started = new Date(meta.startedAt).getTime();
  const ended = new Date(meta.endedAt).getTime();
  const duration = Math.round((ended - started) / 1000);
  if (duration < 0 || duration > 3_600 || Math.abs(Date.now() - ended) > 10 * 60_000) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  let audioPath: string | null = null;
  const audio = form?.get("audio");
  if (audio instanceof File && audio.size > 0 && audio.size <= LINA_AUDIO_MAX_BYTES) {
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const type = audioType(bytes);
    if (type) {
      const path = `${meta.startedAt.slice(0, 7)}/${id}.${extensions[type]}`;
      const { error } = await supabase.storage.from(LINA_AUDIO_BUCKET).upload(path, bytes, { contentType: type, upsert: false });
      if (error) console.error("[lina] Audio non enregistré :", error.message);
      else audioPath = path;
    }
  }

  const { error } = await supabase.from("lina_conversations").insert({
    id,
    language: meta.language,
    started_at: meta.startedAt,
    ended_at: meta.endedAt,
    duration_seconds: duration,
    page: meta.page ?? null,
    transcript: meta.transcript,
    audio_path: audioPath,
  });
  if (error) {
    console.error("[lina] Conversation non enregistrée :", error.code, error.message);
    if (audioPath) await supabase.storage.from(LINA_AUDIO_BUCKET).remove([audioPath]);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  after(() => purgeExpired(supabase).catch((cause) => console.error("[lina] Purge des anciennes conversations :", cause)));
  return NextResponse.json({ ok: true });
}
