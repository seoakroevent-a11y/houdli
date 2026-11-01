"use server";

import { redirect } from "next/navigation";
import { isSafeUrl } from "@/lib/admin/format";
import { db, fail, field, refresh } from "@/lib/admin/form";

export async function saveSettings(formData: FormData) {
  const payload = {
    id: 1,
    phone_display: field(formData, "phone_display", 40),
    whatsapp_phone: field(formData, "whatsapp_phone", 20).replace(/\D/g, ""),
    email: field(formData, "email", 160),
    instagram_url: field(formData, "instagram_url", 300),
    facebook_url: field(formData, "facebook_url", 300),
    linkedin_url: field(formData, "linkedin_url", 300),
    seo_title: field(formData, "seo_title", 120),
    seo_description: field(formData, "seo_description", 300),
    seo_keywords: field(formData, "seo_keywords", 400),
    og_image_url: field(formData, "og_image_url", 500),
    geo_summary: field(formData, "geo_summary", 600),
    geo_service_area: field(formData, "geo_service_area", 200),
    geo_llms_txt: field(formData, "geo_llms_txt", 8000),
    updated_at: new Date().toISOString(),
  };
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    fail("/admin/parametres", "Adresse e-mail invalide.");
  }
  for (const key of ["instagram_url", "facebook_url", "linkedin_url", "og_image_url"] as const) {
    const value = payload[key];
    if (value && !isSafeUrl(value)) {
      fail("/admin/parametres", "Les liens doivent commencer par https:// ou /.");
    }
  }
  const supabase = await db();
  const { error } = await supabase.from("site_settings").upsert(payload);
  if (error) fail("/admin/parametres", "Impossible d'enregistrer les paramètres.");
  refresh(["/", "/galerie", "/blog", "/admin/parametres", "/llms.txt"]);
  redirect("/admin/parametres?ok=1");
}
