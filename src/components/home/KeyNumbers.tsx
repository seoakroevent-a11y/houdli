import { keyNumbers } from "@/content/home";
import { stats } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";

export function KeyNumbers() {
  return (
    <Section labelledBy="numbers-title" className="overflow-hidden">
      <div aria-hidden="true" className="accent-glow pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 opacity-60" />
      <SectionHeading id="numbers-title" eyebrow={keyNumbers.eyebrow} title={keyNumbers.title} accent={keyNumbers.accent} align="center" />
      <RevealGroup as="ul" className="relative mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5" interval={0.08}>
        {stats.map((s, i) => (
          <RevealItem as="li" key={s.label} className={i === stats.length - 1 ? "col-span-2 lg:col-span-1" : undefined}>
            <div className="surface-card flex h-full flex-col items-center justify-center px-4 py-10 text-center">
              <Counter
                value={s.value}
                prefix={s.prefix}
                suffix={s.suffix}
                className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-bold leading-none tracking-tight text-fg"
              />
              <span aria-hidden="true" className="mt-5 h-[2px] w-8 rounded-full bg-accent" />
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-muted">{s.label}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
