// src/services/hub/internal/resolve-hub-runtime-progress.ts - Calcula capítulo y medallas del HUD con fuentes reales de Story y Arena.
interface IResolveHubRuntimeProgressInput {
  fallbackStoryChapter: number;
  fallbackMedals: number;
  storyCurrentNodeId: string | null;
  trainingTotalWins: number | null;
}

interface IHubRuntimeProgressValues {
  storyChapter: number;
  medals: number;
}

function resolveStoryChapterFromNodeId(nodeId: string | null): number | null {
  if (!nodeId) return null;
  const match = /story-(?:ch|a)(\d+)-/i.exec(nodeId);
  if (!match?.[1]) return null;
  const chapter = Number.parseInt(match[1], 10);
  return Number.isInteger(chapter) && chapter > 0 ? chapter : null;
}

/**
 * Prioriza señales runtime reales y mantiene fallback de `player_progress` si no hay datos aún.
 */
export function resolveHubRuntimeProgress(input: IResolveHubRuntimeProgressInput): IHubRuntimeProgressValues {
  const resolvedChapter = resolveStoryChapterFromNodeId(input.storyCurrentNodeId) ?? input.fallbackStoryChapter;
  const resolvedMedals = input.trainingTotalWins ?? input.fallbackMedals;
  return {
    storyChapter: Math.max(1, resolvedChapter),
    medals: Math.max(0, resolvedMedals),
  };
}
