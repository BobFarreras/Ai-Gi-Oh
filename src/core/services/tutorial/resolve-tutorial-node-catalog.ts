// src/core/services/tutorial/resolve-tutorial-node-catalog.ts - Catálogo base de nodos del nuevo tutorial narrativo y progresivo.
import { ITutorialMapNodeDefinition } from "@/core/entities/tutorial/ITutorialMapNode";

const DEFAULT_TUTORIAL_NODE_CATALOG: ITutorialMapNodeDefinition[] = [
  {
    id: "tutorial-arsenal-basics",
    order: 1,
    title: "Preparar Deck",
    description: "Aprende a añadir cartas, abrir detalle y gestionar evolución en una simulación guiada.",
    kind: "ARSENAL",
    href: "/hub/tutorial/arsenal",
  },
  {
    id: "tutorial-market-basics",
    order: 2,
    title: "Market",
    description: "Revisa filtros, compra de cartas/sobres y lectura de historial de transacciones.",
    kind: "MARKET",
    href: "/hub/tutorial/market",
  },
  {
    id: "tutorial-combat-basics",
    order: 3,
    title: "Combate Base",
    description: "Domina turnos, ataque/defensa, mágicas y el flujo central del duelo.",
    kind: "COMBAT",
    href: "/hub/training/tutorial",
  },
  {
    id: "tutorial-final-reward",
    order: 4,
    title: "Recompensa Final",
    description: "Completa todos los nodos para reclamar tu recompensa de onboarding.",
    kind: "REWARD",
    href: "/hub/tutorial/reward",
  },
];

/**
 * Permite inyectar catálogo custom para tests o balanceo futuro sin tocar UI.
 */
export function resolveTutorialNodeCatalog(
  input: { nodes: ITutorialMapNodeDefinition[] } = { nodes: DEFAULT_TUTORIAL_NODE_CATALOG },
): ITutorialMapNodeDefinition[] {
  return [...input.nodes].sort((a, b) => a.order - b.order);
}
