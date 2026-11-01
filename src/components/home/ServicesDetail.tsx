"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { servicesSection } from "@/content/home";
import { universList } from "@/content/univers";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export function ServicesDetail() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const current = universList[active];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = universList.length - 1;
    let next = active;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <Section id="services" labelledBy="services-title">
      <SectionHeading id="services-title" eyebrow={servicesSection.eyebrow} title={servicesSection.title} accent={servicesSection.accent} />

      <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:gap-10">
        <div role="tablist" aria-orientation="vertical" aria-label="Nos services" onKeyDown={onKeyDown} className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {universList.map((u, i) => {
            const selected = i === active;
            return (
              <button
                key={u.slug}
                id={`${baseId}-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "relative shrink-0 rounded-[18px] px-5 py-4 text-left transition-colors duration-300 lg:px-6 lg:py-6",
                  selected ? "text-white" : "text-muted hover:bg-bg-alt hover:text-fg",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId={`${baseId}-pill`}
                    className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_16px_40px_-16px_rgba(45,102,210,0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                ) : null}
                <span className="relative flex items-center gap-4">
                  <span className={cn("font-display text-sm font-semibold", selected ? "text-white/75" : "text-accent-text")}>{u.index}</span>
                  <span className="whitespace-nowrap font-display text-base font-semibold lg:text-xl">{u.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active}`}
          className="surface-card relative min-h-[420px] overflow-hidden p-6 sm:p-10"
        >
          <div aria-hidden="true" className="accent-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72" />
          <AnimatePresence mode="wait">
            <motion.div
              key={current.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: ease.out }}
              className="relative"
            >
              <p className="eyebrow">{current.subtitle}</p>
              <h3 className="mt-3 text-2xl font-bold text-fg sm:text-3xl">{current.title}</h3>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted">{current.description}</p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {current.prestations.map((item, ci) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + ci * 0.05, duration: 0.4, ease: ease.out }}
                    className="flex items-start gap-2 text-sm text-muted"
                  >
                    <Check size={15} className="mt-0.5 shrink-0 text-accent-text" aria-hidden="true" />
                    {item}
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10">
                <Button href={`/univers/${current.slug}`} variant="outline">
                  Découvrir l&apos;univers {current.title}
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
