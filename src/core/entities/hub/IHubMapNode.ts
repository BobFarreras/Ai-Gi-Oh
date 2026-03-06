// src/core/entities/hub/IHubMapNode.ts - Representa un nodo visual de la ciudad central enlazado a una sección.
import { HubSectionType } from "@/core/entities/hub/IHubSection";

export interface IHubMapNode {
  id: string;
  sectionType: HubSectionType;
  positionX: number;
  positionY: number;
  districtLabel: string;
}
