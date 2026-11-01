"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks";

const INTERACTIVE = "a, button, [role='button'], [data-cursor='hover'], label, select, summary";

/** Petit cercle bleu qui suit la souris et s'agrandit sur les éléments cliquables. */
export function CustomCursor() {
  const enabled = useMediaQuery("(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)");
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    const trackCursor = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target as Element | null;
      setHovering(Boolean(target?.closest?.(INTERACTIVE)));
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", trackCursor, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", trackCursor);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[100]" style={{ x: sx, y: sy }}>
      <motion.div
        className="-ml-2 -mt-2 h-4 w-4 rounded-full border border-accent"
        initial={false}
        animate={{
          scale: hovering ? 2.6 : 1,
          opacity: visible ? 1 : 0,
          backgroundColor: hovering ? "rgba(45,102,210,0.14)" : "rgba(45,102,210,0.85)",
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}
