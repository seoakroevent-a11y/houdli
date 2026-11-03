import Link from "next/link";
import { ArrowLeft, Mail, Phone, Plus, Printer, Search } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/Brand";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";
import { PageHeader } from "@/components/admin/PageHeader";
import { fieldClass, ghostButton, labelClass, primaryButton, whatsappButton } from "@/components/admin/styles";
import { StatusSelect } from "@/components/admin/billing/StatusSelect";
import { ClientFields } from "@/components/admin/crm/ClientFields";
import {
  activityKinds,
  activityLabels,
  clientStatuses,
  clientStatusLabels,
  clientStatusTone,
  documentStatusLabels,
  documentStatusTone,
  documentTotals,
  formatDay,
  formatMoney,
  isActivityKind,
  isClientStatus,
  isOverdue,
  kindConfig,
  todayInMorocco,
  type ClientStatus,
  type DocumentKind,
} from "@/lib/admin/billing";
import { addActivity, deleteActivity, deleteClient, saveClient, setClientStatus } from "@/lib/admin/crm";
import { isUuid } from "@/lib/admin/format";
import { formatInquiryDate, whatsappNumber } from "@/lib/admin/inquiries";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Query = { id?: string; statut?: string; q?: string; ok?: string; error?: string };
type Supabase = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

type DocSummary = { id: string; kind: DocumentKind; number: string; status: string; subject: string | null; issue_date: string; due_date: string | null; tva_rate: number; discount_rate: number; document_items: { quantity: number; unit_price: number }[] };

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  ice: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  follow_up_at: string | null;
  created_at: string;
  documents: DocSummary[];
};

const tabClass = "rounded-md border px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition";
const card = "rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6";
const missingTables = "Les tables du CRM n'existent pas encore : exécutez supabase/crm-devis-factures.sql dans l'éditeur SQL de Supabase.";
const statusOptions = clientStatuses.map((value) => ({ value, label: clientStatusLabels[value] }));

function withTotals(documents: DocSummary[]) {
  return documents.map((doc) => ({ ...doc, total: documentTotals(doc.document_items, doc.discount_rate, doc.tva_rate).total }));
}

function revenue(documents: ReturnType<typeof withTotals>) {
  return documents.filter((doc) => doc.kind === "invoice" && (doc.status === "sent" || doc.status === "paid")).reduce((sum, doc) => sum + doc.total, 0);
}

function FollowUp({ date, today }: { date: string | null; today: string }) {
  if (!date) return <span className="text-white/40">—</span>;
  const tone = date < today ? "text-red-300" : date === today ? "text-amber-200" : "text-white/70";
  return <span className={tone}>{date < today ? "En retard · " : date === today ? "Aujourd'hui · " : ""}{formatDay(date)}</span>;
}

export async function CrmPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  if (!supabase) return <p className="text-sm text-white/60">Supabase non configuré.</p>;
  if (query.id && isUuid(query.id)) return <ClientDetail id={query.id} query={query} supabase={supabase} />;
  return <ClientList query={query} supabase={supabase} />;
}

