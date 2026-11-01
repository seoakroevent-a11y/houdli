import { activites } from "@/content/activites";
import { universList, universSeo } from "@/content/univers";
import { getPublicSettings, getPublishedPosts } from "@/lib/public-data";
import { site } from "@/lib/site";

const link = (title: string, path: string, note?: string) =>
  `- [${title}](${site.url}${path})${note ? ` : ${note}` : ""}`;

export async function GET() {
  const [settings, posts] = await Promise.all([getPublicSettings(), getPublishedPosts()]);
  const sections = [
    settings.llmsTxt.trim(),
    "## Services",
    ...universList.map((u) => link(u.title, `/univers/${u.slug}`, universSeo[u.slug].description)),
    "## Activités de team building",
    link("Catalogue des 30 activités", "/activites"),
    ...activites.map((a) => link(a.title, `/activites/${a.slug}`, `${a.category}, ${a.duration}, ${a.participants}`)),
    ...(posts.length ? ["## Articles", ...posts.map((p) => link(p.title, `/blog/${p.slug}`, p.excerpt))] : []),
    "## Contact",
    link("Demander un devis", "/#contact"),
  ];

  return new Response(`${sections.join("\n\n").replace(/\n\n- /g, "\n- ")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
