import Link from "next/link";
import { FileText, Plus, Printer } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";
import { PageHeader } from "@/components/admin/PageHeader";
import { ghostButton, primaryButton } from "@/components/admin/styles";
import { DocumentForm, type DocumentDraft } from "@/components/admin/billing/DocumentForm";
import { StatusSelect } from "@/components/admin/billing/StatusSelect";
import {
  clientLabel,
  documentStatusLabels,
  documentStatusTone,
  documentTotals,
  formatDay,
  formatMoney,
  isDocumentStatus,
  isOverdue,
  kindConfig,
  todayInMorocco,
  type DocumentKind,
} from "@/lib/admin/billing";
import { isUuid } from "@/lib/admin/format";
import { deleteDocument, invoiceFromQuote, setDocumentStatus } from "@/lib/admin/documents";
import { activites } from "@/content/activites";
import { universList } from "@/content/univers";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Query = { id?: string; client?: string; objet?: string; statut?: string; ok?: string; error?: string };
type Supabase = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

type DocumentRow = {
  id: string;
  number: string;
  status: string;
  subject: string | null;
  issue_date: string;
  due_date: string | null;
  tva_rate: number;
  discount_rate: number;
  client_id: string;
  clients: { name: string; company: string | null } | null;
  document_items: { quantity: number; unit_price: number }[];
};

const tabClass = "rounded-md border px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition";
const missingTables = "Les tables du CRM n'existent pas encore : exécutez supabase/crm-devis-factures.sql dans l'éditeur SQL de Supabase.";

