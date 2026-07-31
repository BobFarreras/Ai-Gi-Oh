// src/infrastructure/persistence/supabase/SupabaseSurvivalRepository.ts - Adapta Supervivencia a RPCs transaccionales privilegiadas.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository, ICompleteSurvivalBattleInput, IIssueSurvivalBattleInput } from "@/core/repositories/ISurvivalRepository";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { GameState } from "@/core/use-cases/GameEngine";
import { ICombatSession } from "@/core/entities/match";
import {
  mapSurvivalBattle,
  mapSurvivalRuleset,
  mapSurvivalRun,
  mapSurvivalStage,
} from "./internal/survival-repository-mappers";

type Row = Record<string, unknown>;

export class SupabaseSurvivalRepository implements ISurvivalRepository {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly writeClient: SupabaseClient,
  ) {}

  async getRuleset(version?: number) {
    const client = version === undefined ? this.readClient : this.writeClient;
    let query = client.from("survival_rulesets").select("*");
    query = version === undefined ? query.eq("is_active", true) : query.eq("version", version);
    const rulesetResult = await query.maybeSingle();
    if (rulesetResult.error) throw new ValidationError("No se pudo cargar el ruleset de Supervivencia.");
    if (!rulesetResult.data) return null;
    const stagesResult = await client.from("survival_scaling_stages").select("*").eq("ruleset_id", rulesetResult.data.id).order("from_battle");
    if (stagesResult.error) throw new ValidationError("No se pudo cargar el escalado de Supervivencia.");
    return {
      ruleset: mapSurvivalRuleset(rulesetResult.data as Row),
      stages: (stagesResult.data as Row[]).map(mapSurvivalStage),
    };
  }

  async getActiveRun(playerId: string) {
    const result = await this.readClient.from("player_survival_runs").select("*").eq("player_id", playerId).eq("status", "ACTIVE").maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar la expedición activa.");
    return result.data ? mapSurvivalRun(result.data as Row) : null;
  }

  async getRunById(playerId: string, runId: string) {
    const result = await this.readClient.from("player_survival_runs").select("*").eq("player_id", playerId).eq("id", runId).maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar la expedición.");
    return result.data ? mapSurvivalRun(result.data as Row) : null;
  }

  async getIssuedBattle(runId: string) {
    const result = await this.readClient.from("survival_battles").select("*").eq("run_id", runId).eq("status", "ISSUED").maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar el combate activo.");
    return result.data ? mapSurvivalBattle(result.data as Row) : null;
  }

  async getBattleById(playerId: string, battleId: string) {
    const result = await this.readClient
      .from("survival_battles")
      .select("*,player_survival_runs!inner(player_id)")
      .eq("battle_id", battleId)
      .eq("player_survival_runs.player_id", playerId)
      .maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar el combate de Supervivencia.");
    return result.data ? mapSurvivalBattle(result.data as Row) : null;
  }

  async getCombatSession(
    playerId: string,
    battleId: string,
  ): Promise<{ session: ICombatSession; snapshot: GameState } | null> {
    const result = await this.readClient.from("combat_sessions").select("*").eq("player_id", playerId).eq("battle_id", battleId).maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar la sesión de combate.");
    if (!result.data) return null;
    const row = result.data as Row;
    const snapshot = structuredClone(row.snapshot_json) as GameState;
    snapshot.idFactory = createSeededGameEngineIdFactory(String(row.seed));
    return {
      session: {
        id: String(row.id), battleId: String(row.battle_id), mode: "SURVIVAL",
        playerId: String(row.player_id), opponentId: String((snapshot.playerB as { id: string }).id),
        seed: String(row.seed), snapshotHash: String(row.snapshot_hash),
        protocolVersion: Number(row.protocol_version),
        issuedAtIso: String(row.issued_at), expiresAtIso: String(row.expires_at),
      },
      snapshot,
    };
  }

  async getProgress(playerId: string) {
    const [bestRunResult, walletResult] = await Promise.all([
      this.readClient.from("player_survival_runs").select("wins").eq("player_id", playerId)
        .order("wins", { ascending: false }).limit(1).maybeSingle(),
      this.readClient.from("combat_mode_wallets").select("ascension_fragments")
        .eq("player_id", playerId).maybeSingle(),
    ]);
    if (bestRunResult.error || walletResult.error) {
      throw new ValidationError("No se pudo cargar el progreso de Supervivencia.");
    }
    return {
      bestWins: Number(bestRunResult.data?.wins ?? 0),
      ascensionFragments: Number(walletResult.data?.ascension_fragments ?? 0),
    };
  }

  async startRun(playerId: string, maxLp: number, rulesetVersion: number) {
    const { data, error } = await this.writeClient.rpc("start_survival_run", {
      p_player_id: playerId, p_max_lp: maxLp, p_ruleset_version: rulesetVersion,
    });
    if (error || !data) throw new ValidationError("No se pudo iniciar la expedición de Supervivencia.");
    return mapSurvivalRun(data as Row);
  }

  async issueBattle(input: IIssueSurvivalBattleInput) {
    const { data, error } = await this.writeClient.rpc("issue_survival_battle", {
      p_player_id: input.playerId, p_run_id: input.runId, p_battle_id: input.battleId,
      p_opponent_id: input.opponentId, p_effective_tier: input.effectiveTier,
      p_ascension_rank: input.ascensionRank, p_seed: input.seed,
      p_snapshot_hash: input.snapshotHash, p_snapshot_json: input.snapshot,
      p_protocol_version: input.protocolVersion, p_expires_at: input.expiresAtIso,
    });
    if (error || !data) throw new ValidationError("No se pudo emitir el combate de Supervivencia.");
    return mapSurvivalBattle(data as Row);
  }

  async invalidateIssuedBattle(playerId: string, battleId: string): Promise<void> {
    const { error } = await this.writeClient.rpc("invalidate_survival_battle", {
      p_player_id: playerId,
      p_battle_id: battleId,
    });
    if (error) throw new ValidationError("No se pudo renovar el combate de Supervivencia.");
  }

  async forfeitIssuedBattle(playerId: string, battleId: string) {
    const { data, error } = await this.writeClient.rpc("forfeit_survival_battle", {
      p_player_id: playerId,
      p_battle_id: battleId,
    });
    if (error || !data) throw new ValidationError("No se pudo cerrar el combate abandonado de Supervivencia.");
    return mapSurvivalRun(data as Row);
  }

  async completeBattle(input: ICompleteSurvivalBattleInput) {
    const { data, error } = await this.writeClient.rpc("complete_survival_battle", {
      p_player_id: input.playerId, p_battle_id: input.battleId, p_outcome: input.outcome,
      p_ending_lp: input.endingLp, p_reward_json: input.reward, p_fragment_amount: input.fragmentAmount,
    });
    if (error || !data) throw new ValidationError("No se pudo completar el combate de Supervivencia.");
    return mapSurvivalRun(data as Row);
  }
}
