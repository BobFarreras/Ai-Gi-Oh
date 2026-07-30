// src/services/survival/build-survival-battle-snapshot.ts - Construye y firma el estado inicial inmutable de una batalla.
import { createHash } from "node:crypto";
import { ISurvivalEncounter, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { getPlayerBoardLoadoutByPlayerId } from "@/services/game/get-player-board-deck";
import { getArenaCatalog } from "@/services/training/get-arena-catalog";
import { resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";
import { resolveDifficultyScale } from "@/services/training/internal/training-card-scaling";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICard } from "@/core/entities/ICard";

const AI_DIFFICULTY: Record<ISurvivalEncounter["aiProfile"], OpponentDifficulty> = {
  HARD: "HARD", BOSS: "BOSS", MASTER: "MASTER", MYTHIC: "MYTHIC",
};

/** Baraja una copia con seed propia por duelista para no correlacionar ambos órdenes. */
export function shuffleSurvivalDeck(deck: ICard[], seed: string): ICard[] {
  const random = createSeededRandom(seed);
  const shuffled = deck.map((card) => ({ ...card }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

/** Crea el mismo snapshot que el servidor reproducirá al finalizar el combate. */
export async function buildSurvivalBattleSnapshot(
  playerId: string,
  run: ISurvivalRun,
  encounter: ISurvivalEncounter,
  seed: string,
) {
  const [loadout, catalog] = await Promise.all([getPlayerBoardLoadoutByPlayerId(playerId), getArenaCatalog()]);
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
  const baseSnapshot = createInitialGameState({
    playerA: {
      id: playerId, name: "Arquitecto", deck: shuffleSurvivalDeck(loadout.deck, `${seed}:player-deck`),
      fusionDeck: loadout.fusionDeck ?? [], startingHealthPoints: run.currentLp,
    },
    playerB: {
      id: encounter.opponentId, name: opponent.displayName,
      deck: shuffleSurvivalDeck(opponent.deck, `${seed}:opponent-deck`), fusionDeck: opponent.fusionDeck,
    },
    maxHealthPoints: run.maxLp,
    randomSource: createSeededRandom(seed),
    idFactory: createSeededGameEngineIdFactory(seed),
  });
  // La Ascensión refuerza LP del rival sin inflar el máximo transportable del jugador.
  const snapshot = encounter.maxLpBonus > 0
    ? {
        ...baseSnapshot,
        playerB: {
          ...baseSnapshot.playerB,
          healthPoints: baseSnapshot.playerB.healthPoints + encounter.maxLpBonus,
          maxHealthPoints: baseSnapshot.playerB.maxHealthPoints + encounter.maxLpBonus,
        },
      }
    : baseSnapshot;
  const persistedSnapshot = { ...snapshot, idFactory: undefined };
  const snapshotHash = createHash("sha256").update(JSON.stringify(persistedSnapshot)).digest("hex");
  return { snapshot, snapshotHash, opponent };
}
