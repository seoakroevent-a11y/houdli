import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { universList } from "@/content/univers";
import { activites } from "@/content/activites";
import { getPublishedGallery, getPublishedPosts } from "@/lib/public-data";

/** Date de la dernière mise à jour éditoriale, lue par Google Search Console. */
const LAST_UPDATED = "2026-10-30";

/**
 * Sitemap servi sur /sitemap.xml.
 * À déclarer dans Google Search Console : https://www.houdli.ma/sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, gallery] = await Promise.all([getPublishedPosts(), getPublishedGallery()]);
  const routes: { path: string; priority: number; lastModified?: string }[] = [
    { path: "", priority: 1 },
    ...universList.map((u) => ({ path: `/univers/${u.slug}`, priority: 0.8 })),
    { path: "/activites", priority: 0.8 },
    ...activites.map((a) => ({ path: `/activites/${a.slug}`, priority: 0.6 })),
    ...(gallery ? [{ path: "/galerie", priority: 0.6 }] : []),
    { path: "/blog", priority: 0.5 },
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      priority: 0.5,
      lastModified: post.created_at.slice(0, 10),
    })),
  ];

  return routes.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified: route.lastModified ?? LAST_UPDATED,
    changeFrequency: "monthly" as const,
    priority: route.priority,
  }));
}
