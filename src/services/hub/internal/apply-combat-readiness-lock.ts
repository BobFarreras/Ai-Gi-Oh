// src/services/hub/internal/apply-combat-readiness-lock.ts - Bloquea secciones de combate del Hub cuando el deck principal no está completo.
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { IPlayerBoardLoadout } from "@/services/game/get-player-board-deck";

const COMBAT_SECTION_TYPES = new Set(["TRAINING", "STORY", "MULTIPLAYER"]);

export function applyCombatReadinessLock(
  sections: readonly IHubSection[],
  loadout: IPlayerBoardLoadout,
): IHubSection[] {
  const isDeckReady = Boolean(loadout.deck && loadout.deck.length === HOME_DECK_SIZE);
  if (isDeckReady) return sections.map((section) => ({ ...section }));
  return sections.map((section) => {
    if (!COMBAT_SECTION_TYPES.has(section.type)) return { ...section };
    return {
      ...section,
      isLocked: true,
      lockReason: `Completa tu deck (${HOME_DECK_SIZE}/${HOME_DECK_SIZE}) en Arsenal para entrar en combate.`,
    };
  });
}
