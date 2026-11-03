import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";
import { PageHeader } from "@/components/admin/PageHeader";
import { fieldClass, ghostButton, labelClass, primaryButton } from "@/components/admin/styles";
import { deleteAgendaItem, saveAgendaItem } from "@/lib/admin/agenda";
import { clientLabel, formatMoney, documentTotals, kindConfig, todayInMorocco, type DocumentKind } from "@/lib/admin/billing";
import {
  addDays,
  agendaKinds,
  agendaLabels,
  dayLabel,
  entryTone,
  isAgendaKind,
  isMonth,
  legend,
  monthGrid,
  monthLabel,
  shiftMonth,
  weekDays,
  type EntryTone,
} from "@/lib/admin/calendar";
import { isUuid } from "@/lib/admin/format";
import { moroccanHolidays, type Holiday } from "@/lib/admin/holidays";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Query = { mois?: string; jour?: string; entree?: string; client?: string; document?: string; ok?: string; error?: string };
type Client = { name: string; company: string | null };

type AgendaRow = {
  id: string;
  title: string;
  kind: string;
  starts_on: string;
  ends_on: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  client_id: string | null;
  document_id: string | null;
  notes: string | null;
  clients: Client | null;
};

type Entry = { key: string; day: string; tone: EntryTone; title: string; detail: string; href?: string };

function holidayEntry(holiday: Holiday): Entry {
  return {
    key: `h-${holiday.day}-${holiday.name}`,
    day: holiday.day,
    tone: holiday.off ? "holiday" : "ramadan",
    title: holiday.name,
    detail: [holiday.off ? "Jour férié" : "Non férié", holiday.estimated ? "date estimée, selon l'observation du croissant" : ""].filter(Boolean).join(" · "),
  };
}

