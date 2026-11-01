export const inquiryStatuses = ["new", "in_progress", "done", "archived", "spam"] as const;

export type InquiryStatus = (typeof inquiryStatuses)[number];

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "Nouveau",
  in_progress: "En cours",
  done: "Traité",
  archived: "Archivé",
  spam: "Indésirable",
};

export const inquiryTabLabels: Record<InquiryStatus, string> = {
  new: "Nouveaux",
  in_progress: "En cours",
  done: "Traités",
  archived: "Archivés",
  spam: "Indésirables",
};

export function isInquiryStatus(value: string): value is InquiryStatus {
  return (inquiryStatuses as readonly string[]).includes(value);
}

/** `read` est l'ancien statut, avant la migration `supabase/demandes-statuts.sql`. */
export function toInquiryStatus(value: string): InquiryStatus {
  if (value === "read") return "done";
  return isInquiryStatus(value) ? value : "new";
}

/** Numéro au format wa.me : les numéros marocains locaux (06…, 07…) reçoivent l'indicatif 212. */
export function whatsappNumber(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("2120") && digits.length === 13) return `212${digits.slice(4)}`;
  if (digits.startsWith("0") && digits.length === 10) return `212${digits.slice(1)}`;
  return digits.length >= 8 ? digits : null;
}

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Casablanca",
});

/** « 31 oct. 2026, 00:02 », à l'heure du Maroc. */
export function formatInquiryDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const part = Object.fromEntries(dateTime.formatToParts(date).map((p) => [p.type, p.value]));
  return `${part.day} ${part.month} ${part.year}, ${part.hour}:${part.minute}`;
}
