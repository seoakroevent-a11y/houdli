import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { getUnivers, universList, universSeo } from "@/content/univers";
import { images } from "@/lib/images";
import { getPublicSettings } from "@/lib/public-data";
import { breadcrumbJsonLd, jsonLdString, pageMetadata, serviceJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/univers/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { RevealImage } from "@/components/ui/RevealImage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SmartLink } from "@/components/ui/SmartLink";
import { CtaBanner } from "@/components/home/CtaBanner";

export function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const univers of universList) params.push({ slug: univers.slug });
  return params;
}

export async function generateMetadata({ params }: PageProps<"/univers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const univers = getUnivers(slug);
  if (!univers) return {};
  const { title, description } = universSeo[univers.slug];
  const visual = images.univers[univers.slug].src;
  return pageMetadata({ title, description, path: `/univers/${univers.slug}`, image: visual });
}

export default function UniversPage({ params }: PageProps<"/univers/[slug]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-[78svh] bg-black" />}>
      <UniversContent params={params} />
    </Suspense>
  );
}

async function UniversContent({ params }: { params: PageProps<"/univers/[slug]">["params"] }) {
  const { slug } = await params;
  const univers = getUnivers(slug);
  if (!univers) notFound();

  const { hasGallery } = await getPublicSettings();
  const hero = images.univers[univers.slug];
  const gallery = images.universGallery[univers.slug];
  const others = universList.filter((u) => u.slug !== univers.slug);
  const seo = universSeo[univers.slug];
  const path = `/univers/${univers.slug}`;
  const structuredData = [
    serviceJsonLd({ name: seo.title, serviceType: seo.serviceType, description: seo.description, path, image: hero.src }),
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: univers.title, path },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(structuredData) }} />
      <PageHero
        eyebrow={`Univers ${univers.index}`}
        title={univers.title}
        subtitle={univers.subtitle}
        image={hero}
        breadcrumb={[{ label: "Accueil", href: "/" }, { label: "Services", href: "/#services" }, { label: univers.title }]}
      />

      <Section labelledBy="intro-title">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionHeading id="intro-title" eyebrow="Notre approche" title={univers.subtitle} />
          <div>
            <Reveal as="p" className="text-lg leading-relaxed text-muted">
              {univers.description}
            </Reveal>
            <RevealGroup as="ul" className="mt-8 space-y-4" interval={0.1} delay={0.15}>
              {univers.details.map((d) => (
                <RevealItem as="li" key={d} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <Check size={14} aria-hidden="true" />
                  </span>
                  <span className="text-fg">{d}</span>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-3">
              <Button href="/#contact" size="lg">
                Demander un devis
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              {univers.slug === "team-building" ? (
                <Button href="/activites" size="lg" variant="outline">
                  Voir le catalogue 2026
                </Button>
              ) : null}
            </Reveal>
          </div>
        </div>
      </Section>

      <Section tone="alt" labelledBy="detail-title">
        <SectionHeading id="detail-title" eyebrow="En détail" title="Prestations, méthode et plus Houdli" accent="plus Houdli" />
        <RevealGroup as="ul" className="mt-14 grid gap-4 lg:grid-cols-3" interval={0.1}>
          {[
            { title: "Nos prestations", items: univers.prestations },
            { title: "Notre méthode", items: univers.method },
            { title: "Les + Houdli", items: univers.plus },
          ].map((block) => (
            <RevealItem as="li" key={block.title} className="h-full">
              <Card className="h-full">
                <h3 className="text-xl font-semibold text-fg">{block.title}</h3>
                <ul className="mt-5 space-y-2.5">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section tone="alt" labelledBy="offers-title">
        <SectionHeading id="offers-title" eyebrow="Nos formats" title="Ce que nous proposons" accent="proposons" />
        <RevealGroup as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" interval={0.08}>
          {univers.categories.map((cat, i) => (
            <RevealItem as="li" key={cat.label} className="h-full">
              <Card interactive className="h-full">
                <span className="font-display text-sm font-semibold text-accent-text">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-xl font-semibold text-fg">{cat.label}</h3>
                <ul className="mt-5 space-y-2.5">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section labelledBy="moments-title">
        <SectionHeading id="moments-title" eyebrow="En images" title="Quelques moments" accent="moments" />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {gallery.map((img, i) => (
            <RevealImage
              key={img.src}
              src={img.src}
              alt={img.alt}
              sizes="(max-width: 768px) 100vw, 33vw"
              className={i === 1 ? "aspect-[4/5] md:mt-12" : "aspect-[4/5]"}
              delay={i * 0.12}
            />
          ))}
        </div>
        {hasGallery ? (
          <Reveal className="mt-12 flex justify-center">
            <Button href="/galerie" variant="outline">
              Voir toute la galerie
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </Reveal>
        ) : null}
      </Section>

      <Section tone="alt" labelledBy="others-title">
        <SectionHeading id="others-title" eyebrow="Nos univers" title="Explorer nos autres univers" accent="autres univers" />
        <RevealGroup as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" interval={0.1}>
          {others.map((u) => {
            const img = images.univers[u.slug];
            return (
              <RevealItem as="li" key={u.slug}>
                <SmartLink
                  href={`/univers/${u.slug}`}
                  className="group relative flex aspect-[16/11] overflow-hidden rounded-[var(--radius-xl2)] transition-transform duration-500 hover:-translate-y-1.5"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    quality={70}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                  />
                  <div aria-hidden="true" className="image-veil absolute inset-0" />
                  <div aria-hidden="true" className="absolute inset-0 bg-accent/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-6 text-white">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">{u.index}</span>
                      <h3 className="mt-1 text-xl font-bold">{u.title}</h3>
                    </div>
                    <ArrowUpRight size={22} aria-hidden="true" className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                </SmartLink>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Section>

      <div className="pb-16 sm:pb-20">
        <CtaBanner />
      </div>
    </>
  );
}
