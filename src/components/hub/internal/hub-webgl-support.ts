// src/components/hub/internal/hub-webgl-support.ts - Detecta soporte WebGL para decidir entre escena 3D y fallback 2D.
export function supportsWebGL(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  const context =
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl") ??
    canvas.getContext("webgl2");
  return context !== null;
}
