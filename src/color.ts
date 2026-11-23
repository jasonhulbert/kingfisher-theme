/**
 * OKLCH color math. Every color in the theme is defined in OKLCH and converted
 * to sRGB hex here. Colors outside the sRGB gamut keep their lightness and hue,
 * and lose chroma until they fit.
 */

export interface Color {
  /** Lowercase `#rrggbb`. */
  readonly hex: string;
  /** OKLCH lightness, 0–1. */
  readonly l: number;
  /** OKLCH chroma after gamut mapping. */
  readonly c: number;
  /** OKLCH hue in degrees. */
  readonly h: number;
  /** WCAG 2.x relative luminance, 0–1. */
  readonly luminance: number;
}

type Vec3 = [number, number, number];

function oklabToLinearRgb([L, a, b]: Vec3): Vec3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearRgbToOklab([r, g, b]: Vec3): Vec3 {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const inGamut = (rgb: Vec3) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);
const lch = (l: number, c: number, h: number): Vec3 => {
  const rad = (h * Math.PI) / 180;
  return [l, c * Math.cos(rad), c * Math.sin(rad)];
};

function fromLinear(rgb: Vec3, l: number, c: number, h: number): Color {
  const clamped = rgb.map((v) => Math.min(1, Math.max(0, v))) as Vec3;
  const hex = '#' + clamped.map((v) => Math.round(encode(v) * 255).toString(16).padStart(2, '0')).join('');
  const luminance = 0.2126 * clamped[0] + 0.7152 * clamped[1] + 0.0722 * clamped[2];
  return { hex, l, c, h, luminance };
}

/** Build a color from OKLCH, reducing chroma until it fits in sRGB. */
export function oklch(l: number, c: number, h: number): Color {
  l = Math.min(1, Math.max(0, l));
  c = Math.max(0, c);
  let rgb = oklabToLinearRgb(lch(l, c, h));
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToLinearRgb(lch(l, mid, h)))) lo = mid;
      else hi = mid;
    }
    c = lo;
    rgb = oklabToLinearRgb(lch(l, c, h));
  }
  return fromLinear(rgb, l, c, h);
}

/** Parse `#rrggbb`. */
export function fromHex(hex: string): Color {
  const rgb = [1, 3, 5].map((i) => decode(parseInt(hex.slice(i, i + 2), 16) / 255)) as Vec3;
  const [l, a, b] = linearRgbToOklab(rgb);
  const c = Math.hypot(a, b);
  const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return fromLinear(rgb, l, c, h);
}

/** Interpolate from `a` to `b` in OKLab. `t = 0` returns `a`. */
export function mix(a: Color, b: Color, t: number): Color {
  const [l1, a1, b1] = lch(a.l, a.c, a.h);
  const [l2, a2, b2] = lch(b.l, b.c, b.h);
  const lab: Vec3 = [l1 + (l2 - l1) * t, a1 + (a2 - a1) * t, b1 + (b2 - b1) * t];
  const c = Math.hypot(lab[1], lab[2]);
  const h = ((Math.atan2(lab[2], lab[1]) * 180) / Math.PI + 360) % 360;
  return oklch(lab[0], c, h);
}

/** `#rrggbbaa` with the given opacity. */
export function alpha(color: Color, opacity: number): string {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255);
  return color.hex + a.toString(16).padStart(2, '0');
}

/**
 * A translucent `#rrggbbaa` that looks exactly like `target` when drawn over
 * `background`. Apps that stack highlights (selection over search matches,
 * for example) need translucent colors, but the design is specified as the
 * opaque result. Uses the lowest opacity, starting at `minOpacity`, that keeps
 * every channel in range.
 */
export function translucent(target: Color, background: Color, minOpacity = 0.35): string {
  const t = rgb(target);
  const b = rgb(background);
  for (let a = minOpacity; a < 1; a += 0.05) {
    const channels = t.map((tv, i) => (tv - (1 - a) * b[i]!) / a);
    if (channels.every((v) => v >= 0 && v <= 255)) {
      return '#' + [...channels, a * 255].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    }
  }
  return target.hex + 'ff';
}

/** sRGB channels, 0–255. */
export function rgb(color: Color): Vec3 {
  return [1, 3, 5].map((i) => parseInt(color.hex.slice(i, i + 2), 16)) as Vec3;
}

/** HSL as `[degrees, percent, percent]`, for apps that configure accents in HSL. */
export function hsl(color: Color): Vec3 {
  const [r, g, b] = rgb(color).map((v) => v / 255) as Vec3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

/** WCAG 2.x contrast ratio, 1–21. */
export function contrast(a: Color, b: Color): number {
  const [hi, lo] = a.luminance > b.luminance ? [a, b] : [b, a];
  return (hi.luminance + 0.05) / (lo.luminance + 0.05);
}