function EntryLink({ entry, className, children }: { entry: Entry; className: string; children: ReactNode }) {
  if (!entry.href) {
    return (
      <span title={`${entry.title} — ${entry.detail}`} className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link href={entry.href} title={`${entry.title} — ${entry.detail}`} className={className}>
      {children}
    </Link>
  );
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const card = "rounded-xl border border-white/10 bg-[#111111]";

function time(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function daysUntil(today: string, day: string) {
  const count = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  return count === 0 ? "Aujourd'hui" : count === 1 ? "Demain" : `Dans ${count} jours`;
}

function hours(row: AgendaRow) {
  const start = time(row.start_time);
  const end = time(row.end_time);
  return start && end ? `${start}–${end}` : start;
}

export async function CalendarPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  if (!supabase) return <p className="text-sm text-white/60">Supabase non configuré.</p>;

  const today = todayInMorocco();
  const newDay = query.jour && DAY.test(query.jour) ? query.jour : "";
  const month = isMonth(query.mois) ? query.mois : (newDay || today).slice(0, 7);
  const { days, start, end } = monthGrid(month);
  const self = `/admin/calendrier?mois=${month}`;
  const editId = query.entree && isUuid(query.entree) ? query.entree : "";

  const [agenda, followUps, dueDocs, clients, editing, linkedDoc] = await Promise.all([
    supabase
      .from("agenda_items")
      .select("id,title,kind,starts_on,ends_on,start_time,end_time,location,client_id,document_id,notes,clients(name,company)")
      .lte("starts_on", end)
      .or(`ends_on.gte.${start},starts_on.gte.${start}`)
      .order("starts_on")
      .order("start_time", { nullsFirst: true }),
    supabase.from("clients").select("id,name,company,follow_up_at").gte("follow_up_at", start).lte("follow_up_at", end).neq("status", "lost"),
    supabase
      .from("documents")
      .select("id,kind,number,due_date,tva_rate,discount_rate,clients(name,company),document_items(quantity,unit_price)")
      .eq("status", "sent")
      .gte("due_date", start)
      .lte("due_date", end),
    supabase.from("clients").select("id,name,company").order("company", { ascending: true, nullsFirst: false }).order("name"),
    editId ? supabase.from("agenda_items").select("*").eq("id", editId).maybeSingle() : Promise.resolve({ data: null }),
    !editId && query.document && isUuid(query.document)
      ? supabase.from("documents").select("id,kind,number,subject,client_id").eq("id", query.document).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const holidays = moroccanHolidays(start, end);
  const offDays = new Set(holidays.filter((holiday) => holiday.off).map((holiday) => holiday.day));
  const upcoming = moroccanHolidays(today, addDays(today, 365)).filter((holiday) => holiday.off && !holiday.name.includes("2e jour")).slice(0, 6);

  const entries: Entry[] = holidays.map(holidayEntry);
  for (const row of (agenda.data ?? []) as unknown as AgendaRow[]) {
    const kind = isAgendaKind(row.kind) ? row.kind : "other";
    const last = row.ends_on ?? row.starts_on;
    const detail = [hours(row), row.location, row.clients ? clientLabel(row.clients) : ""].filter(Boolean).join(" · ");
    for (let day = row.starts_on < start ? start : row.starts_on; day <= last && day <= end; day = addDays(day, 1)) {
      entries.push({ key: `${row.id}-${day}`, day, tone: kind, title: row.title, detail: detail || agendaLabels[kind], href: `${self}&entree=${row.id}` });
    }
  }
  for (const row of (followUps.data ?? []) as { id: string; name: string; company: string | null; follow_up_at: string }[]) {
    entries.push({ key: `f-${row.id}`, day: row.follow_up_at, tone: "follow_up", title: `Relancer ${row.company || row.name}`, detail: "Relance client", href: `/admin/crm?id=${row.id}` });
  }
  for (const row of (dueDocs.data ?? []) as unknown as { id: string; kind: DocumentKind; number: string; due_date: string; tva_rate: number; discount_rate: number; clients: Client | null; document_items: { quantity: number; unit_price: number }[] }[]) {
    const total = formatMoney(documentTotals(row.document_items, row.discount_rate, row.tva_rate).total);
    entries.push({
      key: `d-${row.id}`,
      day: row.due_date,
      tone: row.kind,
      title: row.kind === "invoice" ? `Échéance ${row.number}` : `Fin du devis ${row.number}`,
      detail: `${clientLabel(row.clients)} · ${total}`,
      href: `${kindConfig[row.kind].path}?id=${row.id}`,
    });
  }
  const byDay = new Map<string, Entry[]>();
  for (const entry of entries) byDay.set(entry.day, [...(byDay.get(entry.day) ?? []), entry]);
  const monthEntries = entries.filter((entry) => entry.day.startsWith(month)).sort((a, b) => a.day.localeCompare(b.day));

  const item = editing.data as Omit<AgendaRow, "clients"> | null;
  const doc = linkedDoc.data as { id: string; kind: DocumentKind; number: string; subject: string | null; client_id: string } | null;
  const showForm = !!item || !!newDay;
  const formDay = item?.starts_on ?? newDay;

  return (
    <>
      <PageHeader title="Calendrier" text="Vos événements, rendez-vous et montages, avec les relances du CRM et les échéances des devis et factures." />
      <Flash
        ok={query.ok}
        error={query.error ?? (agenda.error ? "La table du calendrier n'existe pas encore : exécutez supabase/calendrier.sql dans l'éditeur SQL de Supabase." : undefined)}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/admin/calendrier?mois=${shiftMonth(month, -1)}`} aria-label="Mois précédent" className={cn(ghostButton, "h-10 w-10 p-0")}>
            <ChevronLeft size={16} />
          </Link>
          <h2 className="min-w-[11rem] text-center font-display text-lg font-bold">{monthLabel(month)}</h2>
          <Link href={`/admin/calendrier?mois=${shiftMonth(month, 1)}`} aria-label="Mois suivant" className={cn(ghostButton, "h-10 w-10 p-0")}>
            <ChevronRight size={16} />
          </Link>
          {month !== today.slice(0, 7) ? (
            <Link href="/admin/calendrier" className={ghostButton}>
              Aujourd&apos;hui
            </Link>
          ) : null}
        </div>
        <Link href={`/admin/calendrier?mois=${month}&jour=${month === today.slice(0, 7) ? today : `${month}-01`}`} className={cn(primaryButton, "gap-2")}>
          <Plus size={15} aria-hidden="true" />
          Nouvelle entrée
        </Link>
      </div>

      {showForm ? (
        <form action={saveAgendaItem} className={cn(card, "mb-6 grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4")}>
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] sm:col-span-2 lg:col-span-4">
            {item ? "Modifier l'entrée" : `Nouvelle entrée · ${dayLabel(formDay)}`}
          </h2>
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <input type="hidden" name="document_id" value={item?.document_id ?? doc?.id ?? ""} />
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="title">
              Titre
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={item?.title ?? (doc ? doc.subject || `${kindConfig[doc.kind].label} ${doc.number}` : "")}
              placeholder="Ex. Séminaire, Marrakech"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="kind">
              Type
            </label>
            <select id="kind" name="kind" defaultValue={item?.kind ?? "event"} className={fieldClass}>
              {agendaKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {agendaLabels[kind]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="client_id">
              Client
            </label>
            <select id="client_id" name="client_id" defaultValue={item?.client_id ?? doc?.client_id ?? (query.client && isUuid(query.client) ? query.client : "")} className={fieldClass}>
              <option value="">Aucun</option>
              {((clients.data ?? []) as { id: string; name: string; company: string | null }[]).map((client) => (
                <option key={client.id} value={client.id}>
                  {clientLabel(client)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="starts_on">
              Du
            </label>
            <input id="starts_on" name="starts_on" type="date" required defaultValue={formDay} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="ends_on">
              Au (si plusieurs jours)
            </label>
            <input id="ends_on" name="ends_on" type="date" defaultValue={item?.ends_on ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="start_time">
              De
            </label>
            <input id="start_time" name="start_time" type="time" defaultValue={time(item?.start_time ?? null)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="end_time">
              À
            </label>
            <input id="end_time" name="end_time" type="time" defaultValue={time(item?.end_time ?? null)} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="location">
              Lieu
            </label>
            <input id="location" name="location" defaultValue={item?.location ?? ""} placeholder="Hôtel, ville…" className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="notes">
              Notes
            </label>
            <textarea id="notes" name="notes" rows={2} defaultValue={item?.notes ?? ""} className={fieldClass} />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
            <button className={primaryButton}>{item ? "Enregistrer" : "Ajouter au calendrier"}</button>
            <Link href={self} className={ghostButton}>
              Annuler
            </Link>
            {item?.client_id ? (
              <Link href={`/admin/crm?id=${item.client_id}`} className={ghostButton}>
                Fiche client
              </Link>
            ) : null}
          </div>
        </form>
      ) : null}
      {item ? (
        <form action={deleteAgendaItem} className="-mt-3 mb-6">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="mois" value={month} />
          <ConfirmSubmit label={`Supprimer « ${item.title} » du calendrier ?`} />
        </form>
      ) : null}

      <div className={cn(card, "hidden overflow-hidden md:block")}>
        <div className="grid grid-cols-7 border-b border-white/10 text-[0.65rem] uppercase tracking-[0.16em] text-white/45">
          {weekDays.map((day) => (
            <p key={day} className="px-3 py-3 font-medium">
              {day}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const list = byDay.get(day) ?? [];
            const inMonth = day.startsWith(month);
            return (
              <div
                key={day}
                className={cn(
                  "group min-h-[7.5rem] border-white/10 p-2",
                  index % 7 !== 6 && "border-r",
                  index < days.length - 7 && "border-b",
                  !inMonth && "bg-black/40",
                  offDays.has(day) && (inMonth ? "bg-emerald-500/[0.06]" : "bg-emerald-500/[0.03]"),
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs",
                      day === today ? "bg-[#2d66d2] font-semibold text-white" : inMonth ? "text-white/80" : "text-white/30",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                  <Link
                    href={`${self}&jour=${day}`}
                    aria-label={`Ajouter une entrée le ${dayLabel(day)}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100"
                  >
                    <Plus size={13} />
                  </Link>
                </div>
                <ul className="grid gap-1">
                  {list.slice(0, 3).map((entry) => (
                    <li key={entry.key}>
                      <EntryLink entry={entry} className={cn("block truncate rounded border-l-2 px-1.5 py-1 text-[0.7rem] leading-tight transition hover:brightness-125", entryTone[entry.tone])}>
                        {entry.title}
                      </EntryLink>
                    </li>
                  ))}
                  {list.length > 3 ? <li className="px-1.5 text-[0.65rem] text-white/50">+{list.length - 3} autre{list.length > 4 ? "s" : ""}</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60">
        {legend.map((item) => (
          <li key={item.tone} className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-sm border-l-2", entryTone[item.tone])} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>

      <section className={cn(card, "mt-8 p-5 sm:p-6")}>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">Prochains jours fériés</h2>
        <p className="mt-1 text-xs text-white/45">
          Les fêtes religieuses sont estimées : leur date officielle dépend de l&apos;observation du croissant lunaire et peut tomber un jour plus tard.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((holiday) => (
            <li key={`${holiday.day}-${holiday.name}`}>
              <Link href={`/admin/calendrier?mois=${holiday.day.slice(0, 7)}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-4 py-3 transition hover:border-emerald-400/40">
                <span>
                  <span className="block text-sm text-white">{holiday.name}</span>
                  <span className="block text-xs capitalize text-white/50">
                    {dayLabel(holiday.day)} {holiday.day.slice(0, 4)}
                    {holiday.estimated ? " · estimée" : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-emerald-300">{daysUntil(today, holiday.day)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.16em]">{monthLabel(month)} en détail</h2>
        {monthEntries.length === 0 ? (
          <p className={cn(card, "px-5 py-10 text-center text-sm text-white/50")}>Rien de prévu ce mois-ci.</p>
        ) : (
          <ol className={cn(card, "divide-y divide-white/10")}>
            {monthEntries.map((entry) => (
              <li key={entry.key}>
                <EntryLink entry={entry} className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5", entry.href && "transition hover:bg-white/[0.03]")}>
                  <span className={cn("w-36 shrink-0 text-sm capitalize", entry.day === today ? "font-semibold text-[#8FB2F5]" : "text-white/60")}>{dayLabel(entry.day)}</span>
                  <span className={cn("rounded border-l-2 px-2 py-0.5 text-sm", entryTone[entry.tone])}>{entry.title}</span>
                  <span className="text-xs text-white/50">{entry.detail}</span>
                </EntryLink>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
