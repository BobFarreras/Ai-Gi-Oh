// src/components/hub/internal/hub-camera-fit.ts - Calcula una pose de cámara que encuadra nodos del hub según viewport.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { resolveHubNodeWorldPosition } from "@/components/hub/internal/hub-3d-node-math";

interface IHubCameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export function resolveHubCameraPose(nodes: readonly IHubMapNode[], viewportWidth: number): IHubCameraPose {
  if (nodes.length === 0) {
    return { position: [0, 15, 22], target: [0, 0, 0] };
  }
  const worldPositions = nodes.map((node) => resolveHubNodeWorldPosition(node.positionX, node.positionY));
  const xValues = worldPositions.map((position) => position.x);
  const zValues = worldPositions.map((position) => position.z);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const halfSpanX = (maxX - minX) / 2 + 1.2;
  const halfSpanZ = (maxZ - minZ) / 2 + 1.4;
  const minDistance = viewportWidth < 640 ? 32 : 22;
  const distance = Math.max(minDistance, halfSpanX * 2.2, halfSpanZ * 2.9);
  const targetYOffset = viewportWidth < 640 ? -1.8 : -0.6;
  return {
    position: [centerX, distance * 0.66, centerZ + distance],
    target: [centerX, targetYOffset, centerZ],
  };
}
