import { fullLayouts, layout as fallbackLayout, vadasithurLayout as rawVadasithur } from "./plotData";
import { applyMockInsights } from "../../mock/plotInsights"; // MOCK: delete with src/mock/plotInsights.js

/* The data-loading layer: every screen that shows plot facts gets its layout
 * from here, so per-plot insights are merged in exactly one place. Results
 * are cached per id — callers use the layout as a memo/effect dependency,
 * so it must be referentially stable. */
const merge = (l) => applyMockInsights(l); // MOCK: replace with real extraction merge (or identity)

const cache = new Map();

export function loadLayout(id) {
  const base = fullLayouts[id] ?? fallbackLayout;
  if (!cache.has(base.id)) cache.set(base.id, merge(base));
  return cache.get(base.id);
}

export const sampleLayout = loadLayout(fallbackLayout.id);
export const vadasithurLayout = loadLayout(rawVadasithur.id);
