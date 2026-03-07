// src/components/hub/internal/mobile-inspector-animation.ts - Utilidades para animar diálogos de inspección desde el punto pulsado.
export interface IInspectorOrigin {
  x: number;
  y: number;
}

export function resolveInspectorAnimationOffset(origin: IInspectorOrigin): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return {
    x: origin.x - window.innerWidth / 2,
    y: origin.y - window.innerHeight / 2,
  };
}
