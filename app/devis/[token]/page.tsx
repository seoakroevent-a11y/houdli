import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { DocumentSheet, type SheetData } from "@/components/admin/billing/DocumentSheet";
import { PrintButton } from "@/components/admin/billing/PrintButton";
import { documentTotals, formatDay, formatMoney, todayInMorocco } from "@/lib/admin/billing";
import { isUuid } from "@/lib/admin/format";
import { acceptQuote } from "@/lib/quote-online";
import { site } from "@/lib/site";
import { createAnonSupabase } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: { absolute: `Votre devis | ${site.name}` },
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ accepte?: string; erreur?: string }> };

type PublicQuote = Omit<SheetData, "kind" | "acceptedAt" | "acceptedBy"> & { status: string; accepted_at: string | null; accepted_by: string | null };

const errors: Record<string, string> = {
  champs: "Indiquez votre nom et cochez la case pour accepter le devis.",
  expired: "Ce devis a dépassé sa date de validité. Contactez-nous pour le mettre à jour.",
  closed: "Ce devis n'est plus ouvert à l'acceptation. Contactez-nous si besoin.",
  not_found: "Ce devis est introuvable.",
  indisponible: "L'acceptation est momentanément indisponible. Réessayez dans un instant ou contactez-nous.",
};

export default function QuotePage(props: Props) {
  return (
    <div className="min-h-dvh bg-[#eef0f6] px-3 py-6 sm:px-4 sm:py-10 print:bg-white print:p-0">
      <style>{`@media print { @page { size: A4; margin: 14mm; } }`}</style>
      <Suspense fallback={<p className="mx-auto max-w-[210mm] text-sm text-neutral-500">Chargement du devis…</p>}>
        <Quote {...props} />
      </Suspense>
    </div>
  );
}

async function Quote({ params, searchParams }: Props) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const supabase = createAnonSupabase();
  const { data } = isUuid(token) && supabase ? await supabase.rpc("public_quote", { p_token: token }) : { data: null };
  const quote = data as PublicQuote | null;

  if (!quote) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center text-neutral-800 shadow-xl">
        <h1 className="font-display text-xl font-bold text-[#080838]">Devis introuvable</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Ce lien n&apos;est pas valide. Contactez-nous au {site.contact.phoneDisplay} ou à {site.contact.email}.
        </p>
      </div>
    );
  }

  const total = documentTotals(quote.items, quote.discount_rate, quote.tva_rate).total;
  const expired = quote.status !== "accepted" && !!quote.due_date && quote.due_date < todayInMorocco();
  const open = (quote.status === "draft" || quote.status === "sent") && !expired;
  const error = query.erreur ? errors[query.erreur] : null;

  return (
    <>
      <div className="mx-auto mb-5 max-w-[210mm] print:hidden">
        {quote.status === "accepted" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={22} aria-hidden="true" />
            <div>
              <p className="font-semibold">{query.accepte ? "Merci, votre accord est bien enregistré." : "Devis accepté."}</p>
              <p className="mt-1 text-sm">
                Accepté par {quote.accepted_by}
                {quote.accepted_at ? ` le ${formatDay(quote.accepted_at)}` : ""}. L&apos;équipe {site.name} revient vers vous pour la suite.
              </p>
            </div>
          </div>
        ) : open ? (
          <form action={acceptQuote} className="rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <input type="hidden" name="token" value={token} />
            <p className="font-display text-lg font-bold text-[#080838]">
              Devis {quote.number} · {formatMoney(total)} TTC
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Relisez le devis ci-dessous. Pour le valider, indiquez votre nom puis cliquez sur « J&apos;accepte le devis ».
              {quote.due_date ? ` Valable jusqu'au ${formatDay(quote.due_date)}.` : ""}
            </p>
            {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Nom et fonction
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Ex. Salma Bennani, responsable RH"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-[#2d66d2] focus:ring-2 focus:ring-[#2d66d2]/20"
                />
              </div>
              <button className="rounded-lg bg-[#2d66d2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4A82EA]">J&apos;accepte le devis</button>
            </div>
            <label className="mt-3 flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[#2d66d2]" />
              J&apos;ai lu ce devis et je l&apos;accepte au nom de {quote.client?.company || quote.client?.name}, avec ses conditions.
            </label>
          </form>
        ) : (
          <p className="rounded-2xl bg-white p-5 text-sm text-neutral-700 shadow-xl">
            {expired ? errors.expired : errors.closed} {site.contact.phoneDisplay} · {site.contact.email}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <PrintButton title={`${quote.number} - ${site.name}`} />
        </div>
      </div>

      <DocumentSheet
        doc={{ ...quote, kind: "quote", acceptedAt: quote.accepted_at, acceptedBy: quote.accepted_by }}
      />
    </>
  );
}
