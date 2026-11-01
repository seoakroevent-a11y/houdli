"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronRight } from "lucide-react";
import { fadeUp, wordReveal } from "@/lib/motion";
import { SmartLink } from "@/components/ui/SmartLink";

gsap.registerPlugin(ScrollTrigger);

type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: { src: string; alt: string };
  breadcrumb: { label: string; href?: string }[];
};

/** En-tête plein cadre des pages intérieures, avec Ken Burns et parallaxe. */
export function PageHero({ eyebrow, title, subtitle, image, breadcrumb }: PageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(bgRef.current, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    });
    return () => mm.revert();
  }, []);

  const words = title.split(" ");

  return (
    <section ref={sectionRef} aria-labelledby="page-title" className="relative flex min-h-[78svh] items-end overflow-hidden bg-black pb-16 pt-36 text-white sm:pb-20">
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.15 }}
          animate={{ scale: [1.15, 1.04, 1.12] }}
          transition={{ duration: 28, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        >
          <Image src={image.src} alt={image.alt} fill preload fetchPriority="high" loading="eager" quality={75} sizes="100vw" className="object-cover" />
        </motion.div>
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      <div aria-hidden="true" className="accent-glow absolute -left-40 bottom-0 h-[30rem] w-[30rem] opacity-70" />

      <div className="container-x relative">
        <motion.nav aria-label="Fil d'Ariane" variants={fadeUp} initial="hidden" animate="visible" custom={0.1}>
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
            {breadcrumb.map((b, i) => (
              <li key={b.label} className="flex items-center gap-1.5">
                {b.href ? (
                  <SmartLink href={b.href} className="transition-colors hover:text-white">
                    {b.label}
                  </SmartLink>
                ) : (
                  <span aria-current="page" className="text-white">
                    {b.label}
                  </span>
                )}
                {i < breadcrumb.length - 1 ? <ChevronRight size={14} aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </motion.nav>

        <motion.p className="eyebrow mt-10 !text-[#7aa3f0]" variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
          {eyebrow}
        </motion.p>
        <h1 id="page-title" aria-label={title} className="mt-5 max-w-5xl text-[clamp(2.5rem,7.5vw,6rem)] font-bold leading-[1] tracking-[-0.035em]">
          {words.map((w, i) => (
            <span key={w + i} aria-hidden="true" className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom last:mr-0">
              <motion.span className="inline-block" variants={wordReveal} initial="hidden" animate="visible" custom={0.3 + i * 0.08}>
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="mt-6 max-w-xl text-lg text-white/80" variants={fadeUp} initial="hidden" animate="visible" custom={0.6}>
          {subtitle}
        </motion.p>
      </div>
    </section>
  );
}
