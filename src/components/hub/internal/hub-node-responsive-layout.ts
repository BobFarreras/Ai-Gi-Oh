// src/components/hub/internal/hub-node-responsive-layout.ts - Reescala posiciones de nodos según ancho de viewport para evitar solapes.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";

const MOBILE_NODE_LAYOUT_BY_TYPE: Partial<Record<IHubMapNode["sectionType"], { x: number; y: number }>> = {
  STORY: { x: 36, y: 14 },
  MARKET: { x: 64, y: 28 },
  HOME: { x: 50, y: 48 },
  MULTIPLAYER: { x: 42, y: 66 },
  TRAINING: { x: 58, y: 78 },
};

function clampNodeAxis(value: number): number {
  return Math.max(12, Math.min(88, value));
}

function resolveSpreadFactor(viewportWidth: number): number {
  if (viewportWidth < 640) return 0.78;
  if (viewportWidth < 1024) return 0.9;
  if (viewportWidth < 1440) return 1;
  return 1.08;
}

export function applyResponsiveNodeLayout(nodes: readonly IHubMapNode[], viewportWidth: number): IHubMapNode[] {
  if (viewportWidth < 640) {
    return nodes.map((node) => {
      const mobilePreset = MOBILE_NODE_LAYOUT_BY_TYPE[node.sectionType];
      if (!mobilePreset) return { ...node };
      return { ...node, positionX: mobilePreset.x, positionY: mobilePreset.y };
    });
  }
  const spreadFactor = resolveSpreadFactor(viewportWidth);
  return nodes.map((node) => {
    const nextX = clampNodeAxis(50 + (node.positionX - 50) * spreadFactor);
    const nextY = clampNodeAxis(50 + (node.positionY - 50) * spreadFactor);
    return { ...node, positionX: nextX, positionY: nextY };
  });
}
