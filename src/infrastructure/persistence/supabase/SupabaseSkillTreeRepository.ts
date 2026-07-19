// src/infrastructure/persistence/supabase/SupabaseSkillTreeRepository.ts - Árbol de habilidades (ficha 8): lee
// catálogo y rangos con el cliente de SESIÓN (policies de lectura); sube rango con la RPC service-role
// `rank_up_skill_node` (misma razón que la cartera: el jugador no escribe sus filas de valor).
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IPlayerSkillRank,
  IRankUpResult,
  ISkillNodePrerequisite,
  ISkillTreeNode,
} from "@/core/entities/progression/ISkillTreeNode";
import { IRankUpSkillNodeCommand, ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { SkillEffect } from "@/core/services/progression/skill-tree/skill-effect-types";
import { createPrivilegedWriteClientResolver } from "@/infrastructure/persistence/supabase/internal/resolve-privileged-write-client";

interface ISkillNodeRow {
  id: string;
  branch: string;
  tier: number;
  max_rank: number;
  cost_per_rank: number;
  effect: SkillEffect;
  prerequisites: ISkillNodePrerequisite[];
  display: ISkillTreeNode["display"];
}

interface ISkillRankRow {
  node_id: string;
  rank: number;
}

function mapNode(row: ISkillNodeRow): ISkillTreeNode {
  return {
    id: row.id,
    branch: row.branch as ISkillTreeNode["branch"],
    tier: row.tier,
    maxRank: row.max_rank,
    costPerRank: row.cost_per_rank,
    effect: row.effect,
    prerequisites: Array.isArray(row.prerequisites) ? row.prerequisites : [],
    display: row.display ?? { name: row.id, blurb: "" },
  };
}

export class SupabaseSkillTreeRepository implements ISkillTreeRepository {
  private readonly writeClient: () => SupabaseClient;

  constructor(private readonly client: SupabaseClient) {
    this.writeClient = createPrivilegedWriteClientResolver();
  }

  async getActiveCatalog(): Promise<ISkillTreeNode[]> {
    const { data, error } = await this.client
      .from("character_skill_nodes")
      .select("id,branch,tier,max_rank,cost_per_rank,effect,prerequisites,display")
      .eq("is_active", true)
      .order("tier", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar el catálogo del árbol de habilidades.");
    return (data as ISkillNodeRow[]).map(mapNode);
  }

  async getPlayerRanks(playerId: string): Promise<IPlayerSkillRank[]> {
    const { data, error } = await this.client
      .from("player_skill_ranks")
      .select("node_id,rank")
      .eq("player_id", playerId);
    if (error) throw new ValidationError("No se pudieron cargar los rangos del árbol del jugador.");
    return (data as ISkillRankRow[]).map((row) => ({ nodeId: row.node_id, rank: row.rank }));
  }

  async rankUp(command: IRankUpSkillNodeCommand): Promise<IRankUpResult> {
    const { data, error } = await this.writeClient().rpc("rank_up_skill_node", {
      p_player_id: command.playerId,
      p_node_id: command.nodeId,
      p_available_points: command.availablePoints,
      p_operation_id: command.operationId,
    });
    if (error) throw new ValidationError("No se pudo subir el rango de la habilidad.");
    const payload = (data ?? {}) as Record<string, unknown>;
    return {
      ok: payload.ok === true,
      nodeId: typeof payload.node_id === "string" ? payload.node_id : command.nodeId,
      rank: typeof payload.rank === "number" ? payload.rank : 0,
      reason: payload.reason as IRankUpResult["reason"],
      duplicate: payload.duplicate === true,
      pointsSpent: typeof payload.points_spent === "number" ? payload.points_spent : undefined,
      pointsAvailable: typeof payload.points_available === "number" ? payload.points_available : undefined,
    };
  }
}
