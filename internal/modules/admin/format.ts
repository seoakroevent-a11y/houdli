const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID.test(value);
}

/** URL https ou chemin du site. `//hote` et `/\hote` mènent vers un autre domaine. */
export function isSafeUrl(value: string) {
  if (value.startsWith("https://")) return true;
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}

export function formatDate(iso: string) {
  const [date, time = ""] = iso.split("T");
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return iso;
  const hours = time.slice(0, 5);
  return `${day}/${month}/${year}${hours ? ` · ${hours}` : ""}`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
