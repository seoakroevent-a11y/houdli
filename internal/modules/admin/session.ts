"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isUuid } from "@/lib/admin/format";
import { isInquiryStatus } from "@/lib/admin/inquiries";
import { db, drop, fail, field, refresh } from "@/lib/admin/form";

export async function signOut() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function setInquiryStatus(formData: FormData) {
  const id = field(formData, "id", 40);
  const status = field(formData, "status", 20);
  const back = field(formData, "back", 20);
  const path = isInquiryStatus(back) ? `/admin/demandes?statut=${back}` : "/admin/demandes";
  if (!isUuid(id) || !isInquiryStatus(status)) fail(path, "Demande invalide.");
  const supabase = await db();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) {
    console.error("[admin] Statut refusé :", status, error.code, error.message);
    fail(path, "Impossible de mettre à jour la demande. Vérifiez que supabase/demandes-statuts.sql a bien été exécuté.");
  }
  refresh(["/admin", "/admin/demandes"]);
  redirect(path);
}

export async function deleteInquiry(d: FormData) {
  return drop(d, "i");
}
