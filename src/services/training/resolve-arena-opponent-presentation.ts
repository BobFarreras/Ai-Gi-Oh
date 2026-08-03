// src/services/training/resolve-arena-opponent-presentation.ts - Resuelve identidad visual estable de un rival de Arena.
import { IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { ValidationError } from "@/core/errors/ValidationError";
import { buildArenaOpponentsFromPresets } from "./internal/build-arena-opponents-from-presets";

export interface IArenaOpponentPresentation {
  storyOpponentId: string;
  displayName: string;
  avatarUrl: string;
  introUrl: string;
}

/** Obtiene avatar y narrativa sin reconstruir ni alterar el deck del snapshot. */
export function resolveArenaOpponentPresentation(
  opponentId: string,
  opponents?: Record<string, IArenaOpponent>,
): IArenaOpponentPresentation {
  const opponent = (opponents ?? buildArenaOpponentsFromPresets())[opponentId];
  if (!opponent) throw new ValidationError(`No existe presentación de oponente para '${opponentId}'.`);
  return {
    storyOpponentId: opponent.storyOpponentId,
    displayName: opponent.displayName,
    avatarUrl: opponent.avatarUrl,
    introUrl: opponent.introUrl,
  };
}
