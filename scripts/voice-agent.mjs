/**
 * Crée ou met à jour l'agent vocal Houdli sur ElevenLabs.
 * Usage : npx tsx scripts/agent-knowledge.ts > /tmp/houdli-agent-knowledge.md
 *         node --env-file=.env.local scripts/voice-agent.mjs /tmp/houdli-agent-knowledge.md
 * Sans NEXT_PUBLIC_ELEVENLABS_AGENT_ID, un nouvel agent est créé et son identifiant est affiché.
 */
import { readFile } from "node:fs/promises";

const key = process.env.ELEVENLABS_API_KEY;
const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
const knowledgePath = process.argv[2];
if (!key || !knowledgePath) {
  console.error("ELEVENLABS_API_KEY et le chemin de la base de connaissances sont requis.");
  process.exit(1);
}

async function api(path, init = {}) {
  const response = await fetch(`https://api.elevenlabs.io${path}`, {
    ...init,
    headers: { "xi-api-key": key, "Content-Type": "application/json", ...init.headers },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} : ${response.status} ${body}`);
  return body ? JSON.parse(body) : null;
}

const prompt = `# Personnalité
Vous êtes Lina, la conseillère vocale de Houdli, agence événementielle fondée en 2018 à Casablanca. Chaleureuse, claire et professionnelle.

# Environnement
Vous parlez à des visiteurs du site www.houdli.ma : surtout des responsables RH, communication ou marketing d'entreprises au Maroc qui préparent un événement ou un team building. La conversation est orale : ils vous entendent, ils ne lisent pas.

# Ton
- Phrases courtes, deux ou trois au plus par réponse.
- Pas de listes, de symboles ni d'adresses web épelées : dites « sur notre site, page Activités ».
- Dites les numéros chiffre par chiffre : zéro six, soixante et un, soixante-huit, cinquante-neuf, zéro un.
- Terminez souvent par une question pour aider la personne à préciser son besoin.

# Langue
Vous accueillez en français, mais vous répondez toujours dans la langue de la personne, du premier message jusqu'à l'au revoir. Ceci est important.
- Dès que la personne parle anglais, arabe ou darija, appelez l'outil language_detection pour passer dans sa langue, puis répondez uniquement dans cette langue.
- Anglais : répondez en anglais. Arabe : répondez en arabe simple. Darija : choisissez l'arabe (ar) et répondez en darija marocaine simple, écrite en lettres arabes.
- Ne revenez jamais au français si la personne ne le parle pas, même pour remercier ou dire au revoir.
- Si elle change de langue, suivez-la.

# Objectif
1. Comprendre le projet : type d'événement, nombre de personnes, ville, période, objectif.
2. Présenter les univers et les activités Houdli qui correspondent, en vous appuyant uniquement sur la base de connaissances.
3. Inviter la personne à demander un devis : formulaire du site, téléphone ou WhatsApp au 06 61 68 59 01, ou e-mail contact@houdli.ma.

# Règles
- N'utilisez que les informations de la base de connaissances. Si une information n'y figure pas, dites que l'équipe Houdli pourra répondre et donnez le contact. Ceci est important.
- Ne donnez jamais de prix, de tarif, de fourchette ou de délai chiffré : chaque devis est personnalisé après le brief. Ceci est important.
- N'inventez aucun client, chiffre, lieu ou disponibilité, et ne promettez rien au nom de l'équipe.
- Vous ne prenez pas de réservation et ne promettez aucune date : seule l'équipe Houdli confirme un projet.
- Restez sur les sujets liés à Houdli et à l'événementiel ; ramenez poliment la conversation sinon.
- Quand la personne a obtenu sa réponse et dit au revoir, remerciez-la et terminez l'appel.

# Formulaire de contact
Quand la personne veut un devis, être rappelée, ou vous demande de remplir le formulaire :
1. Demandez son nom complet et son e-mail, qui sont obligatoires, puis, si elle le souhaite, son téléphone, son entreprise et le service.
2. Faites épeler l'e-mail et relisez-le lettre par lettre pour vérifier.
3. Rédigez le message à partir de ce qu'elle vous a dit : type d'événement, date ou période, ville, nombre de personnes, activités qui l'intéressent.
4. Appelez fill_contact_form avec ces informations. Si l'outil signale une erreur, redemandez le champ concerné et rappelez l'outil.
5. Résumez la demande en une phrase et demandez si vous pouvez l'envoyer.
6. Appelez submit_contact_form seulement après un oui clair de la personne. Ceci est important.
7. Une fois l'envoi confirmé, dites que l'équipe Houdli reviendra vers elle rapidement.

# Navigation
Quand la personne demande à voir une page, ou qu'une page l'aiderait, appelez navigate_to_page, puis dites en une phrase ce qu'elle y trouve.
Chemins : accueil « / », à propos « /#apropos », services « /#services », références « /#references », contact « /#contact », catalogue des activités « /activites », blog « /blog », galerie « /galerie ».
Pour une activité ou un univers précis, utilisez le chemin indiqué après « Page : » dans la base de connaissances, par exemple « /activites/la-fresque-geante » ou « /univers/team-building ».`;

const services = ["Événementiel", "Team Building", "Communication", "Lumière & sono", "Print", "Réalisation de stands"];

const clientTool = (name, description, properties = {}, required = []) => ({
  type: "client",
  name,
  description,
  expects_response: true,
  response_timeout_secs: 20,
  parameters: { type: "object", properties, required },
});

const tools = [
  clientTool("navigate_to_page", "Ouvre une page du site Houdli dans le navigateur du visiteur.", {
    page: { type: "string", description: "Chemin de la page, par exemple /activites, /#contact ou /univers/team-building." },
  }, ["page"]),
  clientTool(
    "fill_contact_form",
    "Affiche le formulaire de contact et le remplit avec les informations données par le visiteur. N'envoie rien.",
    {
      name: { type: "string", description: "Nom complet du visiteur." },
      email: { type: "string", description: "Adresse e-mail du visiteur, vérifiée avec lui." },
      phone: { type: "string", description: "Téléphone, si le visiteur le donne." },
      company: { type: "string", description: "Entreprise, si le visiteur la donne." },
      service: { type: "string", description: `Service souhaité, exactement l'un de : ${services.join(", ")}.` },
      message: { type: "string", description: "Description du projet rédigée en français : type d'événement, date, ville, nombre de personnes, activités." },
    },
    ["name", "email"],
  ),
  clientTool("submit_contact_form", "Envoie le formulaire de contact déjà rempli. Uniquement après l'accord explicite du visiteur."),
];

