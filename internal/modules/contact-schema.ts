import { z } from "zod";
import { serviceOptions } from "@/content/home";

const optionalText = (max: number) => z.string().trim().max(max, `${max} caractères maximum`).optional().or(z.literal(""));

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Merci d'indiquer votre nom complet")
    .max(100, "100 caractères maximum"),
  company: optionalText(120),
  email: z
    .string()
    .trim()
    .min(1, "Merci d'indiquer votre e-mail")
    .max(160, "160 caractères maximum")
    .pipe(z.email("Adresse e-mail invalide")),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s().-]{7,19}$/, "Numéro de téléphone invalide")
    .optional()
    .or(z.literal("")),
  service: z.enum(serviceOptions).optional().or(z.literal("")),
  message: optionalText(2000),
  /** Champ piège invisible : doit rester vide (anti-spam). */
  website: z.string().max(300).optional().or(z.literal("")),
});

export type ContactInput = z.input<typeof contactSchema>;
