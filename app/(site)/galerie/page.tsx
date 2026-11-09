import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Gallery } from "@/components/gallery/Gallery";
import { getPublishedGallery } from "@/lib/public-data";

export const metadata: Metadata = pageMetadata({
  title: "Galerie : nos événements au Maroc en images",
  description:
    "Team building, événements d'entreprise, communication et stands réalisés par Houd-Li à Casablanca et partout au Maroc : nos réalisations en images.",
  path: "/galerie",
});

export default async function GaleriePage() {
  const items = await getPublishedGallery();
  if (!items) notFound();

  return (
    <Section className="pt-36 sm:pt-40 lg:pt-44" labelledBy="gallery-title">
      <SectionHeading
        id="gallery-title"
        as="h1"
        eyebrow="Galerie"
        title="Nos événements en images"
        accent="en images"
        text="Un aperçu des expériences que nous concevons et produisons partout au Maroc."
      />
      <Gallery items={items} />
    </Section>
  );
}
