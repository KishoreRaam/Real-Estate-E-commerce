// Probed once per page load; creating throwaway contexts isn't free.
let webglCache;
export function webglAvailable() {
  if (webglCache !== undefined) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    webglCache = false;
  }
  return webglCache;
}
