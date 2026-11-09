"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { usePublicSettings } from "@/components/providers/PublicSettings";
import { useScrolledPast } from "@/lib/hooks";
import { WhatsappIcon } from "@/components/icons/Brand";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

export function FloatingActions() {
  const showTop = useScrolledPast(700);
  const { scrollTo } = useSmoothScroll();
  const settings = usePublicSettings();

  const whatsappHref = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(settings.whatsappMessage)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3 sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {showTop ? (
          <motion.button
            key="top"
            type="button"
            onClick={() => scrollTo(0)}
            aria-label="Retour en haut de page"
            data-cursor="hover"
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card/90 text-fg shadow-soft backdrop-blur-md transition-colors hover:border-accent hover:text-accent-text"
          >
            <ArrowUp size={18} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <motion.a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter avec Houd-Li sur WhatsApp"
        data-cursor="hover"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_14px_34px_-10px_rgba(45,102,210,0.8)]"
      >
        <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
        <WhatsappIcon size={26} className="relative" />
      </motion.a>
    </div>
  );
}
