"use server";

import { redirect } from "next/navigation";
import { isSafeUrl, isUuid, slugify } from "@/lib/admin/format";
import { db, drop, fail, field, published, refresh } from "@/lib/admin/form";

export async function savePost(formData: FormData) {
  const id = field(formData, "id", 40);
  const title = field(formData, "title", 160);
  const excerpt = field(formData, "excerpt", 300);
  const content = field(formData, "content", 12000);
  const cover_url = field(formData, "cover_url", 500);
  const requestedSlug = slugify(field(formData, "slug", 80) || title);
  if (title.length < 3 || excerpt.length < 10 || content.length < 20 || !requestedSlug) {
    fail("/admin/blog", "Titre, chapô, texte et slug sont obligatoires.");
  }
  if (cover_url && !isSafeUrl(cover_url)) {
    fail("/admin/blog", "L'image doit être une URL https ou un chemin du site.");
  }
  const supabase = await db();
  let slug = requestedSlug;
  const { data: taken } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (taken && taken.id !== id) slug = `${requestedSlug}-${Date.now().toString().slice(-4)}`;
  const payload = {
    title,
    slug,
    excerpt,
    content,
    cover_url: cover_url || null,
    published: published(formData),
  };
  const query = id
    ? isUuid(id)
      ? supabase.from("posts").update(payload).eq("id", id)
      : null
    : supabase.from("posts").insert(payload);
  if (!query) fail("/admin/blog", "Identifiant invalide.");
  const { error } = await query;
  if (error) fail("/admin/blog", "Impossible d'enregistrer l'article.");
  refresh(["/blog", `/blog/${slug}`, "/admin/blog", "/sitemap.xml"]);
  redirect("/admin/blog?ok=1");
}

export async function deletePost(d: FormData) {
  return drop(d, "p");
}
