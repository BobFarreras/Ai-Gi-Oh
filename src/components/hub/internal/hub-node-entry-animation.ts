// src/components/hub/internal/hub-node-entry-animation.ts - Cálculo puro de escala de entrada para nodos 3D del hub.
export function resolveHubNodeEntryScale(elapsed: number, delay: number, duration = 0.42): number {
  if (elapsed <= delay) return 0;
  const normalized = Math.min(1, (elapsed - delay) / duration);
  return 1 - (1 - normalized) ** 3;
}
