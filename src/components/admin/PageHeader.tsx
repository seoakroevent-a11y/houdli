import type { ReactNode } from "react";

export function PageHeader({ title, text }: { title: string; text?: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="font-display text-2xl font-bold uppercase tracking-[0.14em] text-white sm:text-3xl">{title}</h1>
      {text ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{text}</p> : null}
    </header>
  );
}
