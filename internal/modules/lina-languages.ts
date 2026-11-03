export const linaLanguages = {
  fr: { label: "Français", speech: "fr-FR", greeting: "Bonjour, je suis Lina de Houdli. Vous préparez un événement ou un team building ? Dites-moi tout." },
  ar: { label: "العربية", speech: "ar-MA", greeting: "مرحبا، أنا لينا من هودلي. واش كتوجدو لشي حدث ولا تيم بيلدينغ؟ أنا في الخدمة." },
  en: { label: "English", speech: "en-US", greeting: "Hello, I'm Lina from Houdli. Are you planning an event or a team building? Tell me about it." },
} as const;

export type LinaLanguage = keyof typeof linaLanguages;
