import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createServerSupabase } from "@/lib/supabase/server";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-white/50">Chargement…</p>}>
      <Authed>{children}</Authed>
    </Suspense>
  );
}

async function Authed({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin/login?error=forbidden");
  return <AdminShell email={user.email ?? ""}>{children}</AdminShell>;
}
