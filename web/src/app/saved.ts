/**
 * A finished analysis saved to disk and reopened later. The file holds
 * only what the model saw and returned: pseudonymized observations and
 * frise. The real names come back from the encrypted .axkey, separately.
 */
import { withUndated, type Observation, type Timeline } from "../notebook/model";

export interface SavedAnalysis {
  observations: Observation[];
  timeline: Timeline;
  model?: string;
  /** Answers replayed from a recording (demonstration). */
  replayed?: boolean;
  createdAt: string;
}

export function serializeAnalysis(a: Omit<SavedAnalysis, "createdAt">, now = new Date()): string {
  return JSON.stringify(
    {
      tool: "addictoscope",
      kind: "analysis",
      formatVersion: 1,
      createdAt: now.toISOString(),
      model: a.model,
      replayed: a.replayed ?? false,
      observations: a.observations,
      timeline: a.timeline,
    },
    null,
    1,
  );
}

export class NotAnAnalysis extends Error {}

export function parseAnalysis(text: string): SavedAnalysis {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new NotAnAnalysis("Fichier illisible : ce n'est pas une analyse enregistrée par addictoscope.");
  }
  if (data?.tool !== "addictoscope" || data.kind !== "analysis") {
    throw new NotAnAnalysis("Ce fichier n'est pas une analyse enregistrée par addictoscope.");
  }
  if (data.formatVersion !== 1) throw new NotAnAnalysis(`Version de fichier non prise en charge : ${String(data.formatVersion)}.`);
  const timeline = data.timeline as Timeline | undefined;
  if (!Array.isArray(data.observations) || !timeline || !Array.isArray(timeline.events) || !Array.isArray(timeline.tracks)) {
    throw new NotAnAnalysis("Analyse incomplète : observations ou frise manquantes.");
  }
  return {
    observations: data.observations as Observation[],
    timeline: withUndated(timeline),
    model: typeof data.model === "string" ? data.model : undefined,
    replayed: data.replayed === true,
    createdAt: String(data.createdAt ?? ""),
  };
}
