"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Mic, PhoneOff, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { contactBridge, type ContactBridge, type ContactDraft } from "@/lib/contact-bridge";
import { LINA_RETENTION_DAYS } from "@/lib/lina-conversations";
import { linaLanguages, type LinaLanguage } from "@/lib/lina-languages";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import type { ClientTools, LinaSession } from "./lina-session";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
const UNAVAILABLE = "Lina n'est pas disponible pour le moment. Appelez-nous ou écrivez-nous sur WhatsApp.";
const EASE = [0.22, 1, 0.36, 1] as const;

/** Pages que l'agent a le droit d'ouvrir. */
const allowedPath = /^\/(#(apropos|services|references|contact))?$|^\/(activites|blog|galerie)$|^\/(activites|blog|univers)\/[a-z0-9-]+$/;

function toPath(page: unknown) {
  if (typeof page !== "string") return null;
  const path = page.trim().replace(/^https?:\/\/(www\.)?houdli\.ma/, "") || "/";
  return allowedPath.test(path) ? path : null;
}

async function waitForContactForm(timeout = 6000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const bridge = contactBridge();
    if (bridge) return bridge;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

type State = "idle" | "connecting" | "listening" | "thinking" | "speaking";

const stateLabels: Record<State, string> = {
  idle: "Prête à vous écouter",
  connecting: "Connexion…",
  listening: "Lina vous écoute",
  thinking: "Lina réfléchit…",
  speaking: "Lina vous répond",
};

const spin: Record<State, number> = { idle: 14, connecting: 2.5, listening: 7, thinking: 2, speaking: 3.5 };

/** Sphère animée : le dégradé tourne selon l'état et le volume de la voix la fait respirer. */
function Orb({ size, level, state }: { size: number; level: MotionValue<number>; state: State }) {
  const reduce = useReducedMotion();
  const scale = useTransform(level, [0, 1], [1, 1.16]);
  const glow = useTransform(level, [0, 1], [0.45, 1]);
  const glowScale = useTransform(level, [0, 1], [1, 1.35]);

  return (
    <motion.div className="relative shrink-0" style={{ width: size, height: size, scale }}>
      <motion.div
        aria-hidden="true"
        className="absolute -inset-[30%] rounded-full bg-[radial-gradient(circle,rgba(45,102,210,0.7)_0%,rgba(122,92,255,0.3)_40%,transparent_68%)]"
        style={{ opacity: glow, scale: glowScale }}
      />
      <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_60%,#2d66d2,#10145a_75%)]">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 28% 32%, rgba(127,190,255,0.95), transparent 42%), radial-gradient(circle at 74% 70%, rgba(139,107,255,0.9), transparent 44%)",
          }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: spin[state], repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 70% 25%, rgba(90,160,255,0.8), transparent 40%), radial-gradient(circle at 30% 78%, rgba(45,102,210,0.9), transparent 42%)",
          }}
          animate={reduce ? undefined : { rotate: -360, scale: [1, 1.15, 1] }}
          transition={{
            rotate: { duration: spin[state] * 1.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.65),rgba(255,255,255,0.1)_26%,transparent_50%)]" />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_14px_rgba(255,255,255,0.3),inset_0_-8px_20px_rgba(8,8,56,0.5)]" />
      </div>
    </motion.div>
  );
}

