"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: ReactNode;
  /** Durée d'un cycle complet, en secondes. */
  duration?: number;
  className?: string;
  trackClassName?: string;
  reverse?: boolean;
  label?: string;
};

/** Bandeau défilant infini qui ralentit au survol. */
export function Marquee({ children, duration = 40, className, trackClassName, reverse = false, label }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      tweenRef.current = gsap.fromTo(
        el,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration, ease: "none", repeat: -1 },
      );
      return () => {
        tweenRef.current?.kill();
        tweenRef.current = null;
      };
    });
    return () => mm.revert();
  }, [duration, reverse]);

  const setSpeed = (timeScale: number) => {
    if (tweenRef.current) gsap.to(tweenRef.current, { timeScale, duration: 0.6, ease: "power2.out" });
  };

  return (
    <div
      className={cn("relative overflow-x-clip [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]", className)}
      onMouseEnter={() => setSpeed(0.2)}
      onMouseLeave={() => setSpeed(1)}
      role={label ? "region" : undefined}
      aria-label={label}
    >
      <div ref={trackRef} className={cn("flex w-max will-change-transform", trackClassName)}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
