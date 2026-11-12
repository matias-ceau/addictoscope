/**
 * Corrections made by hand, kept in this browser without anyone having to
 * save: the corrected frise (pseudonymized, as the model returned it) is
 * stored under a fingerprint of the observations it was built from, and put
 * back when the same dossier is analysed or opened again. Nothing is sent;
 * a browser that refuses storage simply keeps nothing.
 */
import { carryCorrections, correctionCount } from "../notebook/edit";
import type { Observation, Timeline } from "../notebook/model";

const PREFIX = "addictoscope:corrections:";

/** The same documents cut the same way give the same key, whatever their ids in this session. */
export function dossierKey(observations: Observation[]): string {
  let h = 5381;
  const text = observations.map((o) => `${o.date ?? ""}|${o.start.page}.${o.start.line}|${o.end.page}.${o.end.line}|${o.kind}`).join("\n");
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `${PREFIX}${observations.length}-${h.toString(36)}`;
}

const touched = (t: Timeline) => correctionCount(t).total + correctionCount(t).verdicts > 0 || Boolean(t.missing) || t.events.some((e) => e.key !== undefined);

export function storeCorrections(observations: Observation[], timeline: Timeline, storage: Pick<Storage, "setItem" | "removeItem"> | undefined = safeStorage()): void {
  if (!storage || !observations.length) return;
  try {
    if (touched(timeline)) storage.setItem(dossierKey(observations), JSON.stringify(timeline));
    else storage.removeItem(dossierKey(observations));
  } catch {
    // Storage full or refused: the corrections stay in the open analysis.
  }
}

/** `fresh` with the corrections kept for this dossier, if any. */
export function restoreCorrections(observations: Observation[], fresh: Timeline, storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Timeline {
  if (!storage || !observations.length) return fresh;
  try {
    const kept = storage.getItem(dossierKey(observations));
    if (!kept) return fresh;
    const previous = JSON.parse(kept) as Timeline;
    if (!Array.isArray(previous.events) || !Array.isArray(previous.tracks)) return fresh;
    return carryCorrections({ ...previous, undated: previous.undated ?? [] }, fresh);
  } catch {
    return fresh;
  }
}

function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
