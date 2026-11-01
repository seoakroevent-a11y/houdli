/**
 * Configuration unique du site : coordonnées, réseaux et chiffres clés.
 * Modifiez ces valeurs pour mettre à jour l'ensemble du site.
 */
export const site = {
  name: "Houdli",
  slogan: "De l'idée à l'impact",
  url: "https://www.houdli.ma",
  description:
    "Agence événementielle à Casablanca depuis 2018 : événements, team building, communication, lumière & sono, print et stands. Un seul interlocuteur au Maroc.",
  locale: "fr_MA",
  contact: {
    email: "contact@houdli.ma",
    phoneDisplay: "06 61 68 59 01",
    phoneHref: "tel:+212661685901",
    whatsapp: "212661685901",
    whatsappMessage: "Bonjour Houdli, je souhaite échanger sur un projet événementiel.",
    city: "Casablanca",
    country: "MA",
    area: "Casablanca — tout le Maroc",
    areaDetail: "Casablanca, Maroc — intervention partout dans le Royaume.",
  },
  social: {
    instagram: "https://www.instagram.com/houdli",
    facebook: "https://www.facebook.com/houdli",
    linkedin: "https://www.linkedin.com/company/houdli",
    handle: "@houdli",
  },
} as const;

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

export const stats: Stat[] = [
  { value: 600, prefix: "+", label: "Événements réalisés" },
  { value: 30, prefix: "+", label: "Marques de référence" },
  { value: 8, label: "Ans d'expérience" },
  { value: 6, label: "Métiers réunis" },
  { value: 30, label: "Activités au catalogue" },
];

export const yearsOfExperience = 8;
export const foundedYear = 2018;

export const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/#apropos", label: "À propos" },
  { href: "/#services", label: "Services" },
  { href: "/activites", label: "Activités" },
  { href: "/blog", label: "Blog" },
  { href: "/#references", label: "Références" },
  { href: "/galerie", label: "Galerie" },
] as const;

export function visibleNavLinks(hasGallery: boolean) {
  return hasGallery ? navLinks : navLinks.filter((link) => link.href !== "/galerie");
}
