"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { faqSection } from "@/content/home";
import { faqItems, type FaqItem } from "@/content/faq";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function Faq({ items = faqItems }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <Section id="faq" tone="alt" labelledBy="faq-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading id="faq-title" eyebrow={faqSection.eyebrow} title={faqSection.title} accent={faqSection.accent} />
          <p className="mt-6 max-w-sm leading-relaxed text-muted">
            Une autre question ? Notre équipe vous répond sous 24h.
          </p>
          <div className="mt-8">
            <Button href="/#contact" variant="outline">
              Nous écrire
            </Button>
          </div>
        </div>

        <RevealGroup as="ul" className="space-y-3" interval={0.05}>
          {items.map((item, i) => {
            const isOpen = open === i;
            const btnId = `${baseId}-q-${i}`;
            const panelId = `${baseId}-a-${i}`;
            return (
              <RevealItem as="li" key={item.question}>
                <div
                  className={cn(
                    "rounded-[20px] border bg-card transition-[border-color,box-shadow] duration-300",
                    isOpen ? "border-accent/40 shadow-soft" : "border-line",
                  )}
                >
                  <h3 className="text-base">
                    <button
                      id={btnId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-start justify-between gap-6 rounded-[20px] px-5 py-5 text-left font-display text-[0.98rem] font-semibold text-fg sm:px-7 sm:py-6 sm:text-lg"
                    >
                      <span>{item.question}</span>
                      <motion.span
                        aria-hidden="true"
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.35, ease: ease.out }}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                          isOpen ? "border-accent bg-accent text-white" : "border-line text-fg",
                        )}
                      >
                        <Plus size={16} />
                      </motion.span>
                    </button>
                  </h3>
                  {/* Réponse toujours dans le HTML, repliée : les robots IA n'exécutent pas le JavaScript. */}
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    inert={!isOpen}
                    aria-hidden={!isOpen}
                    initial={false}
                    animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: ease.out }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-6 pr-14 leading-relaxed text-muted sm:px-7 sm:pr-20">{item.answer}</p>
                  </motion.div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </Section>
  );
}
