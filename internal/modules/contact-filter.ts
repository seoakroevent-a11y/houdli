import type { ContactInput } from "@/lib/contact-schema";

export type InquiryVerdict = { kind: "offtopic" } | { kind: "spam"; reason: string } | null;

/** Candidatures, stages et personnes qui proposent leurs services : de vraies personnes, mais pas des projets d'événement. */
const OFFTOPIC =
  /\b(cv|curriculum|candidature|postuler|stagiaire|alternance|alternant|(demande|recherche|offre) d'emploi|(re)?cherche (un |d'un |du )?(emploi|travail|job|stage)|(demande|offre) de stage|stage (pfe|de fin d'etudes|d'ete|d'observation|d'application)|(proposer|propose|offrir) mes services|je suis (un |une )?etudiante?|etudiante? (en|a la|a l')|en tant que (membre du staff|staff|hotesse|hote d'accueil|stagiaire|extra|freelance))\b/;

/** Démarchage commercial et spam classique. */
const SOLICITATION =
  /\b(seo|backlinks?|referencement (naturel|google|seo)|guest posts?|crypto|bitcoin|forex|casino|viagra|cialis|porn|escort|loans?|rank(ing)? your (site|website)|first page of google|increase (your )?traffic|web ?design services)\b/;

/** Formules de vendeurs qui proposent leurs services au lieu d'acheter un événement. */
const PITCH =
  /\b(we (offer|provide|specialize|help (brands|businesses|companies))|i'?m \w+ from|i am \w+ from|reaching out|lead generation|generation de leads|top of (the )?(search|google)|search results|walk you through|(book|schedule|for) a (call|demo)|partnership discussion|chatbots?|influencer marketing|social[- ]media (marketing|automation|management)|appointment setting|freelance (writer|designer|developer|photographer|videographer|editor)|any use for|looking for new opportunities|book a time|calendly|hoping to connect|writing projects|content writing|blog posts|virtual assistants?|website (design|development|redesign)|app development|nous proposons nos services|presenter nos services|visibilite sur google|premiere page de google)\b/;

const ENGLISH_WORDS = new Set([
  "the", "and", "you", "your", "we", "our", "with", "for", "can", "is", "are", "to", "of",
  "this", "that", "please", "my", "it", "be", "will", "would", "us", "from", "hello", "hi", "hey",
]);

/** Une phrase de démarchage suffit ; les petits indices doivent s'additionner. */
const PITCH_SCORE = 3;
const SPAM_THRESHOLD = 3;

/** L'arabe et l'alphabet latin restent acceptés. */
const FOREIGN_SCRIPT =
  /[\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Devanagari}]/u;

const LINK = /https?:\/\/|www\./i;
const LINKS = /https?:\/\/|www\./gi;

const DISPOSABLE_DOMAINS = new Set([
  "yopmail.com",
  "yopmail.fr",
  "mailinator.com",
  "guerrillamail.com",
  "sharklasers.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "tempail.com",
  "trashmail.com",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
  "throwawaymail.com",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "mailnesia.com",
]);

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’`]/g, "'");
}

export function screenInquiry(data: ContactInput): InquiryVerdict {
  const identity = `${data.name} ${data.company ?? ""}`;
  const all = `${identity} ${data.message ?? ""}`;
  const text = normalize(all);

  if (OFFTOPIC.test(text)) return { kind: "offtopic" };
  if (SOLICITATION.test(normalize(data.message ?? ""))) return { kind: "spam", reason: "démarchage" };
  if (FOREIGN_SCRIPT.test(all)) return { kind: "spam", reason: "alphabet étranger" };
  if (LINK.test(identity)) return { kind: "spam", reason: "lien dans le nom" };
  if ((data.message?.match(LINKS) ?? []).length > 1) return { kind: "spam", reason: "liens multiples" };

  const domain = data.email.split("@").pop()?.trim().toLowerCase() ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) return { kind: "spam", reason: "e-mail jetable" };

  const score =
    (PITCH.test(text) ? PITCH_SCORE : 0) +
    (isMostlyEnglish(normalize(data.message ?? "")) ? 1 : 0) +
    (isNorthAmericanPhone(data.phone ?? "") ? 1 : 0) +
    (LINK.test(data.message ?? "") ? 1 : 0) +
    (data.company && normalize(data.company).trim() === normalize(data.name).trim() ? 1 : 0);
  if (score >= SPAM_THRESHOLD) return { kind: "spam", reason: `démarchage probable (score ${score})` };

  return null;
}

function isMostlyEnglish(text: string) {
  const words = text.match(/[a-z']+/g) ?? [];
  const hits = words.filter((w) => ENGLISH_WORDS.has(w)).length;
  return hits >= 5 && hits / words.length >= 0.2;
}

/** Les leads marocains commencent par +212, 0 ou 00212 ; +1 et 10 chiffres nus sont nord-américains. */
function isNorthAmericanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return phone.trim().startsWith("+1") || digits.startsWith("001") || /^[2-9]\d{9}$/.test(digits);
}
