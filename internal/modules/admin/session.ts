"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isUuid } from "@/lib/admin/format";
import { isInquiryStatus } from "@/lib/admin/inquiries";
import { db, drop, fail, field, refresh } from "@/lib/admin/form";
import { LINA_AUDIO_BUCKET } from "@/lib/lina-conversations";

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

export async function deleteConversation(formData: FormData) {
  const id = field(formData, "id", 40);
  const path = "/admin/conversations";
  if (!isUuid(id)) fail(path, "Conversation invalide.");
  const supabase = await db();
  const { data: row } = await supabase.from("lina_conversations").select("audio_path").eq("id", id).maybeSingle();
  if (row?.audio_path) {
    const { error } = await supabase.storage.from(LINA_AUDIO_BUCKET).remove([row.audio_path]);
    if (error) fail(path, "Impossible de supprimer l'audio de la conversation.");
  }
  const { error } = await supabase.from("lina_conversations").delete().eq("id", id);
  if (error) fail(path, "Impossible de supprimer la conversation.");
  refresh([path]);
  redirect(`${path}?ok=1`);
}
