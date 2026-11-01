import { images } from "@/lib/images";

export type UniversSlug =
  | "evenementiel"
  | "team-building"
  | "communication"
  | "lumiere-sono"
  | "print"
  | "realisation-stands";

export type UniversCategory = {
  label: string;
  items: string[];
};

export type Univers = {
  slug: UniversSlug;
  index: string;
  title: string;
  subtitle: string;
  short: string;
  description: string;
  details: string[];
  prestations: string[];
  method: string[];
  plus: string[];
  categories: UniversCategory[];
};

export const universList: Univers[] = [
  {
    slug: "evenementiel",
    index: "01",
    title: "Événementiel",
    subtitle: "Des événements qui fédèrent et qui marquent",
    short: "Séminaires, galas, lancements, family days : l'organisation complète, de A à Z.",
    description:
      "De la conception à la coordination le jour J, Houdli prend en charge l'organisation complète de vos événements professionnels et institutionnels. Nous imaginons un concept fidèle à vos objectifs, sélectionnons les lieux et les prestataires, et pilotons toute la logistique pour que vous profitiez pleinement du moment.",
    details: [
      "Un chef de projet dédié, de la recherche du concept jusqu'au bilan.",
      "Technique, print et stands gérés par la même équipe.",
      "Budget, planning et coordination des prestataires maîtrisés.",
    ],
    prestations: [
      "Séminaires et conventions",
      "Conférences et plénières",
      "Soirées de gala et cocktails",
      "Lancements de produits et inaugurations",
      "Family days, Safety days et célébrations",
    ],
    method: [
      "Recherche du concept et du lieu",
      "Budget et planning détaillés",
      "Coordination des prestataires",
      "Pilotage sur site le jour J",
    ],
    plus: [
      "Un chef de projet dédié",
      "Technique, print et stands gérés par la même équipe",
      "Un bilan partagé après chaque événement",
    ],
    categories: [
      { label: "Événements corporate", items: ["Séminaires", "Conventions", "Conférences"] },
      { label: "Soirées & galas", items: ["Cocktails", "Dîners", "Remises de prix"] },
      { label: "Lancements & inaugurations", items: ["Révélations produits", "Ouvertures de sites"] },
      { label: "Family days & Safety days", items: ["Célébrations d'entreprise", "Journées thématiques"] },
    ],
  },
  {
    slug: "team-building",
    index: "02",
    title: "Team Building",
    subtitle: "Fédérer vos équipes autour d'une aventure commune",
    short: "30 activités au catalogue, de 10 à 400 participants, indoor ou outdoor, partout au Maroc.",
    description:
      "Le team building est un outil de management à la fois ludique et pédagogique. Il renforce la cohésion, fluidifie la communication et facilite l'intégration des nouveaux collaborateurs. Nos spécialistes vous guident dans le choix du thème, du lieu et des animations, en fonction de vos objectifs RH.",
    details: [
      "30 activités au catalogue, des formats de 10 à 400 participants.",
      "En intérieur ou en plein air, partout au Maroc.",
      "Animation par nos coachs, photos et vidéos souvenirs.",
    ],
    prestations: [
      "Artistique et musical",
      "Ludique et créatif",
      "Sport et aventure",
      "Escape game et chasse au trésor",
      "Cuisine, au vert et solidaire",
    ],
    method: [
      "Définition des objectifs",
      "Choix de l'activité et du lieu",
      "Animation par nos coachs",
      "Photos et vidéos souvenirs",
    ],
    plus: [
      "30 activités au catalogue",
      "Des formats de 10 à 400 participants",
      "En intérieur ou en plein air, partout au Maroc",
    ],
    categories: [
      { label: "Artistique", items: ["La Fresque géante", "Percussion musicale", "Entreprise Got Talent", "Let's Dance", "Make Your Movie", "Lip Dub", "Logo humain", "Karaoké", "Live Band"] },
      { label: "Ludique & créatif", items: ["Squid Game", "Réaction en chaîne", "Formula 1 carton", "Clayground", "Artisanat Connect", "Art floral", "Pont de cohésion", "Catapulta", "Puzzle géant", "Trust Trek", "Pyramide géante"] },
      { label: "Sport & aventure", items: ["Olympiades", "Rallye Berbère Challenge", "Kohlanta", "Survivor Challenge", "The Red City Experience", "Funny Games"] },
      { label: "Escape game", items: ["La chasse au trésor"] },
      { label: "Cuisine", items: ["Master Chef"] },
      { label: "Au vert & solidaire", items: ["Team building solidaire", "Randonnée pédestre"] },
    ],
  },
  {
    slug: "communication",
    index: "03",
    title: "Communication",
    subtitle: "Une image forte, avant, pendant et après",
    short: "Identité visuelle, campagnes, photo, vidéo et réseaux sociaux autour de vos temps forts.",
    description:
      "Un événement réussi se prépare, se vit et se raconte. Houdli construit une communication cohérente autour de vos temps forts : identité visuelle, campagnes, contenus photo et vidéo, et présence sur les réseaux sociaux pour prolonger l'impact bien après l'événement.",
    details: [
      "Une communication alignée sur l'événement.",
      "Des créations adaptées à chaque support.",
      "Des contenus livrés rapidement.",
    ],
    prestations: [
      "Identité visuelle et charte graphique",
      "Campagnes et activations de marque",
      "Couverture photo et vidéo",
      "Films d'entreprise et motion design",
      "Gestion des réseaux sociaux",
    ],
    method: [
      "Brief et analyse de vos cibles",
      "Concept créatif",
      "Production des contenus",
      "Diffusion et suivi des résultats",
    ],
    plus: [
      "Une communication alignée sur l'événement",
      "Des créations adaptées à chaque support",
      "Des contenus livrés rapidement",
    ],
    categories: [
      { label: "Identité visuelle", items: ["Logos", "Chartes", "Univers graphiques"] },
      { label: "Campagnes & activations", items: ["Concepts créatifs", "Dispositifs de marque"] },
      { label: "Photo & vidéo", items: ["Couverture d'événements", "Films", "Motion design"] },
      { label: "Réseaux sociaux", items: ["Stratégie", "Animation", "Couverture en direct"] },
    ],
  },
  {
    slug: "lumiere-sono",
    index: "04",
    title: "Lumière & sono",
    subtitle: "L'ambiance qui transforme un lieu en expérience",
    short: "Sonorisation, éclairage, murs LED et régie technique, de la conférence au concert.",
    description:
      "La lumière et le son transforment un lieu en expérience. Nos équipes techniques conçoivent et installent les dispositifs adaptés à votre format, de la conférence intimiste au grand concert, et assurent la régie pendant tout l'événement.",
    details: [
      "Du matériel professionnel et des techniciens expérimentés.",
      "Une seule équipe pour la technique et l'organisation.",
      "Repérage, plan d'implantation, tests et régie le jour J.",
    ],
    prestations: [
      "Sonorisation de conférences et concerts",
      "Éclairage scénique et architectural",
      "Murs LED et vidéoprojection",
      "Captation et retransmission en direct",
      "Régie et techniciens sur site",
    ],
    method: [
      "Repérage technique du lieu",
      "Plan d'implantation",
      "Installation et tests",
      "Régie pendant l'événement",
    ],
    plus: [
      "Du matériel professionnel",
      "Des techniciens expérimentés",
      "Une seule équipe pour la technique et l'organisation",
    ],
    categories: [
      { label: "Sonorisation", items: ["Conférences", "Concerts", "Soirées"] },
      { label: "Éclairage", items: ["Lumière scénique", "Mise en valeur architecturale"] },
      { label: "Écrans LED & vidéo", items: ["Murs LED", "Vidéoprojection", "Retransmission"] },
      { label: "Régie technique", items: ["Techniciens", "Ingénieurs du son sur site"] },
    ],
  },
  {
    slug: "print",
    index: "05",
    title: "Print",
    subtitle: "Des supports soignés, du petit au grand format",
    short: "Corporate, PLV, grands formats et objets personnalisés, jusqu'à la pose sur site.",
    description:
      "Chaque support compte pour porter votre image. Houdli conçoit et produit l'ensemble de vos imprimés, des documents corporate à la signalétique grand format, dans le respect de votre charte graphique et de vos délais.",
    details: [
      "Respect strict de votre charte.",
      "Des délais maîtrisés.",
      "Installation sur site incluse sur demande.",
    ],
    prestations: [
      "Cartes, brochures, flyers et catalogues",
      "Roll-ups, kakémonos et beach flags",
      "Bâches, adhésifs et habillages",
      "Badges et signalétique d'événement",
      "Goodies et textiles personnalisés",
    ],
    method: [
      "Conseil sur les supports",
      "Création ou adaptation graphique",
      "BAT et validation",
      "Impression, livraison et pose",
    ],
    plus: [
      "Respect strict de votre charte",
      "Des délais maîtrisés",
      "Installation sur site incluse sur demande",
    ],
    categories: [
      { label: "Supports corporate", items: ["Cartes de visite", "Brochures", "Flyers"] },
      { label: "PLV & signalétique", items: ["Roll-ups", "Kakémonos", "Totems"] },
      { label: "Grands formats", items: ["Bâches", "Habillages", "Adhésifs"] },
      { label: "Objets personnalisés", items: ["Goodies", "Textiles", "Badges"] },
    ],
  },
  {
    slug: "realisation-stands",
    index: "06",
    title: "Réalisation des stands",
    subtitle: "Des espaces de marque pensés pour attirer et convaincre",
    short: "Conception 3D, fabrication, transport, montage et démontage clés en main.",
    description:
      "Salons, foires, expositions : votre stand est la vitrine de votre marque. Houdli le conçoit en 3D, le fabrique et l'installe clé en main, avec un objectif simple : capter l'attention de vos visiteurs et valoriser votre identité.",
    details: [
      "Un interlocuteur unique.",
      "Le respect des délais du salon.",
      "Un stand fidèle à votre identité visuelle.",
    ],
    prestations: [
      "Conception 3D sur mesure",
      "Menuiserie et fabrication",
      "Habillage graphique",
      "Mobilier, éclairage et écrans",
      "Transport, montage et démontage",
    ],
    method: [
      "Brief et contraintes du salon",
      "Proposition 3D",
      "Fabrication",
      "Installation clé en main",
    ],
    plus: [
      "Un interlocuteur unique",
      "Le respect des délais du salon",
      "Un stand fidèle à votre identité visuelle",
    ],
    categories: [
      { label: "Design 3D sur mesure", items: ["Fidèle à votre identité visuelle"] },
      { label: "Fabrication", items: ["Menuiserie", "Impression", "Habillage"] },
      { label: "Logistique complète", items: ["Transport", "Montage", "Démontage"] },
      { label: "Équipements intégrés", items: ["Mobilier", "Lumière", "Écrans", "Signalétique"] },
    ],
  },
];

