// Color math for gel stacking simulation.
//
// Approach (designed to be replaced later with true spectral data):
// 1. Convert each gel HEX -> linear RGB transmission (0..1 per channel).
//    Treating each channel as transmittance is a crude proxy for the
//    integrated R/G/B bands of the visible spectrum.
// 2. Stacking N gels = component-wise multiply of their transmittances
//    (Beer–Lambert in 3-band approximation). This is genuinely subtractive,
//    NOT additive RGB mixing.
// 3. Compare against the target's linear-RGB transmittance.
// 4. Convert both to CIE Lab (D65) and compute ΔE76 as the accuracy score.
// 5. Brightness loss = 1 - luminance(stacked).
//
// Architecture note: replace `gelTransmittance()` with sampled spectral
// data + a CMF integrator to upgrade accuracy without changing the engine.

export type RGB = { r: number; g: number; b: number }; // 0..1 linear
export type Lab = { L: number; a: number; b: number };

// ---------- HEX <-> sRGB <-> linear RGB ----------

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
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}

// ---------- Gel transmittance & stacking ----------

/**
 * Treat the gel's swatch color (linear RGB) as its 3-band transmittance.
 * Future: replace with sampled spectral data.
 */
export function gelTransmittance(hex: string): RGB {
  return hexToLinear(hex);
}

/** Multiply transmittances of any number of gels (subtractive stack). */
export function stackGels(hexes: string[]): RGB {
  if (hexes.length === 0) return { r: 1, g: 1, b: 1 };
  return hexes
    .map(gelTransmittance)
    .reduce((acc, t) => ({ r: acc.r * t.r, g: acc.g * t.g, b: acc.b * t.b }), {
      r: 1,
      g: 1,
      b: 1,
    });
}

// ---------- CIE Lab (D65) ----------

// linear sRGB -> XYZ (D65)
function linearToXyz(rgb: RGB): { x: number; y: number; z: number } {
  return {
    x: rgb.r * 0.4124564 + rgb.g * 0.3575761 + rgb.b * 0.1804375,
    y: rgb.r * 0.2126729 + rgb.g * 0.7151522 + rgb.b * 0.072175,
    z: rgb.r * 0.0193339 + rgb.g * 0.119192 + rgb.b * 0.9503041,
  };
}

const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

const fLab = (t: number) =>
  t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29;

export function linearToLab(rgb: RGB): Lab {
  const { x, y, z } = linearToXyz(rgb);
  const fx = fLab(x / Xn);
  const fy = fLab(y / Yn);
  const fz = fLab(z / Zn);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
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
