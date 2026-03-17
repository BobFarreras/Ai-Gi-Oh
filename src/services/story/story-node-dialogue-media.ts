// src/services/story/story-node-dialogue-media.ts - Catálogo local de retratos y audios por línea de diálogo Story.
interface IStoryDialogueLineMedia {
  portraitUrl?: string;
  audioUrl?: string;
}

const DIALOGUE_MEDIA_BY_NODE_ID: Record<string, IStoryDialogueLineMedia[]> = {
  "story-ch1-event-scout-log": [
    {
      portraitUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.png",
      // Punto de integración futuro: activar cuando exista el asset final de voz.
      // audioUrl: "/audio/story/dialogues/story-ch1-event-scout-log-line-01.mp3",
    },
    {
      portraitUrl: "/assets/story/player/bob.png",
    },
    {
      portraitUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.png",
    },
    {
      portraitUrl: "/assets/story/player/bob.png",
    },
  ],
};

/**
 * Devuelve recursos multimedia opcionales para una línea concreta de diálogo.
 */
export function resolveStoryDialogueLineMedia(nodeId: string, lineIndex: number): IStoryDialogueLineMedia {
  const resources = DIALOGUE_MEDIA_BY_NODE_ID[nodeId] ?? [];
  return resources[lineIndex] ?? {};
}
