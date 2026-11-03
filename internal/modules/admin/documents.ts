"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isDocumentKind, isDocumentStatus, kindConfig, todayInMorocco, type DocumentKind } from "@/lib/admin/billing";
import { isUuid } from "@/lib/admin/format";
import { db, fail, field, refresh } from "@/lib/admin/form";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const itemsSchema = z
  .array(
    z.object({
      description: z.string().trim().min(1).max(1000),
      unit: z.string().trim().max(30).default(""),
      quantity: z.coerce.number().positive().max(1_000_000),
      unit_price: z.coerce.number().min(0).max(100_000_000),
    }),
  )
  .min(1)
  .max(100);

function kindOf(formData: FormData): DocumentKind {
  const kind = field(formData, "kind", 10);
  if (!isDocumentKind(kind)) redirect("/admin");
  return kind;
}

function rate(formData: FormData, key: string) {
  const value = Number(String(formData.get(key) ?? "0").replace(",", "."));
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value * 100) / 100)) : 0;
}

export async function saveDocument(formData: FormData) {
  const kind = kindOf(formData);
  const base = kindConfig[kind].path;
  const id = field(formData, "id", 40);
  if (id && !isUuid(id)) fail(base, "Document invalide.");
  const back = `${base}?id=${id || "nouveau"}`;

  const clientId = field(formData, "client_id", 40);
  const status = field(formData, "status", 20);
  const issueDate = field(formData, "issue_date", 10);
  const dueDate = field(formData, "due_date", 10);
  if (!isUuid(clientId)) fail(back, "Choisissez un client.");
  if (!isDocumentStatus(kind, status)) fail(back, "Statut invalide.");
  if (!day.safeParse(issueDate).success || (dueDate && !day.safeParse(dueDate).success)) fail(back, "Date invalide.");

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    rawItems = [];
  }
  const items = itemsSchema.safeParse(rawItems);
  if (!items.success) fail(back, "Ajoutez au moins une ligne avec une désignation, une quantité et un prix.");

  const paidAt = field(formData, "paid_at", 10);
  const doc = {
    client_id: clientId,
    quote_id: field(formData, "quote_id", 40),
    status,
    subject: field(formData, "subject", 200),
    issue_date: issueDate,
    due_date: dueDate,
    tva_rate: rate(formData, "tva_rate"),
    discount_rate: rate(formData, "discount_rate"),
    notes: field(formData, "notes", 4000),
    terms: field(formData, "terms", 4000),
    paid_at: kind === "invoice" && status === "paid" ? (day.safeParse(paidAt).success ? paidAt : todayInMorocco()) : "",
  };
  if (doc.quote_id && !isUuid(doc.quote_id)) doc.quote_id = "";

  const supabase = await db();
  const { data, error } = await supabase.rpc("save_document", { p_id: id || null, p_kind: kind, p_doc: doc, p_items: items.data });
  if (error || !data) {
    console.error("[admin] Document refusé :", error?.code, error?.message);
    fail(back, "Impossible d'enregistrer. Vérifiez que supabase/crm-devis-factures.sql a bien été exécuté.");
  }
  refresh(["/admin", base, "/admin/crm"]);
  redirect(`${base}?id=${data}&ok=1`);
}

export async function setDocumentStatus(formData: FormData) {
  const kind = kindOf(formData);
  const base = kindConfig[kind].path;
  const id = field(formData, "id", 40);
  const status = field(formData, "status", 20);
  const back = field(formData, "back", 80);
  const path = back.startsWith("/admin/") ? back : base;
  if (!isUuid(id) || !isDocumentStatus(kind, status)) fail(path, "Statut invalide.");
  const supabase = await db();
  const patch: Record<string, string | null> = { status, updated_at: new Date().toISOString() };
  if (kind === "invoice") patch.paid_at = status === "paid" ? todayInMorocco() : null;
  const { error } = await supabase.from("documents").update(patch).eq("id", id).eq("kind", kind);
  if (error) fail(path, "Impossible de mettre à jour le statut.");
  refresh(["/admin", base, "/admin/crm"]);
  redirect(path);
}

export async function deleteDocument(formData: FormData) {
  const kind = kindOf(formData);
  const base = kindConfig[kind].path;
  const id = field(formData, "id", 40);
  if (!isUuid(id)) fail(base, "Document invalide.");
  const supabase = await db();
  const { data: doc } = await supabase.from("documents").select("status").eq("id", id).eq("kind", kind).maybeSingle();
  if (!doc) fail(base, "Document introuvable.");
  if (kind === "invoice" && doc.status !== "draft") {
    fail(base, "Une facture émise ne se supprime pas : passez-la en « Annulée » pour garder la numérotation continue.");
  }
  const { error } = await supabase.from("documents").delete().eq("id", id).eq("kind", kind);
  if (error) fail(base, "Impossible de supprimer le document.");
  refresh(["/admin", base, "/admin/crm"]);
  redirect(`${base}?ok=1`);
}

export async function invoiceFromQuote(formData: FormData) {
  const id = field(formData, "id", 40);
  if (!isUuid(id)) fail("/admin/devis", "Devis invalide.");
  const supabase = await db();
  const { data, error } = await supabase.rpc("invoice_from_quote", { p_quote: id });
  if (error || !data) fail("/admin/devis", "Impossible de créer la facture.");
  refresh(["/admin", "/admin/devis", "/admin/factures", "/admin/crm"]);
  redirect(`/admin/factures?id=${data}&ok=1`);
}

export async function saveBillingSettings(formData: FormData) {
  const path = "/admin/parametres/facturation";
  const text = (key: string, max: number) => field(formData, key, max) || null;
  const payload = {
    id: 1,
    legal_name: text("legal_name", 160),
    address: text("address", 300),
    city: text("city", 80),
    phone: text("phone", 40),
    email: text("email", 160),
    ice: text("ice", 30),
    rc: text("rc", 40),
    if_number: text("if_number", 40),
    patente: text("patente", 40),
    cnss: text("cnss", 40),
    bank_name: text("bank_name", 120),
    rib: text("rib", 60),
    quote_terms: text("quote_terms", 4000),
    invoice_terms: text("invoice_terms", 4000),
    default_tva: rate(formData, "default_tva"),
    updated_at: new Date().toISOString(),
  };
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) fail(path, "Adresse e-mail invalide.");
  const supabase = await db();
  const { error } = await supabase.from("billing_settings").upsert(payload);
  if (error) fail(path, "Impossible d'enregistrer. Vérifiez que supabase/crm-devis-factures.sql a bien été exécuté.");
  refresh([path, "/admin/devis", "/admin/factures"]);
  redirect(`${path}?ok=1`);
}
