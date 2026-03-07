// src/services/story/get-story-map-runtime-data.ts - Construye el mapa Story del jugador con nodos bloqueados/desbloqueados desde repositorios.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/create-supabase-opponent-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { IStoryMapRuntimeData, IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function buildNodeMap(rawNodes: IStoryMapNodeRuntime[]): IStoryMapNodeRuntime[] {
  const completedById = new Set(rawNodes.filter((node) => node.isCompleted).map((node) => node.id));
  return rawNodes.map((node, index) => {
    if (index === 0) return { ...node, isUnlocked: true };
    const previousNode = rawNodes[index - 1];
    const unlockBySequence = previousNode ? completedById.has(previousNode.id) : true;
    return { ...node, isUnlocked: node.isUnlocked || unlockBySequence };
  });
}

export async function getStoryMapRuntimeData(): Promise<IStoryMapRuntimeData | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const opponentRepository = await createSupabaseOpponentRepository();
  const progressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const [duels, progress] = await Promise.all([
    opponentRepository.listStoryDuels(),
    progressRepository.listByPlayerId(session.user.id),
  ]);
  const progressByDuelId = new Map(progress.map((entry) => [entry.duelId, entry]));
  const completedById = new Set(progress.filter((entry) => entry.bestResult === "WON").map((entry) => entry.duelId));
  const rawNodes: IStoryMapNodeRuntime[] = duels.map((duel) => {
    const duelProgress = progressByDuelId.get(duel.id);
    const unlockedByRequirement = duel.unlockRequirementDuelId ? completedById.has(duel.unlockRequirementDuelId) : true;
    return {
      id: duel.id,
      chapter: duel.chapter,
      duelIndex: duel.duelIndex,
      title: duel.title,
      opponentName: duel.opponentName,
      difficulty: duel.opponentDifficulty,
      rewardNexus: duel.rewardNexus,
      rewardPlayerExperience: duel.rewardPlayerExperience,
      isBossDuel: duel.isBossDuel,
      isCompleted: duelProgress?.bestResult === "WON",
      isUnlocked: unlockedByRequirement,
      href: `/hub/story/chapter/${duel.chapter}/duel/${duel.duelIndex}`,
    };
  });
  return { playerId: session.user.id, nodes: buildNodeMap(rawNodes) };
}
