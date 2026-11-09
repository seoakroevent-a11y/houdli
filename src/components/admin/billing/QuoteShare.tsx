"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Mail } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/Brand";
import { fieldClass, ghostButton, whatsappButton } from "@/components/admin/styles";
import { cn } from "@/lib/utils";

type Props = { url: string; number: string; whatsapp: string | null; email: string | null; firstName: string };

export function QuoteShare({ url, number, whatsapp, email, firstName }: Props) {
  const [copied, setCopied] = useState(false);
  const message = `Bonjour ${firstName}, voici votre devis ${number} de Houd-Li. Vous pouvez le consulter et l'accepter en ligne : ${url}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input readOnly value={url} aria-label="Lien du devis" onFocus={(event) => event.currentTarget.select()} className={cn(fieldClass, "min-w-0 flex-1 basis-72 text-xs")} />
      <button
        type="button"
        className={cn(ghostButton, "gap-1.5")}
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
        {copied ? "Copié" : "Copier"}
      </button>
      {whatsapp ? (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={whatsappButton}>
          <WhatsappIcon size={14} />
          WhatsApp
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}?subject=${encodeURIComponent(`Votre devis ${number} — Houd-Li`)}&body=${encodeURIComponent(message)}`} className={cn(ghostButton, "gap-1.5")}>
          <Mail size={13} aria-hidden="true" />
          E-mail
        </a>
      ) : null}
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn(ghostButton, "gap-1.5")}>
        <ExternalLink size={13} aria-hidden="true" />
        Voir comme le client
      </a>
    </div>
  );
}