async function ClientList({ query, supabase }: { query: Query; supabase: Supabase }) {
  const filter = query.statut && isClientStatus(query.statut) ? query.statut : "";
  const search = (query.q ?? "").trim().slice(0, 80);
  const today = todayInMorocco();
  const { data, error } = await supabase
    .from("clients")
    .select("id,name,company,email,phone,city,status,follow_up_at,created_at,documents(id,kind,status,tva_rate,discount_rate,document_items(quantity,unit_price))")
    .order("created_at", { ascending: false });
  const all = ((data ?? []) as unknown as ClientRow[]).map((row) => ({ ...row, docs: withTotals(row.documents ?? []) }));
  const needle = search.toLocaleLowerCase("fr");
  const matching = needle
    ? all.filter((row) => [row.name, row.company, row.email, row.phone, row.city].some((value) => value?.toLocaleLowerCase("fr").includes(needle)))
    : all;
  const rows = filter ? matching.filter((row) => row.status === filter) : matching;
  const dueFollowUps = all.filter((row) => row.follow_up_at && row.follow_up_at <= today && row.status !== "won" && row.status !== "lost").length;
  const href = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("statut", status);
    if (search) params.set("q", search);
    const value = params.toString();
    return value ? `/admin/crm?${value}` : "/admin/crm";
  };

  return (
    <>
      <PageHeader title="CRM" text="Prospects et clients, l'historique des échanges, les relances, et leurs devis et factures au même endroit." />
      <Flash ok={query.ok} error={query.error ?? (error ? missingTables : undefined)} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {clientStatuses.map((status) => (
          <Link key={status} href={href(status)} className="rounded-xl border border-white/10 bg-[#111111] p-5 transition hover:border-[#4A82EA]/60">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">{clientStatusLabels[status]}</p>
            <p className="mt-3 font-display text-3xl font-bold">{all.filter((row) => row.status === status).length}</p>
          </Link>
        ))}
        <div className={cn("rounded-xl border p-5", dueFollowUps ? "border-amber-400/40 bg-amber-400/5" : "border-white/10 bg-[#111111]")}>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Relances à faire</p>
          <p className="mt-3 font-display text-3xl font-bold">{dueFollowUps}</p>
        </div>
      </div>

      <details className={cn(card, "mb-6")} open={all.length === 0 && !error}>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
          <Plus size={15} aria-hidden="true" />
          Nouveau client ou prospect
        </summary>
        <form action={saveClient} className="mt-5 grid gap-4 sm:grid-cols-2">
          <ClientFields prefix="new-" />
          <div className="sm:col-span-2">
            <button className={primaryButton}>Créer la fiche</button>
          </div>
        </form>
      </details>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrer les clients" className="flex flex-wrap gap-2">
          {[{ value: "", label: "Tous", total: matching.length }, ...clientStatuses.map((value) => ({ value, label: clientStatusLabels[value], total: matching.filter((row) => row.status === value).length }))].map((tab) => {
            const active = tab.value === filter;
            return (
              <Link
                key={tab.value || "all"}
                href={href(tab.value)}
                aria-current={active ? "page" : undefined}
                className={cn(tabClass, active ? "border-[#4A82EA] bg-[#2d66d2]/20 text-white" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white")}
              >
                {tab.label} <span className={active ? "text-[#8FB2F5]" : "text-white/40"}>({tab.total})</span>
              </Link>
            );
          })}
        </nav>
        <form action="/admin/crm" className="relative w-full sm:w-72">
          {filter ? <input type="hidden" name="statut" value={filter} /> : null}
          <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input name="q" type="search" defaultValue={search} placeholder="Rechercher un nom, une entreprise…" aria-label="Rechercher un client" className={cn(fieldClass, "pl-9")} />
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111111]">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-white/10 text-[0.65rem] uppercase tracking-[0.16em] text-white/45">
            <tr>
              <th className="px-5 py-4 font-medium">Contact</th>
              <th className="px-5 py-4 font-medium">Coordonnées</th>
              <th className="px-5 py-4 font-medium">Étape</th>
              <th className="px-5 py-4 font-medium">Relance</th>
              <th className="px-5 py-4 text-right font-medium">Facturé</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-white/50">
                  {search || filter ? "Aucun client ne correspond." : "Aucun client pour le moment. Créez une fiche, ou ajoutez une demande du site depuis « Demandes »."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const number = whatsappNumber(row.phone);
                return (
                  <tr key={row.id} className="border-b border-white/10 align-top transition last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-5">
                      <Link href={`/admin/crm?id=${row.id}`} className="font-medium text-white hover:text-[#8FB2F5]">
                        {row.company || row.name}
                      </Link>
                      {row.company ? <p className="mt-0.5 text-xs text-white/55">{row.name}</p> : null}
                    </td>
                    <td className="px-5 py-5 text-xs text-white/60">
                      {row.email ? <p className="break-all">{row.email}</p> : null}
                      {row.phone ? <p>{row.phone}</p> : null}
                      {row.city ? <p>{row.city}</p> : null}
                    </td>
                    <td className="px-5 py-5">
                      <StatusSelect
                        key={row.status}
                        action={setClientStatus}
                        hidden={{ id: row.id, back: href(filter) }}
                        value={row.status}
                        options={statusOptions}
                        tone={clientStatusTone}
                        label={`Étape de ${row.name}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-sm">
                      <FollowUp date={row.follow_up_at} today={today} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-right">
                      {formatMoney(revenue(row.docs))}
                      <p className="mt-0.5 text-xs text-white/45">
                        {row.docs.filter((doc) => doc.kind === "quote").length} devis · {row.docs.filter((doc) => doc.kind === "invoice").length} fact.
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/crm?id=${row.id}`} className={ghostButton}>
                          Ouvrir
                        </Link>
                        {number ? (
                          <a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" className={whatsappButton} aria-label={`WhatsApp ${row.name}`}>
                            <WhatsappIcon size={14} />
                          </a>
                        ) : null}
                        <form action={deleteClient}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="back" value={href(filter)} />
                          <ConfirmSubmit label={`Supprimer ${row.company || row.name} du CRM, avec son historique d'échanges ?`} />
                        </form>
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

async function ClientDetail({ id, query, supabase }: { id: string; query: Query; supabase: Supabase }) {
  const today = todayInMorocco();
  const [{ data, error }, { data: activities }] = await Promise.all([
    supabase
      .from("clients")
      .select("*,documents(id,kind,number,status,subject,issue_date,due_date,tva_rate,discount_rate,document_items(quantity,unit_price))")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("client_activities").select("id,kind,content,created_at").eq("client_id", id).order("created_at", { ascending: false }),
  ]);
  const client = data as unknown as ClientRow | null;
  if (!client) {
    return (
      <>
        <PageHeader title="CRM" />
        <Flash error={error ? missingTables : "Client introuvable."} />
        <Link href="/admin/crm" className={ghostButton}>
          Retour au CRM
        </Link>
      </>
    );
  }

  const docs = withTotals(client.documents ?? []).sort((a, b) => b.issue_date.localeCompare(a.issue_date));
  const number = whatsappNumber(client.phone);
  const status = (isClientStatus(client.status) ? client.status : "lead") as ClientStatus;
  const stats = [
    { label: "Devis en cours", value: docs.filter((doc) => doc.kind === "quote" && (doc.status === "draft" || doc.status === "sent")).reduce((sum, doc) => sum + doc.total, 0) },
    { label: "Facturé", value: revenue(docs) },
    { label: "Encaissé", value: docs.filter((doc) => doc.kind === "invoice" && doc.status === "paid").reduce((sum, doc) => sum + doc.total, 0) },
  ];

  return (
    <>
      <Link href="/admin/crm" className="mb-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-white/50 hover:text-white">
        <ArrowLeft size={13} aria-hidden="true" />
        CRM
      </Link>
      <PageHeader
        title={client.company || client.name}
        text={
          <>
            {client.company ? `${client.name} · ` : ""}Fiche créée le {formatInquiryDate(client.created_at)}
            {client.source ? ` · ${client.source}` : ""}
          </>
        }
      />
      <Flash ok={query.ok} error={query.error} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusSelect action={setClientStatus} hidden={{ id: client.id, back: `/admin/crm?id=${client.id}` }} value={status} options={statusOptions} tone={clientStatusTone} label="Étape du client" />
        {number ? (
          <a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" className={whatsappButton}>
            <WhatsappIcon size={14} />
            WhatsApp
          </a>
        ) : null}
        {client.email ? (
          <a href={`mailto:${client.email}`} className={cn(ghostButton, "gap-1.5")}>
            <Mail size={13} aria-hidden="true" />
            E-mail
          </a>
        ) : null}
        {client.phone ? (
          <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className={cn(ghostButton, "gap-1.5")}>
            <Phone size={13} aria-hidden="true" />
            Appeler
          </a>
        ) : null}
        <Link href={`/admin/devis?id=nouveau&client=${client.id}`} className={cn(primaryButton, "gap-2")}>
          <Plus size={15} aria-hidden="true" />
          Nouveau devis
        </Link>
        <Link href={`/admin/factures?id=nouveau&client=${client.id}`} className={cn(ghostButton, "gap-1.5")}>
          <Plus size={13} aria-hidden="true" />
          Nouvelle facture
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">{stat.label}</p>
            <p className="mt-3 font-display text-2xl font-bold">{formatMoney(stat.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className={card}>
          <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.16em]">Informations</h2>
          <form action={saveClient} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={client.id} />
            <ClientFields values={client} />
            <div className="sm:col-span-2">
              <button className={primaryButton}>Enregistrer</button>
            </div>
          </form>
          <form action={deleteClient} className="mt-6 border-t border-white/10 pt-4">
            <input type="hidden" name="id" value={client.id} />
            <ConfirmSubmit label={`Supprimer ${client.company || client.name} du CRM, avec son historique d'échanges ?`} />
            <p className="mt-2 text-xs text-white/45">Un client qui a des devis ou des factures ne peut pas être supprimé : passez-le plutôt en « Perdu ».</p>
          </form>
        </section>

        <section className={card}>
          <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.16em]">Échanges</h2>
          <form action={addActivity} className="grid gap-3">
            <input type="hidden" name="client_id" value={client.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="kind">
                  Type
                </label>
                <select id="kind" name="kind" className={fieldClass}>
                  {activityKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {activityLabels[kind]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="activity-follow-up">
                  Relancer le
                </label>
                <input id="activity-follow-up" name="follow_up_at" type="date" className={fieldClass} />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="content">
                Compte rendu
              </label>
              <textarea id="content" name="content" rows={3} required placeholder="Ex. Appel : budget validé, attend le devis avant vendredi." className={fieldClass} />
            </div>
            <div>
              <button className={primaryButton}>Ajouter à l&apos;historique</button>
            </div>
          </form>

          <p className="mt-6 text-xs uppercase tracking-[0.14em] text-white/45">
            Prochaine relance : <FollowUp date={client.follow_up_at} today={today} />
          </p>

          <ol className="mt-4 grid gap-3">
            {(activities ?? []).length === 0 ? <li className="text-sm text-white/50">Aucun échange enregistré.</li> : null}
            {(activities ?? []).map((activity: { id: string; kind: string; content: string; created_at: string }) => (
              <li key={activity.id} className="rounded-lg border border-white/10 bg-black/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#8FB2F5]">
                    {isActivityKind(activity.kind) ? activityLabels[activity.kind] : activity.kind}
                    <span className="ml-2 font-normal normal-case tracking-normal text-white/45">{formatInquiryDate(activity.created_at)}</span>
                  </p>
                  <form action={deleteActivity}>
                    <input type="hidden" name="id" value={activity.id} />
                    <input type="hidden" name="client_id" value={client.id} />
                    <button
                      className="text-xs text-white/40 hover:text-red-200"
                      aria-label="Supprimer cet échange"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{activity.content}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.16em]">Devis et factures</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111111]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-[0.65rem] uppercase tracking-[0.16em] text-white/45">
              <tr>
                <th className="px-5 py-4 font-medium">Document</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 text-right font-medium">Total TTC</th>
                <th className="px-5 py-4 font-medium">Statut</th>
                <th className="px-5 py-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-white/50">
                    Aucun devis ni facture pour ce client.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-white/10 last:border-0">
                    <td className="px-5 py-4">
                      <Link href={`${kindConfig[doc.kind].path}?id=${doc.id}`} className="font-medium hover:text-[#8FB2F5]">
                        {kindConfig[doc.kind].label} {doc.number}
                      </Link>
                      {doc.subject ? <p className="mt-0.5 text-xs text-white/55">{doc.subject}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-white/75">{formatDay(doc.issue_date)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">{formatMoney(doc.total)}</td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-block rounded-md border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]", documentStatusTone[doc.status])}>
                        {isOverdue(doc, today) ? "En retard" : documentStatusLabels[doc.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/imprimer?id=${doc.id}`} target="_blank" className={cn(ghostButton, "gap-1.5")}>
                        <Printer size={13} aria-hidden="true" />
                        PDF
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
