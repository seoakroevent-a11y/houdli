"use client";

import { useRef, type ReactNode } from "react";
import { Building2, Mail, Phone, X } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/Brand";
import type { InquiryStatus } from "@/lib/admin/inquiries";
import { InquiryActions } from "./InquiryActions";
import { InquiryStatusSelect } from "./InquiryStatusSelect";
import { ghostButton, whatsappButton } from "./styles";

export type InquiryView = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  service: string | null;
  message: string | null;
  status: InquiryStatus;
  spamReason: string | null;
  date: string;
  whatsappHref: string | null;
  mailHref: string;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/10 py-4">
      <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/45">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function InquiryDialog({ inquiry, back }: { inquiry: InquiryView; back: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = `inquiry-${inquiry.id}`;

  return (
    <>
      <button type="button" className={ghostButton} onClick={() => dialog.current?.showModal()}>
        Voir
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-white/10 bg-[#111111] p-0 text-white shadow-2xl backdrop:bg-black/75"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="max-h-[85dvh] overflow-y-auto px-6 pb-2 pt-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="font-display text-lg font-bold uppercase tracking-[0.08em]">
                {inquiry.name}
              </h2>
              <p className="mt-1 text-sm text-white/55">{inquiry.date}</p>
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => dialog.current?.close()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {inquiry.status === "spam" ? (
            <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-red-100">
              Classée indésirable par le filtre{inquiry.spamReason ? ` : ${inquiry.spamReason}` : ""}. Si c&apos;est un vrai client,
              repassez-la en « Nouveau ».
            </p>
          ) : null}

          <ul className="mt-5 space-y-2.5 text-sm">
            <li className="flex items-center gap-3">
              <Mail size={15} aria-hidden="true" className="text-[#4A82EA]" />
              <a href={inquiry.mailHref} className="break-all text-white/85 hover:text-white">
                {inquiry.email}
              </a>
            </li>
            {inquiry.phone ? (
              <li className="flex items-center gap-3">
                <Phone size={15} aria-hidden="true" className="text-[#4A82EA]" />
                <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`} className="text-white/85 hover:text-white">
                  {inquiry.phone}
                </a>
              </li>
            ) : null}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-3 pb-5">
            {inquiry.whatsappHref ? (
              <a href={inquiry.whatsappHref} target="_blank" rel="noopener noreferrer" className={`${whatsappButton} py-3`}>
                <WhatsappIcon size={15} />
                WhatsApp
              </a>
            ) : (
              <span className={`${ghostButton} cursor-not-allowed py-3 opacity-50`}>Pas de numéro</span>
            )}
            <a href={inquiry.mailHref} className={`${ghostButton} gap-2 py-3`}>
              <Mail size={15} aria-hidden="true" />
              Envoyer un e-mail
            </a>
          </div>

          {inquiry.company ? (
            <p className="flex items-center gap-3 border-t border-white/10 py-4 text-sm text-white/85">
              <Building2 size={15} aria-hidden="true" className="text-[#4A82EA]" />
              {inquiry.company}
            </p>
          ) : null}
          <Section title="Service">
            <p className="text-white/90">{inquiry.service || "Non précisé"}</p>
          </Section>
          <Section title="Message">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/75">{inquiry.message || "Aucun message."}</p>
          </Section>
          <Section title="Statut">
            <InquiryStatusSelect key={inquiry.status} id={inquiry.id} status={inquiry.status} back={back} />
          </Section>
          <Section title="Suite à donner">
            <InquiryActions id={inquiry.id} className="pb-3" />
          </Section>
        </div>
      </dialog>
    </>
  );
}
