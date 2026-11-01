import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { catalogueSection } from "@/content/home";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Catalogue } from "@/components/activites/Catalogue";
import { CtaBanner } from "@/components/home/CtaBanner";

export const metadata: Metadata = pageMetadata({
  title: "Catalogue team building 2026 — Casablanca et Maroc",
  description:
    "30 activités de team building : artistique, sport & aventure, escape game, cuisine, solidaire. De 10 à 400 participants, à Casablanca et partout au Maroc.",
  path: "/activites",
});

export default function ActivitesPage() {
  return (
    <>
      <Section className="pt-36 sm:pt-40 lg:pt-44" labelledBy="catalogue-title">
        <SectionHeading
          id="catalogue-title"
          as="h1"
          eyebrow={catalogueSection.eyebrow}
          title={catalogueSection.title}
          accent={catalogueSection.accent}
          text={catalogueSection.text}
        />
        <Catalogue />
      </Section>
      <div className="pb-16 sm:pb-20">
        <CtaBanner />
      </div>
    </>
  );
}
