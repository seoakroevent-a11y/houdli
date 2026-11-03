import { after, NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema } from "@/lib/contact-schema";
import { screenInquiry } from "@/lib/contact-filter";
import { sendAlert } from "@/lib/mailer";
import { site } from "@/lib/site";
import { createAnonSupabase, createServiceSupabase } from "@/lib/supabase/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const MAX_TRACKED = 5_000;
const hits = new Map<string, number[]>();

function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function rateLimited(ip: string) {
  const now = Date.now();
  if (hits.size > MAX_TRACKED) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false, error: "Trop de demandes, réessayez dans une minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Certains champs sont invalides.", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }

  // Champ piège rempli : on répond comme un succès pour ne pas renseigner le robot.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const verdict = screenInquiry(parsed.data);
  if (verdict?.kind === "offtopic") {
    return NextResponse.json(
      {
        ok: false,
        error: `Ce formulaire est réservé aux projets d'événements. Pour une candidature, un stage ou une proposition de services, écrivez-nous à ${site.contact.email}.`,
      },
      { status: 422 },
    );
  }
  const supabase = createServiceSupabase() ?? createAnonSupabase();
  if (!supabase) {
    console.error("[contact] Supabase n'est pas configuré : demande non enregistrée.");
    return NextResponse.json(
      { ok: false, error: "Le formulaire est indisponible. Écrivez-nous directement par e-mail." },
      { status: 503 },
    );
  }

  const row = {
    name: parsed.data.name,
    company: parsed.data.company || null,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    service: parsed.data.service || null,
    message: parsed.data.message || null,
  };

  // Rangée dans « Indésirables » plutôt que supprimée : un faux positif reste récupérable dans l'admin.
  if (verdict?.kind === "spam") {
    console.warn("[contact] Demande filtrée :", verdict.reason);
    const spam = await supabase.from("inquiries").insert({ ...row, status: "spam", spam_reason: verdict.reason });
    if (!spam.error) return NextResponse.json({ ok: true });
    console.error("[contact] Statut spam indisponible, exécutez supabase/demandes-statuts.sql :", spam.error.code);
  }

  const { error } = await supabase.from("inquiries").insert(row);
  if (error) {
    console.error("[contact] Insertion refusée :", error.code, error.message);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué. Réessayez dans un instant." }, { status: 500 });
  }

  after(() =>
    sendAlert({
      subject: `Nouvelle demande : ${row.name}${row.company ? ` (${row.company})` : ""}`,
      rows: [
        ["Nom", row.name],
        ["Entreprise", row.company],
        ["E-mail", row.email],
        ["Téléphone", row.phone],
        ["Service", row.service],
      ],
      message: row.message,
      link: { label: "Ouvrir les demandes", path: "/admin/demandes?statut=new" },
      replyTo: row.email,
    }),
  );
  return NextResponse.json({ ok: true });
}
