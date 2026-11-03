import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { createServerSupabase } from "@/lib/supabase/server";

/** Page privée lue avec la session : elle attend le serveur, le squelette de `loading.tsx` couvre l'attente. */
export const instant = false;

type Card = {
  href: string;
  label: string;
  table: string;
  hint: string;
  filter?: { column: string; values: string[]; kind?: "quote" | "invoice" };
};

const cards: Card[] = [
  { href: "/admin/demandes", label: "Nouvelles demandes", table: "inquiries", hint: "Formulaire de contact", filter: { column: "status", values: ["new"] } },
  { href: "/admin/crm", label: "Prospects en cours", table: "clients", hint: "CRM", filter: { column: "status", values: ["lead", "negotiation"] } },
  { href: "/admin/devis?statut=sent", label: "Devis en attente de réponse", table: "documents", hint: "Devis", filter: { column: "status", values: ["sent"], kind: "quote" } },
  { href: "/admin/factures?statut=sent", label: "Factures à encaisser", table: "documents", hint: "Factures", filter: { column: "status", values: ["sent"], kind: "invoice" } },
  { href: "/admin/faq", label: "FAQ", table: "faqs", hint: "Questions de l'accueil" },
  { href: "/admin/references", label: "Références", table: "client_logos", hint: "Logos clients" },
  { href: "/admin/galerie", label: "Galerie", table: "gallery_items", hint: "Photos publiées" },
  { href: "/admin/blog", label: "Blog", table: "posts", hint: "Articles" },
];

const crmTables = ["clients", "documents"];

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const counts = await Promise.all(
    cards.map(async (card) => {
      if (!supabase) return { ...card, count: null as number | null, error: "Supabase non configuré." };
      let query = supabase.from(card.table).select("id", { count: "exact", head: true });
      if (card.filter) query = query.in(card.filter.column, card.filter.values);
      if (card.filter?.kind) query = query.eq("kind", card.filter.kind);
      const { count, error } = await query;
      return { ...card, count: error ? null : (count ?? 0), error: error?.message ?? null };
    }),
  );
  const blocked = counts.find((item) => item.error && !crmTables.includes(item.table));
  const crmMissing = counts.some((item) => item.error && crmTables.includes(item.table));

  return (
    <>
      <PageHeader title="Tableau de bord" text="Les demandes en attente, et les contenus que le site public peut afficher." />
      {blocked?.error ? (
        <p className="mb-6 rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
          La base n&apos;est pas prête ({blocked.error}). Exécutez <code>supabase/schema.sql</code> dans l&apos;éditeur SQL Supabase, puis créez le premier
          utilisateur. Le guide est dans <code>supabase/GUIDE.md</code>.
        </p>
      ) : null}
      {crmMissing ? (
        <p className="mb-6 rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
          CRM, devis et factures : exécutez <code>supabase/crm-devis-factures.sql</code> dans l&apos;éditeur SQL Supabase pour activer ces modules.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {counts.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-xl border border-white/10 bg-[#111111] p-5 transition hover:border-[#4A82EA]/60">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">{card.hint}</p>
            <p className="mt-3 font-display text-4xl font-bold">{card.count ?? "—"}</p>
            <p className="mt-2 text-sm text-white/70">{card.label}</p>
          </Link>
        ))}
        <Link href="/admin/parametres" className="rounded-xl border border-white/10 bg-[#111111] p-5 transition hover:border-[#4A82EA]/60">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Site</p>
          <p className="mt-3 font-display text-xl font-bold uppercase tracking-[0.12em]">SEO & contact</p>
          <p className="mt-2 text-sm text-white/70">Téléphone, WhatsApp, réseaux, GEO</p>
        </Link>
      </div>
    </>
  );
}
