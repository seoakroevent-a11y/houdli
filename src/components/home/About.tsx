import { about } from "@/content/home";
import { images } from "@/lib/images";
import { yearsOfExperience } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem, Reveal } from "@/components/ui/Reveal";
import { RevealImage } from "@/components/ui/RevealImage";

export function About() {
  const emphasize = (text: string) => {
    if (!text.includes(about.highlight)) return text;
    const [before, after] = text.split(about.highlight);
    return (
      <>
        {before}
        <strong className="font-medium text-fg">{about.highlight}</strong>
        {after}
      </>
    );
  };

  return (
    <Section id="apropos" labelledBy="about-title">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading id="about-title" eyebrow={about.eyebrow} title={`${about.title} ${about.accent}`} accent={about.accent} />
          <RevealGroup className="mt-8 space-y-5 text-base leading-relaxed text-muted sm:text-[1.05rem]" interval={0.1} delay={0.2}>
            {about.paragraphs.map((paragraph) => (
              <RevealItem key={paragraph}>
                <p>{emphasize(paragraph)}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.45} className="mt-8 flex flex-wrap gap-2">
            {about.values.map((value) => (
              <span key={value} className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted">
                {value}
              </span>
            ))}
          </Reveal>
        </div>

        <div className="relative">
          <RevealImage
            src={images.about.src}
            alt={images.about.alt}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/5] w-full sm:aspect-[5/4] lg:aspect-[4/5]"
            veil
          />
          <Reveal
            delay={0.5}
            className="absolute -bottom-6 left-4 right-4 rounded-[20px] border border-white/10 bg-black/55 p-6 text-white shadow-lift backdrop-blur-xl sm:left-auto sm:right-6 sm:w-72"
          >
            <p className="font-display text-6xl font-bold leading-none tracking-tight">
              {yearsOfExperience}
              <span className="text-[#4A82EA]">+</span>
            </p>
            <p className="mt-3 font-display text-lg font-semibold">{about.badgeTitle}</p>
            <p className="mt-1 text-sm text-white/70">{about.badgeText}</p>
          </Reveal>
          <div aria-hidden="true" className="accent-glow pointer-events-none absolute -right-20 -top-20 -z-10 h-72 w-72" />
        </div>
      </div>
    </Section>
  );
}
