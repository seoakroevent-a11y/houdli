import Link from "next/link";
import { CountedField } from "@/components/admin/CountedField";
import { Flash } from "@/components/admin/Flash";
import { ImageField } from "@/components/admin/ImageField";
import { PageHeader } from "@/components/admin/PageHeader";
import { fieldClass, ghostButton, labelClass, primaryButton } from "@/components/admin/styles";
import { saveSettings } from "@/lib/admin/settings";
import { defaultLlms } from "@/lib/public-data";
import { site } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const { data } = supabase ? await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle() : { data: null };

  return (
    <>
      <PageHeader
        title="Paramètres"
        text="Coordonnées, réseaux, SEO et GEO. Les champs vides laissent les valeurs actuelles du site."
      />
      <Flash ok={query.ok} error={query.error} />
      <Link href="/admin/parametres/facturation" className={cn(ghostButton, "mb-6")}>
        Mentions légales des devis et factures (ICE, RC, IF, RIB) →
      </Link>
      <form action={saveSettings} className="grid max-w-3xl gap-8">
        <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">Contact</h2>
          <div>
            <label className={labelClass} htmlFor="phone_display">
              Téléphone affiché
            </label>
            <input id="phone_display" name="phone_display" defaultValue={data?.phone_display ?? site.contact.phoneDisplay} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="whatsapp_phone">
              WhatsApp (indicatif, sans +)
            </label>
            <input id="whatsapp_phone" name="whatsapp_phone" defaultValue={data?.whatsapp_phone ?? site.contact.whatsapp} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" defaultValue={data?.email ?? site.contact.email} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="instagram_url">
              Instagram
            </label>
            <input id="instagram_url" name="instagram_url" defaultValue={data?.instagram_url ?? site.social.instagram} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="linkedin_url">
              LinkedIn
            </label>
            <input id="linkedin_url" name="linkedin_url" defaultValue={data?.linkedin_url ?? site.social.linkedin} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="facebook_url">
              Facebook
            </label>
            <input id="facebook_url" name="facebook_url" defaultValue={data?.facebook_url ?? site.social.facebook} className={fieldClass} />
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">SEO & GEO</h2>
          <CountedField name="seo_title" label="Titre SEO" defaultValue={data?.seo_title ?? ""} recommended={70} rows={1} />
          <CountedField name="seo_description" label="Description" defaultValue={data?.seo_description ?? ""} recommended={170} rows={4} />
          <div>
            <label className={labelClass} htmlFor="seo_keywords">
              Mots-clés (séparés par des virgules)
            </label>
            <input id="seo_keywords" name="seo_keywords" defaultValue={data?.seo_keywords ?? ""} className={fieldClass} />
          </div>
          <ImageField name="og_image_url" label="Image Open Graph" defaultValue={data?.og_image_url ?? ""} hint="1200 × 630 recommandé." />
          <div>
            <label className={labelClass} htmlFor="geo_summary">
              Résumé GEO
            </label>
            <textarea id="geo_summary" name="geo_summary" rows={4} defaultValue={data?.geo_summary ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="geo_service_area">
              Zone d&apos;intervention
            </label>
            <input id="geo_service_area" name="geo_service_area" defaultValue={data?.geo_service_area ?? site.contact.area} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="geo_llms_txt">
              llms.txt
            </label>
            <textarea id="geo_llms_txt" name="geo_llms_txt" rows={10} defaultValue={data?.geo_llms_txt ?? defaultLlms()} className={fieldClass} />
          </div>
          <button className={primaryButton}>Enregistrer SEO & GEO</button>
        </section>
      </form>
    </>
  );
}
