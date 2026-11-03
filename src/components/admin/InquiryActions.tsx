import { FileSignature, Receipt, UserPlus } from "lucide-react";
import { clientFromInquiry } from "@/lib/admin/crm";
import { cn } from "@/lib/utils";
import { ghostButton } from "./styles";

const actions = [
  { next: "crm", label: "Envoyer au CRM", icon: UserPlus },
  { next: "quote", label: "Créer un devis", icon: FileSignature },
  { next: "invoice", label: "Créer une facture", icon: Receipt },
] as const;

/** Chaque bouton crée (ou retrouve) la fiche CRM de la demande, puis ouvre la fiche, le devis ou la facture. */
export function InquiryActions({ id, className }: { id: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action) => (
        <form key={action.next} action={clientFromInquiry}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="next" value={action.next} />
          <button className={cn(ghostButton, "gap-1.5")}>
            <action.icon size={13} aria-hidden="true" />
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}
