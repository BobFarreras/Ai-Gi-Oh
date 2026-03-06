// src/components/hub/control-room-layout.ts - Define posiciones visuales de paneles para la sala de control del hub.
import { HubSectionType } from "@/core/entities/hub/IHubSection";

export interface IControlPanelPosition {
  left: string;
  top: string;
}

const CONTROL_PANEL_LAYOUT: Record<HubSectionType, IControlPanelPosition> = {
  STORY: { left: "50%", top: "34%" },
  MARKET: { left: "22%", top: "47%" },
  HOME: { left: "78%", top: "53%" },
  MULTIPLAYER: { left: "24%", top: "75%" },
  TRAINING: { left: "70%", top: "79%" },
};

export function getControlPanelPosition(sectionType: HubSectionType): IControlPanelPosition {
  return CONTROL_PANEL_LAYOUT[sectionType];
}
