import { whyHoudli } from "@/content/home";
import { images } from "@/lib/images";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { RevealImage } from "@/components/ui/RevealImage";
import { featureIcons } from "./icons";

export function WhyHoudli() {
  const [main, second, third] = images.why;

  return (
    <Section tone="alt" labelledBy="why-title">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <RevealImage src={main.src} alt={main.alt} sizes="(max-width: 1024px) 100vw, 50vw" className="col-span-2 aspect-[16/10]" />
          <RevealImage src={second.src} alt={second.alt} sizes="(max-width: 1024px) 50vw, 25vw" className="aspect-[4/5]" delay={0.15} />
          <RevealImage src={third.src} alt={third.alt} sizes="(max-width: 1024px) 50vw, 25vw" className="aspect-[4/5]" delay={0.3} />
        </div>

        <div>
          <SectionHeading id="why-title" eyebrow={whyHoudli.eyebrow} title={whyHoudli.title} accent={whyHoudli.accent} />
          <RevealGroup as="ul" className="mt-10 space-y-4" interval={0.12} delay={0.2}>
            {whyHoudli.items.map((item) => {
              const Icon = featureIcons[item.icon];
              return (
                <RevealItem as="li" key={item.title}>
                  <div className="surface-card flex gap-5 p-6 transition-[transform,border-color] duration-500 hover:translate-x-1 hover:border-accent/30">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/30 text-accent-text">
                      <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-fg">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.text}</p>
                    </div>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </Section>
  );
}
