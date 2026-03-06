// src/components/hub/nodes/hub-node-presets.tsx - Define iconos, estilos y decoración visual por tipo de sección del hub.
import { ComponentType } from "react";
import { BookOpen, Crosshair, Home, ShoppingCart, Swords } from "lucide-react";
import { HubSectionType } from "@/core/entities/hub/IHubSection";
import { HubNodeDecorHome } from "@/components/hub/nodes/HubNodeDecorHome";
import { HubNodeDecorMarket } from "@/components/hub/nodes/HubNodeDecorMarket";
import { HubNodeDecorMultiplayer } from "@/components/hub/nodes/HubNodeDecorMultiplayer";
import { HubNodeDecorStory } from "@/components/hub/nodes/HubNodeDecorStory";
import { HubNodeDecorTraining } from "@/components/hub/nodes/HubNodeDecorTraining";

interface IHubNodePreset {
  icon: ComponentType<{ className?: string }>;
  shellClass: string;
  Decor: ComponentType;
}

const HUB_NODE_PRESETS: Record<HubSectionType, IHubNodePreset> = {
  STORY: {
    icon: BookOpen,
    shellClass: "border-cyan-300/50 bg-[#071323]/86 shadow-[0_0_40px_rgba(8,145,178,0.35)]",
    Decor: HubNodeDecorStory,
  },
  MARKET: {
    icon: ShoppingCart,
    shellClass: "border-teal-300/45 bg-[#061221]/86 shadow-[0_0_34px_rgba(20,184,166,0.28)]",
    Decor: HubNodeDecorMarket,
  },
  HOME: {
    icon: Home,
    shellClass: "border-sky-300/50 bg-[#071223]/86 shadow-[0_0_34px_rgba(56,189,248,0.26)]",
    Decor: HubNodeDecorHome,
  },
  MULTIPLAYER: {
    icon: Swords,
    shellClass: "border-emerald-300/45 bg-[#061a24]/86 shadow-[0_0_36px_rgba(16,185,129,0.28)]",
    Decor: HubNodeDecorMultiplayer,
  },
  TRAINING: {
    icon: Crosshair,
    shellClass: "border-blue-300/45 bg-[#071628]/86 shadow-[0_0_36px_rgba(59,130,246,0.26)]",
    Decor: HubNodeDecorTraining,
  },
};

export function getHubNodePreset(sectionType: HubSectionType): IHubNodePreset {
  return HUB_NODE_PRESETS[sectionType];
}
