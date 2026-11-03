export const agendaKinds = ["event", "meeting", "setup", "other"] as const;
export type AgendaKind = (typeof agendaKinds)[number];

export const agendaLabels: Record<AgendaKind, string> = {
  event: "Événement",
  meeting: "Rendez-vous",
  setup: "Montage / démontage",
  other: "Autre",
};

export function isAgendaKind(value: string): value is AgendaKind {
  return (agendaKinds as readonly string[]).includes(value);
}

/** Couleurs des pastilles : entrées manuelles, puis dates issues du CRM et de la facturation. */
export const entryTone = {
  event: "border-l-[#4A82EA] bg-[#2d66d2]/20 text-white",
  meeting: "border-l-violet-400 bg-violet-500/15 text-violet-100",
  setup: "border-l-teal-400 bg-teal-500/15 text-teal-100",
  other: "border-l-white/40 bg-white/10 text-white/85",
  follow_up: "border-l-amber-400 bg-amber-400/10 text-amber-100",
  invoice: "border-l-red-400 bg-red-500/10 text-red-100",
  quote: "border-l-sky-300 bg-sky-400/10 text-sky-100",
  holiday: "border-l-emerald-400 bg-emerald-500/15 text-emerald-100",
  ramadan: "border-l-emerald-200/60 bg-emerald-200/5 text-emerald-100/80",
} as const;

export type EntryTone = keyof typeof entryTone;

export const legend: { tone: EntryTone; label: string }[] = [
  ...agendaKinds.map((kind) => ({ tone: kind as EntryTone, label: agendaLabels[kind] })),
  { tone: "follow_up", label: "Relance client" },
  { tone: "invoice", label: "Échéance de facture" },
  { tone: "quote", label: "Fin de validité d'un devis" },
  { tone: "holiday", label: "Jour férié" },
  { tone: "ramadan", label: "Début du Ramadan" },
];

export const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const dayName = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromIso(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

export function addDays(day: string, count: number) {
  const date = fromIso(day);
  date.setUTCDate(date.getUTCDate() + count);
  return toIso(date);
}

export function isMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return toIso(date).slice(0, 7);
}

export function monthLabel(month: string) {
  const label = monthName.format(fromIso(`${month}-01`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayLabel(day: string) {
  return dayName.format(fromIso(day));
}

/** Semaines complètes, du lundi au dimanche, qui couvrent le mois. */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const offset = (fromIso(first).getUTCDay() + 6) % 7;
  const start = addDays(first, -offset);
  const nextMonth = `${shiftMonth(month, 1)}-01`;
  const days: string[] = [];
  for (let day = start; day < nextMonth || days.length % 7 !== 0; day = addDays(day, 1)) days.push(day);
  return { days, start, end: days[days.length - 1] };
}
