"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { universList } from "@/content/univers";
import { images } from "@/lib/images";
import { ease } from "@/lib/motion";
import { SmartLink } from "@/components/ui/SmartLink";

const CLOSE_DELAY = 140;

/** Lien « Services » du menu : au survol ou au focus, affiche les six univers avant d'y aller. */
export function ServicesMenu({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenPath(pathname);
  };
  const hide = (delay = CLOSE_DELAY) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenPath(null), delay);
  };

  useEffect(() => () => void (closeTimer.current && clearTimeout(closeTimer.current)), []);

  return (
    <li
      className="relative"
      onMouseEnter={show}
      onMouseLeave={() => hide()}
      onFocus={show}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide(0);
      }}
      onKeyDown={(event) => event.key === "Escape" && hide(0)}
    >
      <SmartLink href={href} aria-expanded={open} aria-controls="services-menu" className={className}>
        {children}
      </SmartLink>

      <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-5">
        <AnimatePresence>
          {open ? (
            <motion.div
              id="services-menu"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.28, ease: ease.out }}
              className="origin-top"
            >
              <div className="w-[min(42rem,calc(100vw-3rem))] rounded-3xl border border-line bg-bg/95 p-3 shadow-[0_30px_80px_-30px_rgba(8,8,56,0.45)] backdrop-blur-xl">
                <ul className="grid grid-cols-2 gap-1">
                  {universList.map((univers, i) => {
                    const image = images.univers[univers.slug];
                    return (
                      <motion.li
                        key={univers.slug}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: ease.out, delay: 0.03 * i }}
                      >
                        <SmartLink
                          href={`/univers/${univers.slug}`}
                          onClick={() => hide(0)}
                          className="group/item flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-fg/[0.05] focus-visible:bg-fg/[0.05]"
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                            <Image
                              src={image.src}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover transition-transform duration-500 group-hover/item:scale-110"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-baseline gap-2 text-sm font-medium text-fg">
                              <span className="font-display text-[0.65rem] text-accent-text">{univers.index}</span>
                              {univers.title}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted">{univers.subtitle}</span>
                          </span>
                        </SmartLink>
                      </motion.li>
                    );
                  })}
                </ul>
                <SmartLink
                  href={href}
                  onClick={() => hide(0)}
                  className="group/all mt-2 flex items-center justify-between rounded-2xl border-t border-line px-3 pb-1 pt-3 text-sm font-medium text-fg"
                >
                  Voir tous nos services
                  <ArrowRight size={16} className="text-accent-text transition-transform group-hover/all:translate-x-1" />
                </SmartLink>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </li>
  );
}
