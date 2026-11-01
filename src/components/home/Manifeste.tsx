import { manifesto } from "@/content/home";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

export function Manifeste() {
  return (
    <Section id="manifeste" labelledBy="manifeste-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] lg:items-end lg:gap-20">
        <div>
          <SectionHeading id="manifeste-title" eyebrow={manifesto.eyebrow} title={manifesto.title} accent={manifesto.accent} />
          <Reveal as="p" className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            {manifesto.text}
          </Reveal>
        </div>
        <RevealGroup as="ol" className="grid gap-4 sm:grid-cols-3" interval={0.1} delay={0.15}>
          {manifesto.steps.map((step) => (
            <RevealItem as="li" key={step.index} className="surface-card h-full p-6">
              <span className="font-display text-sm font-semibold text-accent-text">{step.index}</span>
              <h3 className="mt-4 text-xl font-semibold text-fg">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}
