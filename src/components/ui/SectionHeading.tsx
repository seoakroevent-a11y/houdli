"use client";

import { motion } from "framer-motion";
import { ease, fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id?: string;
  eyebrow: string;
  title: string;
  accent?: string;
  text?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
};

/** Met en bleu la portion `accent` du titre. */
export function AccentTitle({ title, accent }: { title: string; accent?: string }) {
  if (!accent || !title.includes(accent)) return <>{title}</>;
  const [before, after] = title.split(accent);
  return (
    <>
      {before}
      <span className="text-accent-text">{accent}</span>
      {after}
    </>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  accent,
  text,
  align = "left",
  as = "h2",
  className,
}: SectionHeadingProps) {
  const Title = as === "h1" ? motion.h1 : motion.h2;
  const centered = align === "center";

  return (
    <motion.div
      className={cn("max-w-2xl", centered && "mx-auto text-center", className)}
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      <motion.p variants={fadeUp} className="eyebrow">
        {eyebrow}
      </motion.p>
      <Title
        id={id}
        variants={fadeUp}
        className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] font-bold leading-[1.05] text-fg"
      >
        <AccentTitle title={title} accent={accent} />
      </Title>
      <motion.span
        aria-hidden="true"
        className={cn("mt-6 block h-[3px] w-16 rounded-full bg-accent", centered ? "mx-auto origin-center" : "origin-left")}
        variants={{
          hidden: { scaleX: 0 },
          visible: { scaleX: 1, transition: { duration: 0.9, ease: ease.expo, delay: 0.25 } },
        }}
      />
      {text ? (
        <motion.p variants={fadeUp} className="mt-6 text-base leading-relaxed text-muted sm:text-lg">
          {text}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
