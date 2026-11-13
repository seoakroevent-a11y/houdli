import { ConversationList, type ConversationRow } from "@/components/admin/ConversationList";
import { Flash } from "@/components/admin/Flash";
import { PageHeader } from "@/components/admin/PageHeader";
import { LINA_AUDIO_BUCKET, LINA_RETENTION_DAYS } from "@/lib/lina-conversations";
import { createServerSupabase } from "@/lib/supabase/server";

export const instant = false;

const SIGNED_URL_SECONDS = 60 * 60;

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const result = supabase
    ? await supabase
        .from("lina_conversations")
        .select("id,language,started_at,duration_seconds,page,transcript,audio_path")
        .order("started_at", { ascending: false })
        .limit(200)
    : null;
  const missingTable = Boolean(result?.error);
  const rows = (result?.data ?? []) as ConversationRow[];

  const paths = rows.flatMap((row) => (row.audio_path ? [row.audio_path] : []));
  const signed = supabase && paths.length ? await supabase.storage.from(LINA_AUDIO_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS) : null;
  const audioUrls = new Map((signed?.data ?? []).flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [])));

  return (
    <>
      <PageHeader
        title="Conversations Lina"
        text={`${rows.length} conversation${rows.length > 1 ? "s" : ""} avec l'agent vocal. Chaque appel est supprimé automatiquement après ${LINA_RETENTION_DAYS} jours.`}
      />
      <Flash ok={query.ok} error={query.error} />

      {missingTable ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          Les conversations ne sont pas encore activées : exécutez <code>supabase/conversations-lina.sql</code> dans Supabase → SQL Editor.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#111111] px-5 py-12 text-center text-sm text-white/50">
          Aucune conversation pour le moment.
        </p>
      ) : (
        <ConversationList rows={rows} audioUrls={audioUrls} />
      )}
    </>
  );
}
