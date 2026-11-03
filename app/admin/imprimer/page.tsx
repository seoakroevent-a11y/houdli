import { Suspense } from "react";
import Link from "next/link";
import { PrintButton } from "@/components/admin/billing/PrintButton";
import { amountInWords, documentTotals, formatDay, formatMoney, isDocumentKind, kindConfig } from "@/lib/admin/billing";
import { isUuid } from "@/lib/admin/format";
import { db } from "@/lib/admin/form";
import { site } from "@/lib/site";

export const instant = false;

type Item = { description: string; unit: string | null; quantity: number; unit_price: number; position: number };

export default function PrintPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-white/50">Chargement…</p>}>
      <PrintableDocument searchParams={searchParams} />
    </Suspense>
  );
}

async function PrintableDocument({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;
  const supabase = await db();
  if (!isUuid(id)) return <p className="p-8 text-sm">Document introuvable.</p>;

  const [{ data: doc }, { data: billing }] = await Promise.all([
    supabase
      .from("documents")
      .select("id,kind,number,status,subject,issue_date,due_date,tva_rate,discount_rate,notes,terms,clients(name,company,address,city,ice,email,phone),document_items(description,unit,quantity,unit_price,position)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("billing_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (!doc || !isDocumentKind(doc.kind)) return <p className="p-8 text-sm">Document introuvable.</p>;

  const config = kindConfig[doc.kind];
  const client = doc.clients as unknown as { name: string; company: string | null; address: string | null; city: string | null; ice: string | null; email: string | null; phone: string | null } | null;
  const items = [...((doc.document_items ?? []) as Item[])].sort((a, b) => a.position - b.position);
  const totals = documentTotals(items, doc.discount_rate, doc.tva_rate);
  const company = billing?.legal_name || site.name;
  const legal = [
    billing?.ice && `ICE : ${billing.ice}`,
    billing?.rc && `RC : ${billing.rc}`,
    billing?.if_number && `IF : ${billing.if_number}`,
    billing?.patente && `Patente : ${billing.patente}`,
    billing?.cnss && `CNSS : ${billing.cnss}`,
  ].filter(Boolean);
  const title = `${doc.number}${client ? ` - ${client.company || client.name}` : ""}`;

  return (
    <div className="min-h-dvh bg-[#0A0A0A] px-4 py-8 print:bg-white print:p-0">
      <style>{`@media print { @page { size: A4; margin: 14mm; } html, body { background: #fff !important; } }`}</style>
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`${config.path}?id=${doc.id}`} className="text-sm text-white/60 hover:text-white">
          ← Retour {doc.kind === "quote" ? "au devis" : "à la facture"}
        </Link>
        <PrintButton title={title} />
      </div>
      {legal.length === 0 ? (
        <p className="mx-auto mb-4 max-w-[210mm] rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 print:hidden">
          Les mentions légales (ICE, RC, IF…) ne sont pas encore remplies :{" "}
          <Link href="/admin/parametres/facturation" className="underline">
            complétez-les dans Paramètres → Facturation
          </Link>
          .
        </p>
      ) : null}

      <article className="mx-auto min-h-[297mm] max-w-[210mm] bg-white p-[14mm] text-[13px] leading-relaxed text-neutral-900 shadow-2xl print:min-h-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-8 border-b-2 border-[#080838] pb-6">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/houdli-black.svg" alt={site.name} width={134} height={90} className="h-[70px] w-auto" />
            <div className="mt-3 text-xs text-neutral-600">
              <p className="font-semibold text-neutral-900">{company}</p>
              {billing?.address ? <p>{billing.address}</p> : null}
              <p>{billing?.city || site.contact.city}, Maroc</p>
              <p>{billing?.phone || site.contact.phoneDisplay}</p>
              <p>{billing?.email || site.contact.email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold uppercase tracking-[0.12em] text-[#080838]">{config.label}</p>
            <p className="mt-1 text-sm font-semibold">N° {doc.number}</p>
            <p className="mt-3 text-xs text-neutral-600">Date : {formatDay(doc.issue_date)}</p>
            {doc.due_date ? (
              <p className="text-xs text-neutral-600">
                {config.dateLabel} : {formatDay(doc.due_date)}
              </p>
            ) : null}
          </div>
        </header>

        <section className="mt-6 flex justify-end">
          <div className="w-[48%] rounded-md border border-neutral-300 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Client</p>
            {client ? (
              <div className="mt-1.5">
                <p className="font-semibold">{client.company || client.name}</p>
                {client.company ? <p>À l&apos;attention de {client.name}</p> : null}
                {client.address ? <p>{client.address}</p> : null}
                {client.city ? <p>{client.city}</p> : null}
                {client.ice ? <p>ICE : {client.ice}</p> : null}
              </div>
            ) : (
              <p>—</p>
            )}
          </div>
        </section>

        {doc.subject ? (
          <p className="mt-6">
            <span className="font-semibold">Objet : </span>
            {doc.subject}
          </p>
        ) : null}

        <table className="mt-6 w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#080838] text-[10px] uppercase tracking-[0.12em] text-white print:[print-color-adjust:exact]">
              <th className="px-3 py-2 font-semibold">Désignation</th>
              <th className="px-3 py-2 font-semibold">Unité</th>
              <th className="px-3 py-2 text-right font-semibold">Qté</th>
              <th className="px-3 py-2 text-right font-semibold">P.U. HT</th>
              <th className="px-3 py-2 text-right font-semibold">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-neutral-200 align-top">
                <td className="whitespace-pre-wrap px-3 py-2.5">{item.description}</td>
                <td className="px-3 py-2.5 text-neutral-600">{item.unit || "—"}</td>
                <td className="px-3 py-2.5 text-right">{Number(item.quantity).toLocaleString("fr-FR")}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatMoney(Number(item.unit_price))}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatMoney(totals.lines[index] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-[48%] text-sm">
            <div className="flex justify-between py-1">
              <dt>Total HT</dt>
              <dd>{formatMoney(totals.gross)}</dd>
            </div>
            {totals.discount ? (
              <>
                <div className="flex justify-between py-1">
                  <dt>Remise {Number(doc.discount_rate)} %</dt>
                  <dd>−{formatMoney(totals.discount)}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt>Net HT</dt>
                  <dd>{formatMoney(totals.net)}</dd>
                </div>
              </>
            ) : null}
            <div className="flex justify-between py-1">
              <dt>TVA {Number(doc.tva_rate)} %</dt>
              <dd>{formatMoney(totals.tva)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t-2 border-[#080838] py-2 text-base font-bold text-[#080838]">
              <dt>Total TTC</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-4 text-sm">
          Arrêté{doc.kind === "invoice" ? "e" : ""} {config.article} à la somme de : <span className="font-semibold">{amountInWords(totals.total)} TTC</span>.
        </p>

        {doc.notes ? <p className="mt-6 whitespace-pre-wrap">{doc.notes}</p> : null}
        {doc.terms ? (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Conditions</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-700">{doc.terms}</p>
          </div>
        ) : null}
        {billing?.rib ? (
          <div className="mt-6 text-xs text-neutral-700">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Règlement par virement</p>
            <p className="mt-1">
              {billing.bank_name ? `${billing.bank_name} · ` : ""}RIB : {billing.rib}
            </p>
          </div>
        ) : null}

        {doc.kind === "quote" ? (
          <div className="mt-10 flex justify-end">
            <div className="h-32 w-[48%] rounded-md border border-neutral-300 p-3 text-xs text-neutral-600">
              <p className="font-semibold text-neutral-900">Bon pour accord</p>
              <p className="mt-1">Date, signature et cachet du client</p>
            </div>
          </div>
        ) : null}

        <footer className="mt-12 border-t border-neutral-300 pt-3 text-center text-[10px] text-neutral-500">
          <p>
            {company} · {site.url.replace("https://", "")}
          </p>
          {legal.length ? <p>{legal.join(" · ")}</p> : null}
        </footer>
      </article>
    </div>
  );
}
