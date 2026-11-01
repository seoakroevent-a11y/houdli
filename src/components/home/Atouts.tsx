import { atouts } from "@/content/home";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Card } from "@/components/ui/Card";
import { featureIcons } from "./icons";

export function Atouts() {
  return (
    <Section tone="alt" labelledBy="atouts-title">
      <SectionHeading id="atouts-title" eyebrow={atouts.eyebrow} title={atouts.title} accent={atouts.accent} />
      <RevealGroup as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5" interval={0.1}>
        {atouts.items.map((item, i) => {
          const Icon = featureIcons[item.icon];
          return (
            <RevealItem as="li" key={item.title} className="h-full">
              <Card interactive className="group flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-text transition-colors duration-500 group-hover:bg-accent group-hover:text-white">
                    <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="font-display text-sm font-semibold text-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-fg">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.text}</p>
              </Card>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
