// Gel combination matching engine.
//
// Given a target color (HEX), search single gels and 2- or 3-gel stacks
// for combinations whose stacked transmittance best matches the target.
//
// Score combines:
//   - ΔE (Lab) accuracy
//   - brightness-loss penalty (don't suggest combos that kill the light)

import { GELS, type Gel } from "./gels";
import {
  hexToLinear,
  linearToLab,
  deltaE76,
  stackGels,
  linearToHex,
  luminance,
  type RGB,
} from "./color";

export type Match = {
  gels: Gel[];
  resultHex: string;
  resultLinear: RGB;
  deltaE: number;
  brightness: number; // 0..1 relative luminance after stacking
  score: number; // lower = better
};

export type MatcherOptions = {
  maxStack: 1 | 2 | 3;
  inventory?: string[] | null; // gel numbers; if null/undefined, use full catalog
  minBrightness?: number; // discard combos darker than this (0..1)
  topN?: number;
};

/**
 * Combined score: ΔE plus a soft penalty when the stacked light gets
 * too dim. Tuned so that a combo losing 80% of the light pays roughly
 * the same cost as +15 ΔE.
 */
function score(deltaE: number, brightness: number): number {
  // Brightness penalty grows non-linearly as light gets crushed.
  const dim = Math.max(0, 1 - brightness);
  const brightnessPenalty = Math.pow(dim, 2) * 25;
  return deltaE + brightnessPenalty;
}

export function findMatches(
  targetHex: string,
  opts: MatcherOptions,
): Match[] {
  const { maxStack, inventory, minBrightness = 0.02, topN = 12 } = opts;

  const pool: Gel[] =
    inventory && inventory.length > 0
      ? GELS.filter((g) => inventory.includes(g.number))
      : GELS;

  const targetLinear = hexToLinear(targetHex);
  const targetLab = linearToLab(targetLinear);

  const results: Match[] = [];

  const consider = (gels: Gel[]) => {
    const stacked = stackGels(gels.map((g) => g.hex));
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

  // Triples — pruned: only build on top of the best ~40 pairs
  if (maxStack >= 3) {
    const bestPairs = [...results]
      .filter((m) => m.gels.length === 2)
      .sort((a, b) => a.score - b.score)
      .slice(0, 40);
    for (const pair of bestPairs) {
      for (const c of pool) {
        consider([...pair.gels, c]);
      }
    }
  }

  // Sort and dedupe by gel-number signature
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
