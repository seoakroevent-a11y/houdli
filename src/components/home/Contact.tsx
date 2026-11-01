"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { contactSection } from "@/content/home";
import { usePublicSettings } from "@/components/providers/PublicSettings";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { FacebookIcon, InstagramIcon, LinkedinIcon, WhatsappIcon } from "@/components/icons/Brand";
import { ContactForm } from "./ContactForm";

export function Contact() {
  const settings = usePublicSettings();
  const channels = [
    { label: "Téléphone", value: settings.phoneDisplay, href: settings.phoneHref, Icon: Phone },
    { label: "E-mail", value: settings.email, href: `mailto:${settings.email}`, Icon: Mail },
    { label: "WhatsApp", value: "Réponse rapide", href: `https://wa.me/${settings.whatsapp}`, Icon: WhatsappIcon },
  ];
  const socials = [
    { label: "Instagram", href: settings.instagram, Icon: InstagramIcon },
    { label: "LinkedIn", href: settings.linkedin, Icon: LinkedinIcon },
    { label: "Facebook", href: settings.facebook, Icon: FacebookIcon },
  ];

  return (
    <Section id="contact" labelledBy="contact-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] lg:gap-16">
        <div>
          <SectionHeading id="contact-title" eyebrow={contactSection.eyebrow} title={contactSection.title} accent={contactSection.accent} text={contactSection.text} />

          <Reveal delay={0.2} className="mt-10 space-y-3">
            {channels.map(({ label, value, href, Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 rounded-[18px] border border-line bg-card p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-text transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</span>
                  <span className="mt-0.5 block truncate font-medium text-fg">{value}</span>
                </span>
              </a>
            ))}
            <div className="flex items-center gap-4 rounded-[18px] border border-line bg-card p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-text">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-medium uppercase tracking-[0.18em] text-muted">Zone d&apos;intervention</span>
                <span className="mt-0.5 block font-medium text-fg">{settings.area}</span>
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.3} className="mt-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Suivez-nous {settings.handle}</p>
            <ul className="mt-3 flex gap-2">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent-text"
                  >
                    <Icon size={17} />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="surface-card relative p-5 sm:p-8 lg:p-10">
          <ContactForm />
        </Reveal>
      </div>
    </Section>
  );
}