const firstMessages = {
  fr: "Bonjour, je suis Lina de Houdli. Vous préparez un événement ou un team building ? Dites-moi tout.",
  ar: "مرحبا، أنا لينا من هودلي. هل تحضّرون لحدث أو نشاط تيم بيلدينغ؟ أنا في الخدمة.",
  en: "Hello, I'm Lina from Houdli. Are you planning an event or a team building? Tell me about it.",
};

const knowledge = await readFile(knowledgePath, "utf8");
const document = await api("/v1/convai/knowledge-base/text", {
  method: "POST",
  body: JSON.stringify({ name: `Houdli — contenu du site (${new Date().toISOString().slice(0, 10)})`, text: knowledge }),
});

const previous = agentId ? await api(`/v1/convai/agents/${agentId}`) : null;
const previousDocuments = previous?.conversation_config?.agent?.prompt?.knowledge_base ?? [];

const existingTools = await Promise.all(
  (previous?.conversation_config?.agent?.prompt?.tool_ids ?? []).map((id) => api(`/v1/convai/tools/${id}`).catch(() => null)),
);
const toolIds = [];
for (const tool of tools) {
  const found = existingTools.find((item) => item?.tool_config?.name === tool.name);
  const saved = found
    ? await api(`/v1/convai/tools/${found.id}`, { method: "PATCH", body: JSON.stringify({ tool_config: tool }) })
    : await api("/v1/convai/tools", { method: "POST", body: JSON.stringify({ tool_config: tool }) });
  toolIds.push(saved.id);
}

const config = {
  name: "Houdli — conseillère vocale",
  tags: ["site", "houdli"],
  conversation_config: {
    agent: {
      first_message: firstMessages.fr,
      language: "fr",
      prompt: {
        prompt,
        llm: "gemini-2.5-flash",
        temperature: 0.4,
        timezone: "Africa/Casablanca",
        knowledge_base: [{ type: "text", id: document.id, name: document.name, usage_mode: "prompt" }],
        tool_ids: toolIds,
        built_in_tools: {
          end_call: { name: "end_call", description: "", params: { system_tool_type: "end_call" } },
          language_detection: { name: "language_detection", description: "", params: { system_tool_type: "language_detection" } },
        },
      },
    },
    language_presets: Object.fromEntries(
      ["ar", "en"].map((language) => [language, { overrides: { agent: { language, first_message: firstMessages[language] } } }]),
    ),
    tts: { voice_id: "EXAVITQu4vr4xnSDxMaL", model_id: "eleven_flash_v2_5", stability: 0.5, similarity_boost: 0.8, speed: 1 },
    asr: { keywords: ["Houdli", "team building", "family day", "safety day", "Casablanca"] },
    turn: { turn_eagerness: "normal", silence_end_call_timeout: 30 },
    conversation: { max_duration_seconds: 300 },
  },
  platform_settings: {
    auth: {
      enable_auth: false,
      allowlist: [{ hostname: "www.houdli.ma" }, { hostname: "houdli.ma" }, { hostname: "localhost" }],
    },
    call_limits: { agent_concurrency_limit: 5, daily_limit: 200 },
    guardrails: { version: "1", focus: { is_enabled: true }, prompt_injection: { is_enabled: true } },
  },
};

const result = await (agentId
  ? api(`/v1/convai/agents/${agentId}`, { method: "PATCH", body: JSON.stringify(config) })
  : api("/v1/convai/agents/create", { method: "POST", body: JSON.stringify(config) })
).catch(async (error) => {
  await api(`/v1/convai/knowledge-base/${document.id}`, { method: "DELETE" }).catch(() => {});
  throw error;
});

for (const old of previousDocuments) {
  if (old.id !== document.id) await api(`/v1/convai/knowledge-base/${old.id}`, { method: "DELETE" }).catch(() => {});
}

console.log(`Agent ${agentId ? "mis à jour" : "créé"} : ${result.agent_id ?? agentId}`);
