// src/services/survival/build-survival-battle-snapshot.ts - Construye y firma el estado inicial inmutable de una batalla.
import { createHash } from "node:crypto";
import { ISurvivalEncounter, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { getPlayerBoardLoadoutByPlayerId } from "@/services/game/get-player-board-deck";
import { getPlayerCombatModifiersByPlayerId } from "@/services/progression/get-player-combat-modifiers";
import { getArenaCatalog } from "@/services/training/get-arena-catalog";
import { resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";
import { resolveDifficultyScale } from "@/services/training/internal/training-card-scaling";
import { ValidationError } from "@/core/errors/ValidationError";
import { applySurvivalAscension } from "@/core/services/survival/apply-survival-ascension";
import { createSurvivalInitialState } from "./create-survival-initial-state";

const AI_DIFFICULTY: Record<ISurvivalEncounter["aiProfile"], OpponentDifficulty> = {
  HARD: "HARD", BOSS: "BOSS", MASTER: "MASTER", MYTHIC: "MYTHIC",
};

/** Crea el mismo snapshot que el servidor reproducirá al finalizar el combate. */
export async function buildSurvivalBattleSnapshot(
  playerId: string,
  run: ISurvivalRun,
  encounter: ISurvivalEncounter,
  seed: string,
) {
  const [loadout, catalog, combatModifiers] = await Promise.all([
    getPlayerBoardLoadoutByPlayerId(playerId),
    getArenaCatalog(),
    // Habilidades de combate del árbol (ficha 8): viajan dentro del snapshot firmado para que el replay
    // server-side aplique exactamente los mismos valores (no-fatal: si falla, ceros = arranque por defecto).
    getPlayerCombatModifiersByPlayerId(playerId),
  ]);
  if (!loadout.deck) throw new ValidationError("Necesitas un deck principal completo para Supervivencia.");
  const difficulty = AI_DIFFICULTY[encounter.aiProfile];
  const scale = resolveDifficultyScale(difficulty);
  const opponent = resolveTrainingOpponentLoadout({
    tier: encounter.effectiveTier,
    aiDifficulty: difficulty,
    tierWins: encounter.battleIndex - 1,
    tierMatches: encounter.battleIndex - 1,
    opponents: catalog.opponents ?? undefined,
    cardCatalog: catalog.cardCatalog ?? undefined,
    opponentId: encounter.opponentId,
    defaultScaling: scale,
  });
  const opponentDeck = applySurvivalAscension(
    opponent.deck,
    encounter.ascensionRank,
    encounter.statBonusPerRank,
  );
  const snapshot = createSurvivalInitialState({
    playerId,
    playerDeck: loadout.deck,
    playerFusionDeck: loadout.fusionDeck ?? [],
    opponentName: opponent.displayName,
    opponentDeck,
    opponentFusionDeck: applySurvivalAscension(
      opponent.fusionDeck,
      encounter.ascensionRank,
      encounter.statBonusPerRank,
    ),
    run,
    encounter,
    seed,
    playerCombatModifiers: combatModifiers,
  });
  const persistedSnapshot = { ...snapshot, idFactory: undefined };
  const snapshotHash = createHash("sha256").update(JSON.stringify(persistedSnapshot)).digest("hex");
  return { snapshot, snapshotHash, opponent };
}