/** Titre (hors « | Houdli ») et description pour Google : la prestation et le lieu, sous 60 et 160 caractères. */
export const universSeo: Record<UniversSlug, { title: string; description: string; serviceType: string }> = {
  evenementiel: {
    title: "Organisation d'événements d'entreprise à Casablanca",
    description:
      "Séminaires, conventions, soirées de gala et lancements à Casablanca et partout au Maroc : un chef de projet dédié, du concept au jour J.",
    serviceType: "Organisation d'événements d'entreprise",
  },
  "team-building": {
    title: "Team building à Casablanca et au Maroc",
    description:
      "30 activités de team building à Casablanca et partout au Maroc : artistique, sport, cuisine, escape game, solidaire. De 10 à 400 participants.",
    serviceType: "Team building",
  },
  communication: {
    title: "Communication événementielle à Casablanca",
    description:
      "Identité visuelle, campagnes, photo, vidéo et réseaux sociaux autour de vos événements, à Casablanca et au Maroc. L'impact continue après le jour J.",
    serviceType: "Communication événementielle",
  },
  "lumiere-sono": {
    title: "Location son et lumière pour événements à Casablanca",
    description:
      "Sonorisation, éclairage scénique, murs LED et régie technique pour vos conférences, galas et concerts à Casablanca et partout au Maroc.",
    serviceType: "Location de son et lumière événementielle",
  },
  print: {
    title: "Impression, PLV et signalétique à Casablanca",
    description:
      "Brochures, roll-ups, kakémonos, bâches et signalétique grand format pour vos événements, imprimés à Casablanca dans le respect de votre charte.",
    serviceType: "Impression et signalétique événementielle",
  },
  "realisation-stands": {
    title: "Conception et réalisation de stands à Casablanca",
    description:
      "Stands sur mesure pour salons, foires et expositions au Maroc : conception 3D, fabrication, habillage et montage clé en main depuis Casablanca.",
    serviceType: "Conception et fabrication de stands",
  },
};

export function getUnivers(slug: string) {
  for (const entry of universList) {
    if (entry.slug === slug) return entry;
  }
}

export function getUniversImage(slug: UniversSlug) {
  return images.univers[slug];
}
