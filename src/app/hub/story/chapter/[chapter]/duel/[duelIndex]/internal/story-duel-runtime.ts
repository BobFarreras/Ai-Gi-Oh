// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/internal/story-duel-runtime.ts - Resuelve runtime narrativo y táctico de duelo Story para desacoplar UI de construcción de dominio.
import { BoardBossThemeVariant } from "@/components/game/board";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { mapStoryDifficultyToOpponentDifficulty } from "@/core/services/opponent/difficulty/map-story-difficulty-to-opponent";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";
import { resolveStoryCoinToss } from "@/services/story/duel-flow/resolve-story-coin-toss";

interface IStoryDuelPresentationRuntime {
  playerAvatarUrl: string;
  opponentAvatarUrl: string;
  bossThemeVariant: BoardBossThemeVariant;
}

function resolveStoryBossThemeVariant(opponentId: string): BoardBossThemeVariant {
  const byOpponentId: Record<string, BoardBossThemeVariant> = {
    "opp-helena": "CRIMSON",
    "opp-ch2-omega": "VIOLET",
  };
  return byOpponentId[opponentId] ?? "CRIMSON";
}

/**
 * Construye parámetros visuales del duelo Story sin exponer reglas al componente.
 */
export function createStoryDuelPresentationRuntime(
  opponentId: string,
  opponentAvatarUrl?: string | null,
): IStoryDuelPresentationRuntime {
  return {
    playerAvatarUrl: "/assets/story/player/bob.png",
    opponentAvatarUrl: opponentAvatarUrl ?? "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png",
    bossThemeVariant: resolveStoryBossThemeVariant(opponentId),
  };
}

/**
 * Traduce dificultad Story al motor táctico y crea la estrategia rival.
 */
export function createStoryDuelOpponentStrategy(
  opponentDifficulty: StoryOpponentDifficulty,
  opponentAiProfile: IStoryAiProfile,
): HeuristicOpponentStrategy {
  return new HeuristicOpponentStrategy({
    difficulty: mapStoryDifficultyToOpponentDifficulty(opponentDifficulty),
    aiProfile: opponentAiProfile,
  });
}

/**
 * Genera paquete de narración para overlays de combate Story.
 */
export function createStoryDuelNarrationPack(input: {
  opponentId: string;
  opponentName: string;
  duelDescription: string;
}) {
  return buildStoryOpponentNarrationPack(input);
}

/**
 * Resuelve de forma determinista quién empieza el duelo Story.
 */
export function createStoryDuelCoinToss(input: { playerId: string; opponentId: string }) {
  return resolveStoryCoinToss(input);
}

