// src/services/story/overworld/act-2-biglog-cutscene.ts - Cutscene de BigLog en el Acto 2: al pisar la entrada del búnker, aparece, se acerca y (tras narrar) reta a combate.
import { OverworldCutsceneStep } from "@/components/hub/story/overworld/engine/engine-types";

const BIGLOG_SPRITE = "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp";

/**
 * BigLog aparece desde el fondo del búnker (33,30) y se acerca hasta plantarse frente al jugador,
 * que acaba de entrar por (33,25). Al terminar la cutscene la escena muestra la narración de
 * evaluación y arranca el combate.
 */
export function buildAct2BigLogCutscene(): OverworldCutsceneStep[] {
  return [
    { kind: "SPAWN_NPC", tileX: 33, tileY: 30, facing: "UP", spriteSrc: BIGLOG_SPRITE },
    { kind: "NPC_WALK_TO", tileX: 33, tileY: 27 },
    { kind: "WAIT", seconds: 0.3 },
  ];
}
