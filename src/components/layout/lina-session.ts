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

/** Conversation vocale gratuite : reconnaissance et synthèse du navigateur, réponses de Gemini via /api/lina. */
export async function startLinaSession(options: Options): Promise<LinaSession> {
  const available = recognitionClass();
  if (!available || !("speechSynthesis" in window)) throw new Error("unsupported");
  const Recognition = available;

  const { speech, greeting } = linaLanguages[options.language];
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audio = new AudioContext();
  const analyser = audio.createAnalyser();
  analyser.fftSize = 512;
  audio.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  const output = audio.createAnalyser();
  output.fftSize = 512;
  output.connect(audio.destination);
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

  async function end() {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    recognition?.abort();
    speechSynthesis.cancel();
    source?.stop();
    stream.getTracks().forEach((track) => track.stop());
    await audio.close().catch(() => {});
    options.onDisconnect();
  }

  async function speak(raw: string) {
    const text = raw.replace(/[*_#`]/g, "").trim();
    if (!active || !text) return;
    setMode("speaking");
    if (await speakCloud(text)) return;
    if (active) await speakBrowser(text);
  }

  /** Voix Gemini : renvoie false si elle n'est pas disponible, pour basculer sur la voix du navigateur. */
  async function speakCloud(text: string) {
    const response = await fetch("/api/lina/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 800) }),
    }).catch(() => null);
    if (!response?.ok || !active) return false;
    const type = response.headers.get("Content-Type") ?? "";
    const bytes = await response.arrayBuffer();
    const buffer = /l16|pcm/i.test(type) ? pcmBuffer(bytes, Number(/rate=(\d+)/.exec(type)?.[1] ?? 24_000)) : await audio.decodeAudioData(bytes).catch(() => null);
    if (!buffer || !active) return Boolean(buffer);
    await new Promise<void>((resolve) => {
      const current = audio.createBufferSource();
      source = current;
      current.buffer = buffer;
      current.connect(output);
      current.onended = () => resolve();
      current.start();
    });
    source = null;
    return true;
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
  void speak(greeting).then(listen);

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
