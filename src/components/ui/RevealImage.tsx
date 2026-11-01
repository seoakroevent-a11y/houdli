"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsapEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type RevealImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  /** Amplitude de la parallaxe en % de la hauteur. 0 pour désactiver. */
  parallax?: number;
  veil?: boolean;
  preload?: boolean;
  delay?: number;
};

/** Image révélée par un masque de gauche à droite, avec parallaxe subtile. */
export function RevealImage({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  parallax = 8,
  veil = false,
  preload = false,
  delay = 0,
}: RevealImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        wrap,
        { clipPath: "inset(0% 100% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.3,
          delay,
          ease: gsapEase.expo,
          scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
        },
      );
      gsap.fromTo(inner, { scale: 1.18 }, {
        scale: 1.08,
        duration: 1.6,
        delay,
        ease: gsapEase.expo,
        scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
      });
      if (parallax > 0) {
        gsap.fromTo(
          inner,
          { yPercent: -parallax / 2 },
          {
            yPercent: parallax / 2,
            ease: "none",
            scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }
    });
    return () => mm.revert();
  }, [parallax, delay]);

  return (
    <div ref={wrapRef} className={cn("relative overflow-hidden rounded-[var(--radius-xl2)] bg-bg-alt", className)}>
      <div ref={innerRef} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          quality={75}
          className={cn("object-cover", imageClassName)}
        />
      </div>
      {veil ? <div aria-hidden="true" className="image-veil absolute inset-0" /> : null}
    </div>
  );
}
