// Gel combination matching engine.
//
// Searches single gels and 2- or 3-gel stacks for combinations whose
// stacked transmittance best matches a target color.
//
// Score = ΔE accuracy + brightness-loss penalty.

import { GELS, GEL_MAP, type Gel } from "./gels";
import {
  linearToLab,
  deltaE76,
  stackGels,
  linearToHex,
  luminance,
  gelTransmittance,
  hexToLinear,
  type RGB,
} from "./color";

export type Match = {
  gels: Gel[];
  resultHex: string;
  resultLinear: RGB;
  deltaE: number;
  brightness: number;
  score: number;
};

export type MatcherOptions = {
  /** Target as a Lee gel number, when matching a Lee color directly. */
  targetGelNumber?: string;
  /** Target as a custom HEX (sRGB), when no Lee gel applies. */
  targetHex?: string;
  maxStack: 1 | 2 | 3;
  inventory?: string[] | null;
  /** Gel number to exclude from the pool (e.g. the target gel). */
  excludeGelNumber?: string | null;
  minBrightness?: number;
  topN?: number;
};

function score(deltaE: number, brightness: number): number {
  const dim = Math.max(0, 1 - brightness);
  const brightnessPenalty = Math.pow(dim, 2) * 25;
  return deltaE + brightnessPenalty;
}

/** Get target as a linear-RGB transmittance, preferring measured xyY. */
function resolveTargetLinear(opts: MatcherOptions): RGB {
  if (opts.targetGelNumber && GEL_MAP[opts.targetGelNumber]) {
    return gelTransmittance(GEL_MAP[opts.targetGelNumber]);
  }
  return hexToLinear(opts.targetHex ?? "#ffffff");
}

export function findMatches(opts: MatcherOptions): Match[] {
  const { maxStack, inventory, excludeGelNumber, minBrightness = 0.005, topN = 12 } = opts;

  let pool: Gel[] =
    inventory && inventory.length > 0
      ? GELS.filter((g) => inventory.includes(g.number))
      : GELS;

  if (excludeGelNumber) {
    pool = pool.filter((g) => g.number !== excludeGelNumber);
  }

  const targetLinear = resolveTargetLinear(opts);
  const targetLab = linearToLab(targetLinear);

  const results: Match[] = [];

  const consider = (gels: Gel[]) => {
    const stacked = stackGels(gels);
    const bright = luminance(stacked);
    if (bright < minBrightness) return;
    const lab = linearToLab(stacked);
    const dE = deltaE76(targetLab, lab);
    results.push({
      gels,
      resultHex: linearToHex(stacked),
      resultLinear: stacked,
      deltaE: dE,
      brightness: bright,
      score: score(dE, bright),
    });
  };

  // Singles
  for (const a of pool) consider([a]);

  // Pairs
  if (maxStack >= 2) {
    for (let i = 0; i < pool.length; i++) {
      for (let j = i; j < pool.length; j++) {
        consider([pool[i], pool[j]]);
      }
    }
  }

  // Triples — pruned: only build on top of best ~50 pairs
  if (maxStack >= 3) {
    const bestPairs = [...results]
      .filter((m) => m.gels.length === 2)
      .sort((a, b) => a.score - b.score)
      .slice(0, 50);
    for (const pair of bestPairs) {
      for (const c of pool) {
        consider([...pair.gels, c]);
      }
    }
  }

  results.sort((a, b) => a.score - b.score);
  const seen = new Set<string>();
  const unique: Match[] = [];
  for (const m of results) {
    const key = m.gels
      .map((g) => g.number)
      .sort()
      .join("+");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(m);
    if (unique.length >= topN) break;
  }
  return unique;
}
