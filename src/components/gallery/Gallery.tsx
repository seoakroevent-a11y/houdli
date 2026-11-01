"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { GalleryCategory, GalleryItem } from "@/lib/images";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

type Filter = "Tous" | GalleryCategory;
const filters: Filter[] = ["Tous", "Team Building", "Événementiel", "Communication", "Stands"];

const spans = {
  portrait: "row-span-2",
  landscape: "sm:col-span-2",
  square: "",
};

export function Gallery({ items: source }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<Filter>("Tous");
  const [index, setIndex] = useState<number | null>(null);
  const mounted = useMounted();
  const { lock } = useSmoothScroll();
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const items = useMemo(
    () => (filter === "Tous" ? source : source.filter((g) => g.category === filter)),
    [filter, source],
  );
  const current = index !== null ? items[index] : null;

  const close = useCallback(() => {
    setIndex(null);
    triggerRef.current?.focus();
  }, []);
  const step = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i === null ? i : (i + dir + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (index === null) return;
    lock(true);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lock(false);
    };
  }, [index, close, step, lock]);

  return (
    <>
      <div role="group" aria-label="Filtrer par catégorie" className="mt-12 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f)}
              className={cn(
                "relative rounded-full border px-5 py-2.5 text-sm font-medium transition-colors duration-300",
                active ? "border-transparent text-white" : "border-line text-muted hover:border-fg/20 hover:text-fg",
              )}
            >
              {active ? (
                <motion.span layoutId="gallery-filter" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
              ) : null}
              <span className="relative">{f}</span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {items.length} photo{items.length > 1 ? "s" : ""} affichée{items.length > 1 ? "s" : ""}
      </p>

      <LayoutGroup>
        <motion.ul layout className="mt-10 grid auto-rows-[200px] grid-cols-2 gap-3 [grid-auto-flow:dense] sm:auto-rows-[220px] sm:gap-4 lg:grid-cols-4 lg:auto-rows-[240px]">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.5, ease: ease.out }}
                className={cn("relative", spans[item.ratio], item.ratio === "landscape" && "col-span-2")}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setIndex(i);
                  }}
                  aria-label={`Agrandir : ${item.alt}`}
                  className="group relative block h-full w-full overflow-hidden rounded-[20px] bg-bg-alt"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    quality={70}
                    loading={i < 6 ? "eager" : undefined}
                    sizes={item.ratio === "landscape" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                  <span aria-hidden="true" className="image-veil absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span aria-hidden="true" className="absolute inset-x-4 bottom-4 flex translate-y-3 items-center justify-between text-left text-white opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span>
                      <span className="block text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/75">{item.category}</span>
                      <span className="mt-0.5 block text-sm font-medium">{item.alt}</span>
                    </span>
                    <Expand size={18} className="shrink-0" />
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </LayoutGroup>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {current ? (
                <motion.div
                  key="lightbox"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Visionneuse de photos"
                  className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  onClick={close}
                >
                  <AnimatePresence mode="wait">
                    <motion.figure
                      key={current.id}
                      className="relative h-full max-h-[82vh] w-full max-w-6xl"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.45, ease: ease.out }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Image src={current.src.replace(/w=\d+/, "w=2000")} alt={current.alt} fill quality={85} sizes="100vw" className="rounded-[16px] object-contain" />
                      <figcaption className="absolute -bottom-10 left-0 right-0 text-center text-sm text-white/80">
                        {current.alt} · {(index ?? 0) + 1}/{items.length}
                      </figcaption>
                    </motion.figure>
                  </AnimatePresence>

                  <button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    aria-label="Fermer la visionneuse"
                    className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white hover:text-black sm:right-8 sm:top-8"
                  >
                    <X size={18} />
                  </button>
                  {items.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          step(-1);
                        }}
                        aria-label="Photo précédente"
                        className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white hover:text-black sm:left-8"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          step(1);
                        }}
                        aria-label="Photo suivante"
                        className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white hover:text-black sm:right-8"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
