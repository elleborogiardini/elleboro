export type Service = { title: string; body: string };

export type PublicSite = {
  ownerName: string;
  heroTitle: string;
  heroLead: string;
  bio: string;
  services: Service[];
  phone: string | null;
  email: string | null;
  area: string | null;
  portraitPath: string | null;
  portraitAlt: string;
};

export const draftSite: PublicSite = {
  ownerName: "Hasith Conthrath",
  heroTitle: "Elleboro Giardini",
  heroLead: "Cura di giardini, balconi e terrazzi.",
  bio: "Bozza: riscrivi con le tue parole.",
  services: [
    {
      title: "Ascolto",
      body: "Capisco il luogo e come lo vivi.",
    },
    {
      title: "Progetto",
      body: "Disegno un verde adatto a quello spazio.",
    },
    {
      title: "Cura",
      body: "Torno nelle stagioni, con continuità.",
    },
  ],
  phone: null,
  email: null,
  area: null,
  portraitPath: null,
  portraitAlt: "Hasith Conthrath, Elleboro Giardini",
};
