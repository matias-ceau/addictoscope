/**
 * Time axis of the frise. A dossier often tells thirty years of history and
 * documents two of follow-up: on one linear scale either the follow-up is a
 * sliver, or the history is cut off. `splitScale` gives each part its own
 * share of the width, with a break at the first document.
 */

export interface Scale {
  /** Position of a timestamp, as a fraction (0–1) of the plot width. */
  (t: number): number;
  /** Timestamp of the break and its position, when the axis is split. */
  breakAt?: { t: number; at: number };
}

export function linearScale(min: number, max: number): Scale {
  return (t) => (Math.min(Math.max(t, min), max) - min) / (max - min || 1);
}

/** Share of the width given to what comes before the break. */
export function historyShare(min: number, breakT: number, max: number): number {
  // Never less than a quarter nor more than 45 %: both parts stay readable.
  return Math.min(0.45, Math.max(0.25, (breakT - min) / (max - min || 1) / 2));
}

export function splitScale(min: number, breakT: number, max: number, share = historyShare(min, breakT, max)): Scale {
  const scale: Scale = (t) => {
    const c = Math.min(Math.max(t, min), max);
    return c < breakT ? ((c - min) / (breakT - min || 1)) * share : share + ((c - breakT) / (max - breakT || 1)) * (1 - share);
  };
  scale.breakAt = { t: breakT, at: share };
  return scale;
}

export interface Tick {
  t: number;
  label: string;
  major: boolean;
}

/** Year ticks (months on short spans), thinned to at most `maxLabels`. */
export function ticks(min: number, max: number, maxLabels = 14): Tick[] {
  const out: Tick[] = [];
  const y0 = new Date(min).getUTCFullYear();
  const y1 = new Date(max).getUTCFullYear();
  const years = y1 - y0 + 1;
  const monthStep = years <= 1 && maxLabels >= 12 ? 1 : years <= 3 && maxLabels >= years * 4 ? 3 : 0;
  for (let y = y0; y <= y1 + 1; y++) {
    for (let m = 0; m < 12; m += monthStep || 12) {
      const t = Date.UTC(y, m, 1);
      if (t < min || t > max) continue;
      out.push({ t, label: m === 0 ? String(y) : `${String(m + 1).padStart(2, "0")}/${String(y).slice(2)}`, major: m === 0 });
    }
  }
  if (monthStep || out.length <= maxLabels) return out;
  const step = [2, 5, 10, 20, 50].find((s) => out.length / s <= maxLabels) ?? 50;
  return out.filter((x) => new Date(x.t).getUTCFullYear() % step === 0);
}
