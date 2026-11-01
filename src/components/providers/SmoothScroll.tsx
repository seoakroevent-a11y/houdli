"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ScrollApi = {
  scrollTo: (target: string | number, opts?: { offset?: number; immediate?: boolean }) => void;
  lock: (locked: boolean) => void;
};

const ScrollContext = createContext<ScrollApi>({
  scrollTo: () => {},
  lock: () => {},
});

export const useSmoothScroll = () => useContext(ScrollContext);

const HEADER_OFFSET = -84;

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const [api] = useState<ScrollApi>(() => ({
    scrollTo: (target, opts) => {
      const offset = opts?.offset ?? HEADER_OFFSET;
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.start();
        document.documentElement.style.overflow = "";
        lenis.scrollTo(target, { offset, immediate: opts?.immediate, duration: 1.2, force: true });
        return;
      }
      if (typeof target === "number") {
        window.scrollTo({ top: target });
        return;
      }
      const el = document.querySelector(target);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset });
    },
    lock: (locked) => {
      const lenis = lenisRef.current;
      if (locked) lenis?.stop();
      else lenis?.start();
      document.documentElement.style.overflow = locked ? "hidden" : "";
    },
  }));

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = window.setTimeout(() => api.scrollTo(hash), 120);
      return () => window.clearTimeout(id);
    }
    lenisRef.current?.scrollTo(0, { immediate: true });
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => window.clearTimeout(refresh);
  }, [pathname, api]);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
