"use client";

import { ChevronDown } from "lucide-react";
import { setInquiryStatus } from "@/lib/admin/session";
import { inquiryStatuses, inquiryStatusLabels, type InquiryStatus } from "@/lib/admin/inquiries";
import { cn } from "@/lib/utils";

const tone: Record<InquiryStatus, string> = {
  new: "border-[#4A82EA]/60 text-[#8FB2F5]",
  in_progress: "border-amber-400/50 text-amber-200",
  done: "border-emerald-500/50 text-emerald-300",
  archived: "border-white/15 text-white/55",
  spam: "border-red-400/40 text-red-300",
};

export function InquiryStatusSelect({ id, status, back }: { id: string; status: InquiryStatus; back: string }) {
  return (
    <form action={setInquiryStatus} className="relative inline-block">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Statut de la demande"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={cn(
          "cursor-pointer appearance-none rounded-md border bg-black py-2 pl-3 pr-8 text-[0.68rem] font-semibold uppercase tracking-[0.14em] outline-none transition focus:ring-2 focus:ring-[#4A82EA]/30",
          tone[status],
        )}
      >
        {inquiryStatuses.map((value) => (
          <option key={value} value={value} className="bg-[#111111] text-white">
            {inquiryStatusLabels[value]}
          </option>
        ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70" />
    </form>
  );
}
