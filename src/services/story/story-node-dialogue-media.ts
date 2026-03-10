// src/services/story/story-node-dialogue-media.ts - Catálogo local de retratos y audios por línea de diálogo Story.
interface IStoryDialogueLineMedia {
  portraitUrl?: string;
  audioUrl?: string;
}

const DIALOGUE_MEDIA_BY_NODE_ID: Record<string, IStoryDialogueLineMedia[]> = {
  "story-ch1-event-briefing": [
    {
      portraitUrl: "/assets/story/dialogues/canal-mando-01.png",
      audioUrl: "/audio/story/dialogues/ch1-briefing-01.mp3",
    },
    {
      portraitUrl: "/assets/story/dialogues/canal-mando-02.png",
      audioUrl: "/audio/story/dialogues/ch1-briefing-02.mp3",
    },
  ],
  "story-ch1-reward-cache": [
    {
      portraitUrl: "/assets/story/dialogues/sistema-cache-01.png",
      audioUrl: "/audio/story/dialogues/ch1-cache-01.mp3",
    },
  ],
  "story-ch2-event-signal": [
    {
      portraitUrl: "/assets/story/dialogues/senal-fantasma-01.png",
      audioUrl: "/audio/story/dialogues/ch2-signal-01.mp3",
    },
    {
      portraitUrl: "/assets/story/dialogues/senal-fantasma-02.png",
      audioUrl: "/audio/story/dialogues/ch2-signal-02.mp3",
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
