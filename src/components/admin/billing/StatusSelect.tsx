"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string>;
  value: string;
  options: { value: string; label: string }[];
  tone: Record<string, string>;
  label: string;
};

export function StatusSelect({ action, hidden, value, options, tone, label }: Props) {
  return (
    <form action={action} className="relative inline-block">
      {Object.entries(hidden).map(([name, val]) => (
        <input key={name} type="hidden" name={name} value={val} />
      ))}
      <select
        name="status"
        defaultValue={value}
        aria-label={label}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={cn(
          "cursor-pointer appearance-none rounded-md border bg-black py-2 pl-3 pr-8 text-[0.68rem] font-semibold uppercase tracking-[0.14em] outline-none transition focus:ring-2 focus:ring-[#4A82EA]/30",
          tone[value],
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#111111] text-white">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70" />
    </form>
  );
}
