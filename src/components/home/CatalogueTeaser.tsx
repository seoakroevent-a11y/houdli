import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { catalogueSection } from "@/content/home";
import { activites } from "@/content/activites";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SmartLink } from "@/components/ui/SmartLink";

const featured = ["la-fresque-geante", "squid-game", "olympiades", "master-chef", "la-chasse-au-tresor", "logo-humain"]
  .map((slug) => activites.find((a) => a.slug === slug))
  .filter((a): a is NonNullable<typeof a> => Boolean(a));

export function CatalogueTeaser() {
  return (
    <Section id="catalogue" labelledBy="catalogue-title">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <SectionHeading id="catalogue-title" eyebrow={catalogueSection.eyebrow} title={catalogueSection.title} accent={catalogueSection.accent} />
        <p className="max-w-md text-base leading-relaxed text-muted">{catalogueSection.text}</p>
      </div>

      <RevealGroup as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" interval={0.08}>
        {featured.map((a, i) => (
          <RevealItem as="li" key={a.slug}>
            <SmartLink
              href={`/activites/${a.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-xl2)]"
            >
              <Image
                src={a.image}
                alt={a.alt}
                fill
                quality={70}
                loading={i < 3 ? "eager" : undefined}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
              />
              <div aria-hidden="true" className="image-veil absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/70">
                  Réf. {a.ref} · {a.category}
                </span>
                <h3 className="mt-1 text-xl font-semibold">{a.title}</h3>
              </div>
            </SmartLink>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-10 flex justify-center">
        <Button href="/activites" variant="outline" size="lg">
          Voir les 30 activités
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </Reveal>
    </Section>
  );
}
