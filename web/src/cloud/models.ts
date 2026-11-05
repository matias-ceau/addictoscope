/**
 * Models offered in the settings, with what was measured on the 14
 * fictional dossiers (data/processed/frise/comparaison-modeles.md): every
 * one is reached through OpenRouter with zero data retention.
 */

export interface ModelInfo {
  id: string;
  name: string;
  /** Who makes it, as shown to the user. */
  maker: string;
  /** Events of verite.json found, over the 14 fictional dossiers. */
  recall?: number;
  /** Estimated cost of one real dossier, in dollars (proportional to the
   *  measured cost of the fictional dossiers). */
  costPerRealDossier?: number;
  /** Short badge: "Recommandé", "Économique". */
  tag?: string;
  note?: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "anthropic/claude-sonnet-5.5",
    name: "Claude Sonnet 5.5",
    maker: "Anthropic",
    recall: 281 / 320,
    costPerRealDossier: 1.17,
    tag: "Meilleure frise",
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    maker: "DeepSeek",
    recall: 258 / 320,
    costPerRealDossier: 0.33,
    tag: "Compromis",
    note: "Proche de Sonnet pour 4 fois moins cher (81 % sur deux passages), mais lent et plus d'événements en trop.",
  },
  {
    id: "openai/gpt-5.6-luna-pro",
    name: "GPT-5.6 Luna Pro",
    maker: "OpenAI (Azure)",
    recall: 248 / 320,
    costPerRealDossier: 0.28,
  },
  {
    id: "anthropic/claude-haiku-5.5",
    name: "Claude Haiku 5.5",
    maker: "Anthropic",
    recall: 239 / 320,
    costPerRealDossier: 0.07,
    tag: "Économique",
    note: "16 fois moins cher ; fins de période et événements secondaires plus souvent manqués.",
  },
  {
    id: "openai/gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    maker: "OpenAI (Azure)",
    recall: 238 / 320,
    costPerRealDossier: 0.09,
    note: "Proche de Haiku ; le meilleur sur les antécédents datés par l'âge (18/20).",
  },
  {
    id: "mistralai/mistral-small-2603",
    name: "Mistral Small",
    maker: "Mistral AI",
    recall: 173 / 320,
    costPerRealDossier: 0.04,
    note: "Le moins cher, éditeur européen ; frise nettement moins complète.",
  },
  {
    id: "google/gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    maker: "Google",
    recall: 150 / 320,
    costPerRealDossier: 0.12,
    note: "Le plus rapide ; frise la moins complète.",
  },
];

export function modelName(id: string): string {
  return MODELS.find((m) => m.id === id)?.name ?? id.split("/").at(-1) ?? id;
}
