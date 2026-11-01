import { method } from "@/content/home";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";

export function Method() {
  const steps = method.steps;
  if (!Array.isArray(steps)) return null;

  return (
    <Section id="methode" tone="alt" labelledBy="methode-title">
      <SectionHeading id="methode-title" eyebrow={method.eyebrow} title={method.title} accent={method.accent} />
      <RevealGroup as="ol" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6" interval={0.08}>
        {steps.map((step) => (
          <RevealItem as="li" key={step.index} className="relative h-full">
            <article className="surface-card flex h-full flex-col p-5 sm:p-6">
              <span className="font-display text-3xl font-bold tracking-tight text-accent-text">{step.index}</span>
              <h3 className="mt-6 text-lg font-semibold text-fg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
