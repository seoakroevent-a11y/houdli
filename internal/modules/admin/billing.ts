export type DocumentKind = "quote" | "invoice";

export const quoteStatuses = ["draft", "sent", "accepted", "refused"] as const;
export const invoiceStatuses = ["draft", "sent", "paid", "cancelled"] as const;

export const documentStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  paid: "Payée",
  cancelled: "Annulée",
};

export const documentStatusTone: Record<string, string> = {
  draft: "border-white/15 text-white/60",
  sent: "border-[#4A82EA]/60 text-[#8FB2F5]",
  accepted: "border-emerald-500/50 text-emerald-300",
  paid: "border-emerald-500/50 text-emerald-300",
  refused: "border-red-400/40 text-red-300",
  cancelled: "border-red-400/40 text-red-300",
};

export const kindConfig = {
  quote: { label: "Devis", plural: "Devis", path: "/admin/devis", statuses: quoteStatuses, dateLabel: "Valable jusqu'au", article: "le présent devis" },
  invoice: { label: "Facture", plural: "Factures", path: "/admin/factures", statuses: invoiceStatuses, dateLabel: "Échéance", article: "la présente facture" },
} as const;

export function isDocumentKind(value: string): value is DocumentKind {
  return value === "quote" || value === "invoice";
}

export function isDocumentStatus(kind: DocumentKind, value: string) {
  return (kindConfig[kind].statuses as readonly string[]).includes(value);
}

export const clientStatuses = ["lead", "negotiation", "won", "lost"] as const;
export type ClientStatus = (typeof clientStatuses)[number];

export const clientStatusLabels: Record<ClientStatus, string> = {
  lead: "Prospect",
  negotiation: "En négociation",
  won: "Client",
  lost: "Perdu",
};

export const clientStatusTone: Record<ClientStatus, string> = {
  lead: "border-[#4A82EA]/60 text-[#8FB2F5]",
  negotiation: "border-amber-400/50 text-amber-200",
  won: "border-emerald-500/50 text-emerald-300",
  lost: "border-white/15 text-white/55",
};

export function isClientStatus(value: string): value is ClientStatus {
  return (clientStatuses as readonly string[]).includes(value);
}

export const activityKinds = ["note", "call", "email", "meeting", "whatsapp"] as const;
export type ActivityKind = (typeof activityKinds)[number];

export const activityLabels: Record<ActivityKind, string> = {
  note: "Note",
  call: "Appel",
  email: "E-mail",
  meeting: "Rendez-vous",
  whatsapp: "WhatsApp",
};

export function isActivityKind(value: string): value is ActivityKind {
  return (activityKinds as readonly string[]).includes(value);
}

export const tvaRates = [20, 14, 10, 7, 0] as const;

export function clientLabel(client: { name: string; company: string | null } | null) {
  if (!client) return "—";
  return client.company ? `${client.company} · ${client.name}` : client.name;
}

/** Envoyé et échéance dépassée : un devis expiré, une facture impayée. */
export function isOverdue(row: { status: string; due_date: string | null }, today: string) {
  return row.status === "sent" && !!row.due_date && row.due_date < today;
}

export type LineItem = { description: string; unit: string; quantity: number; unit_price: number };

/** Calcul en centimes : évite les écarts d'arrondi entre l'éditeur, la liste et le PDF. */
export function documentTotals(items: Pick<LineItem, "quantity" | "unit_price">[], discountRate: number, tvaRate: number) {
  const lines = items.map((item) => Math.round(Number(item.quantity) * Number(item.unit_price) * 100));
  const gross = lines.reduce((sum, line) => sum + line, 0);
  const discount = Math.round((gross * Number(discountRate)) / 100);
  const net = gross - discount;
  const tva = Math.round((net * Number(tvaRate)) / 100);
  return { lines: lines.map((c) => c / 100), gross: gross / 100, discount: discount / 100, net: net / 100, tva: tva / 100, total: (net + tva) / 100 };
}

const money = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(value: number) {
  return `${money.format(value)} DH`;
}

/** Date du jour au Maroc, au format AAAA-MM-JJ. */
export function todayInMorocco(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca" }).format(date);
}

export function formatDay(iso: string | null) {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

const units = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];

function below100(n: number): string {
  if (n < 17) return units[n];
  if (n < 20) return `dix-${units[n - 10]}`;
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return tens[t];
    return u === 1 ? `${tens[t]} et un` : `${tens[t]}-${units[u]}`;
  }
  if (n < 80) return n === 71 ? "soixante et onze" : `soixante-${below100(n - 60)}`;
  return n === 80 ? "quatre-vingts" : `quatre-vingt-${below100(n - 80)}`;
}

function below1000(n: number) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hundreds = h === 0 ? "" : h === 1 ? "cent" : `${units[h]} cent${r === 0 ? "s" : ""}`;
  if (!r) return hundreds;
  return hundreds ? `${hundreds} ${below100(r)}` : below100(r);
}

function integerToWords(value: number) {
  if (value === 0) return "zéro";
  let n = value;
  const parts: string[] = [];
  for (const [size, name] of [[1e9, "milliard"], [1e6, "million"]] as const) {
    const q = Math.floor(n / size);
    n %= size;
    if (q) parts.push(`${below1000(q)} ${name}${q > 1 ? "s" : ""}`);
  }
  const thousands = Math.floor(n / 1000);
  n %= 1000;
  if (thousands) parts.push(thousands === 1 ? "mille" : `${below1000(thousands).replace(/(cent|vingt)s$/, "$1")} mille`);
  if (n) parts.push(below1000(n));
  return parts.join(" ");
}

/** « douze mille cinq cents dirhams et quarante centimes ». */
export function amountInWords(amount: number) {
  const cents = Math.round(amount * 100);
  const dirhams = Math.floor(cents / 100);
  const rest = cents % 100;
  const of = dirhams >= 1e6 && dirhams % 1e6 === 0 ? " de" : "";
  const main = `${integerToWords(dirhams)}${of} dirham${dirhams > 1 ? "s" : ""}`;
  return rest ? `${main} et ${integerToWords(rest)} centime${rest > 1 ? "s" : ""}` : main;
}
