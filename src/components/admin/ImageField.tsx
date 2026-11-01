"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { fieldClass, labelClass } from "./styles";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export function ImageField({
  name,
  label,
  defaultValue = "",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    const ext = EXTENSIONS[file.type];
    if (!ext) {
      setStatus("error");
      setMessage("Format refusé : PNG, JPG ou WEBP uniquement.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setMessage("Image trop lourde : 5 Mo maximum.");
      return;
    }
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setStatus("error");
      setMessage("Supabase n'est pas configuré. Collez une URL à la place.");
      return;
    }
    setStatus("loading");
    setMessage("");
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setUrl(data.publicUrl);
    setStatus("idle");
  }

  return (
    <div>
      <label className={labelClass} htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} value={url} onChange={(event) => setUrl(event.target.value)} className={fieldClass} placeholder="https://… ou /images/…" />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="mt-2 block w-full text-xs text-white/60 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:text-white"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {hint ? <p className="mt-1.5 text-xs text-white/40">{hint}</p> : null}
      {status === "loading" ? <p className="mt-1.5 text-xs text-white/60">Envoi en cours…</p> : null}
      {status === "error" ? <p className="mt-1.5 text-xs text-red-200">{message}</p> : null}
      {url ? <img src={url} alt="" className="mt-3 h-16 w-auto max-w-full rounded-md bg-white object-contain p-2" /> : null}
    </div>
  );
}
