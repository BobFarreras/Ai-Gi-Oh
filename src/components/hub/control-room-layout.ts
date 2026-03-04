// src/components/hub/control-room-layout.ts - Define posiciones visuales de paneles para la sala de control del hub.
import { HubSectionType } from "@/core/entities/hub/IHubSection";

export interface IControlPanelPosition {
  left: string;
  top: string;
}

const CONTROL_PANEL_LAYOUT: Record<HubSectionType, IControlPanelPosition> = {
  STORY: { left: "50%", top: "25%" },
  MARKET: { left: "24%", top: "45%" },
  HOME: { left: "76%", top: "45%" },
  MULTIPLAYER: { left: "26%", top: "73%" },
  TRAINING: { left: "74%", top: "73%" },
};

export function getControlPanelPosition(sectionType: HubSectionType): IControlPanelPosition {
  return CONTROL_PANEL_LAYOUT[sectionType];
}
