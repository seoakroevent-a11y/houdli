"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight } from "lucide-react";
import { hero } from "@/content/home";
import { universList } from "@/content/univers";
import { images } from "@/lib/images";
import { charReveal, ease, fadeUp } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const SLIDE_MS = 3600;

// Les visuels passent en plein écran : on demande une largeur supérieure à celle des cartes.
const slides = universList.map((u) => {
  const image = images.univers[u.slug];
  return { title: u.title, image: { ...image, src: image.src.replace(/w=\d+/, "w=2400") } };
});

const statementWords = hero.subtitle.split(" ");

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const mediaInnerRef = useRef<HTMLDivElement>(null);
  const pointerLayerRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);

  const { scrollTo } = useSmoothScroll();
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState({ index: 0, prev: -1 });
  // L'image affichée et les deux suivantes seulement : les 6 visuels plein écran d'un coup pèsent plus d'1 Mo.
  const [mounted, setMounted] = useState(3);
  // Laisse le temps à l'écran de chargement de se retirer lors du premier affichage.
  const [baseDelay] = useState(() =>
    typeof performance !== "undefined" && performance.now() < 3000 ? 0.6 : 0.1,
  );

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setSlide(({ index }) => ({ index: (index + 1) % slides.length, prev: index }));
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    setMounted((count) => Math.min(slides.length, Math.max(count, slide.index + 3)));
  }, [slide.index]);

  useIsoLayoutEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!stage || !frame || !media) return;

    // Le calque image couvre tout l'écran ; on le découpe à la taille de la fenêtre centrale.
    const frameInset = () => {
      const s = stage.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      return `inset(${f.top - s.top}px ${s.right - f.right}px ${s.bottom - f.bottom}px ${f.left - s.left}px round 22px)`;
    };

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const words = statementRef.current?.querySelectorAll("[data-word]") ?? [];
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(media, { clipPath: frameInset }, { clipPath: "inset(0px 0px 0px 0px round 0px)", ease: "power2.inOut", duration: 1 }, 0)
        .fromTo(mediaInnerRef.current, { scale: 1.3 }, { scale: 1, duration: 1 }, 0)
        .to(line1Ref.current, { xPercent: -45, autoAlpha: 0, ease: "power1.in", duration: 0.6 }, 0)
        .to(line2Ref.current, { xPercent: 45, autoAlpha: 0, ease: "power1.in", duration: 0.6 }, 0)
        .to([topRef.current, bottomRef.current, captionRef.current], { autoAlpha: 0, y: -16, duration: 0.3 }, 0)
        .to(arcRef.current, { autoAlpha: 0, duration: 0.3 }, 0)
        .to(veilRef.current, { opacity: 1, duration: 0.45 }, 0.5)
        .to(statementRef.current, { autoAlpha: 1, duration: 0.15 }, 0.75)
        .fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.05, duration: 0.2 }, 0.8)
        .to({}, { duration: 0.35 });

      // Parallaxe au pointeur : l'image, l'arc et le titre se décalent à des vitesses différentes.
      if (!window.matchMedia("(pointer: fine)").matches) return;
      const to = (el: Element | null, prop: "x" | "y") =>
        el ? gsap.quickTo(el, prop, { duration: 1.1, ease: "power3.out" }) : () => {};
      const layerX = to(pointerLayerRef.current, "x");
      const layerY = to(pointerLayerRef.current, "y");
      const arcX = to(arcRef.current, "x");
      const arcY = to(arcRef.current, "y");
      const l1X = to(line1Ref.current, "x");
      const l2X = to(line2Ref.current, "x");

      const nudgeHeroLayers = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layerX(nx * -36);
        layerY(ny * -24);
        arcX(nx * 28);
        arcY(ny * 20);
        l1X(nx * -18);
        l2X(nx * 18);
      };
      stage.addEventListener("pointermove", nudgeHeroLayers);
      return () => stage.removeEventListener("pointermove", nudgeHeroLayers);
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      const apply = () => gsap.set(media, { clipPath: frameInset() });
      apply();
      window.addEventListener("resize", apply);
      return () => window.removeEventListener("resize", apply);
    });

    return () => mm.revert();
  }, []);

  let charIndex = 0;
  const renderLine = (words: string[], extra?: React.ReactNode) =>
    words.map((word, w) => (
      <span key={word} className="mr-[0.2em] inline-flex overflow-hidden pb-[0.1em] last:mr-0">
        {Array.from(word).map((char, c) => {
          const delay = baseDelay + 0.1 + charIndex++ * 0.035;
          return (
            <motion.span
              key={c}
              className={`inline-block origin-bottom-left ${hero.accentWords.includes(word) ? "text-accent-text" : ""}`}
              variants={charReveal}
              initial="hidden"
              animate="visible"
              custom={delay}
            >
              {char}
            </motion.span>
          );
        })}
        {w === words.length - 1 && extra}
      </span>
    ));

  const current = slides[slide.index];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative h-[250svh] overflow-x-clip bg-bg text-fg motion-reduce:h-[100svh] dark:text-white"
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Calque image : fenêtre centrale qui s'ouvre en plein écran au défilement */}
        <div
          ref={mediaRef}
          className="absolute inset-0 will-change-[clip-path]"
          style={{ clipPath: "inset(50% 50% 50% 50% round 22px)" }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            transition={{ duration: 1.4, ease: ease.expo, delay: baseDelay + 0.3 }}
          >
            <div ref={mediaInnerRef} className="absolute inset-0 scale-[1.3] will-change-transform">
              <div ref={pointerLayerRef} className="absolute -inset-[4%]">
                {slides.map((s, i) => {
                  const active = i === slide.index;
                  const prev = i === slide.prev;
                  return (
                    <motion.div
                      key={s.title}
                      className="absolute inset-0"
                      style={{ zIndex: active ? 2 : prev ? 1 : 0 }}
                      initial={false}
                      animate={{ clipPath: active || prev ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
                      transition={active ? { duration: 1.2, ease: ease.expo } : { duration: 0 }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        initial={false}
                        animate={{ scale: active ? 1 : 1.18 }}
                        transition={active ? { duration: 2.4, ease: ease.out } : { duration: 0 }}
                      >
                        {i < mounted ? (
                          <Image
                            src={s.image.src}
                            alt={i === 0 ? s.image.alt : ""}
                            fill
                            preload={i === 0}
                            fetchPriority={i === 0 ? "high" : "low"}
                            loading={i === 0 ? "eager" : "lazy"}
                            quality={75}
                            sizes="100vw"
                            className="object-cover"
                          />
                        ) : null}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-black/20" />
            <div
              ref={veilRef}
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),rgba(0,0,0,0.85))] opacity-0"
            />
          </motion.div>
        </div>

        <div aria-hidden="true" className="grain pointer-events-none absolute -inset-1/2 z-[5] opacity-[0.09]" />

        <div className="container-x relative z-10 flex h-full flex-col pb-6 pt-24 sm:pb-8 sm:pt-28">
          {/* Ligne meta */}
          <div ref={topRef}>
            <motion.div
              className="flex items-center justify-between gap-4 font-display text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-muted sm:text-[0.68rem] dark:text-white"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={baseDelay + 0.9}
            >
              <h1 id="hero-title" className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_#2D66D2]" />
                {hero.eyebrow}
              </h1>
              <span className="hidden gap-8 sm:flex">
                {hero.meta.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </span>
            </motion.div>
          </div>

          {/* Scène centrale : titre géant autour de la fenêtre */}
          <div className="relative flex-1">
            <p className="pointer-events-none font-display text-[clamp(3.1rem,13.5vw,12rem)] font-bold leading-[0.9] tracking-[-0.045em]">
              <span className="sr-only">{hero.title.join(" ")}</span>
              <span ref={line1Ref} aria-hidden="true" className="absolute left-0 top-[6%] block whitespace-nowrap">
                {renderLine(hero.lines[0])}
              </span>
              <span
                ref={line2Ref}
                aria-hidden="true"
                className="absolute bottom-[6%] right-0 block whitespace-nowrap"
              >
                {renderLine(
                  hero.lines[1],
                  <motion.span
                    className="ml-[0.04em] inline-block h-[0.16em] w-[0.16em] self-end rounded-full bg-accent shadow-[0_0_30px_rgba(45,102,210,0.9)] mb-[0.16em]"
                    initial={{ scale: 0, y: "-2em" }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 14, delay: baseDelay + 0.85 }}
                  />,
                )}
              </span>
            </p>

            <div
              ref={frameRef}
              className="absolute left-1/2 top-1/2 aspect-[4/5] h-[46svh] -translate-x-1/2 -translate-y-1/2 sm:h-[56svh]"
            >
              {/* Arc et point du logo, en orbite autour de la fenêtre */}
              <div ref={arcRef} aria-hidden="true" className="pointer-events-none absolute -inset-[16%]">
                <motion.svg
                  viewBox="0 0 200 200"
                  className="h-full w-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                >
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="96"
                    fill="none"
                    stroke="#2D66D2"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 0.62, opacity: 1 }}
                    transition={{ duration: 1.8, ease: ease.inOut, delay: baseDelay + 0.7 }}
                  />
                  <motion.circle
                    cx="196"
                    cy="100"
                    r="4.5"
                    fill="#2D66D2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 12, delay: baseDelay + 1.6 }}
                  />
                </motion.svg>
              </div>

              <div
                ref={captionRef}
                className="absolute left-0 right-0 top-full mt-3 hidden lg:left-full lg:right-auto lg:top-1/2 lg:ml-[14%] lg:mt-0 lg:block lg:w-[19rem] lg:-translate-y-1/2"
              >
              <motion.div
                className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-muted sm:text-[0.68rem] dark:text-white"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={baseDelay + 1.1}
                aria-hidden="true"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="relative block h-[1.4em] flex-1 overflow-hidden">
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        key={slide.index}
                        className="absolute inset-0 truncate"
                        initial={{ y: "110%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "-110%" }}
                        transition={{ duration: 0.7, ease: ease.expo }}
                      >
                        <span>0{slide.index + 1}</span> — {current.title}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="tabular-nums text-fg/70 dark:text-white">/0{slides.length}</span>
                </div>
                <span className="mt-2 block h-px overflow-hidden bg-white/15 motion-reduce:hidden">
                  <motion.span
                    key={slide.index}
                    className="block h-full origin-left bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                  />
                </span>
              </motion.div>
              </div>
            </div>
          </div>

          {/* Bas de scène : accroche + actions */}
          <div ref={bottomRef}>
            <motion.div
              className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={baseDelay + 1}
            >
              <p className="max-w-sm font-display text-sm font-semibold leading-relaxed text-fg sm:text-base">{hero.subtitle}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button href="/#services" size="lg">
                  {hero.primaryCta}
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
                <Button href="/#contact" size="lg" variant="light">
                  {hero.secondaryCta}
                </Button>
                <button
                  type="button"
                  onClick={() => scrollTo("#marquee", { offset: -72 })}
                  className="ml-2 hidden h-12 w-12 items-center justify-center rounded-full border border-line text-fg/80 transition-colors hover:border-fg hover:text-fg dark:border-white/25 dark:text-white/80 dark:hover:border-white dark:hover:text-white 2xl:flex"
                  aria-label="Faire défiler vers le contenu"
                >
                  <ArrowDown size={18} className="animate-bounce" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Deuxième acte : l'accroche s'allume mot à mot sur l'image plein écran */}
        <div
          ref={statementRef}
          aria-hidden="true"
          className="invisible pointer-events-none absolute inset-0 z-10 flex items-center opacity-0"
        >
          <div className="container-x text-center">
            <p className="eyebrow !text-[#7aa3f0]">Nos 4 univers</p>
            <p className="mx-auto mt-6 max-w-5xl font-display text-[clamp(1.9rem,5.2vw,4.6rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-white">
              {statementWords.map((word, i) => (
                <span key={i} data-word className="inline-block opacity-[0.14]">
                  {word}
                  {i < statementWords.length - 1 && "\u00a0"}
                </span>
              ))}
            </p>
            <p className="mt-8 text-[0.68rem] font-medium uppercase tracking-[0.3em] text-white/60">
              {slides.map((s) => s.title).join("  ·  ")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
