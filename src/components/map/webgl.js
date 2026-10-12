/* One-off capability probe, run before the 3D chunk is even requested. The
 * probe context is released immediately so it doesn't count against the
 * browser's (small, per-page) limit of live WebGL contexts. */
export function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
