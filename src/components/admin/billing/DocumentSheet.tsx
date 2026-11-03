import { amountInWords, documentTotals, formatDay, formatMoney, kindConfig, type DocumentKind } from "@/lib/admin/billing";
import { site } from "@/lib/site";

export type SheetBilling = {
  legal_name?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  ice?: string | null;
  rc?: string | null;
  if_number?: string | null;
  patente?: string | null;
  cnss?: string | null;
  bank_name?: string | null;
  rib?: string | null;
};

export type SheetData = {
  kind: DocumentKind;
  number: string;
  subject: string | null;
  issue_date: string;
  due_date: string | null;
  tva_rate: number;
  discount_rate: number;
  notes: string | null;
  terms: string | null;
  client: { name: string; company: string | null; address: string | null; city: string | null; ice: string | null } | null;
  items: { description: string; unit: string | null; quantity: number; unit_price: number }[];
  billing: SheetBilling | null;
  acceptedBy?: string | null;
  acceptedAt?: string | null;
};

export function legalMentions(billing: SheetBilling | null) {
  return [
    billing?.ice && `ICE : ${billing.ice}`,
    billing?.rc && `RC : ${billing.rc}`,
    billing?.if_number && `IF : ${billing.if_number}`,
    billing?.patente && `Patente : ${billing.patente}`,
    billing?.cnss && `CNSS : ${billing.cnss}`,
  ].filter(Boolean) as string[];
}

/** Devis ou facture au format A4, identique à l'écran, à l'impression et dans le PDF. */
export function DocumentSheet({ doc }: { doc: SheetData }) {
  const config = kindConfig[doc.kind];
  const { billing, client } = doc;
  const totals = documentTotals(doc.items, doc.discount_rate, doc.tva_rate);
  const company = billing?.legal_name || site.name;
  const legal = legalMentions(billing);

  return (
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
        <div className="w-full rounded-md border border-neutral-300 p-4 sm:w-[48%]">
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

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
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
            {doc.items.map((item, index) => (
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
      </div>

      <div className="mt-4 flex justify-end">
        <dl className="w-full text-sm sm:w-[48%]">
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
          <div className="min-h-32 w-full rounded-md border border-neutral-300 p-3 text-xs text-neutral-600 sm:w-[48%]">
            <p className="font-semibold text-neutral-900">Bon pour accord</p>
            {doc.acceptedAt && doc.acceptedBy ? (
              <p className="mt-1 text-emerald-700">
                Accepté en ligne par {doc.acceptedBy} le {formatDay(doc.acceptedAt)}.
              </p>
            ) : (
              <p className="mt-1">Date, signature et cachet du client</p>
            )}
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
  );
}
