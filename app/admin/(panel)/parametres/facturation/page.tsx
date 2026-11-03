import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { PageHeader } from "@/components/admin/PageHeader";
import { fieldClass, ghostButton, labelClass, primaryButton } from "@/components/admin/styles";
import { tvaRates } from "@/lib/admin/billing";
import { saveBillingSettings } from "@/lib/admin/documents";
import { createServerSupabase } from "@/lib/supabase/server";

export const instant = false;

const identity = [
  { name: "legal_name", label: "Raison sociale", placeholder: "Ex. HOUDLI SARL" },
  { name: "phone", label: "Téléphone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "city", label: "Ville" },
] as const;

const legal = [
  { name: "ice", label: "ICE" },
  { name: "rc", label: "RC" },
  { name: "if_number", label: "IF (identifiant fiscal)" },
  { name: "patente", label: "Patente / TP" },
  { name: "cnss", label: "CNSS" },
] as const;

export default async function FacturationPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const { data, error } = supabase ? await supabase.from("billing_settings").select("*").eq("id", 1).maybeSingle() : { data: null, error: null };
  const value = (key: string) => (data?.[key] as string | null) ?? "";

  return (
    <>
      <PageHeader
        title="Facturation"
        text="Ces informations sont imprimées en en-tête et en pied de page des devis et factures. Elles restent privées : le site public ne les lit pas."
      />
      <Flash
        ok={query.ok}
        error={query.error ?? (error ? "La table n'existe pas encore : exécutez supabase/crm-devis-factures.sql dans l'éditeur SQL de Supabase." : undefined)}
      />
      <form action={saveBillingSettings} className="grid max-w-3xl gap-8">
        <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] sm:col-span-2">Société</h2>
          {identity.map((item) => (
            <div key={item.name}>
              <label className={labelClass} htmlFor={item.name}>
                {item.label}
              </label>
              <input
                id={item.name}
                name={item.name}
                type={"type" in item ? item.type : "text"}
                placeholder={"placeholder" in item ? item.placeholder : undefined}
                defaultValue={value(item.name)}
                className={fieldClass}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="address">
              Adresse
            </label>
            <input id="address" name="address" defaultValue={value("address")} className={fieldClass} />
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] sm:col-span-2">Identifiants légaux</h2>
          {legal.map((item) => (
            <div key={item.name}>
              <label className={labelClass} htmlFor={item.name}>
                {item.label}
              </label>
              <input id={item.name} name={item.name} defaultValue={value(item.name)} className={fieldClass} />
            </div>
          ))}
          <div>
            <label className={labelClass} htmlFor="default_tva">
              TVA par défaut
            </label>
            <select id="default_tva" name="default_tva" defaultValue={String(Number(data?.default_tva ?? 20))} className={fieldClass}>
              {tvaRates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate} %
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] sm:col-span-2">Banque</h2>
          <div>
            <label className={labelClass} htmlFor="bank_name">
              Banque
            </label>
            <input id="bank_name" name="bank_name" defaultValue={value("bank_name")} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="rib">
              RIB (24 chiffres)
            </label>
            <input id="rib" name="rib" defaultValue={value("rib")} className={fieldClass} />
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">Conditions par défaut</h2>
          <div>
            <label className={labelClass} htmlFor="quote_terms">
              Devis
            </label>
            <textarea id="quote_terms" name="quote_terms" rows={4} defaultValue={value("quote_terms")} placeholder="Ex. Devis valable 30 jours. Acompte à la commande." className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="invoice_terms">
              Factures
            </label>
            <textarea id="invoice_terms" name="invoice_terms" rows={4} defaultValue={value("invoice_terms")} placeholder="Ex. Paiement par virement à 30 jours." className={fieldClass} />
          </div>
        </section>

        <div className="flex gap-3">
          <button className={primaryButton}>Enregistrer</button>
          <Link href="/admin/devis" className={ghostButton}>
            Aller aux devis
          </Link>
        </div>
      </form>
    </>
  );
}
