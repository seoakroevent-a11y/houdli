"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { isUuid } from "@/lib/admin/format";
import { sendAlert } from "@/lib/mailer";
import { createAnonSupabase } from "@/lib/supabase/server";

/** Acceptation par le client : passe par la fonction SQL `accept_quote`, qui ne touche qu'au devis de ce lien. */
export async function acceptQuote(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!isUuid(token)) redirect("/");
  const page = `/devis/${token}`;
  if (name.length < 2 || formData.get("consent") !== "on") redirect(`${page}?erreur=champs`);

  const supabase = createAnonSupabase();
  if (!supabase) redirect(`${page}?erreur=indisponible`);
  const { data, error } = await supabase.rpc("accept_quote", { p_token: token, p_name: name });
  if (error) {
    console.error("[devis] Acceptation refusée :", error.code, error.message);
    redirect(`${page}?erreur=indisponible`);
  }
  if (data === "expired" || data === "closed" || data === "not_found") redirect(`${page}?erreur=${data}`);

  if (data === "accepted") {
    const { data: quote } = await supabase.rpc("public_quote", { p_token: token });
    after(() =>
      sendAlert({
        subject: `Devis ${quote?.number ?? ""} accepté en ligne`,
        rows: [
          ["Devis", quote?.number],
          ["Client", quote?.client?.company || quote?.client?.name],
          ["Objet", quote?.subject],
          ["Accepté par", name],
        ],
        link: { label: "Ouvrir les devis acceptés", path: "/admin/devis?statut=accepted" },
      }),
    );
    revalidatePath("/admin/devis");
    revalidatePath("/admin/crm");
    revalidatePath("/admin");
  }
  redirect(`${page}?accepte=1`);
}
