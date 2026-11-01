"use server";

import { redirect } from "next/navigation";
import { isSafeUrl, isUuid } from "@/lib/admin/format";
import { db, drop, fail, field, order, published, refresh } from "@/lib/admin/form";

export async function saveLogo(formData: FormData) {
  const id = field(formData, "id", 40);
  const name = field(formData, "name", 120);
  const logo_url = field(formData, "logo_url", 500);
  if (name.length < 2 || !isSafeUrl(logo_url)) {
    fail("/admin/references", "Nom et image (URL https ou chemin /…) sont obligatoires.");
  }
  const payload = { name, logo_url, sort_order: order(formData), published: published(formData) };
  const supabase = await db();
  const query = id
    ? isUuid(id)
      ? supabase.from("client_logos").update(payload).eq("id", id)
      : null
    : supabase.from("client_logos").insert(payload);
  if (!query) fail("/admin/references", "Identifiant invalide.");
  const { error } = await query;
  if (error) fail("/admin/references", "Impossible d'enregistrer le logo.");
  refresh(["/", "/admin/references"]);
  redirect("/admin/references?ok=1");
}

export async function deleteLogo(d: FormData) {
  return drop(d, "l");
}
