// src/infrastructure/repositories/internal/hub-static-data.ts - Catálogo estático de secciones y nodos del hub reutilizable por repositorios.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";

export const HUB_SECTIONS: ReadonlyArray<Omit<IHubSection, "isLocked" | "lockReason">> = [
  { id: "market", type: "MARKET", title: "Mercado", description: "Compra sobres, cartas y mejoras.", href: "/hub/market" },
  { id: "home", type: "HOME", title: "Arsenal", description: "Gestiona mazos, cartas y ajustes.", href: "/hub/home" },
  {
    id: "training",
    type: "TRAINING",
    title: "Entrenamiento",
    description: "Aprende reglas y domina tácticas.",
    href: "/hub/training",
  },
  { id: "story", type: "STORY", title: "Historia", description: "Progresa por capítulos y consigue medallas.", href: "/hub/story" },
  {
    id: "multiplayer",
    type: "MULTIPLAYER",
    title: "Multijugador",
    description: "Lucha contra otros duelistas en línea.",
    href: "/hub/multiplayer",
  },
];

export const HUB_MAP_NODES: ReadonlyArray<IHubMapNode> = [
  { id: "node-home", sectionType: "HOME", positionX: 50, positionY: 70, districtLabel: "Distrito Base" },
  { id: "node-market", sectionType: "MARKET", positionX: 24, positionY: 58, districtLabel: "Distrito Comercial" },
  { id: "node-training", sectionType: "TRAINING", positionX: 74, positionY: 56, districtLabel: "Dojo Táctico" },
  { id: "node-story", sectionType: "STORY", positionX: 36, positionY: 30, districtLabel: "Archivo de Historia" },
  { id: "node-multiplayer", sectionType: "MULTIPLAYER", positionX: 66, positionY: 26, districtLabel: "Portal Arena" },
];
