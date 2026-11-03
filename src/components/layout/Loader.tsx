"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { markPaths } from "./Logo";
import { ease } from "@/lib/motion";

const TOTAL_MS = 600;

/** Écran de chargement : le monogramme Houdli se dessine puis révèle le site. */
export function Loader() {
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = window.setTimeout(() => setDone(true), reduce ? 200 : TOTAL_MS);
    return () => window.clearTimeout(id);
  }, [reduce]);

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          key="loader"
          role="status"
          aria-label="Chargement du site Houdli"
          className="loader-failsafe fixed inset-0 z-[200] flex items-center justify-center bg-black"
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 0.45, ease: ease.inOut }}
        >
          <motion.svg
            viewBox={markPaths.viewBox}
            className="h-24 w-24 sm:h-28 sm:w-28"
            aria-hidden="true"
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            <motion.path
              d={markPaths.h}
              stroke="#fff"
              strokeWidth={4}
              initial={{ pathLength: 0, fill: "rgba(255,255,255,0)" }}
              animate={{ pathLength: 1, fill: "rgba(255,255,255,1)" }}
              transition={{
                pathLength: { duration: 0.35, ease: ease.inOut },
                fill: { duration: 0.2, delay: 0.25 },
              }}
            />
            <motion.path
              d={markPaths.arc}
              stroke="#2D66D2"
              strokeWidth={4}
              initial={{ pathLength: 0, fill: "rgba(45,102,210,0)" }}
              animate={{ pathLength: 1, fill: "rgba(45,102,210,1)" }}
              transition={{
                pathLength: { duration: 0.35, delay: 0.08, ease: ease.inOut },
                fill: { duration: 0.2, delay: 0.3 },
              }}
            />
            <motion.circle
              cx={markPaths.dot.cx}
              cy={markPaths.dot.cy}
              r={markPaths.dot.r}
              fill="#fff"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ transformOrigin: `${markPaths.dot.cx}px ${markPaths.dot.cy}px` }}
              transition={{ delay: 0.3, type: "spring", stiffness: 380, damping: 16 }}
            />
          </motion.svg>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
