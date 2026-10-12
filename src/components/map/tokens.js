/* Design tokens for the WebGL view. Three.js can't read CSS custom properties,
 * so the scene resolves them once from :root — with the index.css values as a
 * fallback, because Tailwind may drop theme vars nothing in CSS references. */

const FALLBACK = {
  paper: "#fbf5ea",
  paper2: "#f4ecdd",
  champagne: "#f7e6ca",
  concrete: "#9c9a9a",
  concreteLt: "#c3c0bb",
  graphite: "#464646",
  ink: "#000000",
  brick: "#a35e47",
  brickLit: "#8f4e39",
  soil: "#d8c6ab",
  soilDk: "#c2ac8d",
  grass: "#9aa383",
  scrub: "#8b9673",
  tree: "#6f7d59",
  treeDk: "#576344",
  road: "#9c9a9a",
  roadDk: "#86847f",
};

const VARS = {
  paper: "--color-paper",
  paper2: "--color-paper-2",
  champagne: "--color-champagne",
  concrete: "--color-concrete",
  concreteLt: "--color-concrete-lt",
  graphite: "--color-graphite",
  ink: "--color-ink",
  brick: "--color-brick",
  brickLit: "--color-brick-lit",
  soil: "--terrain-soil",
  soilDk: "--terrain-soil-dk",
  grass: "--terrain-grass",
  scrub: "--terrain-scrub",
  tree: "--terrain-tree",
  treeDk: "--terrain-tree-dk",
  road: "--terrain-road",
  roadDk: "--terrain-road-dk",
};

export function readTokens() {
  if (typeof window === "undefined") return { ...FALLBACK };
  const css = getComputedStyle(document.documentElement);
  const out = {};
  for (const [key, name] of Object.entries(VARS)) {
    const v = css.getPropertyValue(name).trim();
    out[key] = /^#[0-9a-f]{3,8}$/i.test(v) ? v : FALLBACK[key];
  }
  return out;
}
