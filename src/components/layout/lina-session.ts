import { LINA_AUDIO_MAX_BYTES, type TranscriptEntry } from "@/lib/lina-conversations";
import { linaLanguages, type LinaLanguage } from "@/lib/lina-languages";

type Part = {
  text?: string;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
  thoughtSignature?: string;
};
type Content = { role: "user" | "model"; parts: Part[] };

export type LinaMode = "listening" | "thinking" | "speaking";
export type ClientTools = Record<string, (args: Record<string, unknown>) => unknown>;

export type LinaSession = {
  endSession: () => Promise<void>;
  getInputVolume: () => number;
  getOutputVolume: () => number;
};

type Options = {
  language: LinaLanguage;
  clientTools: ClientTools;
  onConnect: () => void;
  onModeChange: (mode: LinaMode) => void;
  onDisconnect: () => void;
  onError: (message: string) => void;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

const MAX_DURATION_MS = 5 * 60_000;
const MAX_SILENT_ROUNDS = 3;

export function speechSupported() {
  return typeof window !== "undefined" && Boolean(recognitionClass()) && "speechSynthesis" in window;
}

function recognitionClass() {
  const scope = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

/** Voix féminines courantes (macOS, Windows, Chrome), utilisées seulement si la voix Gemini est indisponible. */
const femaleVoice = /amélie|amelie|audrey|aurélie|aurelie|marie|julie|hortense|virginie|denise|celine|céline|léa|flo|sandy|shelley|samantha|ava|allison|susan|karen|moira|tessa|serena|zira|jenny|aria|female|femme|google français|google us english|google uk english female|mariam|hoda|salma|laila|zariyah|amina|fatima/i;

async function pickVoice(lang: string) {
  let voices = speechSynthesis.getVoices();
  if (!voices.length) {
    await new Promise((resolve) => {
      speechSynthesis.addEventListener("voiceschanged", resolve, { once: true });
      setTimeout(resolve, 1500);
    });
    voices = speechSynthesis.getVoices();
  }
  const prefix = lang.slice(0, 2);
  const candidates = voices.filter((voice) => voice.lang.replace("_", "-").startsWith(prefix) && femaleVoice.test(voice.name));
  const quality = (voice: SpeechSynthesisVoice) =>
    (voice.lang.replace("_", "-") === lang ? 4 : 0) + (/google|premium|enhanced|natural|neural/i.test(voice.name) ? 2 : 0) + (voice.localService ? 0 : 1);
  return candidates.sort((a, b) => quality(b) - quality(a))[0];
}

type Voice = { bytes: ArrayBuffer; type: string };

/** Voix Gemini : null si elle n'est pas disponible, pour basculer sur la voix du navigateur. */
async function fetchVoice(text: string): Promise<Voice | null> {
  const response = await fetch("/api/lina/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 800) }),
  }).catch(() => null);
  if (!response?.ok) return null;
  const bytes = await response.arrayBuffer().catch(() => null);
  return bytes ? { bytes, type: response.headers.get("Content-Type") ?? "" } : null;
}

/**
 * Au plus deux appels de synthèse par réponse, pour ménager le quota gratuit de Gemini.
 * La durée de synthèse croît avec la longueur : la première partie reste une phrase courte.
 */
const FIRST_CHUNK_MIN = 12;

function splitForVoice(text: string): string[] {
  const sentences = text.split(/(?<=[.!?…؟])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  let first = "";
  let index = 0;
  while (index < sentences.length && first.length < FIRST_CHUNK_MIN) first = `${first} ${sentences[index++]}`.trim();
  const rest = sentences.slice(index).join(" ");
  return rest ? [first, rest] : [first];
}

const actionLabels: Record<string, string> = {
  navigate_to_page: "Page ouverte",
  fill_contact_form: "Formulaire rempli",
  submit_contact_form: "Demande envoyée",
  end_conversation: "Fin de l'appel",
};

function describeAction(name: string, args: Record<string, unknown> = {}) {
  const details = Object.entries(args)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => `${key} : ${String(value).trim()}`)
    .join(", ");
  return [actionLabels[name] ?? name, details].filter(Boolean).join(" — ").slice(0, 2_000);
}

/** Opus à 32 kbit/s : environ 1,2 Mo pour un appel de 5 minutes. */
function startRecorder(stream: MediaStream) {
  if (typeof MediaRecorder === "undefined") return null;
  const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
  try {
    const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.start(1_000);
    return {
      stop() {
        return new Promise<Blob | null>((resolve) => {
          const finish = () => resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }) : null);
          if (recorder.state === "inactive") return finish();
          recorder.onstop = finish;
          setTimeout(finish, 1_500);
          recorder.stop();
        });
      },
    };
  } catch {
    return null;
  }
}

