import { ChevronDown, Clock, Globe, MessageCircle, MousePointerClick } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { ConversationAudio } from "@/components/admin/ConversationAudio";
import { formatInquiryDate } from "@/lib/admin/inquiries";
import { deleteConversation } from "@/lib/admin/session";
import type { TranscriptEntry } from "@/lib/lina-conversations";
import { linaLanguages, type LinaLanguage } from "@/lib/lina-languages";

export type ConversationRow = {
  id: string;
  language: LinaLanguage;
  started_at: string;
  duration_seconds: number;
  page: string | null;
  transcript: TranscriptEntry[];
  audio_path: string | null;
};

function duration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} min ${String(seconds % 60).padStart(2, "0")}` : `${seconds} s`;
}

function timestamp(at: number) {
  const seconds = Math.floor(at);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function Bubble({ entry, rtl }: { entry: TranscriptEntry; rtl: boolean }) {
  if (entry.role === "action") {
    return (
      <li className="flex justify-center">
        <span className="inline-flex max-w-[90%] items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-xs text-amber-100/80">
          <MousePointerClick size={12} aria-hidden="true" />
          {entry.text}
        </span>
      </li>
    );
  }
  const client = entry.role === "client";
  return (
    <li className={client ? "flex flex-col items-end" : "flex flex-col items-start"}>
      <span className="mb-1 px-1 text-[0.65rem] uppercase tracking-[0.14em] text-white/35">
        {client ? "Client" : "Lina"} · {timestamp(entry.at)}
      </span>
      <p
        dir={rtl ? "rtl" : undefined}
        className={
          client
            ? "max-w-[min(34rem,85%)] rounded-2xl rounded-tr-md bg-white px-4 py-2.5 text-sm leading-relaxed text-[#0A0A0A]"
            : "max-w-[min(34rem,85%)] rounded-2xl rounded-tl-md border border-[#2d66d2]/30 bg-[#2d66d2]/15 px-4 py-2.5 text-sm leading-relaxed text-white"
        }
      >
        {entry.text}
      </p>
    </li>
  );
}

export function ConversationList({ rows, audioUrls }: { rows: ConversationRow[]; audioUrls: Map<string, string> }) {
  return (
    <ul className="flex max-w-4xl flex-col gap-3">
      {rows.map((row) => {
        const firstQuestion = row.transcript.find((entry) => entry.role === "client")?.text ?? "—";
        const exchanges = row.transcript.filter((entry) => entry.role === "client").length;
        const audioUrl = row.audio_path ? audioUrls.get(row.audio_path) : undefined;
        const rtl = row.language === "ar";
        return (
          <li key={row.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111] transition hover:border-white/20">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#7fbeff,#2d66d2_55%,#10145a)] text-white">
                  <MessageCircle size={17} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span dir={rtl ? "rtl" : undefined} className="block truncate text-[0.95rem] font-medium text-white">
                    {firstQuestion}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
                    <span>{formatInquiryDate(row.started_at)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Globe size={12} aria-hidden="true" />
                      {linaLanguages[row.language]?.label ?? row.language}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} aria-hidden="true" />
                      {duration(row.duration_seconds)}
                    </span>
                    <span>
                      {exchanges} message{exchanges > 1 ? "s" : ""} du client
                    </span>
                  </span>
                </span>
                <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-white/40 transition group-open:rotate-180" />
              </summary>

              <div className="border-t border-white/10 bg-black/20 px-5 py-5">
                {audioUrl ? (
                  <ConversationAudio src={audioUrl} fallbackDuration={row.duration_seconds} />
                ) : (
                  <p className="text-xs text-white/45">Pas d&apos;audio pour cette conversation.</p>
                )}
                <ol className="mt-6 flex flex-col gap-4">
                  {row.transcript.map((entry, index) => (
                    <Bubble key={index} entry={entry} rtl={rtl} />
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="text-xs text-white/40">{row.page ? `Commencée sur la page ${row.page === "/" ? "d'accueil" : row.page}` : null}</span>
                  <form action={deleteConversation}>
                    <input type="hidden" name="id" value={row.id} />
                    <ConfirmSubmit label="Supprimer cette conversation et son audio ?" />
                  </form>
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
