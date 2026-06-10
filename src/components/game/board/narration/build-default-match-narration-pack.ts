// src/components/game/board/narration/build-default-match-narration-pack.ts - Construye pack de narración por defecto sin depender de base de datos durante el duelo.
import { IMatchNarrationLine, IMatchNarrationPack } from "./types";

function line(seed: Omit<IMatchNarrationLine, "audioUrl" | "durationMs">, durationMs: number, audioUrl = "/audio/sfx/banner.m4a"): IMatchNarrationLine {
  return { ...seed, durationMs, audioUrl };
}

export function buildDefaultMatchNarrationPack(): IMatchNarrationPack {
  return {
    lines: [
      line({ id: "start-opponent", trigger: "MATCH_START", channel: "CINEMATIC", actor: "OPPONENT", text: "Te estaba esperando. Demuestra tu arquitectura." }, 3600),
      line({ id: "hit-dealt", trigger: "DIRECT_HIT_DEALT", channel: "HUD", actor: "OPPONENT", text: "Aún puedo resistir." }, 1800, "/audio/sfx/damage.m4a"),
      line({ id: "hit-taken-player", trigger: "DIRECT_HIT_TAKEN", channel: "HUD", actor: "PLAYER", text: "Este duelo no ha acabado!!" }, 1800, "/audio/story/player/impacto-directo.m4a"),
      line({ id: "hit-taken", trigger: "DIRECT_HIT_TAKEN", channel: "HUD", actor: "OPPONENT", text: "Acaba con sus puntos de vida." }, 1800, "/audio/sfx/damage.m4a"),
      line({ id: "trap-player", trigger: "OPPONENT_TRAP_TRIGGERED", channel: "HUD", actor: "PLAYER", text: "¡TU ATAQUE FUE UN ERROR!" }, 1900, "/audio/story/player/trampa.m4a"),
      line({ id: "trap-opponent", trigger: "OPPONENT_TRAP_TRIGGERED", channel: "HUD", actor: "OPPONENT", text: "Has caído en mi trampa." }, 1900, "/audio/sfx/magic-attack.m4a"),
      line({ id: "fusion-player", trigger: "FUSION_SUMMONED", channel: "HUD", actor: "PLAYER", text: "¡DOS PODERES SE CONVIERTEN EN UNO!" }, 2200, "/audio/story/player/fusion.m4a"),
      line({ id: "fusion-opponent", trigger: "FUSION_SUMMONED", channel: "CINEMATIC", actor: "OPPONENT", text: "Tu estructura colapsará ante esta fusión." }, 3200, "/audio/sfx/fusion-summon.m4a"),
      line({ id: "win-opponent-defeat", trigger: "PLAYER_WIN", channel: "CINEMATIC", actor: "OPPONENT", text: "La próxima vez ganaré." }, 3600, "/audio/sfx/victory-stinger.m4a"),
      line({ id: "lose-player", trigger: "PLAYER_LOSE", channel: "CINEMATIC", actor: "OPPONENT", text: "Se acabó, he ganado." }, 3600, "/audio/sfx/game-over.m4a"),
    ],
  };
}
