"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { site, visibleNavLinks } from "@/lib/site";
import { usePublicSettings } from "@/components/providers/PublicSettings";
import { universList } from "@/content/univers";
import { Logo } from "./Logo";
import { SmartLink } from "@/components/ui/SmartLink";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "@/components/icons/Brand";
import { CurrentYear } from "./CurrentYear";

const linkClass =
  "text-sm text-muted transition-colors hover:text-fg focus-visible:text-fg";

export function Footer() {
  const settings = usePublicSettings();
  const socials = [
    { label: "Instagram", href: settings.instagram, Icon: InstagramIcon },
    { label: "LinkedIn", href: settings.linkedin, Icon: LinkedinIcon },
    { label: "Facebook", href: settings.facebook, Icon: FacebookIcon },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg-alt">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="container-x grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
        <div>
          <SmartLink href="/" aria-label="Houd-Li — Accueil" className="inline-block rounded-md">
            <Logo height={64} eager />
          </SmartLink>
          <p className="eyebrow mt-6">{site.slogan}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Agence événementielle à Casablanca depuis 2018 — six métiers, un seul interlocuteur, du concept au démontage.
          </p>
          <ul className="mt-6 flex gap-2" aria-label="Réseaux sociaux">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (${settings.handle})`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent-text"
                >
                  <Icon size={17} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Services">
          <p className="font-display text-sm font-semibold text-fg">Services</p>
          <ul className="mt-5 space-y-3">
            {universList.map((u) => (
              <li key={u.slug}>
                <SmartLink href={`/univers/${u.slug}`} className={linkClass}>
                  {u.title}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Pages">
          <p className="font-display text-sm font-semibold text-fg">Pages</p>
          <ul className="mt-5 space-y-3">
            {visibleNavLinks(settings.hasGallery).map((l) => (
              <li key={l.href}>
                <SmartLink href={l.href} className={linkClass}>
                  {l.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-display text-sm font-semibold text-fg">Coordonnées</p>
          <address className="mt-5 space-y-4 not-italic">
            <a href={`mailto:${settings.email}`} className={`${linkClass} flex items-start gap-3`}>
              <Mail size={16} className="mt-0.5 shrink-0 text-accent-text" aria-hidden="true" />
              {settings.email}
            </a>
            <a href={settings.phoneHref} className={`${linkClass} flex items-start gap-3`}>
              <Phone size={16} className="mt-0.5 shrink-0 text-accent-text" aria-hidden="true" />
              {settings.phoneDisplay}
            </a>
            <p className="flex items-start gap-3 text-sm leading-relaxed text-muted">
              <MapPin size={16} className="mt-0.5 shrink-0 text-accent-text" aria-hidden="true" />
              {settings.areaDetail}
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center gap-3 py-6 text-center text-xs text-muted">
          <p>
            © <CurrentYear /> Houd-Li. Tous droits réservés.
          </p>
          <a
            href="https://www.vsnstudios.ma/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
          >
            Designed by VSNSTUDIOS
          </a>
        </div>
      </div>
    </footer>
  );
}
