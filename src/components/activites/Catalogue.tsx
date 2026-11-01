"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { activiteCategories, activites, type ActiviteCategory } from "@/content/activites";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SmartLink } from "@/components/ui/SmartLink";

type Filter = "Toutes" | ActiviteCategory;
const filters: Filter[] = ["Toutes", ...activiteCategories];

export function Catalogue() {
  const [filter, setFilter] = useState<Filter>("Toutes");
  const items = useMemo(
    () => (filter === "Toutes" ? activites : activites.filter((a) => a.category === filter)),
    [filter],
  );

  return (
    <LayoutGroup>
      <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filtrer les activités">
        {filters.map((f) => {
          const selected = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(f)}
              className={cn(
                "relative rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
                selected ? "border-transparent text-white" : "border-line text-muted hover:border-fg/20 hover:text-fg",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId="catalogue-pill"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              ) : null}
              <span className="relative">{f}</span>
            </button>
          );
        })}
      </div>

      <motion.ul layout className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((a) => (
            <motion.li
              key={a.slug}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: ease.out }}
            >
              <SmartLink
                href={`/activites/${a.slug}`}
                className="group block overflow-hidden rounded-[22px] border border-line bg-card transition-transform duration-500 hover:-translate-y-1"
              >
                <span className="relative block aspect-[16/11] overflow-hidden">
                  <Image
                    src={a.image}
                    alt={a.alt}
                    fill
                    quality={70}
                    loading={items.indexOf(a) < 3 ? "eager" : undefined}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                </span>
                <span className="block p-5">
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-accent-text">
                    Réf. {a.ref} · {a.category}
                  </span>
                  <span className="mt-2 block font-display text-xl font-semibold text-fg">{a.title}</span>
                  <span className="mt-2 block text-sm text-muted">
                    {a.duration} · {a.participants}
                  </span>
                </span>
              </SmartLink>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </LayoutGroup>
  );
}
