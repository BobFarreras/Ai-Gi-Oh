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
    // Ranura del módulo (placa con beltToggleRect): al insertar la caja se enclava y PERSISTE (mark-interacted),
    // invirtiendo la pasarela del puente de forma permanente (aunque la caja se mueva luego, no hay soft-lock).
    v({ id: "story-ch4-belt-slot", duelIndex: 401, nodeType: "EVENT", title: "Ranura del Módulo", unlockRequirementNodeId: null, position: { x: 200, y: 200 } }),
    // Eventos narrativos (E1-E6 + puzzle). Persisten como EVENT vía mark-interacted; la narración vive en
    // story-node-interaction-dialogue-catalog. E1/E4/E6 serán vídeo (placeholder de narración de momento).
    v({ id: "story-ch4-event-intro", duelIndex: 403, nodeType: "EVENT", title: "Núcleo GenNvim", unlockRequirementNodeId: null, position: { x: 600, y: 200 } }),
    v({ id: "story-ch4-event-log-origin-1", duelIndex: 404, nodeType: "EVENT", title: "Log del Origen", unlockRequirementNodeId: null, position: { x: 800, y: 200 } }),
    v({ id: "story-ch4-event-belts", duelIndex: 405, nodeType: "EVENT", title: "Sala de Pasarelas", unlockRequirementNodeId: null, position: { x: 1000, y: 200 } }),
    v({ id: "story-ch4-event-belt-locked", duelIndex: 406, nodeType: "EVENT", title: "Flujo en Contra", unlockRequirementNodeId: null, position: { x: 200, y: 400 } }),
    v({ id: "story-ch4-event-revelation", duelIndex: 408, nodeType: "EVENT", title: "Registro-Madre", unlockRequirementNodeId: null, position: { x: 600, y: 400 } }),
    v({ id: "story-ch4-event-pre-midutech", duelIndex: 409, nodeType: "EVENT", title: "El Arquitecto", unlockRequirementNodeId: null, position: { x: 800, y: 400 } }),
    v({ id: "story-ch4-event-core-key", duelIndex: 410, nodeType: "EVENT", title: "Llave del Core", unlockRequirementNodeId: null, position: { x: 1000, y: 400 } }),
    // Recompensas-objeto (una vez, vía claim-reward): USB en el laberinto + aumentos ATK/DEF tras rivales.
    v({ id: "story-ch4-cache-usb", duelIndex: 411, nodeType: "REWARD_OBJECT", title: "USB Raro", rewardObjectType: "LEVEL_CANDY", rewardObjectId: "candy-usb-raro-1", rewardObjectQuantity: 1, unlockRequirementNodeId: null, position: { x: 200, y: 600 } }),
    v({ id: "story-ch4-cache-atk", duelIndex: 412, nodeType: "REWARD_OBJECT", title: "Núcleo Overclock", rewardObjectType: "CARD_UPGRADE", rewardObjectId: "item-nucleo-overclock", rewardObjectQuantity: 1, unlockRequirementNodeId: null, position: { x: 400, y: 600 } }),
    v({ id: "story-ch4-cache-def", duelIndex: 413, nodeType: "REWARD_OBJECT", title: "Placa Blindada", rewardObjectType: "CARD_UPGRADE", rewardObjectId: "item-placa-blindada", rewardObjectQuantity: 1, unlockRequirementNodeId: null, position: { x: 600, y: 600 } }),
  ],
};
