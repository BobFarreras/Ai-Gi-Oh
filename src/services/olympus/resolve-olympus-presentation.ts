// src/services/olympus/resolve-olympus-presentation.ts - Resuelve identidad visual de campeón y leyenda para el HUD.
import { IOlympusChampion, IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { getArenaCatalog } from "@/services/training/get-arena-catalog";
import { buildArenaOpponentsFromPresets } from "@/services/training/internal/build-arena-opponents-from-presets";

export interface IOlympusPresentation {
  championName: string;
  championAvatarUrl: string | null;
  legendName: string;
  legendAvatarUrl: string | null;
  legendIntroUrl: string | null;
  specialRules: string[];
}

/**
 * Se resuelve fuera de la construcción del snapshot para que reanudar una batalla ya emitida devuelva
 * la misma presentación que la emisión original, sin volver a barajar nada.
 */
export async function resolveOlympusPresentation(
  champion: IOlympusChampion,
  legend: IOlympusLegend,
): Promise<IOlympusPresentation> {
  const catalog = await getArenaCatalog();
  const opponents = catalog.opponents ?? buildArenaOpponentsFromPresets();
  const arenaOpponent = opponents[champion.arenaOpponentId];
  return {
    championName: arenaOpponent?.displayName ?? champion.id,
    championAvatarUrl: arenaOpponent?.avatarUrl ?? null,
    legendName: legend.displayName,
    legendAvatarUrl: legend.avatarPath,
    legendIntroUrl: legend.introPath,
    specialRules: legend.specialRules,
  };
}
