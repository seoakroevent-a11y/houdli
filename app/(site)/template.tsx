"use client";

import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition.variants}
      initial="initial"
      animate="enter"
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}
