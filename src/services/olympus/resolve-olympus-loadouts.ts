// src/services/olympus/resolve-olympus-loadouts.ts - Hidrata el deck prestado del campeón y el deck legendario del rival.
import { ICard } from "@/core/entities/ICard";
import { IArenaDeckCardEntry, IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { IOlympusChampion } from "@/core/entities/olympus/IOlympus";
import { IOlympusChampionBattleProfile } from "@/core/services/olympus/resolve-champion-battle-profile";
import { IOlympusLegendDeckEntry } from "@/core/repositories/IOlympusRepository";
import { ValidationError } from "@/core/errors/ValidationError";
import { applyArenaCardScaling } from "@/services/training/internal/training-card-scaling";

export interface IOlympusLoadout {
  deck: ICard[];
  fusionDeck: ICard[];
}

/**
 * Sin selector explícito, las cartas emblemáticas son el fusion deck del campeón: es lo que define
 * su identidad y lo que la rama IDENTITY promete mejorar.
 */
function applySignatureLevel(
  entries: IArenaDeckCardEntry[],
  profile: IOlympusChampionBattleProfile,
  isFusionZone: boolean,
): IArenaDeckCardEntry[] {
  const selector = new Set(profile.signatureCardIds);
  const appliesToWholeZone = selector.size === 0 && isFusionZone;
  return entries.map((entry) => {
    if (!appliesToWholeZone && !selector.has(entry.cardId)) return entry;
    return { ...entry, level: profile.signatureLevel };
  });
}

/** El deck del campeón es su variante real de Arena, escalada por la inversión del jugador. */
export function resolveChampionLoadout(
  champion: IOlympusChampion,
  opponents: Record<string, IArenaOpponent>,
  cardCatalog: Map<string, ICard>,
  profile: IOlympusChampionBattleProfile,
): IOlympusLoadout & { displayName: string; avatarUrl: string } {
  const arenaOpponent = opponents[champion.arenaOpponentId];
  if (!arenaOpponent) throw new ValidationError("El campeón ya no tiene rival de Arena asociado.");
  const variant = arenaOpponent.variants.find((candidate) => candidate.id === champion.baseDeckVariantId);
  if (!variant) throw new ValidationError("El campeón ya no tiene su variante de mazo publicada.");
  const scale = { level: profile.level, versionTier: profile.versionTier, xp: profile.xp };
  return {
    displayName: arenaOpponent.displayName,
    avatarUrl: arenaOpponent.avatarUrl,
    deck: applyArenaCardScaling(applySignatureLevel(variant.deckCards, profile, false), scale, cardCatalog),
    fusionDeck: applyArenaCardScaling(applySignatureLevel(variant.fusionCards, profile, true), scale, cardCatalog),
  };
}

/** El deck legendario ya viaja versionado en BD: aquí solo se hidrata con el catálogo de cartas. */
export function resolveLegendLoadout(
  entries: IOlympusLegendDeckEntry[],
  cardCatalog: Map<string, ICard>,
): IOlympusLoadout {
  if (entries.length === 0) throw new ValidationError("La leyenda no tiene deck publicado.");
  const toArenaEntry = (entry: IOlympusLegendDeckEntry): IArenaDeckCardEntry => ({
    cardId: entry.cardId,
    versionTier: entry.versionTier,
    level: entry.level,
    xp: entry.xp,
    attackBonus: entry.attackBonus,
    defenseBonus: entry.defenseBonus,
  });
  const byZone = (zone: IOlympusLegendDeckEntry["zone"]) => entries
    .filter((entry) => entry.zone === zone)
    .sort((left, right) => left.position - right.position)
    .map(toArenaEntry);
  const scale = { level: 30, versionTier: 5, xp: 9800 };
  return {
    deck: applyArenaCardScaling(byZone("DECK"), scale, cardCatalog),
    fusionDeck: applyArenaCardScaling(byZone("FUSION"), scale, cardCatalog),
  };
}