export async function DocumentsPage({ kind, searchParams }: { kind: DocumentKind; searchParams: Promise<Query> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  if (!supabase) return <p className="text-sm text-white/60">Supabase non configuré.</p>;
  if (query.id) return <DocumentEditor kind={kind} query={query} supabase={supabase} />;
  return <DocumentList kind={kind} query={query} supabase={supabase} />;
}

async function DocumentList({ kind, query, supabase }: { kind: DocumentKind; query: Query; supabase: Supabase }) {
  const config = kindConfig[kind];
  const filter = query.statut && isDocumentStatus(kind, query.statut) ? query.statut : "";
  const today = todayInMorocco();
  const [{ data, error }, { data: invoices }] = await Promise.all([
    supabase
      .from("documents")
      .select("id,number,status,subject,issue_date,due_date,tva_rate,discount_rate,client_id,clients(name,company),document_items(quantity,unit_price)")
      .eq("kind", kind)
      .order("issue_date", { ascending: false })
      .order("number", { ascending: false }),
    kind === "quote" ? supabase.from("documents").select("id,quote_id").eq("kind", "invoice").not("quote_id", "is", null) : Promise.resolve({ data: [] }),
  ]);
  const invoiceOf = new Map((invoices ?? []).map((row: { id: string; quote_id: string }) => [row.quote_id, row.id]));
  const items = ((data ?? []) as unknown as DocumentRow[]).map((row) => ({
    ...row,
    total: documentTotals(row.document_items, row.discount_rate, row.tva_rate).total,
    overdue: isOverdue(row, today),
  }));
  const rows = filter ? items.filter((row) => row.status === filter) : items;
  const sum = (list: typeof items) => list.reduce((total, row) => total + row.total, 0);
  const count = (status: string) => items.filter((row) => row.status === status).length;
  const tabs = [{ value: "", label: "Tous", total: items.length }, ...config.statuses.map((value) => ({ value, label: documentStatusLabels[value], total: count(value) }))];

  const summary =
    kind === "quote"
      ? [
          { label: "En attente de réponse", value: sum(items.filter((row) => row.status === "sent")) },
          { label: "Acceptés", value: sum(items.filter((row) => row.status === "accepted")) },
          { label: "Taux d'acceptation", text: acceptance(items) },
        ]
      : [
          { label: "Facturé (hors brouillons et annulées)", value: sum(items.filter((row) => row.status === "sent" || row.status === "paid")) },
          { label: "Encaissé", value: sum(items.filter((row) => row.status === "paid")) },
          { label: "À encaisser", value: sum(items.filter((row) => row.status === "sent")), hint: overdueHint(items) },
        ];

  return (
    <>
      <PageHeader
        title={config.plural}
        text={
          kind === "quote"
            ? "Créez un devis, imprimez-le ou enregistrez-le en PDF, puis transformez-le en facture dès qu'il est accepté."
            : "Factures numérotées à la suite (FAC-année-numéro). Une facture émise ne se supprime pas : elle s'annule."
        }
      />
      <Flash ok={query.ok} error={query.error ?? (error ? missingTables : undefined)} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`${config.path}?id=nouveau`} className={cn(primaryButton, "gap-2")}>
          <Plus size={15} aria-hidden="true" />
          {kind === "quote" ? "Nouveau devis" : "Nouvelle facture"}
        </Link>
        <Link href="/admin/parametres/facturation" className={ghostButton}>
          Mentions légales et RIB
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {summary.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">{card.label}</p>
            <p className="mt-3 font-display text-2xl font-bold">{"value" in card && card.value !== undefined ? formatMoney(card.value) : card.text}</p>
            {"hint" in card && card.hint ? <p className="mt-1 text-xs text-red-300">{card.hint}</p> : null}
          </div>
        ))}
      </div>

      <nav aria-label={`Filtrer les ${config.plural.toLowerCase()}`} className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.value === filter;
          return (
            <Link
              key={tab.value || "all"}
              href={tab.value ? `${config.path}?statut=${tab.value}` : config.path}
              aria-current={active ? "page" : undefined}
              className={cn(tabClass, active ? "border-[#4A82EA] bg-[#2d66d2]/20 text-white" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white")}
            >
              {tab.label} <span className={active ? "text-[#8FB2F5]" : "text-white/40"}>({tab.total})</span>
            </Link>
          );
        })}
      </nav>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111111]">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-white/10 text-[0.65rem] uppercase tracking-[0.16em] text-white/45">
            <tr>
              <th className="px-5 py-4 font-medium">Numéro</th>
              <th className="px-5 py-4 font-medium">Client</th>
              <th className="px-5 py-4 font-medium">Date</th>
              <th className="px-5 py-4 text-right font-medium">Total TTC</th>
              <th className="px-5 py-4 font-medium">Statut</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-white/50">
                  {filter ? "Aucun document avec ce statut." : kind === "quote" ? "Aucun devis pour le moment." : "Aucune facture pour le moment."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const back = filter ? `${config.path}?statut=${filter}` : config.path;
                const invoiceId = invoiceOf.get(row.id);
                return (
                  <tr key={row.id} className="border-b border-white/10 align-top transition last:border-0 hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-5 py-5">
                      <Link href={`${config.path}?id=${row.id}`} className="font-medium text-white hover:text-[#8FB2F5]">
                        {row.number}
                      </Link>
                      {row.subject ? <p className="mt-0.5 max-w-[14rem] truncate text-xs text-white/55">{row.subject}</p> : null}
                    </td>
                    <td className="px-5 py-5">
                      <Link href={`/admin/crm?id=${row.client_id}`} className="text-white/80 hover:text-white">
                        {clientLabel(row.clients)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-white/75">
                      {formatDay(row.issue_date)}
                      {row.due_date ? (
                        <p className={cn("mt-0.5 text-xs", row.overdue ? "text-red-300" : "text-white/45")}>
                          {row.overdue ? "En retard · " : kind === "quote" ? "Valable → " : "Échéance "}
                          {formatDay(row.due_date)}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-right font-medium">{formatMoney(row.total)}</td>
                    <td className="px-5 py-5">
                      <StatusSelect
                        key={row.status}
                        action={setDocumentStatus}
                        hidden={{ id: row.id, kind, back }}
                        value={row.status}
                        options={config.statuses.map((value) => ({ value, label: documentStatusLabels[value] }))}
                        tone={documentStatusTone}
                        label={`Statut de ${row.number}`}
                      />
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`${config.path}?id=${row.id}`} className={ghostButton}>
                          Modifier
                        </Link>
                        <Link href={`/admin/imprimer?id=${row.id}`} target="_blank" className={cn(ghostButton, "gap-1.5")}>
                          <Printer size={13} aria-hidden="true" />
                          PDF
                        </Link>
                        {kind === "quote" ? (
                          invoiceId ? (
                            <Link href={`/admin/factures?id=${invoiceId}`} className={cn(ghostButton, "gap-1.5")}>
                              <FileText size={13} aria-hidden="true" />
                              Voir la facture
                            </Link>
                          ) : row.status !== "refused" ? (
                            <form action={invoiceFromQuote}>
                              <input type="hidden" name="id" value={row.id} />
                              <button className={cn(ghostButton, "gap-1.5")}>
                                <FileText size={13} aria-hidden="true" />
                                Facturer
                              </button>
                            </form>
                          ) : null
                        ) : null}
                        {kind === "quote" || row.status === "draft" ? (
                          <form action={deleteDocument}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="kind" value={kind} />
                            <ConfirmSubmit label={`Supprimer ${row.number} ?`} />
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function acceptance(items: { status: string }[]) {
  const answered = items.filter((row) => row.status === "accepted" || row.status === "refused");
  if (!answered.length) return "—";
  return `${Math.round((answered.filter((row) => row.status === "accepted").length / answered.length) * 100)} %`;
}

function overdueHint(items: { overdue: boolean; total: number }[]) {
  const late = items.filter((row) => row.overdue);
  if (!late.length) return "";
  return `dont ${formatMoney(late.reduce((total, row) => total + row.total, 0))} en retard (${late.length})`;
}

async function DocumentEditor({ kind, query, supabase }: { kind: DocumentKind; query: Query; supabase: Supabase }) {
  const config = kindConfig[kind];
  const isNew = query.id === "nouveau";
  if (!isNew && !isUuid(query.id ?? "")) return <p className="text-sm text-white/60">Document introuvable.</p>;

  const [{ data: clients, error: clientsError }, { data: billing }, docResult] = await Promise.all([
    supabase.from("clients").select("id,name,company").order("company", { ascending: true, nullsFirst: false }).order("name"),
    supabase.from("billing_settings").select("default_tva,quote_terms,invoice_terms").eq("id", 1).maybeSingle(),
    isNew
      ? Promise.resolve({ data: null })
      : supabase
          .from("documents")
          .select("id,number,quote_id,client_id,status,subject,issue_date,due_date,paid_at,tva_rate,discount_rate,notes,terms,document_items(description,unit,quantity,unit_price,position)")
          .eq("id", query.id!)
          .eq("kind", kind)
          .maybeSingle(),
  ]);
  const doc = docResult.data;
  if (!isNew && !doc) {
    return (
      <>
        <PageHeader title={config.label} />
        <p className="text-sm text-white/60">Document introuvable.</p>
      </>
    );
  }

  const defaultTerms = (kind === "quote" ? billing?.quote_terms : billing?.invoice_terms) ?? "";
  const draft: DocumentDraft = doc
    ? {
        id: doc.id,
        number: doc.number,
        quoteId: doc.quote_id ?? "",
        clientId: doc.client_id,
        status: doc.status,
        subject: doc.subject ?? "",
        issueDate: doc.issue_date,
        dueDate: doc.due_date ?? "",
        paidAt: doc.paid_at ?? "",
        tvaRate: Number(doc.tva_rate),
        discountRate: Number(doc.discount_rate),
        notes: doc.notes ?? "",
        terms: doc.terms ?? "",
        items: [...(doc.document_items ?? [])]
          .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
          .map((item: { description: string; unit: string | null; quantity: number; unit_price: number }) => ({
            description: item.description,
            unit: item.unit ?? "",
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          })),
      }
    : {
        id: "",
        number: null,
        quoteId: "",
        clientId: query.client && isUuid(query.client) ? query.client : "",
        status: "draft",
        subject: (query.objet ?? "").slice(0, 200),
        issueDate: todayInMorocco(),
        dueDate: todayInMorocco(30),
        paidAt: "",
        tvaRate: Number(billing?.default_tva ?? 20),
        discountRate: 0,
        notes: "",
        terms: defaultTerms,
        items: [{ description: "", unit: "", quantity: 1, unit_price: 0 }],
      };

  const suggestions = [...universList.map((univers) => univers.title), ...activites.map((activite) => `Team building — ${activite.title}`)];
  const clientOptions = (clients ?? []).map((client: { id: string; name: string; company: string | null }) => ({ id: client.id, label: clientLabel(client) }));

  return (
    <>
      <PageHeader
        title={doc ? `${config.label} ${doc.number}` : kind === "quote" ? "Nouveau devis" : "Nouvelle facture"}
        text={doc ? undefined : "Le numéro est attribué à l'enregistrement."}
      />
      <Flash ok={query.ok} error={query.error ?? (clientsError ? missingTables : undefined)} />
      {doc ? (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href={`/admin/imprimer?id=${doc.id}`} target="_blank" className={cn(primaryButton, "gap-2")}>
            <Printer size={15} aria-hidden="true" />
            Imprimer / PDF
          </Link>
          <Link href={`/admin/crm?id=${doc.client_id}`} className={ghostButton}>
            Fiche client
          </Link>
          {kind === "quote" ? (
            <form action={invoiceFromQuote}>
              <input type="hidden" name="id" value={doc.id} />
              <button className={cn(ghostButton, "gap-1.5")}>
                <FileText size={13} aria-hidden="true" />
                Créer la facture
              </button>
            </form>
          ) : doc.quote_id ? (
            <Link href={`/admin/devis?id=${doc.quote_id}`} className={ghostButton}>
              Devis d&apos;origine
            </Link>
          ) : null}
        </div>
      ) : null}
      <DocumentForm key={doc?.id ?? "new"} kind={kind} draft={draft} clients={clientOptions} suggestions={suggestions} />
    </>
  );
}
