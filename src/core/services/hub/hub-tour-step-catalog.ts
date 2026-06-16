// src/core/services/hub/hub-tour-step-catalog.ts - Catálogo de pasos del tour guiado del Hub vinculados a nodos y tutoriales.
import {
  ACADEMY_TRAINING_TUTORIAL_ROUTE,
  ACADEMY_TUTORIAL_ARSENAL_ROUTE,
  ACADEMY_TUTORIAL_MARKET_ROUTE,
} from "@/core/constants/routes/academy-routes";

export type HubTourStepId = "market" | "arsenal" | "combat";

export interface IHubTourStep {
  id: HubTourStepId;
  hubNodeId: string;
  tutorialNodeId: string;
  route: string;
  title: string;
  bigLogObjective: string;
  bigLogContext: string;
}

/**
 * Orden estable del tour: Market → Arsenal → Combate.
 * Cada paso enlaza un nodo real del Hub con su tutorial correspondiente.
 */
export const HUB_TOUR_STEPS: readonly IHubTourStep[] = [
  {
    id: "market",
    hubNodeId: "node-market",
    tutorialNodeId: "tutorial-market-basics",
    route: ACADEMY_TUTORIAL_MARKET_ROUTE,
    title: "Distrito Comercial",
    bigLogObjective: "Ve al nodo Market para aprender a comprar cartas y sobres.",
    bigLogContext: "El Mercado es el centro de recursos del sistema. Aquí conseguirás lo que necesitas para construir tu deck.",
  },
  {
    id: "arsenal",
    hubNodeId: "node-home",
    tutorialNodeId: "tutorial-arsenal-basics",
    route: ACADEMY_TUTORIAL_ARSENAL_ROUTE,
    title: "Arsenal",
    bigLogObjective: "Ve al nodo Arsenal para aprender a gestionar cartas, deck y fusiones.",
    bigLogContext: "Un duelista sin deck es solo código errante. En el Arsenal montarás tu estrategia.",
  },
  {
    id: "combat",
    hubNodeId: "node-story",
    tutorialNodeId: "tutorial-combat-basics",
    route: ACADEMY_TRAINING_TUTORIAL_ROUTE,
    title: "Archivo de Historia",
    bigLogObjective: "Ve al nodo Historia para iniciar tu primer combate tutorial.",
    bigLogContext: "La teoría no basta. Enfrentémonos a una simulación de combate antes de entrar al mundo real.",
  },
];
