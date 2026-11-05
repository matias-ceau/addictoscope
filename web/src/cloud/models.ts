/**
 * Models offered in the settings, with what was measured: recall on the 14
 * fictional dossiers (data/processed/frise/comparaison-modeles.md), cost as
 * the mean of six real dossiers (benchmark of 05/11/2026). Every one is
 * reached through OpenRouter with zero data retention.
 */

export interface ModelInfo {
  id: string;
  name: string;
  /** Who makes it, as shown to the user. */
  maker: string;
  /** Events of verite.json found, over the 14 fictional dossiers. */
  recall?: number;
  /** Mean cost of one real dossier, in dollars. */
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
    id: "openai/gpt-6-luna",
    name: "GPT-6 Luna",
    maker: "OpenAI (Azure)",
    recall: 254 / 320,
    costPerRealDossier: 0.05,
    tag: "Économique",
    note: "Plus de 20 fois moins cher que Sonnet. Sur de vrais dossiers, retrouve un peu moins de la moitié de la frise de Sonnet, comme Haiku.",
  },
  {
    id: "anthropic/claude-haiku-5.5",
    name: "Claude Haiku 5.5",
    maker: "Anthropic",
    recall: 239 / 320,
    costPerRealDossier: 0.08,
    note: "Le plus proche de Sonnet sur de vrais dossiers (la moitié de sa frise) ; fins de période et événements secondaires plus souvent manqués.",
  },
  {
    id: "openai/gpt-6-luna-pro",
    name: "GPT-6 Luna Pro",
    maker: "OpenAI (Azure)",
    recall: 246 / 320,
    costPerRealDossier: 0.12,
    note: "Pas mieux que GPT-6 Luna, plus cher et nettement plus lent.",
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    maker: "DeepSeek",
    recall: 258 / 320,
    costPerRealDossier: 0.19,
    note: "Bon sur les dossiers fictifs, peu fiable sur les vrais : sur les dossiers longs, il s'emballe et ne rend pas de réponse.",
  },
  {
    id: "openai/gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    maker: "OpenAI (Azure)",
    recall: 238 / 320,
    costPerRealDossier: 0.09,
    note: "Remplacé par GPT-6 Luna, meilleur et moins cher.",
  },
  {
    id: "mistralai/mistral-small-2603",
    name: "Mistral Small",
    maker: "Mistral AI",
    recall: 173 / 320,
    costPerRealDossier: 0.04,
    note: "Éditeur européen ; frise nettement moins complète.",
  },
  {
    id: "google/gemma-4-31b-it",
    name: "Gemma 4 31B",
    maker: "Google (modèle ouvert)",
    recall: 195 / 320,
    costPerRealDossier: 0.02,
    note: "Le moins cher ; modèle ouvert, hébergeable sur un serveur HDS. Frise nettement moins complète.",
  },
];

export function modelName(id: string): string {
  return MODELS.find((m) => m.id === id)?.name ?? id.split("/").at(-1) ?? id;
}
