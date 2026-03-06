// src/core/entities/hub/IHubSection.ts - Define tipos de sección y nodo visible del mundo central.
export type HubSectionType = "MARKET" | "HOME" | "TRAINING" | "STORY" | "MULTIPLAYER";

export interface IHubSection {
  id: string;
  type: HubSectionType;
  title: string;
  description: string;
  href: string;
  isLocked: boolean;
  lockReason: string | null;
}
