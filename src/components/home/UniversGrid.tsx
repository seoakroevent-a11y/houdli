import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { universSection } from "@/content/home";
import { universList } from "@/content/univers";
import { images } from "@/lib/images";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SmartLink } from "@/components/ui/SmartLink";

export function UniversGrid() {
  return (
    <Section id="univers" labelledBy="univers-title">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <SectionHeading id="univers-title" eyebrow={universSection.eyebrow} title={universSection.title} accent={universSection.accent} />
        <p className="max-w-md text-base leading-relaxed text-muted">{universSection.text}</p>
      </div>

      <RevealGroup as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" interval={0.1}>
        {universList.map((u) => {
          const img = images.univers[u.slug];
          return (
            <RevealItem as="li" key={u.slug}>
              <SmartLink
                href={`/univers/${u.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-xl2)] shadow-soft transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:shadow-lift focus-visible:-translate-y-2"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  quality={75}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                />
                <div aria-hidden="true" className="image-veil absolute inset-0" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-accent/85 via-accent/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                  <div className="flex items-start justify-between">
                    <span className="font-display text-sm font-semibold text-white/80">{u.index}</span>
                    <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-colors duration-500 group-hover:border-white group-hover:bg-white group-hover:text-accent">
                      <ArrowUpRight
                        size={18}
                        aria-hidden="true"
                        className="-translate-x-5 translate-y-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:translate-y-0"
                      />
                      <ArrowUpRight
                        size={18}
                        aria-hidden="true"
                        className="absolute transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-5 group-hover:-translate-y-5"
                      />
                    </span>
                  </div>
                  <div className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">{u.subtitle}</p>
                    <h3 className="mt-2 text-2xl font-bold leading-tight">{u.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">{u.short}</p>
                  </div>
                </div>
              </SmartLink>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
