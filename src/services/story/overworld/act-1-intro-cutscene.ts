// src/services/story/overworld/act-1-intro-cutscene.ts - Guion de la cutscene de intro del Acto 1 (BigLog aparece, informa y se va).
import { OverworldCutsceneStep } from "@/components/hub/story/overworld/engine/engine-types";

const BIGLOG_SPRITE = "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp";

/**
 * Intro: el operador sale del teletransporte, da dos pasos, BigLog aparece desde
 * el teletransporte y se acerca, lanza su briefing (con vídeo) y regresa al
 * teletransporte desapareciendo. Las coordenadas asumen el spawn (4,13) del Acto 1.
 */
export function buildAct1IntroCutscene(): OverworldCutsceneStep[] {
  return [
    { kind: "WAIT", seconds: 0.6 },
    { kind: "PLAYER_STEP", direction: "RIGHT" },
    { kind: "PLAYER_STEP", direction: "RIGHT" },
    { kind: "WAIT", seconds: 0.3 },
    { kind: "SPAWN_NPC", tileX: 3, tileY: 13, facing: "RIGHT", spriteSrc: BIGLOG_SPRITE },
    { kind: "NPC_WALK_TO", tileX: 5, tileY: 13 },
    { kind: "WAIT", seconds: 0.25 },
    { kind: "EVENT", nodeId: "story-a1-event-biglog-briefing" },
    { kind: "NPC_WALK_TO", tileX: 3, tileY: 13 },
    { kind: "DESPAWN_NPC" },
  ];
}
