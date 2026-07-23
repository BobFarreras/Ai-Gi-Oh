// src/services/progression/get-opponent-combat-modifiers.ts - Modificadores de COMBATE (stats) asignados a un
// oponente (Arena/Story) desde el admin. Une el catálogo ACTIVO del árbol con los rangos del oponente y agrega
// solo LP/energía. No-fatal: si no hay oponente o algo falla, devuelve ceros (el rival arranca por defecto).
import { OpponentSkillTargetType } from "@/core/entities/progression/IOpponentSkillRank";
import {
  EMPTY_OPPONENT_COMBAT_MODIFIERS,
  IOpponentCombatModifiers,
  resolveOpponentCombatModifiers,
} from "@/core/services/progression/skill-tree/resolve-opponent-combat-modifiers";
import { SupabaseOpponentSkillRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentSkillRepository";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function getOpponentCombatModifiers(
  opponentId: string | null | undefined,
  opponentType: OpponentSkillTargetType,
): Promise<IOpponentCombatModifiers> {
  if (!opponentId?.trim()) return EMPTY_OPPONENT_COMBAT_MODIFIERS;
  try {
    const client = await createSupabaseServerClient();
    const [catalog, ranks] = await Promise.all([
      new SupabaseSkillTreeRepository(client).getActiveCatalog(),
      new SupabaseOpponentSkillRepository(client).getOpponentRanks(opponentId, opponentType),
    ]);
    // Une catálogo activo × rangos del oponente (mismo join que el jugador; un nodo desactivado apaga su efecto).
    const rankByNodeId = new Map(ranks.map((entry) => [entry.nodeId, entry.rank]));
    const nodeStates = catalog.map((node) => ({ effect: node.effect, rank: rankByNodeId.get(node.id) ?? 0 }));
    return resolveOpponentCombatModifiers(nodeStates);
  } catch {
    return EMPTY_OPPONENT_COMBAT_MODIFIERS;
  }
}
