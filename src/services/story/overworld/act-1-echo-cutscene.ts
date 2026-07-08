// src/services/story/overworld/act-1-echo-cutscene.ts - Cutscene de la subruta difícil: BigLog aparece en el corredor y avisa.
import { OverworldCutsceneStep } from "@/components/hub/story/overworld/engine/engine-types";

const BIGLOG_SPRITE = "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp";

/**
 * Al pisar el trigger del corredor de la subruta (jugador en 12,16), BigLog sube
 * desde el fondo del pasillo, se planta a su lado, avisa (narración) y se retira.
 */
export function buildAct1EchoCutscene(): OverworldCutsceneStep[] {
  return [
    { kind: "SPAWN_NPC", tileX: 12, tileY: 19, facing: "UP", spriteSrc: BIGLOG_SPRITE },
    { kind: "NPC_WALK_TO", tileX: 12, tileY: 17 },
    { kind: "WAIT", seconds: 0.25 },
    { kind: "EVENT", nodeId: "story-a1-side-event-echo-fragment" },
    { kind: "NPC_WALK_TO", tileX: 12, tileY: 19 },
    { kind: "DESPAWN_NPC" },
  ];
}
