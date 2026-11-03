"use server";

import { redirect } from "next/navigation";
import { isAgendaKind } from "@/lib/admin/calendar";
import { isUuid } from "@/lib/admin/format";
import { db, fail, field, refresh } from "@/lib/admin/form";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function monthPath(day: string) {
  return `/admin/calendrier?mois=${day.slice(0, 7)}`;
}

export async function saveAgendaItem(formData: FormData) {
  const id = field(formData, "id", 40);
  const startsOn = field(formData, "starts_on", 10);
  const back = DAY.test(startsOn) ? monthPath(startsOn) : "/admin/calendrier";
  if (id && !isUuid(id)) fail(back, "Entrée invalide.");

  const endsOn = field(formData, "ends_on", 10);
  const startTime = field(formData, "start_time", 5);
  const endTime = field(formData, "end_time", 5);
  const kind = field(formData, "kind", 20);
  const clientId = field(formData, "client_id", 40);
  const documentId = field(formData, "document_id", 40);
  const payload = {
    title: field(formData, "title", 200),
    kind,
    starts_on: startsOn,
    ends_on: endsOn && endsOn !== startsOn ? endsOn : null,
    start_time: startTime || null,
    end_time: endTime || null,
    location: field(formData, "location", 200) || null,
    client_id: isUuid(clientId) ? clientId : null,
    document_id: isUuid(documentId) ? documentId : null,
    notes: field(formData, "notes", 4000) || null,
  };
  const retry = `${back}&${id ? `entree=${id}` : `jour=${startsOn}`}`;
  if (payload.title.length < 2) fail(retry, "Donnez un titre à l'entrée.");
  if (!isAgendaKind(kind)) fail(retry, "Type invalide.");
  if (!DAY.test(startsOn) || (payload.ends_on && !DAY.test(payload.ends_on))) fail(retry, "Date invalide.");
  if (payload.ends_on && payload.ends_on < startsOn) fail(retry, "La date de fin doit suivre la date de début.");
  if ((startTime && !TIME.test(startTime)) || (endTime && !TIME.test(endTime))) fail(retry, "Heure invalide.");

  const supabase = await db();
  const { error } = id
    ? await supabase.from("agenda_items").update(payload).eq("id", id)
    : await supabase.from("agenda_items").insert(payload);
  if (error) fail(retry, "Impossible d'enregistrer. Vérifiez que supabase/calendrier.sql a bien été exécuté.");
  refresh(["/admin", "/admin/calendrier"]);
  redirect(`${back}&ok=1`);
}

export async function deleteAgendaItem(formData: FormData) {
  const id = field(formData, "id", 40);
  const month = field(formData, "mois", 7);
  const back = /^\d{4}-\d{2}$/.test(month) ? `/admin/calendrier?mois=${month}` : "/admin/calendrier";
  if (!isUuid(id)) fail(back, "Entrée invalide.");
  const supabase = await db();
  const { error } = await supabase.from("agenda_items").delete().eq("id", id);
  if (error) fail(back, "Impossible de supprimer l'entrée.");
  refresh(["/admin", "/admin/calendrier"]);
  redirect(`${back}${back.includes("?") ? "&" : "?"}ok=1`);
}
