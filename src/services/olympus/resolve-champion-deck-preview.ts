// src/services/olympus/resolve-champion-deck-preview.ts - Resuelve el mazo prestado tal y como saldrá a combatir.
import { ICard } from "@/core/entities/ICard";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { resolveChampionBattleProfile } from "@/core/services/olympus/resolve-champion-battle-profile";
import { ValidationError } from "@/core/errors/ValidationError";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { getArenaCatalog } from "@/services/training/get-arena-catalog";
import { buildArenaOpponentsFromPresets } from "@/services/training/internal/build-arena-opponents-from-presets";
import { resolveChampionLoadout } from "./resolve-olympus-loadouts";

export interface IOlympusChampionDeckPreview {
  championId: string;
  displayName: string;
  deck: ICard[];
  fusionDeck: ICard[];
  /** Escala con la que saldrán las cartas, ya con los rangos del árbol aplicados. */
  level: number;
  versionTier: number;
  startingLp: number;
  energyBonus: number;
}

/**
 * Usa exactamente el mismo resolutor que `buildOlympusBattleSnapshot`: el jugador tiene que ver las
 * cartas con el nivel y la versión con los que van a salir, no una aproximación.
 */
export async function resolveChampionDeckPreview(
  repository: IOlympusRepository,
  playerId: string,
  championId: string,
): Promise<IOlympusChampionDeckPreview> {
  // Las cuatro lecturas son independientes: encadenarlas multiplicaba por cuatro la espera del diálogo.
  const [catalog, unlocked, progressList, arenaCatalog] = await Promise.all([
    repository.getCatalog(),
    repository.getUnlockedChampionIds(playerId),
    repository.getChampionProgress(playerId),
    getArenaCatalog(),
  ]);

  const champion = catalog.champions.find((candidate) => candidate.id === championId);
  if (!champion) throw new ValidationError("Ese campeón no está publicado.");
  if (!unlocked.includes(championId)) {
    throw new ValidationError("Debes derrotar a ese rival en su nivel antes de usarlo en Olimpo.");
  }

  const nodeRanks = progressList.find((entry) => entry.championId === championId)?.nodeRanks ?? {};
  const nodes = catalog.nodes.filter((node) => node.championId === championId);
  const profile = resolveChampionBattleProfile(champion, nodes, nodeRanks);

  const loadout = resolveChampionLoadout(
    champion,
    arenaCatalog.opponents ?? buildArenaOpponentsFromPresets(),
    arenaCatalog.cardCatalog ?? CARD_BY_ID,
    profile,
  );

  return {
    championId,
    displayName: loadout.displayName,
    deck: loadout.deck,
    fusionDeck: loadout.fusionDeck,
    level: profile.level,
    versionTier: profile.versionTier,
    startingLp: profile.startingLp,
    energyBonus: profile.energyBonus,
  };
}
