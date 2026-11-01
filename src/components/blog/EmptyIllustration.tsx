"use client";

import { motion } from "framer-motion";

/** Illustration de l'état vide du blog : carnet, plume et arc bleu du logo. */
export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} role="img" aria-label="Illustration d'un carnet vierge">
      <motion.path
        d="M40 150 A 90 90 0 0 1 200 70"
        fill="none"
        stroke="#2D66D2"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.9 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <rect x="72" y="46" width="96" height="124" rx="12" className="fill-card stroke-current text-fg/15" strokeWidth="2" />
        <rect x="72" y="46" width="14" height="124" rx="6" fill="#2D66D2" opacity="0.9" />
        {[74, 92, 110, 128].map((y, i) => (
          <motion.rect
            key={y}
            x="98"
            y={y}
            height="6"
            rx="3"
            className="fill-current text-fg/15"
            initial={{ width: 0 }}
            whileInView={{ width: i === 3 ? 34 : 56 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.12 }}
          />
        ))}
      </motion.g>
      <motion.g
        animate={{ rotate: [0, -6, 0], y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "170px 120px" }}
      >
        <path d="M150 150 L196 88 L206 96 L160 158 L146 162 Z" className="fill-current text-fg" />
        <path d="M196 88 L206 96" stroke="#2D66D2" strokeWidth="6" strokeLinecap="round" />
      </motion.g>
      <motion.circle
        cx="200"
        cy="44"
        r="9"
        fill="#2D66D2"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
