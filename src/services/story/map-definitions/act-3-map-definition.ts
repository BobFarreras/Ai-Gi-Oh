// src/services/story/map-definitions/act-3-map-definition.ts - Registro de nodos virtuales del Acto 3 (Repositorio Fantasma).
// El Acto 3 se juega en el overworld (Canvas 2D); esta definición solo aporta los nodos VIRTUALES que
// las rutas del servidor necesitan por id: eventos/interruptores/terminal (persisten vía mark-interacted,
// nodeType EVENT) y cachés de recompensa (claim-reward, REWARD_NEXUS/REWARD_CARD). No usa mapa visual clásico.
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
    chapter: 3,
    difficulty: "STANDARD",
    isBossDuel: false,
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    opponentName: "Repositorio",
    href: "#",
    ...input,
  };
}

/**
 * Acto 3 — Repositorio Fantasma (Jaku). Solo nodos virtuales interactivos del overworld.
 * Las posiciones son nominales (el overworld no las usa; están por contrato del tipo).
 */
export const storyAct3MapDefinition: IStoryActMapDefinition = {
  act: 3,
  nodes: [],
  virtualNodes: [
    // Eventos narrativos + interactivos (persisten como EVENT vía mark-interacted).
    v({ id: "story-ch3-event-intro", duelIndex: 301, nodeType: "EVENT", title: "Umbral del Repositorio", unlockRequirementNodeId: null, position: { x: 200, y: 200 } }),
    v({ id: "story-ch3-event-corrupt-log", duelIndex: 302, nodeType: "EVENT", title: "Registro Corrupto", unlockRequirementNodeId: null, position: { x: 400, y: 200 } }),
    v({ id: "story-ch3-switch-entrance", duelIndex: 303, nodeType: "EVENT", title: "Interruptor de Entrada", unlockRequirementNodeId: null, position: { x: 600, y: 200 } }),
    v({ id: "story-ch3-switch-deep", duelIndex: 304, nodeType: "EVENT", title: "Interruptor Profundo", unlockRequirementNodeId: null, position: { x: 800, y: 200 } }),
    v({ id: "story-ch3-firewall-terminal", duelIndex: 305, nodeType: "EVENT", title: "Terminal del Cortafuegos", unlockRequirementNodeId: null, position: { x: 1000, y: 200 } }),
    // Placa de presión del puzzle de la caja: una vez pulsada se enclava (persiste vía mark-interacted)
    // para que la compuerta a la caché siga abierta tras el duelo obligatorio (evita el soft-lock).
    v({ id: "story-ch3-plate-1", duelIndex: 309, nodeType: "EVENT", title: "Placa de Presión", unlockRequirementNodeId: null, position: { x: 1200, y: 200 } }),
    // Cachés de recompensa (una sola vez, vía claim-reward).
    v({ id: "story-ch3-cache-1", duelIndex: 306, nodeType: "REWARD_NEXUS", title: "Caché de Nexus", rewardNexus: 420, unlockRequirementNodeId: null, position: { x: 200, y: 400 } }),
    v({ id: "story-ch3-cache-2", duelIndex: 307, nodeType: "REWARD_NEXUS", title: "Caché de Nexus", rewardNexus: 480, unlockRequirementNodeId: null, position: { x: 400, y: 400 } }),
    v({ id: "story-ch3-cache-card", duelIndex: 308, nodeType: "REWARD_CARD", title: "Fragmento de Datos", rewardCardId: "fusion-pytgress", unlockRequirementNodeId: null, position: { x: 600, y: 400 } }),
  ],
};
