import type { Metadata } from "next";
import { images } from "./images";
import { foundedYear, site } from "./site";

type PageMeta = {
  title: string;
  description: string;
  path: string;
  image?: string;
};

/** Google coupe les descriptions vers 160 caractères : on coupe nous-mêmes, sur un mot entier. */
export function clampDescription(text: string, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:·—–-]+$/, "")}…`;
}

export function pageMetadata({ title, description: rawDescription, path, image = images.og.src }: PageMeta): Metadata {
  const description = clampDescription(rawDescription);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: site.locale,
      siteName: site.name,
      url: path,
      title: `${title} | ${site.name}`,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: images.og.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      images: [image],
    },
  };
}

export function localBusinessJsonLd(contact?: {
  email: string;
  phoneDisplay: string;
  instagram: string;
  facebook: string;
  linkedin: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${site.url}/#organization`,
    name: site.name,
    alternateName: "Houd-Li",
    slogan: site.slogan,
    foundingDate: String(foundedYear),
    description: site.description,
    url: site.url,
    logo: `${site.url}/logo/houdli-black.svg`,
    image: images.og.src,
    email: contact?.email ?? site.contact.email,
    telephone: (contact?.phoneDisplay ?? site.contact.phoneDisplay).replace(/\s/g, ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: site.contact.city,
      addressCountry: site.contact.country,
    },
    areaServed: [
      { "@type": "City", name: site.contact.city },
      { "@type": "Country", name: "Maroc" },
    ],
    sameAs: [
      contact?.instagram ?? site.social.instagram,
      contact?.facebook ?? site.social.facebook,
      contact?.linkedin ?? site.social.linkedin,
    ],
    knowsAbout: [
      "Événementiel",
      "Team building",
      "Communication",
      "Lumière et sono",
      "Print",
      "Réalisation de stands",
    ],
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

const absolute = (path: string) => (path.startsWith("http") ? path : `${site.url}${path}`);
const organizationRef = { "@id": `${site.url}/#organization` };

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function serviceJsonLd(service: { name: string; serviceType: string; description: string; path: string; image: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.serviceType,
    description: service.description,
    url: absolute(service.path),
    image: absolute(service.image),
    provider: organizationRef,
    areaServed: { "@type": "Country", name: "Maroc" },
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  published: string;
  modified?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: absolute(post.path),
    mainEntityOfPage: absolute(post.path),
    image: absolute(post.image || images.og.src),
    datePublished: post.published,
    dateModified: post.modified || post.published,
    inLanguage: "fr-MA",
    author: organizationRef,
    publisher: organizationRef,
  };
}

/** Sérialise un objet JSON-LD en échappant `<` pour éviter toute injection de balise. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
