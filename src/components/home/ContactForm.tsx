"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, ChevronDown, Loader2 } from "lucide-react";
import { contactSchema, type ContactInput } from "@/lib/contact-schema";
import { registerContactBridge, type ContactDraft } from "@/lib/contact-bridge";
import { serviceOptions } from "@/content/home";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const fieldBase =
  "peer block w-full rounded-2xl border bg-bg px-4 pb-2.5 pt-6 text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] duration-300 placeholder-transparent focus:border-accent focus:shadow-[0_0_0_4px_rgba(45,102,210,0.15)]";

const labelBase =
  "pointer-events-none absolute left-4 top-2 text-xs font-medium text-muted transition-all duration-200 peer-placeholder-shown:top-[1.05rem] peer-placeholder-shown:text-[0.95rem] peer-focus:top-2 peer-focus:text-xs peer-focus:text-accent-text";

const DEFAULT_ERROR = "Une erreur est survenue. Réessayez ou écrivez-nous directement par e-mail.";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: FieldError;
  valid?: boolean;
  children: ReactNode;
  className?: string;
};

function Field({ id, label, required, error, valid, children, className }: FieldProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <label htmlFor={id} className={labelBase}>
        {label}
        {required ? <span className="text-accent-text"> *</span> : null}
      </label>
      <AnimatePresence>
        {valid && !error ? (
          <motion.span
            key="ok"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="pointer-events-none absolute right-4 top-[1.1rem] text-accent-text"
            aria-hidden="true"
          >
            <Check size={16} />
          </motion.span>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {error ? (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 flex items-center gap-1.5 pl-1 text-xs font-medium text-red-600 dark:text-red-400"
          >
            <AlertCircle size={13} aria-hidden="true" />
            {error.message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: ease.out }}
      className="flex min-h-[460px] flex-col items-center justify-center text-center"
      role="status"
    >
      <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="#2D66D2"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: ease.inOut }}
        />
        <motion.path
          d="M25 41 L36 52 L56 30"
          fill="none"
          stroke="#2D66D2"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.55, ease: ease.out }}
        />
      </svg>
      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-2xl font-bold text-fg"
      >
        Message envoyé !
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-3 max-w-sm text-muted"
      >
        Merci pour votre demande. Notre équipe revient vers vous sous 24h avec une proposition personnalisée.
      </motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }} className="mt-8">
        <Button variant="outline" onClick={onReset}>
          Envoyer une autre demande
        </Button>
      </motion.div>
    </motion.div>
  );
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState(DEFAULT_ERROR);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    trigger,
    getFieldState,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name: "", company: "", email: "", phone: "", service: "", message: "", website: "" },
  });

  const service = useWatch({ control, name: "service" });

  const send = async (data: ContactInput): Promise<string | null> => {
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const payload: { error?: string } | null = await res.json().catch(() => null);
        const message = payload?.error || DEFAULT_ERROR;
        setErrorText(message);
        setStatus("error");
        return message;
      }
      setStatus("success");
      reset();
      return null;
    } catch {
      setErrorText(DEFAULT_ERROR);
      setStatus("error");
      return DEFAULT_ERROR;
    }
  };

  const onSubmit = async (data: ContactInput) => {
    await send(data);
  };

  const bridge = useRef({ setValue, trigger, getFieldState, handleSubmit, send });
  useEffect(() => {
    bridge.current = { setValue, trigger, getFieldState, handleSubmit, send };
  });

  useEffect(
    () =>
      registerContactBridge({
        async fill(draft: ContactDraft) {
          const form = bridge.current;
          setStatus("idle");
          const filled: (keyof ContactDraft)[] = [];
          const problems: Record<string, string> = {};
          for (const [key, raw] of Object.entries(draft) as [keyof ContactDraft, string | undefined][]) {
            const value = raw?.trim();
            if (!value) continue;
            if (key === "service") {
              const option = serviceOptions.find((item) => item.toLowerCase() === value.toLowerCase());
              if (!option) {
                problems.service = `Service inconnu. Choix possibles : ${serviceOptions.join(", ")}.`;
                continue;
              }
              form.setValue("service", option, { shouldDirty: true, shouldTouch: true });
            } else {
              form.setValue(key, value, { shouldDirty: true, shouldTouch: true });
            }
            filled.push(key);
          }
          if (filled.length) await form.trigger(filled);
          for (const key of filled) {
            const message = form.getFieldState(key).error?.message;
            if (message) problems[key] = message;
          }
          return problems;
        },
        submit: () =>
          new Promise<string | null>((resolve) => {
            const form = bridge.current;
            void form.handleSubmit(
              async (data) => resolve(await form.send(data)),
              (invalid) =>
                resolve(
                  Object.entries(invalid)
                    .map(([key, error]) => `${key} : ${error?.message ?? "invalide"}`)
                    .join(" ; "),
                ),
            )();
          }),
      }),
    [],
  );

  const aria = (name: keyof ContactInput) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `cf-${name}-error` : undefined,
  });

  const fieldState = (name: keyof ContactInput) =>
    cn(fieldBase, errors[name] ? "border-red-500/70" : "border-line hover:border-fg/20");

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <SuccessState onReset={() => setStatus("idle")} />
      ) : (
        <motion.form
          key="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          className="grid gap-4 sm:grid-cols-2"
          aria-label="Formulaire de demande de devis"
        >
          <Field id="cf-name" label="Nom complet" required error={errors.name} valid={dirtyFields.name}>
            <input id="cf-name" type="text" autoComplete="name" placeholder="Nom complet" className={fieldState("name")} {...aria("name")} aria-required="true" {...register("name")} />
          </Field>
          <Field id="cf-company" label="Entreprise" error={errors.company}>
            <input id="cf-company" type="text" autoComplete="organization" placeholder="Entreprise" className={fieldState("company")} {...aria("company")} {...register("company")} />
          </Field>
          <Field id="cf-email" label="E-mail" required error={errors.email} valid={dirtyFields.email}>
            <input id="cf-email" type="email" autoComplete="email" inputMode="email" placeholder="E-mail" className={fieldState("email")} {...aria("email")} aria-required="true" {...register("email")} />
          </Field>
          <Field id="cf-phone" label="Téléphone" error={errors.phone}>
            <input id="cf-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="Téléphone" className={fieldState("phone")} {...aria("phone")} {...register("phone")} />
          </Field>

          <div className="relative sm:col-span-2">
            <select
              id="cf-service"
              className={cn(fieldState("service"), "appearance-none pr-10", !service && "text-muted")}
              {...register("service")}
            >
              <option value="">Sélectionnez un service</option>
              {serviceOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <label htmlFor="cf-service" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-muted">
              Service souhaité
            </label>
            <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          </div>

          <Field id="cf-message" label="Votre message" error={errors.message} className="sm:col-span-2">
            <textarea id="cf-message" rows={5} placeholder="Votre message" className={cn(fieldState("message"), "resize-none")} {...aria("message")} {...register("message")} />
          </Field>

          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="cf-website">Site web</label>
            <input id="cf-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
          </div>

          <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              <span className="text-accent-text">*</span> Champs obligatoires
            </p>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  Envoyer ma demande
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </Button>
          </div>

          {status === "error" ? (
            <p role="alert" className="text-sm font-medium text-red-600 sm:col-span-2 dark:text-red-400">
              {errorText}
            </p>
          ) : null}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
