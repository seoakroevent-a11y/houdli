"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { visibleNavLinks } from "@/lib/site";
import { usePublicSettings } from "@/components/providers/PublicSettings";
import { ease } from "@/lib/motion";
import { useScrolledPast } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { SmartLink } from "@/components/ui/SmartLink";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { InstagramIcon, LinkedinIcon, FacebookIcon } from "@/components/icons/Brand";

const hasDarkHero = (pathname: string) =>
  pathname.startsWith("/univers/") || pathname.startsWith("/activites/");

export function Header() {
  const settings = usePublicSettings();
  const links = visibleNavLinks(settings.hasGallery);
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const { lock } = useSmoothScroll();

  useEffect(() => {
    lock(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuPath(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lock]);

  const onDark = hasDarkHero(pathname) && !scrolled && !open;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open
            ? "border-b border-line bg-bg/80 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-x flex h-[72px] items-center justify-between gap-6 lg:h-20">
          <SmartLink href="/" aria-label="Houdli — Accueil" className="relative z-10 shrink-0 rounded-md">
            <Logo height={54} tone={onDark ? "light" : "auto"} eager />
          </SmartLink>

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {links.map((link) => (
                <li key={link.href}>
                  <SmartLink
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "group/nav relative py-2 text-sm font-medium transition-colors",
                      onDark ? "text-white/80 hover:text-white" : "text-muted hover:text-fg",
                      isActive(link.href) && (onDark ? "text-white" : "text-fg"),
                    )}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-0 -bottom-0.5 h-[2px] origin-right scale-x-0 rounded-full bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/nav:origin-left group-hover/nav:scale-x-100",
                        isActive(link.href) && "scale-x-100",
                      )}
                    />
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-3">
            <ThemeToggle className={cn(onDark && "border-white/25 text-white hover:text-white")} />
            <div className="hidden sm:block">
              <Button href="/#contact" size="md">
                Contact
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setMenuPath(open ? null : pathname)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors lg:hidden",
                onDark ? "border-white/25 text-white" : "border-line text-fg",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="inline-flex"
                >
                  {open ? <X size={18} /> : <Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-40 flex flex-col bg-bg pt-[72px] lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 36px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 36px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 44px) 36px)" }}
            transition={{ duration: 0.7, ease: ease.inOut }}
          >
            <div aria-hidden="true" className="accent-glow pointer-events-none absolute -right-32 top-1/3 h-96 w-96" />
            <nav aria-label="Navigation mobile" className="container-x flex flex-1 flex-col justify-center">
              <motion.ul
                className="space-y-1"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}
              >
                {[...links, { href: "/#contact", label: "Contact" }].map((link, i) => (
                  <motion.li
                    key={link.href}
                    className="overflow-hidden"
                    variants={{
                      hidden: { y: "100%", opacity: 0 },
                      visible: { y: "0%", opacity: 1, transition: { duration: 0.6, ease: ease.expo } },
                    }}
                  >
                    <SmartLink
                      href={link.href}
                      onClick={() => setMenuPath(null)}
                      className="flex items-baseline gap-4 py-2 font-display text-[clamp(2rem,9vw,3rem)] font-semibold tracking-tight text-fg transition-colors hover:text-accent-text"
                    >
                      <span className="font-sans text-xs font-medium text-accent-text">0{i + 1}</span>
                      {link.label}
                    </SmartLink>
                  </motion.li>
                ))}
              </motion.ul>
            </nav>
            <motion.div
              className="container-x flex items-center justify-between border-t border-line py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6 } }}
            >
              <a href={`mailto:${settings.email}`} className="text-sm text-muted hover:text-fg">
                {settings.email}
              </a>
              <div className="flex gap-3 text-muted">
                <a href={settings.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="hover:text-accent-text"><InstagramIcon /></a>
                <a href={settings.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="hover:text-accent-text"><LinkedinIcon /></a>
                <a href={settings.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="hover:text-accent-text"><FacebookIcon /></a>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
