// src/services/story/resolve-story-node-interaction-dialogue.ts - Resuelve secuencias narrativas por nodo Story para interacciones no-duelo.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryDialogueLineMedia } from "@/services/story/story-node-dialogue-media";

export interface IStoryInteractionDialogueLine {
  speaker: string;
  text: string;
  portraitUrl?: string;
  audioUrl?: string;
}

export interface IStoryNodeInteractionDialogue {
  title: string;
  lines: IStoryInteractionDialogueLine[];
}

const DIALOGUE_BY_NODE_ID: Record<string, IStoryNodeInteractionDialogue> = {
  "story-ch1-event-briefing": {
    title: "Terminal de Briefing",
    lines: [
      { speaker: "Canal de mando", text: "Hemos interceptado tráfico en el eje norte." },
      { speaker: "Canal de mando", text: "Prioriza nodos de control antes del jefe de acto." },
    ],
  },
  "story-ch1-reward-cache": {
    title: "Cache de Recursos",
    lines: [
      { speaker: "Sistema", text: "Se abre contenedor seguro y se transfiere Nexus." },
      { speaker: "Sistema", text: "Recurso añadido al perfil del jugador." },
    ],
  },
  "story-ch2-event-signal": {
    title: "Señal Fantasma",
    lines: [
      { speaker: "Canal cifrado", text: "Patrón hostil detectado. Cambia tu ruta de aproximación." },
      { speaker: "Canal cifrado", text: "El núcleo Omega ya conoce tu firma." },
    ],
  },
  "story-ch2-reward-card": {
    title: "Alijo de Carta",
    lines: [
      { speaker: "Sistema", text: "Se detecta carta rara en almacenamiento temporal." },
      { speaker: "Sistema", text: "Recoge el recurso para reforzar el siguiente duelo." },
    ],
  },
};

function buildFallbackDialogue(node: IStoryMapNodeRuntime): IStoryNodeInteractionDialogue {
  if (node.nodeType === "EVENT") {
    return {
      title: node.title,
      lines: [{ speaker: "Evento", text: "Se ejecuta una interacción narrativa sin combate." }],
    };
  }
  if (node.nodeType === "REWARD_CARD" || node.nodeType === "REWARD_NEXUS") {
    return {
      title: node.title,
      lines: [{ speaker: "Sistema", text: "Recompensa registrada en la ruta de historia." }],
    };
  }
  return {
    title: node.title,
    lines: [{ speaker: "Sistema", text: "Nodo de exploración procesado." }],
  };
}

function withMultimedia(nodeId: string, dialogue: IStoryNodeInteractionDialogue): IStoryNodeInteractionDialogue {
  return {
    ...dialogue,
    lines: dialogue.lines.map((line, index) => ({ ...line, ...resolveStoryDialogueLineMedia(nodeId, index) })),
  };
}

/**
 * Devuelve la secuencia narrativa para nodos virtuales. Nodos de duelo no generan diálogo local.
 */
export function resolveStoryNodeInteractionDialogue(
  node: IStoryMapNodeRuntime,
  interactionCount = 1,
): IStoryNodeInteractionDialogue | null {
  if (!node.isVirtualNode && node.nodeType !== "EVENT" && node.nodeType !== "REWARD_CARD" && node.nodeType !== "REWARD_NEXUS") {
    return null;
  }
  const firstDialogue = withMultimedia(node.id, DIALOGUE_BY_NODE_ID[node.id] ?? buildFallbackDialogue(node));
  if (interactionCount <= 1) return firstDialogue;
  return {
    title: firstDialogue.title,
    lines: [
      {
        speaker: "Sistema",
        text: `Registro recurrente detectado (${interactionCount}). Optimizando resumen narrativo.`,
      },
      ...firstDialogue.lines.slice(0, 1),
    ],
  };
}
