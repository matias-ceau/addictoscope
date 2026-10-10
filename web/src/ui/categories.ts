import type { Category } from "../core/types";

export const CATEGORY_INFO: Record<Category, { name: string; hue: number }> = {
  PATIENT: { name: "Patient·e", hue: 350 },
  PROCHE: { name: "Proche", hue: 25 },
  SOIGNANT: { name: "Soignant·e", hue: 205 },
  PERSONNE: { name: "Personne", hue: 280 },
  ADRESSE: { name: "Adresse", hue: 140 },
  VILLE: { name: "Ville", hue: 140 },
  ETABLISSEMENT: { name: "Établissement", hue: 170 },
  NAISSANCE: { name: "Date de naissance", hue: 45 },
  IPP: { name: "IPP", hue: 230 },
  NIR: { name: "N° sécu", hue: 230 },
  DOSSIER: { name: "N° dossier", hue: 230 },
  TEL: { name: "Téléphone", hue: 260 },
  EMAIL: { name: "E-mail", hue: 260 },
};

export const CATEGORY_ORDER: Category[] = [
  "PATIENT", "PROCHE", "SOIGNANT", "PERSONNE", "NAISSANCE", "IPP", "NIR", "DOSSIER",
  "TEL", "EMAIL", "ADRESSE", "VILLE", "ETABLISSEMENT",
];
