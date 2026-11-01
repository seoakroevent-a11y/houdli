"use server";

import { redirect } from "next/navigation";
import { isSafeUrl, isUuid } from "@/lib/admin/format";
import { db, drop, fail, field, order, published, refresh } from "@/lib/admin/form";

const GALLERY_CATEGORIES = ["Team Building", "Événementiel", "Communication", "Stands"] as const;

export async function saveGalleryItem(formData: FormData) {
  const id = field(formData, "id", 40);
  const title = field(formData, "title", 160);
  const alt = field(formData, "alt", 240);
  const image_url = field(formData, "image_url", 500);
  const category = field(formData, "category", 40);
  const ratio = field(formData, "ratio", 20);
  if (title.length < 2 || !isSafeUrl(image_url)) {
    fail("/admin/galerie", "Titre et image sont obligatoires.");
  }
  if (!GALLERY_CATEGORIES.includes(category as (typeof GALLERY_CATEGORIES)[number])) {
    fail("/admin/galerie", "Catégorie invalide.");
  }
  const payload = {
    title,
    alt,
    image_url,
    category,
    ratio: ratio === "portrait" || ratio === "square" ? ratio : "landscape",
    sort_order: order(formData),
    published: published(formData),
  };
  const supabase = await db();
  const query = id
    ? isUuid(id)
      ? supabase.from("gallery_items").update(payload).eq("id", id)
      : null
    : supabase.from("gallery_items").insert(payload);
  if (!query) fail("/admin/galerie", "Identifiant invalide.");
  const { error } = await query;
  if (error) fail("/admin/galerie", "Impossible d'enregistrer la photo.");
  refresh(["/galerie", "/admin/galerie"]);
  redirect("/admin/galerie?ok=1");
}

export async function deleteGalleryItem(d: FormData) {
  return drop(d, "g");
}