/** Ondes qui se propagent autour de la sphère. */
function Ripples({ active, reach = 1 }: { active: boolean; reach?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <>
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border border-accent/60"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1 + (active ? 0.9 : 0.6) * reach, opacity: [0, active ? 0.7 : 0.4, 0] }}
          transition={{ duration: active ? 1.8 : 3.2, repeat: Infinity, delay: ring * (active ? 0.6 : 1.05), ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/**
 * Agent vocal Lina. « browser » : voix du navigateur et réponses Gemini (gratuit) ;
 * « elevenlabs » : agent ElevenLabs. Le moteur n'est chargé qu'au premier appel.
 */
export function VoiceAgent({ engine }: { engine: "browser" | "elevenlabs" | null }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<LinaLanguage>("fr");
  const conversation = useRef<LinaSession | null>(null);
  const rawLevel = useMotionValue(0);
  const level = useSpring(rawLevel, { stiffness: 260, damping: 22 });
  const router = useRouter();
  const pathname = usePathname();
  const { scrollTo } = useSmoothScroll();
  const nav = useRef({ router, pathname, scrollTo });

  useEffect(() => {
    nav.current = { router, pathname, scrollTo };
  });

  useEffect(() => () => void conversation.current?.endSession(), []);

  function openPage(path: string) {
    const { router, pathname, scrollTo } = nav.current;
    const [base, hash] = path.split("#");
    if (hash && (base || "/") === pathname) scrollTo(`#${hash}`);
    else router.push(path, { scroll: !hash });
  }

  async function contactForm(): Promise<ContactBridge | null> {
    if (nav.current.pathname !== "/" || !contactBridge()) openPage("/#contact");
    else nav.current.scrollTo("#contact");
    return waitForContactForm();
  }

  const clientTools = {
    navigate_to_page: ({ page }: { page?: unknown }) => {
      const path = toPath(page);
      if (!path) return "Page introuvable sur le site. Proposez une autre page.";
      openPage(path);
      return `Page ouverte : ${path}`;
    },
    fill_contact_form: async (draft: ContactDraft) => {
      const form = await contactForm();
      if (!form) return "Le formulaire n'a pas pu être affiché. Proposez le téléphone ou WhatsApp.";
      const problems = await form.fill(draft);
      const list = Object.entries(problems);
      return list.length
        ? `Formulaire rempli, mais à corriger : ${list.map(([field, message]) => `${field} (${message})`).join(", ")}.`
        : "Formulaire rempli sans erreur. Résumez la demande et demandez confirmation avant l'envoi.";
    },
    submit_contact_form: async () => {
      const form = contactBridge();
      if (!form) return "Le formulaire n'est pas affiché. Remplissez-le d'abord.";
      const error = await form.submit();
      return error ? `Envoi impossible : ${error}` : "Demande envoyée à l'équipe Houd-Li.";
    },
  };

  useAnimationFrame((time) => {
    const current = conversation.current;
    if (current && state === "speaking") rawLevel.set(Math.min(1, current.getOutputVolume() * 2.2));
    else if (current && state === "listening") rawLevel.set(Math.min(1, current.getInputVolume() * 3));
    else if (state === "connecting" || state === "thinking") rawLevel.set(0.25 + Math.sin(time / 180) * 0.2);
    else rawLevel.set(0);
  });

  if (!engine) return null;

  async function start() {
    setError(null);
    setState("connecting");
    if (engine === "browser") {
      const { speechSupported } = await import("./lina-session");
      if (!speechSupported()) {
        setState("idle");
        setError("La conversation vocale n'est pas disponible dans ce navigateur. Essayez avec Chrome, Edge ou Safari.");
        return;
      }
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (cause) {
      setState("idle");
      const name = cause instanceof DOMException ? cause.name : "";
      setError(
        name === "NotFoundError"
          ? "Aucun micro n'a été détecté sur cet appareil."
          : name === "NotAllowedError"
            ? "L'accès au micro est refusé. Cliquez sur l'icône à gauche de l'adresse du site, autorisez le micro, puis réessayez."
            : "Le micro n'est pas disponible dans ce navigateur. Essayez avec Chrome, Safari ou Edge.",
      );
      return;
    }
    const onDisconnect = () => {
      conversation.current = null;
      setState("idle");
    };
    try {
      if (engine === "browser") {
        const { startLinaSession } = await import("./lina-session");
        conversation.current = await startLinaSession({
          language,
          clientTools: clientTools as ClientTools,
          onConnect: () => setState("speaking"),
          onModeChange: setState,
          onDisconnect,
          onError: setError,
        });
      } else if (AGENT_ID) {
        const { Conversation } = await import("@elevenlabs/client");
        conversation.current = await Conversation.startSession({
          agentId: AGENT_ID,
          connectionType: "websocket",
          textOnly: false,
          clientTools,
          onConnect: () => setState("listening"),
          onModeChange: ({ mode }) => setState(mode === "speaking" ? "speaking" : "listening"),
          onDisconnect,
          onError: () => setError("La conversation a été interrompue. Réessayez dans un instant."),
        });
      }
    } catch {
      conversation.current = null;
      setState("idle");
      setError(UNAVAILABLE);
    }
  }

  async function stop() {
    await conversation.current?.endSession();
    conversation.current = null;
    setState("idle");
  }

  const active = state !== "idle";

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-4 sm:bottom-7 sm:left-7">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Parler avec Lina, conseillère Houd-Li"
            initial={{ opacity: 0, y: 24, scale: 0.85, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.9, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative w-[min(17.5rem,calc(100vw-2.5rem))] origin-bottom-left overflow-hidden rounded-3xl border border-white/10 bg-[#080838]/95 p-4 text-white shadow-[0_24px_60px_-20px_rgba(8,8,56,0.9)] backdrop-blur-xl"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(45,102,210,0.45),transparent_70%)]"
            />

            <div className="relative flex items-center gap-3.5">
              <div className="relative grid place-items-center">
                <Ripples active={active} reach={0.4} />
                <Orb size={48} level={level} state={state} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs uppercase tracking-[0.2em]">Lina · Houd-Li</p>
                <div className="relative mt-0.5 h-5 overflow-hidden" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={state}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="truncate text-sm text-white/70"
                    >
                      {stateLabels[state]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  void stop();
                  setOpen(false);
                }}
                aria-label="Fermer"
                data-cursor="hover"
                className="-mr-1 self-start rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {active ? (
                <motion.button
                  key="stop"
                  type="button"
                  onClick={() => void stop()}
                  data-cursor="hover"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  whileTap={{ scale: 0.97 }}
                  className="relative mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-500/90 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
                >
                  <PhoneOff size={16} />
                  Raccrocher
                </motion.button>
              ) : (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="relative"
                >
                  <p className="mt-3 text-[13px] leading-relaxed text-white/75">
                    {engine === "browser"
                      ? "Une question sur nos événements ou nos activités ? Choisissez votre langue."
                      : "Une question sur nos événements ou nos activités ? Parlez en français, arabe, darija ou anglais."}
                  </p>
                  {engine === "browser" ? (
                    <div role="radiogroup" aria-label="Langue de la conversation" className="mt-3 flex gap-1.5">
                      {(Object.keys(linaLanguages) as LinaLanguage[]).map((code) => (
                        <button
                          key={code}
                          type="button"
                          role="radio"
                          aria-checked={language === code}
                          onClick={() => setLanguage(code)}
                          data-cursor="hover"
                          className={`flex-1 rounded-full border px-2 py-1.5 text-xs transition-colors ${
                            language === code
                              ? "border-accent bg-accent/20 text-white"
                              : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {linaLanguages[code].label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <motion.button
                    type="button"
                    onClick={() => void start()}
                    data-cursor="hover"
                    whileTap={{ scale: 0.97 }}
                    className="relative mt-3.5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ left: "-40%" }}
                      animate={{ left: "140%" }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
                    />
                    <Mic size={16} className="relative" />
                    <span className="relative">Démarrer</span>
                  </motion.button>
                  {engine === "browser" ? (
                    <p className="mt-2.5 text-[11px] leading-snug text-white/50">
                      En démarrant, vous acceptez que l&apos;appel (voix et texte) soit enregistré et conservé {LINA_RETENTION_DAYS} jours pour
                      que notre équipe vous réponde au mieux.
                    </p>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error ? (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative mt-3 text-xs text-red-300"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => setOpen((value) => !value)}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          aria-expanded={open}
          aria-label="Parler avec Lina, la conseillère vocale Houd-Li"
          data-cursor="hover"
          initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1.8, type: "spring", stiffness: 220, damping: 18 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative grid h-14 w-14 place-items-center rounded-full"
        >
          <Ripples active={active} />
          <Orb size={56} level={level} state={state} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "mic"}
              initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-0 grid place-items-center text-white drop-shadow-[0_1px_6px_rgba(8,8,56,0.6)]"
            >
              {open ? <X size={20} /> : <Mic size={20} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {!open && (hovered || active) ? (
            <motion.span
              initial={{ opacity: 0, x: -12, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: EASE }}
              className="pointer-events-none hidden rounded-full border border-white/10 bg-[#080838]/85 px-4 py-2 text-sm font-medium text-white shadow-soft backdrop-blur-md sm:inline"
            >
              {active ? stateLabels[state] : "Parler à Lina"}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
