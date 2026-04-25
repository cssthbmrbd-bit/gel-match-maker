// Color math for gel stacking simulation, using published
// CIE 1931 chromaticity (x, y) and transmission Y% per gel.
//
// Approach:
//  1. Each gel has a true measured (x, y, Y) under standard illuminant.
//     We convert (x, y, Y_fraction) -> XYZ -> linear sRGB to get its
//     transmittance in linear RGB. This is much more accurate than
//     guessing transmittance from a swatch HEX.
//  2. Stacking N gels = component-wise multiply of their linear-RGB
//     transmittances (Beer–Lambert in 3 bands). Genuinely subtractive,
//     NOT additive RGB.
//  3. Score combinations vs the target with ΔE76 in CIE Lab (D65).
//  4. Brightness loss = 1 - relative luminance of the stack.
//
// Future spectral upgrade: replace `gelTransmittance()` with
// integrated transmittance per CIE color matching function from spectral data.

import type { Gel } from "./gels";

export type RGB = { r: number; g: number; b: number };
export type Lab = { L: number; a: number; b: number };

// ---------- HEX <-> sRGB <-> linear ----------

export function hexToSrgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
}

const srgbToLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const linearToSrgb = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v));
};

export function hexToLinear(hex: string): RGB {
  const s = hexToSrgb(hex);
  return { r: srgbToLinear(s.r), g: srgbToLinear(s.g), b: srgbToLinear(s.b) };
}

export function linearToHex(rgb: RGB): string {
  const r = Math.round(linearToSrgb(rgb.r) * 255);
  const g = Math.round(linearToSrgb(rgb.g) * 255);
  const b = Math.round(linearToSrgb(rgb.b) * 255);
  return (
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}

// ---------- CIE xyY -> linear sRGB ----------

/** Convert CIE 1931 (x, y, Y) to linear sRGB (D65). May be out of gamut. */
export function xyYToLinear(x: number, y: number, Y: number): RGB {
  if (y <= 0) return { r: 0, g: 0, b: 0 };
  const X = (x / y) * Y;
  const Z = ((1 - x - y) / y) * Y;
  const r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  return {
    r: Math.max(0, r),
    g: Math.max(0, g),
    b: Math.max(0, b),
  };
}

// ---------- Gel transmittance & stacking ----------

/**
 * Transmittance of a single gel in linear RGB, derived from its measured
 * (x, y, Y%) — Y% is normalised to 0..1.
 */
export function gelTransmittance(gel: Gel): RGB {
  return xyYToLinear(gel.x, gel.yCoord, gel.y / 100);
}

/** Multiply transmittances (component-wise) — true subtractive stack. */
export function stackGels(gels: Gel[]): RGB {
  if (gels.length === 0) return { r: 1, g: 1, b: 1 };
  return gels
    .map(gelTransmittance)
    .reduce(
      (acc, t) => ({ r: acc.r * t.r, g: acc.g * t.g, b: acc.b * t.b }),
      { r: 1, g: 1, b: 1 },
    );
}

// ---------- CIE Lab (D65) ----------

function linearToXyz(rgb: RGB) {
  return {
    x: rgb.r * 0.4124564 + rgb.g * 0.3575761 + rgb.b * 0.1804375,
    y: rgb.r * 0.2126729 + rgb.g * 0.7151522 + rgb.b * 0.072175,
    z: rgb.r * 0.0193339 + rgb.g * 0.119192 + rgb.b * 0.9503041,
  };
}

const Xn = 0.95047,
  Yn = 1.0,
  Zn = 1.08883;
const fLab = (t: number) =>
  t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29;

export function linearToLab(rgb: RGB): Lab {
  const { x, y, z } = linearToXyz(rgb);
  const fx = fLab(x / Xn);
  const fy = fLab(y / Yn);
  const fz = fLab(z / Zn);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function deltaE76(a: Lab, b: Lab): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ---------- Brightness ----------

/** Relative luminance (0..1) of a linear-RGB color. */
export function luminance(rgb: RGB): number {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}
