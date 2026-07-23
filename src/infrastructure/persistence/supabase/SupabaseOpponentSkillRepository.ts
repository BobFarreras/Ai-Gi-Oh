// src/infrastructure/persistence/supabase/SupabaseOpponentSkillRepository.ts - Persistencia de las habilidades de
// combate asignadas a oponentes (Arena/Story). Lectura con el cliente de sesión (policy pública); escritura con
// el cliente privilegiado service-role (patrón de tablas de valor: el jugador no escribe estas filas).
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IOpponentSkillRank, OpponentSkillTargetType } from "@/core/entities/progression/IOpponentSkillRank";
import { IOpponentSkillRepository } from "@/core/repositories/IOpponentSkillRepository";
import { createPrivilegedWriteClientResolver } from "@/infrastructure/persistence/supabase/internal/resolve-privileged-write-client";

interface IOpponentSkillRankRow {
  opponent_id: string;
  opponent_type: string;
  node_id: string;
  rank: number;
}

function mapRow(row: IOpponentSkillRankRow): IOpponentSkillRank {
  return {
    opponentId: row.opponent_id,
    opponentType: row.opponent_type as OpponentSkillTargetType,
    nodeId: row.node_id,
    rank: row.rank,
  };
}

export class SupabaseOpponentSkillRepository implements IOpponentSkillRepository {
  private readonly writeClient: () => SupabaseClient;

  constructor(private readonly client: SupabaseClient) {
    this.writeClient = createPrivilegedWriteClientResolver();
  }

  async getOpponentRanks(opponentId: string, opponentType: OpponentSkillTargetType): Promise<IOpponentSkillRank[]> {
    const { data, error } = await this.client
      .from("opponent_skill_ranks")
      .select("opponent_id,opponent_type,node_id,rank")
      .eq("opponent_type", opponentType)
      .eq("opponent_id", opponentId);
    if (error) throw new ValidationError("No se pudieron cargar las habilidades del oponente.");
    return (data as IOpponentSkillRankRow[]).map(mapRow);
  }

  async setOpponentRank(opponentId: string, opponentType: OpponentSkillTargetType, nodeId: string, rank: number): Promise<void> {
    if (!Number.isInteger(rank) || rank < 1) throw new ValidationError("El rango de la habilidad debe ser un entero >= 1.");
    const { error } = await this.writeClient()
      .from("opponent_skill_ranks")
      .upsert(
        { opponent_id: opponentId, opponent_type: opponentType, node_id: nodeId, rank },
        { onConflict: "opponent_id,opponent_type,node_id" },
      );
    if (error) throw new ValidationError("No se pudo guardar la habilidad del oponente.");
  }

  async removeOpponentRank(opponentId: string, opponentType: OpponentSkillTargetType, nodeId: string): Promise<void> {
    const { error } = await this.writeClient()
      .from("opponent_skill_ranks")
      .delete()
      .eq("opponent_type", opponentType)
      .eq("opponent_id", opponentId)
      .eq("node_id", nodeId);
    if (error) throw new ValidationError("No se pudo eliminar la habilidad del oponente.");
  }
}
