"use server";

import { redirect } from "next/navigation";
import { isUuid } from "@/lib/admin/format";
import { db, drop, fail, field, order, published, refresh } from "@/lib/admin/form";

export async function saveFaq(formData: FormData) {
  const id = field(formData, "id", 40);
  const question = field(formData, "question", 240);
  const answer = field(formData, "answer", 2000);
  if (question.length < 5 || answer.length < 5) fail("/admin/faq", "Question et réponse sont obligatoires.");
  const payload = { question, answer, sort_order: order(formData), published: published(formData) };
  const supabase = await db();
  const query = id
    ? isUuid(id)
      ? supabase.from("faqs").update(payload).eq("id", id)
      : null
    : supabase.from("faqs").insert(payload);
  if (!query) fail("/admin/faq", "Identifiant invalide.");
  const { error } = await query;
  if (error) fail("/admin/faq", "Impossible d'enregistrer la question.");
  refresh(["/", "/admin/faq"]);
  redirect("/admin/faq?ok=1");
}

export async function deleteFaq(d: FormData) {
  return drop(d, "f");
}
