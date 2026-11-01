import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, Languages, MapPin, Users } from "lucide-react";
import { activites, getActivite, type Activite } from "@/content/activites";
import { breadcrumbJsonLd, jsonLdString, pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/univers/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SmartLink } from "@/components/ui/SmartLink";
import { CtaBanner } from "@/components/home/CtaBanner";

export function generateStaticParams() {
  return activites.map((a) => ({ slug: a.slug }));
}

type ActiviteParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: ActiviteParams }): Promise<Metadata> {
  const { slug } = await params;
  const activite = getActivite(slug);
  if (!activite) return {};
  const path = `/activites/${activite.slug}`;
  return pageMetadata({ title: activiteTitle(activite), description: activiteDescription(activite), path, image: activite.image });
}

function activiteTitle(activite: Activite) {
  const local = `${activite.title} — Team building au Maroc`;
  return local.length <= 51 ? local : `${activite.title} — Team building`;
}

function activiteDescription(activite: Activite) {
  const space = activite.space.map((s) => s.toLowerCase()).join(" et ");
  return `${activite.title} : team building ${activite.category.toLowerCase()} de ${activite.duration}, ${activite.participants}, en ${space}. Animé en arabe, français ou anglais, partout au Maroc.`;
}

export default function ActivitePage({ params }: { params: ActiviteParams }) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-[78svh] bg-black" />}>
      <ActiviteContent params={params} />
    </Suspense>
  );
}

async function ActiviteContent({ params }: { params: ActiviteParams }) {
  const { slug } = await params;
  const activite = getActivite(slug);
  if (!activite) notFound();

  const others = activites.filter((a) => a.category === activite.category && a.slug !== activite.slug).slice(0, 3);

  const facts = [
    { label: "Durée", value: activite.duration, Icon: Clock },
    { label: "Participants", value: activite.participants, Icon: Users },
    { label: "Espace", value: activite.space.join(" · "), Icon: MapPin },
    { label: "Langues", value: activite.languages.join(" · "), Icon: Languages },
  ];

  const breadcrumb = breadcrumbJsonLd([
    { name: "Accueil", path: "/" },
    { name: "Activités", path: "/activites" },
    { name: activite.title, path: `/activites/${activite.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <PageHero
        eyebrow={`Réf. ${activite.ref} · ${activite.category}`}
        title={activite.title}
        subtitle={activite.tagline}
        image={{ src: activite.image, alt: activite.alt }}
        breadcrumb={[
          { label: "Accueil", href: "/" },
          { label: "Activités", href: "/activites" },
          { label: activite.title },
        ]}
      />

      <Section labelledBy="activite-title">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:gap-16">
          <div>
            <SectionHeading id="activite-title" eyebrow="À propos" title={activite.tagline} />
            <Reveal as="p" className="mt-8 text-lg leading-relaxed text-muted">
              {activite.about}
            </Reveal>
            <Reveal className="mt-10">
              <Button href="/#contact" size="lg">
                Demander un devis
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </Reveal>
          </div>
          <RevealGroup as="ul" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1" interval={0.08}>
            {facts.map(({ label, value, Icon }) => (
              <RevealItem as="li" key={label}>
                <div className="flex items-start gap-4 rounded-[20px] border border-line bg-card p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-text">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</span>
                    <span className="mt-1 block font-medium text-fg">{value}</span>
                  </span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>

      <Section tone="alt" labelledBy="objectifs-title">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="objectifs-title" eyebrow="Objectifs" title="Ce que l'activité travaille" accent="travaille" />
            <RevealGroup as="ul" className="mt-8 space-y-3" interval={0.08}>
              {activite.objectives.map((item) => (
                <RevealItem as="li" key={item} className="flex items-start gap-3 text-fg">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <Check size={13} aria-hidden="true" />
                  </span>
                  {item}
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
          <div>
            <SectionHeading id="benefices-title" eyebrow="Bénéfices" title="Ce que vos équipes en retirent" accent="retirent" />
            <RevealGroup as="ul" className="mt-8 space-y-3" interval={0.08}>
              {activite.benefits.map((item) => (
                <RevealItem as="li" key={item} className="flex items-start gap-3 text-fg">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <Check size={13} aria-hidden="true" />
                  </span>
                  {item}
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </Section>

      {activite.workshops && activite.workshops.length > 0 ? (
        <Section labelledBy="ateliers-title">
          <SectionHeading id="ateliers-title" eyebrow="Ateliers" title="Au programme" accent="programme" />
          <RevealGroup as="ul" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" interval={0.06}>
            {activite.workshops.map((w) => (
              <RevealItem as="li" key={w}>
                <Card className="h-full text-sm font-medium text-fg">{w}</Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      ) : null}

      {others.length > 0 ? (
        <Section tone="alt" labelledBy="autres-title">
          <SectionHeading id="autres-title" eyebrow={activite.category} title="Dans la même famille" accent="famille" />
          <RevealGroup as="ul" className="mt-10 grid gap-4 md:grid-cols-3" interval={0.08}>
            {others.map((a) => (
              <RevealItem as="li" key={a.slug}>
                <SmartLink href={`/activites/${a.slug}`} className="group block font-display text-lg font-semibold text-fg transition-colors hover:text-accent-text">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Réf. {a.ref}</span>
                  <span className="mt-2 block">{a.title}</span>
                </SmartLink>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      ) : null}

      <div className="pb-16 sm:pb-20">
        <CtaBanner />
      </div>
    </>
  );
}
