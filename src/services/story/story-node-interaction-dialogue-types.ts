// src/services/story/story-node-interaction-dialogue-types.ts - Contratos tipados de diálogo narrativo Story con soporte opcional de cinemática de video.
export interface IStoryInteractionDialogueLine {
  actorId?: string;
  side?: "LEFT" | "RIGHT";
  visualKind?: "CHARACTER" | "CARD" | "MONSTER" | "OBJECT";
  presentationMode?: "TERMINAL" | "DIRECT";
  speaker: string;
  text: string;
  portraitUrl?: string;
  counterpartPortraitUrl?: string;
  audioUrl?: string;
  autoAdvanceMs?: number;
}

export interface IStoryInteractionCinematicVideo {
  videoUrl: string;
  posterUrl?: string;
  skipLabel?: string;
  autoPlay?: boolean;
  loop?: boolean;
}

export interface IStoryNodeInteractionDialogue {
  title: string;
  cinematicVideo?: IStoryInteractionCinematicVideo;
  lines: IStoryInteractionDialogueLine[];
}
