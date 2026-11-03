/**
 * Tests de simulation de l'agent vocal Houdli : crée les tests manquants, les rattache à l'agent, les lance et affiche les résultats.
 * Usage : node --env-file=.env.local scripts/voice-agent-tests.mjs
 */
const key = process.env.ELEVENLABS_API_KEY;
const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
if (!key || !agentId) {
  console.error("ELEVENLABS_API_KEY et NEXT_PUBLIC_ELEVENLABS_AGENT_ID sont requis.");
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

const tests = [
  {
    name: "Houdli — FR : team building plein air et question de prix",
    simulation_scenario:
      "Vous êtes Salma, responsable RH d'une entreprise à Casablanca. Vous parlez français. Vous cherchez un team building en plein air pour 60 personnes. Demandez quelles activités conviennent, puis insistez pour connaître le prix par personne. Quand on vous a orientée vers le contact, dites merci et au revoir.",
    success_conditions: [
      "L'agent propose des activités de team building adaptées au plein air et à 60 personnes, en citant des activités qui existent dans le catalogue Houdli.",
      "L'agent ne donne aucun prix, tarif ni fourchette chiffrée, même quand la personne insiste.",
      "L'agent oriente vers un devis personnalisé avec au moins un moyen de contact : formulaire, téléphone, WhatsApp ou e-mail.",
      "L'agent répond en français, en phrases courtes adaptées à l'oral.",
    ],
  },
  {
    name: "Houdli — Darija : family day à Rabat",
    simulation_scenario:
      "نتا كريم، مسؤول فشركة فالرباط. هضر غير بالدارجة المغربية مكتوبة بالحروف العربية. سول واش هودلي كيخدمو فالرباط، ومن بعد سول شنو كيديرو ففاميلي داي. ملي تاخد الجواب، قول شكرا وبسلامة.",
    success_conditions: [
      "L'agent répond en arabe ou en darija, pas en français ni en anglais.",
      "L'agent confirme que Houdli intervient partout au Maroc, y compris à Rabat.",
      "L'agent décrit ce que Houdli propose pour un family day sans inventer de prix ni de client.",
    ],
  },
  {
    name: "Houdli — EN : escape game en anglais",
    simulation_scenario:
      "You are Mark, an HR manager at a multinational in Casablanca. Speak English only. Ask what an escape game with Houdli looks like, then ask whether the activity can be run in English. Once answered, say thanks and goodbye.",
    success_conditions: [
      "The agent answers in English.",
      "The agent describes at least one escape game activity that exists in the Houdli catalogue.",
      "The agent confirms that activities can be run in English.",
    ],
  },
];

const agent = await api(`/v1/convai/agents/${agentId}`);
const agentTools = await Promise.all((agent.conversation_config.agent.prompt.tool_ids ?? []).map((id) => api(`/v1/convai/tools/${id}`)));
const toolRef = (name) => {
  const tool = agentTools.find((item) => item.tool_config.name === name);
  if (!tool) throw new Error(`Outil ${name} absent de l'agent.`);
  return { id: tool.id, type: tool.tool_config.type };
};

const chat = (...turns) => turns.map(([role, message], index) => ({ role, message, time_in_call_secs: index * 8 }));
const formTurns = [
  ["agent", "Bonjour, je suis Lina de Houdli. Vous préparez un événement ou un team building ? Dites-moi tout."],
  ["user", "Oui, un team building pour 50 personnes à Marrakech en février. Vous pouvez remplir le formulaire pour moi ?"],
  ["agent", "Avec plaisir. Quel est votre nom complet et votre e-mail ?"],
  ["user", "Nadia Benali, nadia.benali@exemple.ma, entreprise Atlas Conseil."],
  ["agent", "Je relis : n, a, d, i, a, point, b, e, n, a, l, i, arobase exemple point m a. C'est bien ça ?"],
  ["user", "Oui c'est exact, allez-y."],
];
const confirmTurns = [
  ...formTurns,
  ["agent", "C'est rempli : team building pour 50 personnes à Marrakech en février, au nom de Nadia Benali. Je l'envoie ?"],
];

tests.push(
  {
    type: "tool",
    name: "Houdli — Outil : remplit le formulaire avec le nom et l'e-mail",
    chat_history: chat(...formTurns),
    tool_call_parameters: {
      referenced_tool: toolRef("fill_contact_form"),
      parameters: [
        { path: "name", eval: { type: "exact", expected_value: "Nadia Benali" } },
        { path: "email", eval: { type: "exact", expected_value: "nadia.benali@exemple.ma" } },
        { path: "message", eval: { type: "llm", description: "Mentionne un team building, 50 personnes, Marrakech et février." } },
      ],
    },
  },
  {
    type: "tool",
    name: "Houdli — Outil : n'envoie pas sans accord",
    chat_history: chat(...confirmTurns, ["user", "Attendez, je préfère vérifier la date avec mon directeur d'abord."]),
    tool_call_parameters: { referenced_tool: toolRef("submit_contact_form"), parameters: [], verify_absence: true },
  },
  {
    type: "tool",
    name: "Houdli — Outil : envoie après un oui",
    chat_history: chat(...confirmTurns, ["user", "Oui, envoyez."]),
    tool_call_parameters: { referenced_tool: toolRef("submit_contact_form"), parameters: [] },
  },
  {
    type: "tool",
    name: "Houdli — Outil : ouvre le catalogue des activités",
    chat_history: chat(formTurns[0], ["user", "Montrez-moi toutes vos activités de team building."]),
    tool_call_parameters: {
      referenced_tool: toolRef("navigate_to_page"),
      parameters: [{ path: "page", eval: { type: "regex", pattern: "^(https://www\\.houdli\\.ma)?/activites/?$" } }],
    },
  },
);

const existing = (await api("/v1/convai/agent-testing?page_size=100")).tests ?? [];
const ids = [];
for (const test of tests) {
  const found = existing.find((item) => item.name === test.name);
  const body = test.type
    ? test
    : {
        type: "simulation",
        simulation_max_turns: 12,
        tool_mock_config: { mocking_strategy: "none", fallback_strategy: "raise_error", mocked_tool_ids: [] },
        dynamic_variables: {},
        chat_history: [],
        ...test,
      };
  const id = found?.id ?? (await api("/v1/convai/agent-testing/create", { method: "POST", body: JSON.stringify(body) })).id;
  ids.push(id);
  if (!found) await api(`/v1/convai/agents/${agentId}/testing/attach-test`, { method: "POST", body: JSON.stringify({ test_id: id }) });
}

const suite = await api(`/v1/convai/agents/${agentId}/run-tests`, {
  method: "POST",
  body: JSON.stringify({ tests: ids.map((test_id) => ({ test_id })), repeat_count: 1 }),
});

let runs = [];
for (let attempt = 0; attempt < 60; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  runs = (await api(`/v1/convai/test-invocations/${suite.id}`)).test_runs ?? [];
  if (runs.length && runs.every((run) => run.status !== "pending" && run.status !== "running")) break;
}

for (const run of runs) {
  console.log(`\n===== ${run.test_name ?? run.test_id} : ${run.status}`);
  for (const turn of run.agent_responses ?? run.simulated_conversation ?? []) {
    if (turn.message) console.log(`${turn.role === "agent" ? "LINA" : "VISITEUR"} : ${turn.message}`);
  }
  const conditions = run.condition_result?.results ?? run.condition_result ?? null;
  if (conditions) console.log("Critères :", JSON.stringify(conditions, null, 1));
}
