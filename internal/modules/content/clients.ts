/**
 * Logos extraits du mur « Ils nous font confiance » (proposition Houd-Li, p. 22).
 * Fichiers dans /public/logos/clients.
 */
export type ClientLogo = {
  name: string;
  logo: string;
};

/** Rangées du mur de logos, de haut en bas. */
export const clientLogoRows: ClientLogo[][] = [
  [
    { name: "Mazagan Beach Resort", logo: "/logos/clients/mazagan.png" },
    { name: "Pullman", logo: "/logos/clients/pullman.svg" },
    { name: "Sonasid", logo: "/logos/clients/sonasid.png" },
    { name: "Imacid", logo: "/logos/clients/imacid.png" },
    { name: "Université Mohammed VI Polytechnique", logo: "/logos/clients/um6p.svg" },
  ],
  [
    { name: "Marjane", logo: "/logos/clients/marjane.svg" },
    { name: "OCP", logo: "/logos/clients/ocp.svg" },
    { name: "Access Transit", logo: "/logos/clients/access-transit.png" },
    { name: "TAQA Morocco", logo: "/logos/clients/taqa.png" },
    { name: "Nestlé", logo: "/logos/clients/nestle.svg" },
  ],
  [
    { name: "Intelcia", logo: "/logos/clients/intelcia.png" },
    { name: "Vivo Energy", logo: "/logos/clients/vivo-energy.png" },
    { name: "Engie Home Services", logo: "/logos/clients/engie.png" },
    { name: "TotalEnergies", logo: "/logos/clients/totalenergies.svg" },
    { name: "CTM", logo: "/logos/clients/ctm.png" },
  ],
  [
    { name: "BMCI", logo: "/logos/clients/bmci.png" },
    { name: "Banque Populaire", logo: "/logos/clients/banque-populaire.svg" },
    { name: "Attijariwafa bank", logo: "/logos/clients/attijariwafa.png" },
    { name: "Bureau Veritas", logo: "/logos/clients/bureau-veritas.png" },
    { name: "AXA", logo: "/logos/clients/axa.svg" },
    { name: "Renault", logo: "/logos/clients/renault.svg" },
  ],
  [
    { name: "Atlas Copco", logo: "/logos/clients/atlas-copco.svg" },
    { name: "inwi", logo: "/logos/clients/inwi.svg" },
    { name: "Orange", logo: "/logos/clients/orange.svg" },
    { name: "Agence Nationale des Ports", logo: "/logos/clients/anp.png" },
    { name: "ONCF", logo: "/logos/clients/oncf.png" },
    { name: "NARSA", logo: "/logos/clients/narsa.png" },
  ],
  [
    { name: "Decathlon", logo: "/logos/clients/decathlon.svg" },
    { name: "SNTL", logo: "/logos/clients/sntl.png" },
    { name: "Oulmès", logo: "/logos/clients/oulmes.png" },
    { name: "ENSA", logo: "/logos/clients/ensa.png" },
    { name: "Université Chouaïb Doukkali", logo: "/logos/clients/chouab-doukkali.png" },
  ],
];

export const clientLogos: ClientLogo[] = clientLogoRows.flat();
