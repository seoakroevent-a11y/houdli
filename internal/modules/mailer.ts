import { site } from "@/lib/site";

/** Échappe le texte saisi par un visiteur avant de l'insérer dans le HTML d'un e-mail. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

type Alert = { subject: string; rows: [string, string | null | undefined][]; message?: string | null; link: { label: string; path: string }; replyTo?: string };

/** Alerte interne envoyée par e-mail et par WhatsApp, selon les canaux configurés. */
export async function sendAlert(alert: Alert) {
  const [email, whatsapp] = await Promise.all([sendEmail(alert), sendWhatsApp(alert)]);
  return email || whatsapp;
}

/**
 * E-mail via l'API Resend. Sans `RESEND_API_KEY` et `ALERT_EMAIL`, rien n'est envoyé.
 * Sans domaine vérifié chez Resend, l'expéditeur par défaut ne peut écrire qu'à l'adresse du compte Resend.
 */
async function sendEmail({ subject, rows, message, link, replyTo }: Alert) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL?.split(",").map((value) => value.trim()).filter(Boolean);
  if (!key || !to?.length) return false;

  const lines = rows.filter(([, value]) => value);
  const url = `${site.url}${link.path}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">
<h2 style="margin:0 0 16px;color:#080838">${escapeHtml(subject)}</h2>
<table style="border-collapse:collapse">${lines
    .map(([label, value]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${escapeHtml(label)}</td><td style="padding:4px 0"><strong>${escapeHtml(String(value))}</strong></td></tr>`)
    .join("")}</table>
${message ? `<p style="margin:16px 0 0;padding:12px 16px;background:#f4f5fb;border-radius:8px;white-space:pre-wrap">${escapeHtml(message)}</p>` : ""}
<p style="margin:24px 0 0"><a href="${url}" style="background:#2d66d2;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${escapeHtml(link.label)}</a></p>
</div>`;
  const text = [subject, "", ...lines.map(([label, value]) => `${label} : ${value}`), message ? `\n${message}` : "", "", `${link.label} : ${url}`].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.ALERT_FROM || `${site.name} <onboarding@resend.dev>`, to, subject, html, text, reply_to: replyTo }),
    });
    if (!response.ok) console.error("[alerte] E-mail refusé par Resend :", response.status, await response.text());
    return response.ok;
  } catch (error) {
    console.error("[alerte] E-mail impossible :", error);
    return false;
  }
}

/**
 * WhatsApp via CallMeBot, uniquement vers le numéro qui a activé la clé.
 * Sans `WHATSAPP_PHONE` et `CALLMEBOT_API_KEY`, rien n'est envoyé.
 */
async function sendWhatsApp({ subject, rows, message, link }: Alert) {
  const phone = process.env.WHATSAPP_PHONE?.replace(/[^\d+]/g, "");
  const key = process.env.CALLMEBOT_API_KEY;
  if (!phone || !key) return false;

  const excerpt = message && message.length > 500 ? `${message.slice(0, 500)}…` : message;
  const text = [
    `*${subject}*`,
    "",
    ...rows.filter(([, value]) => value).map(([label, value]) => `${label} : ${value}`),
    excerpt ? `\n${excerpt}` : "",
    "",
    `${link.label} : ${site.url}${link.path}`,
  ].join("\n");
  const params = new URLSearchParams({ phone, text, apikey: key });

  try {
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?${params}`, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) console.error("[alerte] WhatsApp refusé par CallMeBot :", response.status);
    return response.ok;
  } catch (error) {
    console.error("[alerte] WhatsApp impossible :", error);
    return false;
  }
}
