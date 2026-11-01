import { cacheLife } from "next/cache";
import { cache } from "react";
import type { FaqItem } from "@/content/faq";
import type { ClientLogo } from "@/content/clients";
import type { GalleryCategory, GalleryItem } from "@/lib/images";
import { foundedYear, site } from "@/lib/site";
import { supabaseEnv } from "@/lib/supabase/env";

export type PublicSettings = {
  email: string;
  phoneDisplay: string;
  phoneHref: string;
  whatsapp: string;
  whatsappMessage: string;
  area: string;
  areaDetail: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  handle: string;
  llmsTxt: string;
  /** Faux tant qu'aucune photo n'est publiée depuis l'admin : la galerie reste alors masquée. */
  hasGallery: boolean;
};

export type SeoSettings = {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string | null;
  published: boolean;
  created_at: string;
};

type SettingsRow = {
  phone_display: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image_url: string | null;
  geo_summary: string | null;
  geo_service_area: string | null;
  geo_llms_txt: string | null;
};

const fallbackSettings = (): PublicSettings => ({
  email: site.contact.email,
  phoneDisplay: site.contact.phoneDisplay,
  phoneHref: site.contact.phoneHref,
  whatsapp: site.contact.whatsapp,
  whatsappMessage: site.contact.whatsappMessage,
  area: site.contact.area,
  areaDetail: site.contact.areaDetail,
  instagram: site.social.instagram,
  facebook: site.social.facebook,
  linkedin: site.social.linkedin,
  handle: site.social.handle,
  llmsTxt: defaultLlms(),
  hasGallery: false,
});

export function defaultLlms() {
  return `# ${site.name}

> ${site.description}

Houdli (anciennement Houd-Li) est une agence événementielle 360° fondée en ${foundedYear} à Casablanca. Elle conçoit et produit des événements d'entreprise partout au Maroc : séminaires, conventions, soirées de gala, lancements, team building, communication, son et lumière, print et stands. Un chef de projet unique suit chaque événement, du concept au démontage.

- Site : ${site.url}
- Zone : ${site.contact.areaDetail}
- E-mail : ${site.contact.email}
- Téléphone : ${site.contact.phoneDisplay}
`;
}

function phoneHref(display: string, whatsapp: string) {
  const fromWhatsapp = whatsapp.replace(/\D/g, "");
  if (fromWhatsapp) return `tel:+${fromWhatsapp}`;
  const digits = display.replace(/\D/g, "");
  if (!digits) return site.contact.phoneHref;
  return digits.startsWith("0") ? `tel:+212${digits.slice(1)}` : `tel:+${digits}`;
}

/** Mis en cache (« use cache ») : sans lui, la lecture Supabase bloque le pré-rendu dès que le réseau est lent. */
async function rest<T>(path: string): Promise<T | null> {
  "use cache";
  cacheLife("minutes");
  const env = supabaseEnv();
  if (!env) return null;
  try {
    const response = await fetch(`${env.url}/rest/v1/${path}`, {
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${env.anonKey}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const loadSettings = cache(async () => {
  const rows = await rest<SettingsRow[]>("site_settings?id=eq.1&select=*");
  return rows?.[0] ?? null;
});

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const [row, gallery] = await Promise.all([loadSettings(), getPublishedGallery()]);
  const base = { ...fallbackSettings(), hasGallery: Boolean(gallery) };
  if (!row) return base;
  const whatsapp = row.whatsapp_phone?.trim() || base.whatsapp;
  const phoneDisplay = row.phone_display?.trim() || base.phoneDisplay;
  const area = row.geo_service_area?.trim() || base.area;
  return {
    ...base,
    email: row.email?.trim() || base.email,
    phoneDisplay,
    phoneHref: phoneHref(phoneDisplay, whatsapp),
    whatsapp,
    area,
    areaDetail: row.geo_service_area?.trim() || base.areaDetail,
    instagram: row.instagram_url?.trim() || base.instagram,
    facebook: row.facebook_url?.trim() || base.facebook,
    linkedin: row.linkedin_url?.trim() || base.linkedin,
    llmsTxt: row.geo_llms_txt?.trim() || defaultLlms(),
  };
});

export const getSeoSettings = cache(async (): Promise<SeoSettings | null> => {
  const row = await loadSettings();
  if (!row) return null;
  const keywords = (row.seo_keywords ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!row.seo_title && !row.seo_description && !row.og_image_url && keywords.length === 0) return null;
  return {
    title: row.seo_title?.trim() || "",
    description: row.seo_description?.trim() || "",
    keywords,
    ogImage: row.og_image_url?.trim() || "",
  };
});

export async function getPublishedFaqs(): Promise<FaqItem[] | null> {
  const rows = await rest<{ question: string; answer: string }[]>(
    "faqs?select=question,answer&published=eq.true&order=sort_order.asc,created_at.asc",
  );
  if (!rows?.length) return null;
  return rows.map((row) => ({ question: row.question, answer: row.answer }));
}

export async function getPublishedLogos(): Promise<ClientLogo[] | null> {
  const rows = await rest<{ name: string; logo_url: string }[]>(
    "client_logos?select=name,logo_url&published=eq.true&order=sort_order.asc,created_at.asc",
  );
  if (!rows?.length) return null;
  return rows.map((row) => ({ name: row.name, logo: row.logo_url }));
}

const categories = new Set<GalleryCategory>(["Team Building", "Événementiel", "Communication", "Stands"]);

/** La galerie présente « nos événements » : ni les illustrations IA des fiches activités, ni les photos de banque d'images. */
function isEventPhoto(url: string) {
  return !url.startsWith("/images/activites/") && !url.includes("images.unsplash.com");
}

export async function getPublishedGallery(): Promise<GalleryItem[] | null> {
  const rows = await rest<
    { id: string; title: string; alt: string | null; image_url: string; category: string; ratio: string }[]
  >("gallery_items?select=id,title,alt,image_url,category,ratio&published=eq.true&order=sort_order.asc,created_at.asc");
  const items: GalleryItem[] = (rows ?? [])
    .filter((row) => categories.has(row.category as GalleryCategory) && isEventPhoto(row.image_url))
    .map((row) => ({
      id: row.id,
      category: row.category as GalleryCategory,
      ratio: row.ratio === "portrait" || row.ratio === "square" ? row.ratio : "landscape",
      src: row.image_url,
      alt: row.alt?.trim() || row.title,
    }));
  return items.length ? items : null;
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const rows = await rest<BlogPost[]>(
    "posts?select=id,title,slug,excerpt,content,cover_url,published,created_at&published=eq.true&order=created_at.desc",
  );
  return rows ?? [];
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const rows = await rest<BlogPost[]>(
    `posts?select=id,title,slug,excerpt,content,cover_url,published,created_at&published=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  return rows?.[0] ?? null;
}