/** Conversation vocale gratuite : reconnaissance et synthèse du navigateur, réponses de Gemini via /api/lina. */
export async function startLinaSession(options: Options): Promise<LinaSession> {
  const available = recognitionClass();
  if (!available || !("speechSynthesis" in window)) throw new Error("unsupported");
  const Recognition = available;

  const { speech, greeting } = linaLanguages[options.language];
  const greetingVoice = fetchVoice(greeting);
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audio = new AudioContext();
  const analyser = audio.createAnalyser();
  analyser.fftSize = 512;
  const microphone = audio.createMediaStreamSource(stream);
  microphone.connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  const output = audio.createAnalyser();
  output.fftSize = 512;
  output.connect(audio.destination);
  const mix = audio.createMediaStreamDestination();
  microphone.connect(mix);
  output.connect(mix);
  const recorder = startRecorder(mix.stream);
  const startedAt = new Date();
  const page = window.location.pathname;
  const transcript: TranscriptEntry[] = [];
  const outputSamples = new Uint8Array(output.fftSize);
  await audio.resume().catch(() => {});
  const voice = await pickVoice(speech);
  let source: AudioBufferSourceNode | null = null;

  const contents: Content[] = [];
  let mode: LinaMode | null = null;
  let active = true;
  let silentRounds = 0;
  let recognition: Recognition | null = null;
  const timer = setTimeout(() => void end(), MAX_DURATION_MS);

  function setMode(next: LinaMode) {
    mode = next;
    options.onModeChange(next);
  }

  function note(role: TranscriptEntry["role"], text: string) {
    const clean = text.trim().slice(0, 2_000);
    if (clean) transcript.push({ role, text: clean, at: Math.round((Date.now() - startedAt.getTime()) / 100) / 10 });
  }

  async function end(leaving = false) {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    window.removeEventListener("pagehide", onLeave);
    recognition?.abort();
    speechSynthesis.cancel();
    source?.stop();
    const recording = leaving ? null : await recorder?.stop();
    stream.getTracks().forEach((track) => track.stop());
    await audio.close().catch(() => {});
    save(recording ?? null, leaving);
    options.onDisconnect();
  }

  /** En quittant la page, seul le texte part (sendBeacon est limité à 64 Ko). */
  function onLeave() {
    void end(true);
  }
  window.addEventListener("pagehide", onLeave);

  function save(recording: Blob | null, leaving: boolean) {
    if (!transcript.some((entry) => entry.role === "client")) return;
    const body = new FormData();
    body.set(
      "meta",
      JSON.stringify({ language: options.language, startedAt: startedAt.toISOString(), endedAt: new Date().toISOString(), page, transcript: transcript.slice(-200) }),
    );
    if (recording && recording.size <= LINA_AUDIO_MAX_BYTES) body.set("audio", recording, "conversation");
    if (leaving) navigator.sendBeacon("/api/lina/conversations", body);
    else void fetch("/api/lina/conversations", { method: "POST", body }).catch(() => {});
  }

  /**
   * La voix Gemini met 2 à 4 secondes à être générée : le début de la réponse est synthétisé à part
   * pour que Lina commence à parler pendant que la suite se prépare.
   */
  async function speak(raw: string, firstVoice?: Promise<Voice | null>) {
    const text = raw.replace(/[*_#`]/g, "").trim();
    if (!active || !text) return;
    note("lina", text);
    setMode("speaking");
    const chunks = firstVoice ? [text] : splitForVoice(text);
    const pending = chunks.map((chunk, index) => (index === 0 && firstVoice) || fetchVoice(chunk));
    for (let index = 0; index < chunks.length; index++) {
      const voiced = await pending[index];
      if (!active) return;
      const buffer = voiced && (await decode(voiced));
      if (!active) return;
      if (!buffer) return void (await speakBrowser(chunks.slice(index).join(" ")));
      await play(buffer);
    }
  }

  async function decode({ bytes, type }: Voice) {
    if (/l16|pcm/i.test(type)) return pcmBuffer(bytes, Number(/rate=(\d+)/.exec(type)?.[1] ?? 24_000));
    return audio.decodeAudioData(bytes).catch(() => null);
  }

  function play(buffer: AudioBuffer) {
    return new Promise<void>((resolve) => {
      const current = audio.createBufferSource();
      source = current;
      current.buffer = buffer;
      current.connect(output);
      current.onended = () => {
        source = null;
        resolve();
      };
      current.start();
    });
  }

  function pcmBuffer(bytes: ArrayBuffer, rate: number) {
    const view = new DataView(bytes);
    const buffer = audio.createBuffer(1, Math.floor(bytes.byteLength / 2), rate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = view.getInt16(i * 2, true) / 32_768;
    return buffer;
  }

  function speakBrowser(text: string) {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang ?? speech;
      if (voice) utterance.voice = voice;
      utterance.rate = 1.02;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  }

  function listen() {
    if (!active) return;
    setMode("listening");
    const current = new Recognition();
    recognition = current;
    current.lang = speech;
    current.interimResults = false;
    current.continuous = false;
    let heard = "";
    current.onresult = (event) => {
      heard = Array.from(event.results, (result) => result[0]?.transcript ?? "").join(" ").trim();
    };
    current.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        options.onError("L'accès au micro est refusé. Autorisez le micro pour ce site, puis réessayez.");
        void end();
      } else if (event.error === "network") {
        options.onError("La reconnaissance vocale n'est pas disponible. Vérifiez votre connexion.");
        void end();
      }
    };
    current.onend = () => {
      if (!active || recognition !== current) return;
      if (heard) {
        silentRounds = 0;
        void reply(heard);
      } else if (++silentRounds >= MAX_SILENT_ROUNDS) void end();
      else listen();
    };
    current.start();
  }

  async function ask(): Promise<Content | null> {
    const response = await fetch("/api/lina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: options.language, contents: contents.slice(-40) }),
    }).catch(() => null);
    if (!response?.ok) return null;
    const data = (await response.json()) as { content?: Content };
    return data.content ?? null;
  }

  async function reply(heard: string) {
    setMode("thinking");
    note("client", heard);
    contents.push({ role: "user", parts: [{ text: heard.slice(0, 2_000) }] });
    for (let step = 0; step < 4 && active; step++) {
      const content = await ask();
      if (!active) return;
      if (!content) {
        options.onError("Lina n'est pas disponible pour le moment. Appelez-nous ou écrivez-nous sur WhatsApp.");
        return void end();
      }
      contents.push(content);
      await speak(content.parts.map((part) => part.text ?? "").join(" "));
      const calls = content.parts.flatMap((part) => (part.functionCall ? [part.functionCall] : []));
      if (!calls.length) break;
      calls.forEach((call) => note("action", describeAction(call.name, call.args)));
      if (calls.some((call) => call.name === "end_conversation")) return void end();
      setMode("thinking");
      const responses: Part[] = [];
      for (const call of calls) {
        const tool = options.clientTools[call.name];
        const result = tool ? await Promise.resolve(tool(call.args ?? {})).catch(() => "L'action a échoué.") : "Outil inconnu.";
        responses.push({ functionResponse: { id: call.id, name: call.name, response: { result: String(result) } } });
      }
      contents.push({ role: "user", parts: responses });
    }
    listen();
  }

  options.onConnect();
  void speak(greeting, greetingVoice).then(listen);

  return {
    endSession: end,
    getInputVolume() {
      if (!active || mode !== "listening") return 0;
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
      return Math.sqrt(sum / samples.length);
    },
    getOutputVolume() {
      if (!active || mode !== "speaking") return 0;
      if (!source) return 0.25 + Math.abs(Math.sin(performance.now() / 140)) * 0.25;
      output.getByteTimeDomainData(outputSamples);
      let sum = 0;
      for (const sample of outputSamples) sum += ((sample - 128) / 128) ** 2;
      return Math.sqrt(sum / outputSamples.length);
    },
  };
}
