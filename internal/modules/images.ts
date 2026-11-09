/**
 * Toutes les images du site sont centralisées ici.
 * Les photos du catalogue 2026 sont dans /public/images/activites.
 */
export type SiteImage = {
  src: string;
  alt: string;
};

const unsplash = (id: string, w = 1920) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const local = (file: string) => `/images/activites/${file}.jpg`;

export const images = {
  hero: {
    src: local("karaoke"),
    alt: "Scène de karaoké animée lors d'une soirée d'entreprise Houd-Li",
  },
  about: {
    src: local("lets-dance"),
    alt: "Équipes réunies sur la piste lors d'un atelier Let's Dance",
  },
  univers: {
    evenementiel: {
      src: local("entreprise-got-talent"),
      alt: "Collaborateurs sur scène lors d'une soirée Entreprise Got Talent",
    },
    "team-building": {
      src: local("olympiades"),
      alt: "Course d'équipes lors d'olympiades organisées par Houd-Li",
    },
    communication: {
      src: unsplash("1492691527719-9d1e07e534b4"),
      alt: "Réalisateur et cadreur en train de filmer un événement",
    },
    "lumiere-sono": {
      src: unsplash("1501281668745-f7f57925c3b4"),
      alt: "Scène de concert baignée de lumières bleues",
    },
    print: {
      src: unsplash("1542744173-8e7e53415bb0"),
      alt: "Équipe créative autour d'un projet de communication",
    },
    "realisation-stands": {
      src: unsplash("1561489396-888724a1543d"),
      alt: "Espace d'exposition moderne lors d'un salon professionnel",
    },
  },
  universGallery: {
    evenementiel: [
      { src: local("karaoke"), alt: "Karaoké sur scène lors d'un événement corporate" },
      { src: local("live-band"), alt: "Concert live band sous une tente de soirée" },
      { src: local("entreprise-got-talent"), alt: "Spectacle de talents lors d'une soirée d'entreprise" },
    ],
    "team-building": [
      { src: local("la-fresque-geante"), alt: "Atelier fresque géante en extérieur" },
      { src: local("master-chef"), alt: "Atelier culinaire Master Chef" },
      { src: local("randonnee-pedestre"), alt: "Randonnée pédestre d'équipe au Maroc" },
    ],
    communication: [
      { src: unsplash("1492691527719-9d1e07e534b4", 1200), alt: "Tournage d'un film d'événement" },
      { src: unsplash("1551836022-d5d88e9218df", 1200), alt: "Séance photo professionnelle" },
      { src: unsplash("1556761175-4b46a572b786", 1200), alt: "Équipe de communication en réunion" },
    ],
    "lumiere-sono": [
      { src: unsplash("1501281668745-f7f57925c3b4", 1200), alt: "Régie lumière sur une scène" },
      { src: unsplash("1470229722913-7c0e2dbbafd3", 1200), alt: "Concert sous des projecteurs" },
      { src: unsplash("1514525253161-7a46d19cd819", 1200), alt: "Public lors d'un spectacle éclairé" },
    ],
    print: [
      { src: unsplash("1542744173-8e7e53415bb0", 1200), alt: "Atelier de création graphique" },
      { src: unsplash("1586281380349-632531db7ed4", 1200), alt: "Supports print et documents de travail" },
      { src: unsplash("1450101499163-c8848c66ca85", 1200), alt: "Impression et finitions de supports" },
    ],
    "realisation-stands": [
      { src: unsplash("1561489396-888724a1543d", 1200), alt: "Stand d'exposition lors d'un salon" },
      { src: unsplash("1600508774634-4e11d34730e2", 1200), alt: "Espace d'accueil au mobilier sur mesure" },
      { src: unsplash("1497366216548-37526070297c", 1200), alt: "Espace épuré prêt à accueillir les visiteurs" },
    ],
  },
  why: [
    { src: local("lets-dance"), alt: "Piste de danse lors d'un team building Houd-Li" },
    { src: local("la-fresque-geante"), alt: "Fresque collective réalisée en équipe" },
    { src: local("rallye-berbere-challenge"), alt: "Cercle autour du feu lors d'une expérience immersive" },
  ],
  cta: {
    src: local("logo-humain"),
    alt: "Collaborateurs formant le logo Houd-Li dans le désert",
  },
  og: {
    src: local("lets-dance"),
    alt: "Houd-Li — agence événementielle à Casablanca",
  },
} as const;

export type GalleryCategory = "Team Building" | "Événementiel" | "Communication" | "Stands";

export type GalleryItem = SiteImage & {
  id: string;
  category: GalleryCategory;
  ratio: "portrait" | "landscape" | "square";
};
