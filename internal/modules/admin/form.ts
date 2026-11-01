import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid } from "@/lib/admin/format";
import { createServerSupabase } from "@/lib/supabase/server";

const removal = {
  f: { path: "/admin/faq", invalid: "Question invalide.", failed: "Impossible de supprimer la question.", refreshPaths: ["/", "/admin/faq"] },
  l: { path: "/admin/references", invalid: "Logo invalide.", failed: "Impossible de supprimer le logo.", refreshPaths: ["/", "/admin/references"] },
  g: { path: "/admin/galerie", invalid: "Photo invalide.", failed: "Impossible de supprimer la photo.", refreshPaths: ["/galerie", "/admin/galerie"] },
  p: { path: "/admin/blog", invalid: "Article invalide.", failed: "Impossible de supprimer l'article.", refreshPaths: ["/blog", "/admin/blog", "/sitemap.xml"] },
  i: { path: "/admin/demandes", invalid: "Demande invalide.", failed: "Impossible de supprimer la demande.", refreshPaths: ["/admin", "/admin/demandes"] },
} as const;

type RemovalKind = keyof typeof removal;

export async function drop(formData: FormData, kind: RemovalKind) {
  const spec = removal[kind];
  const id = field(formData, "id", 40);
  if (!isUuid(id)) fail(spec.path, spec.invalid);
  const supabase = await db();
  const query =
    kind === "f"
      ? supabase.from("faqs").delete().eq("id", id)
      : kind === "l"
        ? supabase.from("client_logos").delete().eq("id", id)
        : kind === "g"
          ? supabase.from("gallery_items").delete().eq("id", id)
          : kind === "p"
            ? supabase.from("posts").delete().eq("id", id)
            : supabase.from("inquiries").delete().eq("id", id);
  const { error } = await query;
  if (error) fail(spec.path, spec.failed);
  refresh([...spec.refreshPaths]);
  redirect(`${spec.path}?ok=1`);
}

export async function db() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin/login?error=forbidden");
  return supabase;
}

export function field(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export function published(formData: FormData) {
  return formData.get("published") === "on";
}

export function order(formData: FormData) {
  const value = Number(formData.get("sort_order") ?? 0);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(9999, Math.round(value)));
}

export function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export function refresh(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}
