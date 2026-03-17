// src/services/story/resolve-story-node-interaction-dialogue.ts - Resuelve secuencias narrativas por nodo Story para interacciones no-duelo.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryDialogueLineMedia } from "@/services/story/story-node-dialogue-media";

export interface IStoryInteractionDialogueLine {
  actorId?: string;
  side?: "LEFT" | "RIGHT";
  visualKind?: "CHARACTER" | "CARD" | "MONSTER" | "OBJECT";
  speaker: string;
  text: string;
  portraitUrl?: string;
  audioUrl?: string;
  autoAdvanceMs?: number;
}

export interface IStoryNodeInteractionDialogue {
  title: string;
  soundtrackUrl?: string;
  lines: IStoryInteractionDialogueLine[];
}

const DIALOGUE_BY_NODE_ID: Record<string, IStoryNodeInteractionDialogue> = {
  "story-ch1-event-briefing": {
    title: "Terminal de Briefing",
    soundtrackUrl: "/audio/story/soundtruck.mp3",
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
    soundtrackUrl: "/audio/story/soundtruck.mp3",
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
  "story-ch1-transition-to-act2": {
    title: "Puerta de Acto",
    lines: [
      { speaker: "Sistema", text: "Ruta de ascenso desbloqueada. Preparando salto al Acto 2.", autoAdvanceMs: 2600 },
    ],
  },
  "story-ch2-transition-to-act1": {
    title: "Retorno de Acto",
    lines: [
      { speaker: "Sistema", text: "Canal inverso estable. Regresando al Acto 1.", autoAdvanceMs: 2600 },
    ],
  },
  "story-ch1-event-scout-log": {
    title: "Canal de Reconocimiento",
    soundtrackUrl: "/audio/story/soundtruck.mp3",
    lines: [
      {
        actorId: "opp-ch1-apprentice",
        side: "RIGHT",
        visualKind: "CHARACTER",
        speaker: "GenNvim",
        text: "Buenas, ten cuidado, por este camino hay oponentes con cartas trampa muy poderosas.",
      },
      {
        actorId: "player",
        side: "LEFT",
        visualKind: "CHARACTER",
        speaker: "Operador",
        text: "Entendido. Ajustaré mi ruta y guardaré recursos para responder a trampas.",
        autoAdvanceMs: 4200,
      },
      {
        actorId: "opp-ch1-apprentice",
        side: "RIGHT",
        visualKind: "CHARACTER",
        speaker: "GenNvim",
        text: "Si ves defensas en SET, no ataques a ciegas. Primero fuerza recursos y limpia la línea.",
        autoAdvanceMs: 4300,
      },
      {
        actorId: "player",
        side: "LEFT",
        visualKind: "CHARACTER",
        speaker: "Operador",
        text: "Perfecto. Mantendré presión con ritmo corto y reservaré respuesta para la próxima trampa.",
        autoAdvanceMs: 4300,
      },
    ],
  },
};

function buildFallbackDialogue(node: IStoryMapNodeRuntime): IStoryNodeInteractionDialogue {
  if (node.nodeType === "EVENT") {
    return {
      title: node.title,
      lines: [{ side: "RIGHT", visualKind: "CHARACTER", speaker: "Evento", text: "Se ejecuta una interacción narrativa sin combate." }],
      soundtrackUrl: "/audio/story/soundtruck.mp3",
    };
  }
  if (node.nodeType === "REWARD_CARD" || node.nodeType === "REWARD_NEXUS") {
    return {
      title: node.title,
      lines: [{ side: "RIGHT", visualKind: "OBJECT", speaker: "Sistema", text: "Recompensa registrada en la ruta de historia." }],
    };
  }
  return {
    title: node.title,
    lines: [{ side: "RIGHT", visualKind: "OBJECT", speaker: "Sistema", text: "Nodo de exploración procesado." }],
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
    soundtrackUrl: firstDialogue.soundtrackUrl,
    lines: [
      {
        side: "RIGHT",
        visualKind: "OBJECT",
        speaker: "Sistema",
        text: `Registro recurrente detectado (${interactionCount}). Optimizando resumen narrativo.`,
      },
      ...firstDialogue.lines.slice(0, 1),
    ],
  };
}
