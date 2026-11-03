"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { fieldClass, ghostButton, labelClass, primaryButton } from "@/components/admin/styles";
import { documentStatusLabels, documentTotals, formatMoney, kindConfig, tvaRates, type DocumentKind, type LineItem } from "@/lib/admin/billing";
import { saveDocument } from "@/lib/admin/documents";

export type DocumentDraft = {
  id: string;
  number: string | null;
  quoteId: string;
  clientId: string;
  status: string;
  subject: string;
  issueDate: string;
  dueDate: string;
  paidAt: string;
  tvaRate: number;
  discountRate: number;
  notes: string;
  terms: string;
  items: LineItem[];
};

type Row = LineItem & { key: number };

const cell = "rounded-md border border-white/10 bg-black px-2.5 py-2 text-sm text-white outline-none focus:border-[#4A82EA]";

export function DocumentForm({
  kind,
  draft,
  clients,
  suggestions,
}: {
  kind: DocumentKind;
  draft: DocumentDraft;
  clients: { id: string; label: string }[];
  suggestions: string[];
}) {
  const config = kindConfig[kind];
  const [rows, setRows] = useState<Row[]>(() => draft.items.map((item, key) => ({ ...item, key })));
  const [nextKey, setNextKey] = useState(draft.items.length);
  const [tvaRate, setTvaRate] = useState(draft.tvaRate);
  const [discountRate, setDiscountRate] = useState(draft.discountRate);
  const totals = documentTotals(rows, discountRate, tvaRate);

  const update = (key: number, patch: Partial<LineItem>) => setRows((list) => list.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const addRow = () => {
    setRows((list) => [...list, { key: nextKey, description: "", unit: "", quantity: 1, unit_price: 0 }]);
    setNextKey((key) => key + 1);
  };
  const payload = JSON.stringify(rows.filter((row) => row.description.trim()).map((row) => ({ description: row.description, unit: row.unit, quantity: row.quantity, unit_price: row.unit_price })));

  return (
    <form action={saveDocument} className="grid gap-6">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={draft.id} />
      <input type="hidden" name="quote_id" value={draft.quoteId} />
      <input type="hidden" name="items" value={payload} />
      <input type="hidden" name="paid_at" value={draft.paidAt} />

      <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="client_id">
            Client
          </label>
          <select id="client_id" name="client_id" required defaultValue={draft.clientId} className={fieldClass}>
            <option value="">Choisir un client…</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
          {clients.length === 0 ? (
            <p className="mt-2 text-xs text-amber-200">
              Aucun client : <Link href="/admin/crm" className="underline">créez d&apos;abord une fiche dans le CRM</Link>.
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="subject">
            Objet
          </label>
          <input id="subject" name="subject" defaultValue={draft.subject} placeholder="Ex. Séminaire annuel, Marrakech" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="issue_date">
            Date
          </label>
          <input id="issue_date" name="issue_date" type="date" required defaultValue={draft.issueDate} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="due_date">
            {config.dateLabel}
          </label>
          <input id="due_date" name="due_date" type="date" defaultValue={draft.dueDate} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Statut
          </label>
          <select id="status" name="status" defaultValue={draft.status} className={fieldClass}>
            {config.statuses.map((status) => (
              <option key={status} value={status}>
                {documentStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="tva_rate">
            TVA
          </label>
          <select id="tva_rate" name="tva_rate" value={tvaRate} onChange={(event) => setTvaRate(Number(event.target.value))} className={fieldClass}>
            {[...new Set([...tvaRates, draft.tvaRate])].map((value) => (
              <option key={value} value={value}>
                {value} %
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.16em]">Prestations</h2>
        <datalist id="prestations">
          {suggestions.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[0.65rem] uppercase tracking-[0.16em] text-white/45">
              <tr>
                <th className="pb-2 font-medium">Désignation</th>
                <th className="w-24 pb-2 font-medium">Unité</th>
                <th className="w-24 pb-2 font-medium">Qté</th>
                <th className="w-36 pb-2 font-medium">Prix unitaire HT</th>
                <th className="w-36 pb-2 text-right font-medium">Total HT</th>
                <th className="w-10 pb-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.key} className="align-top">
                  <td className="py-1.5 pr-2">
                    <input
                      aria-label={`Désignation, ligne ${index + 1}`}
                      list="prestations"
                      value={row.description}
                      maxLength={1000}
                      onChange={(event) => update(row.key, { description: event.target.value })}
                      className={`${cell} w-full`}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      aria-label={`Unité, ligne ${index + 1}`}
                      value={row.unit}
                      placeholder="pers., jour…"
                      onChange={(event) => update(row.key, { unit: event.target.value })}
                      className={`${cell} w-full`}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      aria-label={`Quantité, ligne ${index + 1}`}
                      type="number"
                      min={0.01}
                      step="any"
                      value={row.quantity}
                      onChange={(event) => update(row.key, { quantity: Number(event.target.value) })}
                      className={`${cell} w-full`}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      aria-label={`Prix unitaire, ligne ${index + 1}`}
                      type="number"
                      min={0}
                      step="any"
                      value={row.unit_price}
                      onChange={(event) => update(row.key, { unit_price: Number(event.target.value) })}
                      className={`${cell} w-full`}
                    />
                  </td>
                  <td className="whitespace-nowrap py-3.5 text-right text-white/80">{formatMoney(totals.lines[index] ?? 0)}</td>
                  <td className="py-1.5 pl-2">
                    <button
                      type="button"
                      aria-label={`Supprimer la ligne ${index + 1}`}
                      disabled={rows.length === 1}
                      onClick={() => setRows((list) => list.filter((item) => item.key !== row.key))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/60 transition hover:border-red-400/40 hover:text-red-200 disabled:opacity-30"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addRow} className={`${ghostButton} mt-3 gap-1.5`}>
          <Plus size={14} aria-hidden="true" />
          Ajouter une ligne
        </button>

        <dl className="ml-auto mt-6 grid max-w-sm gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-white/60">Total HT</dt>
            <dd>{formatMoney(totals.gross)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>
              <label htmlFor="discount_rate" className="text-white/60">
                Remise (%)
              </label>
            </dt>
            <dd className="flex items-center gap-3">
              <input
                id="discount_rate"
                name="discount_rate"
                type="number"
                min={0}
                max={100}
                step="any"
                value={discountRate}
                onChange={(event) => setDiscountRate(Number(event.target.value))}
                className={`${cell} w-20`}
              />
              <span className="text-white/70">−{formatMoney(totals.discount)}</span>
            </dd>
          </div>
          {totals.discount ? (
            <div className="flex justify-between gap-4">
              <dt className="text-white/60">Net HT</dt>
              <dd>{formatMoney(totals.net)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-white/60">TVA {tvaRate} %</dt>
            <dd>{formatMoney(totals.tva)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/10 pt-2 text-base font-semibold">
            <dt>Total TTC</dt>
            <dd className="text-[#8FB2F5]">{formatMoney(totals.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <label className={labelClass} htmlFor="notes">
            Note pour le client
          </label>
          <textarea id="notes" name="notes" rows={4} defaultValue={draft.notes} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="terms">
            Conditions
          </label>
          <textarea id="terms" name="terms" rows={4} defaultValue={draft.terms} placeholder="Modalités de paiement, acompte, validité…" className={fieldClass} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className={primaryButton}>{draft.id ? "Enregistrer" : `Créer ${kind === "quote" ? "le devis" : "la facture"}`}</button>
        <Link href={config.path} className={ghostButton}>
          Retour à la liste
        </Link>
      </div>
    </form>
  );
}
