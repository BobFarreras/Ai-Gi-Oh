// src/services/story/story-node-dialogue-media.ts - Catálogo local de retratos y audios por línea de diálogo Story.
interface IStoryDialogueLineMedia {
  portraitUrl?: string;
  audioUrl?: string;
}

const DIALOGUE_MEDIA_BY_NODE_ID: Record<string, IStoryDialogueLineMedia[]> = {
  "story-a1-event-biglog-briefing": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
  ],
  "story-a1-event-special-card-signal": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
  ],
  "story-a1-side-event-echo-fragment": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
  ],
  "story-ch2-event-core": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
  ],
  "story-ch2-branch-lower-up-event": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
  ],
  "story-ch2-bridge-submission": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
  ],
  "story-ch2-link-recovered-event": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
  ],
  "story-ch2-duel-7": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp" },
  ],
  "story-ch2-duel-7-post-win": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp" },
  ],
  "story-ch2-duel-8": [
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
    { portraitUrl: "/assets/story/player/bob.webp" },
    { portraitUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" },
  ],
};

/**
 * Devuelve recursos multimedia opcionales para una línea concreta de diálogo.
 */
export function resolveStoryDialogueLineMedia(nodeId: string, lineIndex: number): IStoryDialogueLineMedia {
  const resources = DIALOGUE_MEDIA_BY_NODE_ID[nodeId] ?? [];
  return resources[lineIndex] ?? {};
}
