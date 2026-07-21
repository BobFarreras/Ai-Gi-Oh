// src/services/story/map-definitions/act-4-map-definition.ts - Nodos virtuales del Acto 4 (Núcleo GenNvim).
// El Acto 4 se juega en el overworld; esta definición solo aporta los nodos VIRTUALES que las rutas del
// servidor necesitan por id. FASE 2: la placa del laberinto (EVENT, persiste vía mark-interacted para que la
// compuerta siga abierta tras un duelo → anti soft-lock). Rivales/recompensas/eventos llegan en fases siguientes.
import {
  IStoryActMapDefinition,
  IStoryMapVirtualNodeDefinition,
} from "@/services/story/map-definitions/story-map-definition-types";

function v(
  input: Omit<
    IStoryMapVirtualNodeDefinition,
    "chapter" | "difficulty" | "isBossDuel" | "rewardNexus" | "rewardPlayerExperience" | "opponentName" | "href"
  > &
    Partial<
      Pick<
        IStoryMapVirtualNodeDefinition,
        "chapter" | "difficulty" | "isBossDuel" | "rewardNexus" | "rewardPlayerExperience" | "opponentName" | "href"
      >
    >,
): IStoryMapVirtualNodeDefinition {
  return {
    chapter: 4,
    difficulty: "ELITE",
    isBossDuel: false,
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    opponentName: "GenNvim",
    href: "#",
    ...input,
  };
}

/**
 * Acto 4 — Núcleo GenNvim. Solo nodos virtuales interactivos del overworld.
 * Las posiciones son nominales (el overworld no las usa; están por contrato del tipo).
 */
export const storyAct4MapDefinition: IStoryActMapDefinition = {
  act: 4,
  nodes: [],
  virtualNodes: [
    // Placa de presión del laberinto: al pulsarla (caja encima) se enclava y persiste (mark-interacted),
    // manteniendo abierta la compuerta que da acceso a las plantas altas (evita el soft-lock tras un duelo).
    v({ id: "story-ch4-plate-lab", duelIndex: 401, nodeType: "EVENT", title: "Placa del Laberinto", unlockRequirementNodeId: null, position: { x: 200, y: 200 } }),
  ],
};
