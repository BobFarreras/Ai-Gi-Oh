// src/components/hub/internal/hub-3d-node-math.ts - Utilidades puras para posición y color base de nodos 3D del hub.
import { HubSectionType } from "@/core/entities/hub/IHubSection";

interface IHubNodeWorldPosition {
  x: number;
  z: number;
}

export function resolveHubNodeWorldPosition(positionX: number, positionY: number): IHubNodeWorldPosition {
  return { x: (positionX - 50) * 0.4, z: (positionY - 50) * 0.4 };
}

export function resolveHubNodeBaseColor(sectionType: HubSectionType): string {
  switch (sectionType) {
    case "MARKET":
      return "#f59e0b";
    case "HOME":
      return "#10b981";
    case "MULTIPLAYER":
      return "#d946ef";
    case "TRAINING":
      return "#3b82f6";
    case "STORY":
      return "#0ea5e9";
    default:
      return "#06b6d4";
  }
}
