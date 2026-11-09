"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { fieldClass, labelClass, primaryButton } from "@/components/admin/styles";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") === "forbidden" ? "Ce compte n'a pas le rôle administrateur." : "");
  const [loading, setLoading] = useState(false);
  const configured = Boolean(supabaseEnv());

  function signInMessage(code?: string, status?: number) {
    if (code === "email_not_confirmed") return "Cet e-mail n'est pas encore confirmé : validez-le dans Supabase (Authentication → Users).";
    if (code === "over_request_rate_limit" || status === 429) return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
    if (code === "user_banned") return "Ce compte est suspendu.";
    if (code === "invalid_credentials") return "E-mail ou mot de passe incorrect.";
    if (status === 401 || status === 403) return "Connexion à Supabase refusée : vérifiez la clé publique du site.";
    return `Connexion impossible${code ? ` (${code})` : ""}. Réessayez dans un instant.`;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    setLoading(true);
    setError("");
    const { data, error: signError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signError || !data.user) {
      setLoading(false);
      setError(signInMessage(signError?.code, signError?.status));
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Ce compte n'a pas le rôle administrateur.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 sm:p-8">
        <Logo tone="light" height={48} eager />
        <h1 className="mt-6 font-display text-2xl font-bold uppercase tracking-[0.16em]">Administration</h1>
        <p className="mt-2 text-sm text-white/60">Connexion réservée à l&apos;équipe Houd-Li.</p>

        {configured ? null : (
          <p className="mt-6 rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
            Ajoutez <code className="text-white">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code className="text-white">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> dans <code className="text-white">.env.local</code>, puis
            relancez le serveur. Le modèle est dans <code className="text-white">.env.local.example</code>.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className={labelClass} htmlFor="email">
              E-mail
            </label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </div>
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <button type="submit" className={`${primaryButton} w-full`} disabled={!configured || loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
