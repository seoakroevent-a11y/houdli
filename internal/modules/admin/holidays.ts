import { addDays } from "@/lib/admin/calendar";

export type Holiday = { day: string; name: string; estimated: boolean; off: boolean };

/** Fêtes civiles à date fixe (mois, jour), avec l'année de leur création. */
const fixed: { md: string; name: string; since?: number }[] = [
  { md: "01-01", name: "Nouvel An" },
  { md: "01-11", name: "Manifeste de l'Indépendance" },
  { md: "01-14", name: "Nouvel An amazigh", since: 2024 },
  { md: "05-01", name: "Fête du Travail" },
  { md: "07-30", name: "Fête du Trône" },
  { md: "08-14", name: "Allégeance Oued Eddahab" },
  { md: "08-20", name: "Révolution du Roi et du Peuple" },
  { md: "08-21", name: "Fête de la Jeunesse" },
  { md: "10-31", name: "Fête de l'Unité", since: 2025 },
  { md: "11-06", name: "Marche Verte" },
  { md: "11-18", name: "Fête de l'Indépendance" },
];

/** Fêtes religieuses (mois et jour hégiriens). Le Ramadan n'est pas férié, mais il pèse sur l'agenda des événements. */
const lunar: { month: number; day: number; name: string; off: boolean }[] = [
  { month: 1, day: 1, name: "Nouvel An de l'Hégire", off: true },
  { month: 3, day: 12, name: "Aïd al-Mawlid", off: true },
  { month: 3, day: 13, name: "Aïd al-Mawlid (2e jour)", off: true },
  { month: 9, day: 1, name: "Début du Ramadan", off: false },
  { month: 10, day: 1, name: "Aïd al-Fitr", off: true },
  { month: 10, day: 2, name: "Aïd al-Fitr (2e jour)", off: true },
  { month: 12, day: 10, name: "Aïd al-Adha", off: true },
  { month: 12, day: 11, name: "Aïd al-Adha (2e jour)", off: true },
];

const hijri = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", timeZone: "UTC" });

function hijriParts(day: string) {
  const parts = hijri.formatToParts(new Date(`${day}T00:00:00Z`));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { month: value("month"), day: value("day") };
}

/**
 * Jours fériés du Maroc entre deux dates incluses.
 * Les fêtes religieuses suivent le calendrier Umm al-Qura : au Maroc, la date officielle dépend
 * de l'observation du croissant et tombe souvent un jour plus tard.
 */
export function moroccanHolidays(start: string, end: string): Holiday[] {
  const list: Holiday[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const year = Number(day.slice(0, 4));
    for (const item of fixed) {
      if (day.slice(5) === item.md && (!item.since || year >= item.since)) list.push({ day, name: item.name, estimated: false, off: true });
    }
    const { month, day: hDay } = hijriParts(day);
    for (const item of lunar) {
      if (item.month === month && item.day === hDay) list.push({ day, name: item.name, estimated: true, off: item.off });
    }
  }
  return list;
}
