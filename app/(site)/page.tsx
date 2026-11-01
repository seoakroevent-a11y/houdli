import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { MarqueeBand } from "@/components/home/MarqueeBand";
import { About } from "@/components/home/About";
import { Manifeste } from "@/components/home/Manifeste";
import { References } from "@/components/home/References";
import { UniversGrid } from "@/components/home/UniversGrid";
import { CatalogueTeaser } from "@/components/home/CatalogueTeaser";
import { Atouts } from "@/components/home/Atouts";
import { Method } from "@/components/home/Method";
import { ServicesDetail } from "@/components/home/ServicesDetail";
import { WhyHoudli } from "@/components/home/WhyHoudli";
import { KeyNumbers } from "@/components/home/KeyNumbers";
import { Faq } from "@/components/home/Faq";
import { CtaBanner } from "@/components/home/CtaBanner";
import { Contact } from "@/components/home/Contact";
import { faqItems } from "@/content/faq";
import { clampDescription, faqJsonLd, jsonLdString, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { getPublishedFaqs, getPublishedLogos, getSeoSettings } from "@/lib/public-data";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const title = seo?.title || `Agence événementielle à Casablanca & au Maroc | ${site.name}`;
  const description = clampDescription(seo?.description || site.description);
  return {
    ...pageMetadata({
      title: "Agence événementielle à Casablanca & au Maroc",
      description,
      path: "/",
      image: seo?.ogImage || undefined,
    }),
    title: { absolute: title },
    description,
    keywords: seo?.keywords.length ? seo.keywords : undefined,
  };
}

export default async function HomePage() {
  const faqs = (await getPublishedFaqs()) ?? faqItems;
  const logos = (await getPublishedLogos()) ?? undefined;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd(faqs)) }} />
      <Hero />
      <MarqueeBand />
      <About />
      <Manifeste />
      <References logos={logos} />
      <UniversGrid />
      <CatalogueTeaser />
      <Atouts />
      <ServicesDetail />
      <Method />
      <WhyHoudli />
      <KeyNumbers />
      <Faq items={faqs} />
      <CtaBanner />
      <Contact />
    </>
  );
}
