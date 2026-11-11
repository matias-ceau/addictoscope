/**
 * Library of dossiers already analysed (SPEC.md, « Bibliothèque de
 * dossiers »): `?library=<path>/library.json` opens the app with every
 * dossier in a sidebar. Each dossier's documents go through the normal
 * local path (detection, redaction, verification); its frise is the saved
 * analysis, loaded in place of a call to the model.
 */
import type { Observation } from "../notebook/model";
import { parseAnalysis, type SavedAnalysis } from "./saved";
import type { KeyTable } from "../core/reidentify";

export interface LibraryDoc {
  /** File name, relative to library.json. */
  file: string;
  /** Document id used in the saved analysis (default: the file name without its extension). */
  id: string;
  title: string;
}

export interface LibraryDossier {
  slug: string;
  title: string;
  summary: string;
  docs: LibraryDoc[];
  /** Saved analysis (format of « Enregistrer l'analyse »), relative to library.json. */
  analysis: string;
  /** Table label -> real value (`{ labels: { … } }`), relative to library.json. */
  key?: string;
  /** Cost of the recorded run, in dollars, when known. */
  cost?: number;
  /** The run was answered without a paid call: `cost` is what it would have cost. */
  costEstimated?: boolean;
  /** Pages of the dossier and events of its frise, shown in the sidebar. */
  pages?: number;
  events?: number;
}

export interface LibraryGroup {
  title: string;
  dossiers: LibraryDossier[];
}

export interface Library {
  title: string;
  /** URL of library.json; the other files are resolved against it. */
  base: string;
  groups: LibraryGroup[];
}

export class NotALibrary extends Error {}

const isString = (v: unknown): v is string => typeof v === "string" && v.length > 0;
/** Relative paths only, inside the library folder. */
const safePath = (v: unknown, what: string): string => {
  if (!isString(v) || v.startsWith("/") || /^[a-z]+:/i.test(v) || v.split("/").includes("..")) {
    throw new NotALibrary(`Bibliothèque invalide : chemin de ${what} incorrect (${String(v)}).`);
  }
  return v;
};

export function parseLibrary(text: string, base: string): Library {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new NotALibrary("Bibliothèque illisible : library.json n'est pas un JSON valide.");
  }
  if (!Array.isArray(data?.groups)) throw new NotALibrary("Bibliothèque invalide : aucun groupe de dossiers.");
  const slugs = new Set<string>();
  const groups = (data.groups as Record<string, unknown>[]).map((g, gi): LibraryGroup => {
    if (!Array.isArray(g?.dossiers)) throw new NotALibrary(`Bibliothèque invalide : le groupe ${gi + 1} n'a pas de dossiers.`);
    return {
      title: isString(g.title) ? g.title : `Groupe ${gi + 1}`,
      dossiers: (g.dossiers as Record<string, unknown>[]).map((d): LibraryDossier => {
        if (!isString(d?.slug)) throw new NotALibrary("Bibliothèque invalide : un dossier n'a pas d'identifiant.");
        if (slugs.has(d.slug)) throw new NotALibrary(`Bibliothèque invalide : dossier en double (${d.slug}).`);
        slugs.add(d.slug);
        if (!Array.isArray(d.docs) || d.docs.length === 0) throw new NotALibrary(`Bibliothèque invalide : le dossier ${d.slug} n'a pas de document.`);
        const docs = (d.docs as Record<string, unknown>[]).map((doc): LibraryDoc => {
          const file = safePath(doc?.file, "document");
          const stem = file.split("/").at(-1)!.replace(/\.[^.]+$/, "");
          return { file, id: isString(doc.id) ? doc.id : stem, title: isString(doc.title) ? doc.title : stem };
        });
        return {
          slug: d.slug,
          title: isString(d.title) ? d.title : d.slug,
          summary: typeof d.summary === "string" ? d.summary : "",
          docs,
          analysis: safePath(d.analysis, "l'analyse"),
          ...(d.key !== undefined ? { key: safePath(d.key, "la table") } : {}),
          ...(typeof d.cost === "number" ? { cost: d.cost } : {}),
          ...(d.costEstimated === true ? { costEstimated: true } : {}),
          ...(typeof d.pages === "number" ? { pages: d.pages } : {}),
          ...(typeof d.events === "number" ? { events: d.events } : {}),
        };
      }),
    };
  });
  if (slugs.size === 0) throw new NotALibrary("Bibliothèque vide : aucun dossier.");
  return { title: isString(data.title) ? data.title : "Bibliothèque de dossiers", base, groups };
}

export const libraryUrl = (lib: Library, path: string): string => new URL(path, lib.base).href;

export async function loadLibrary(url: string): Promise<Library> {
  const base = new URL(url, document.baseURI).href;
  const res = await fetch(base);
  if (!res.ok) throw new NotALibrary(`Bibliothèque introuvable (${res.status}) : ${url}`);
  return parseLibrary(await res.text(), base);
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

/** One file per document, in order; a missing one is reported, not fatal. */
export async function loadDossierFiles(lib: Library, d: LibraryDossier): Promise<(File | Error)[]> {
  return Promise.all(
    d.docs.map(async (doc) => {
      try {
        const res = await fetch(libraryUrl(lib, doc.file));
        if (!res.ok) return new Error(`Document introuvable : ${doc.title} (${res.status}).`);
        const name = doc.file.split("/").at(-1)!;
        return new File([await res.arrayBuffer()], name, { type: MIME[name.split(".").at(-1)!.toLowerCase()] ?? "" });
      } catch (err) {
        return new Error(`Document illisible : ${doc.title} (${String((err as Error).message ?? err)}).`);
      }
    }),
  );
}

/**
 * The saved analysis with its document ids mapped to this session's ids
 * (`ids`: id in the analysis -> id in the app). Observations of a document
 * not loaded keep their id: their events stay, without a link to the source.
 */
export function remapAnalysis(saved: SavedAnalysis, ids: Record<string, string>): SavedAnalysis {
  const observations: Observation[] = saved.observations.map((o) => (ids[o.doc] ? { ...o, doc: ids[o.doc] } : o));
  return { ...saved, observations };
}

export async function loadDossierAnalysis(lib: Library, d: LibraryDossier): Promise<SavedAnalysis> {
  const res = await fetch(libraryUrl(lib, d.analysis));
  if (!res.ok) throw new Error(`Analyse enregistrée introuvable (${res.status}).`);
  return parseAnalysis(await res.text());
}

/** `{ labels: { label: real value } }` as a table, or undefined. */
export function parseKeyTable(text: string): KeyTable | undefined {
  try {
    const labels = (JSON.parse(text) as { labels?: unknown }).labels;
    if (!labels || typeof labels !== "object") return undefined;
    const entries = Object.entries(labels as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string");
    return entries.length ? new Map(entries) : undefined;
  } catch {
    return undefined;
  }
}

export async function loadDossierKey(lib: Library, d: LibraryDossier): Promise<KeyTable | undefined> {
  if (!d.key) return undefined;
  const res = await fetch(libraryUrl(lib, d.key));
  return res.ok ? parseKeyTable(await res.text()) : undefined;
}
