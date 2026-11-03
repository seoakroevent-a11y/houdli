"use server";

import { redirect } from "next/navigation";
import { isActivityKind, isClientStatus } from "@/lib/admin/billing";
import { isUuid } from "@/lib/admin/format";
import { db, fail, field, refresh } from "@/lib/admin/form";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function clientPath(id?: string) {
  return id ? `/admin/crm?id=${id}` : "/admin/crm";
}

export async function saveClient(formData: FormData) {
  const id = field(formData, "id", 40);
  if (id && !isUuid(id)) fail("/admin/crm", "Client invalide.");
  const back = clientPath(id);
  const status = field(formData, "status", 20) || "lead";
  const followUp = field(formData, "follow_up_at", 10);
  const payload = {
    name: field(formData, "name", 160),
    company: field(formData, "company", 160) || null,
    email: field(formData, "email", 160) || null,
    phone: field(formData, "phone", 40) || null,
    address: field(formData, "address", 300) || null,
    city: field(formData, "city", 80) || null,
    ice: field(formData, "ice", 30) || null,
    source: field(formData, "source", 80) || null,
    notes: field(formData, "notes", 4000) || null,
    status,
    follow_up_at: followUp || null,
    updated_at: new Date().toISOString(),
  };
  if (payload.name.length < 2) fail(back, "Le nom du contact est obligatoire.");
  if (!isClientStatus(status)) fail(back, "Statut invalide.");
  if (payload.email && !EMAIL.test(payload.email)) fail(back, "Adresse e-mail invalide.");
  if (followUp && !DAY.test(followUp)) fail(back, "Date de relance invalide.");

  const supabase = await db();
  const { data, error } = id
    ? await supabase.from("clients").update(payload).eq("id", id).select("id").maybeSingle()
    : await supabase.from("clients").insert(payload).select("id").single();
  if (error || !data) fail(back, "Impossible d'enregistrer le client. Vérifiez que supabase/crm-devis-factures.sql a bien été exécuté.");
  refresh(["/admin", "/admin/crm"]);
  redirect(`${clientPath(data.id)}&ok=1`);
}

export async function setClientStatus(formData: FormData) {
  const id = field(formData, "id", 40);
  const status = field(formData, "status", 20);
  const back = field(formData, "back", 60);
  const path = back.startsWith("/admin/crm") ? back : "/admin/crm";
  if (!isUuid(id) || !isClientStatus(status)) fail(path, "Statut invalide.");
  const supabase = await db();
  const { error } = await supabase.from("clients").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) fail(path, "Impossible de mettre à jour le statut.");
  refresh(["/admin", "/admin/crm"]);
  redirect(path);
}

export async function deleteClient(formData: FormData) {
  const id = field(formData, "id", 40);
  const back = field(formData, "back", 80);
  const list = back.startsWith("/admin/crm") ? back : "/admin/crm";
  if (!isUuid(id)) fail(list, "Client invalide.");
  const supabase = await db();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) {
    fail(
      back ? list : clientPath(id),
      error.code === "23503" ? "Ce client a des devis ou des factures : supprimez-les d'abord, ou passez-le en « Perdu »." : "Impossible de supprimer le client.",
    );
  }
  refresh(["/admin", "/admin/crm"]);
  redirect(`${list}${list.includes("?") ? "&" : "?"}ok=1`);
}

export async function addActivity(formData: FormData) {
  const clientId = field(formData, "client_id", 40);
  const kind = field(formData, "kind", 20);
  const content = field(formData, "content", 4000);
  if (!isUuid(clientId)) fail("/admin/crm", "Client invalide.");
  const back = clientPath(clientId);
  if (!isActivityKind(kind) || content.length < 2) fail(back, "Écrivez le contenu de l'échange.");
  const followUp = field(formData, "follow_up_at", 10);
  if (followUp && !DAY.test(followUp)) fail(back, "Date de relance invalide.");

  const supabase = await db();
  const { error } = await supabase.from("client_activities").insert({ client_id: clientId, kind, content });
  if (error) fail(back, "Impossible d'ajouter l'échange.");
  if (followUp) {
    await supabase.from("clients").update({ follow_up_at: followUp, updated_at: new Date().toISOString() }).eq("id", clientId);
  }
  refresh(["/admin/crm"]);
  redirect(`${back}&ok=1`);
}

export async function deleteActivity(formData: FormData) {
  const id = field(formData, "id", 40);
  const clientId = field(formData, "client_id", 40);
  if (!isUuid(id) || !isUuid(clientId)) fail("/admin/crm", "Échange invalide.");
  const supabase = await db();
  const { error } = await supabase.from("client_activities").delete().eq("id", id).eq("client_id", clientId);
  if (error) fail(clientPath(clientId), "Impossible de supprimer l'échange.");
  refresh(["/admin/crm"]);
  redirect(clientPath(clientId));
}

function afterInquiry(next: string, clientId: string, subject: string | null, created: boolean) {
  if (next === "quote" || next === "invoice") {
    const objet = subject ? `&objet=${encodeURIComponent(subject)}` : "";
    return `/admin/${next === "quote" ? "devis" : "factures"}?id=nouveau&client=${clientId}${objet}`;
  }
  return `${clientPath(clientId)}${created ? "&ok=1" : ""}`;
}

/** Crée (ou retrouve) la fiche CRM d'une demande, puis ouvre la fiche, un nouveau devis ou une nouvelle facture. */
export async function clientFromInquiry(formData: FormData) {
  const id = field(formData, "id", 40);
  const next = field(formData, "next", 10);
  if (!isUuid(id)) fail("/admin/demandes", "Demande invalide.");
  const supabase = await db();
  const { data: inquiry } = await supabase.from("inquiries").select("id,name,company,email,phone,service,message").eq("id", id).maybeSingle();
  if (!inquiry) fail("/admin/demandes", "Demande introuvable.");

  const { data: linked } = await supabase.from("clients").select("id").eq("inquiry_id", inquiry.id).limit(1).maybeSingle();
  const { data: sameEmail } = linked
    ? { data: null }
    : await supabase.from("clients").select("id").ilike("email", inquiry.email.replace(/[%_\\]/g, "\\$&")).limit(1).maybeSingle();
  const existing = linked ?? sameEmail;
  if (existing) redirect(afterInquiry(next, existing.id, inquiry.service, false));

  const notes = [inquiry.service ? `Service demandé : ${inquiry.service}` : "", inquiry.message ?? ""].filter(Boolean).join("\n\n");
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: inquiry.name,
      company: inquiry.company,
      email: inquiry.email,
      phone: inquiry.phone,
      source: "Formulaire du site",
      notes: notes || null,
      status: "lead",
      inquiry_id: inquiry.id,
    })
    .select("id")
    .single();
  if (error || !data) fail("/admin/demandes", "Impossible de créer la fiche. Vérifiez que supabase/crm-devis-factures.sql a bien été exécuté.");
  await supabase.from("inquiries").update({ status: "in_progress" }).eq("id", inquiry.id).eq("status", "new");
  refresh(["/admin", "/admin/crm", "/admin/demandes"]);
  redirect(afterInquiry(next, data.id, inquiry.service, true));
}
