/**
 * Demonstration bundle (public/demo/, built by scripts/build-demo.ts):
 * fictional dossiers and recorded model answers, served with the app.
 */
import type { Recording } from "../cloud/replay";

export interface DemoDoc {
  file: string;
  title: string;
  pages: number;
}

export interface DemoRecordingInfo {
  file: string;
  model: string;
  cost: number;
  /** The run was answered without a paid call: `cost` is what it would have cost. */
  costEstimated?: boolean;
  elapsedMs: number | null;
  events: number;
  /** Expected events (verite.json) found by this recorded run. */
  score: { found: number; expected: number } | null;
}

export interface DemoDossier {
  slug: string;
  title: string;
  summary: string;
  docs: DemoDoc[];
  recordings: DemoRecordingInfo[];
}

const base = () => `${import.meta.env.BASE_URL}demo/`;

export async function loadDemoIndex(): Promise<DemoDossier[]> {
  const res = await fetch(`${base()}index.json`);
  if (!res.ok) return [];
  return ((await res.json()) as { dossiers: DemoDossier[] }).dossiers;
}

/** The dossier's PDFs as files, in the order the recordings expect. */
export async function demoFiles(d: DemoDossier): Promise<File[]> {
  return Promise.all(
    d.docs.map(async (doc) => {
      const res = await fetch(`${base()}${d.slug}/${doc.file}`);
      if (!res.ok) throw new Error(`Document de démonstration introuvable : ${doc.file}`);
      return new File([await res.arrayBuffer()], doc.file, { type: "application/pdf" });
    }),
  );
}

export async function loadRecording(d: DemoDossier, r: DemoRecordingInfo): Promise<Recording> {
  const res = await fetch(`${base()}${d.slug}/${r.file}`);
  if (!res.ok) throw new Error(`Réponses enregistrées introuvables : ${r.file}`);
  return (await res.json()) as Recording;
}
