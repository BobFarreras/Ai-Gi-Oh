// src/services/olympus/resolve-olympus-champion-cards.ts - Añade identidad visual a los campeones para el selector del modo.
import { IOlympusChampionState } from "@/core/entities/olympus/IOlympus";
import { getArenaCatalog } from "@/services/training/get-arena-catalog";
import { buildArenaOpponentsFromPresets } from "@/services/training/internal/build-arena-opponents-from-presets";

export interface IOlympusChampionCard extends IOlympusChampionState {
  displayName: string;
  avatarUrl: string | null;
  /** Retrato de cuerpo entero; es el que el selector usa recortado, sin marco. */
  introUrl: string | null;
}

/**
 * El campeón no tiene identidad propia: es el rival de Arena al que ya venciste. Se resuelve en la capa
 * de servicios para que el caso de uso siga siendo dominio puro y testeable sin catálogo.
 */
export async function resolveOlympusChampionCards(champions: IOlympusChampionState[]): Promise<IOlympusChampionCard[]> {
  const catalog = await getArenaCatalog();
  const opponents = catalog.opponents ?? buildArenaOpponentsFromPresets();
  return champions.map((state) => {
    const arenaOpponent = opponents[state.champion.arenaOpponentId];
    return {
      ...state,
      displayName: arenaOpponent?.displayName ?? state.champion.id,
      avatarUrl: arenaOpponent?.avatarUrl ?? null,
      introUrl: arenaOpponent?.introUrl ?? null,
    };
  });
}
