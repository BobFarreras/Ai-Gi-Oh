// src/infrastructure/persistence/supabase/SupabaseOlympusRepository.ts - Adapta Olimpo a RPCs transaccionales privilegiadas.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  ICompleteOlympusBattleInput,
  IIssueOlympusBattleInput,
  IOlympusCatalog,
  IOlympusRepository,
} from "@/core/repositories/IOlympusRepository";
import { IOlympusChampionProgress } from "@/core/entities/olympus/IOlympus";
import { ICombatJournalEntry, ICombatSession } from "@/core/entities/match";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { GameState } from "@/core/use-cases/GameEngine";
import {
  mapOlympusBattle,
  mapOlympusChampion,
  mapOlympusChampionProgress,
  mapOlympusLegend,
  mapOlympusLegendDeckEntry,
  mapOlympusSettings,
  mapOlympusUpgradeNode,
} from "./internal/olympus-repository-mappers";

type Row = Record<string, unknown>;

export class SupabaseOlympusRepository implements IOlympusRepository {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly writeClient: SupabaseClient,
  ) {}

  async getCatalog(): Promise<IOlympusCatalog> {
    const [settings, champions, nodes, legends] = await Promise.all([
      this.readClient.from("olympus_settings").select("*").eq("is_active", true).maybeSingle(),
      this.readClient.from("olympus_champions").select("*").eq("is_active", true).order("required_tier"),
      this.readClient.from("olympus_champion_upgrade_nodes").select("*").eq("is_active", true).order("sort_order"),
      this.readClient.from("olympus_opponents").select("*").eq("is_active", true).order("sort_order"),
    ]);
    if (settings.error || champions.error || nodes.error || legends.error) {
      throw new ValidationError("No se pudo cargar el catálogo de Olimpo.");
    }
    if (!settings.data) throw new ValidationError("Olimpo no tiene una configuración activa.");
    return {
      settings: mapOlympusSettings(settings.data as Row),
      champions: (champions.data as Row[]).map(mapOlympusChampion),
      nodes: (nodes.data as Row[]).map(mapOlympusUpgradeNode),
      legends: (legends.data as Row[]).map(mapOlympusLegend),
    };
  }

  async getLegendDeckEntries(opponentId: string) {
    const result = await this.readClient
      .from("olympus_opponent_deck_entries").select("*").eq("opponent_id", opponentId).order("position");
    if (result.error) throw new ValidationError("No se pudo cargar el deck legendario.");
    return (result.data as Row[]).map(mapOlympusLegendDeckEntry);
  }

  async getUnlockedChampionIds(playerId: string) {
    const result = await this.readClient
      .from("player_olympus_champion_unlocks").select("champion_id").eq("player_id", playerId);
    if (result.error) throw new ValidationError("No se pudieron cargar los campeones desbloqueados.");
    return (result.data as Row[]).map((row) => String(row.champion_id));
  }

  async getChampionProgress(playerId: string): Promise<IOlympusChampionProgress[]> {
    const result = await this.readClient
      .from("player_olympus_champion_progress").select("*").eq("player_id", playerId);
    if (result.error) throw new ValidationError("No se pudo cargar el progreso de campeones.");
    return (result.data as Row[]).map(mapOlympusChampionProgress);
  }

  async getDailyUsage(playerId: string, periodKey: string) {
    const result = await this.readClient.from("olympus_daily_usage").select("*")
      .eq("player_id", playerId).eq("period_key", periodKey).maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar el allowance diario.");
    if (!result.data) return null;
    const row = result.data as Row;
    return {
      periodKey: String(row.period_key),
      attemptsUsed: Number(row.attempts_used),
      dailyLimit: Number(row.daily_limit),
    };
  }

  async getFragmentBalance(playerId: string) {
    const result = await this.readClient.from("combat_mode_wallets")
      .select("ascension_fragments").eq("player_id", playerId).maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar la cartera de Fragmentos.");
    return Number(result.data?.ascension_fragments ?? 0);
  }

  async getDefeatedLegendIds(playerId: string) {
    const result = await this.readClient
      .from("olympus_first_victories").select("opponent_id").eq("player_id", playerId);
    if (result.error) throw new ValidationError("No se pudo cargar el historial de leyendas vencidas.");
    return (result.data as Row[]).map((row) => String(row.opponent_id));
  }

  async getIssuedBattle(playerId: string) {
    const result = await this.readClient.from("olympus_battles").select("*")
      .eq("player_id", playerId).eq("status", "ISSUED").maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar el combate activo de Olimpo.");
    return result.data ? mapOlympusBattle(result.data as Row) : null;
  }

  async getBattleById(playerId: string, battleId: string) {
    const result = await this.readClient.from("olympus_battles").select("*")
      .eq("player_id", playerId).eq("battle_id", battleId).maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar el combate de Olimpo.");
    return result.data ? mapOlympusBattle(result.data as Row) : null;
  }

  async getCombatSession(
    playerId: string,
    battleId: string,
  ): Promise<{ session: ICombatSession; snapshot: GameState; journalEntries: ICombatJournalEntry[] } | null> {
    const result = await this.readClient.from("combat_sessions").select("*")
      .eq("player_id", playerId).eq("battle_id", battleId).eq("mode", "OLYMPUS").maybeSingle();
    if (result.error) throw new ValidationError("No se pudo cargar la sesión de combate.");
    if (!result.data) return null;
    const row = result.data as Row;
    const snapshot = structuredClone(row.snapshot_json) as GameState;
    snapshot.idFactory = createSeededGameEngineIdFactory(String(row.seed));
    return {
      session: {
        id: String(row.id), battleId: String(row.battle_id), mode: "OLYMPUS",
        playerId: String(row.player_id), opponentId: String((snapshot.playerB as { id: string }).id),
        seed: String(row.seed), snapshotHash: String(row.snapshot_hash),
        protocolVersion: Number(row.protocol_version),
        issuedAtIso: String(row.issued_at), expiresAtIso: String(row.expires_at),
      },
      snapshot,
      journalEntries: Array.isArray(row.journal_json) ? row.journal_json as ICombatJournalEntry[] : [],
    };
  }

  async saveJournalCheckpoint(playerId: string, battleId: string, entries: ICombatJournalEntry[]) {
    const { data, error } = await this.writeClient.rpc("checkpoint_combat_session", {
      p_player_id: playerId, p_battle_id: battleId, p_journal: entries,
    });
    if (error) throw new ValidationError("No se pudo guardar el avance del combate.");
    return Number(data ?? 0);
  }

  async purchaseUpgrade(playerId: string, championId: string, nodeId: string, operationId: string) {
    const { data, error } = await this.writeClient.rpc("purchase_champion_upgrade", {
      p_player_id: playerId, p_champion_id: championId, p_node_id: nodeId, p_operation_id: operationId,
    });
    if (error) throw new ValidationError("No se pudo comprar la mejora del campeón.");
    return Number(data ?? 0);
  }

  async respecUpgrades(playerId: string, championId: string, operationId: string) {
    const { data, error } = await this.writeClient.rpc("respec_champion_upgrades", {
      p_player_id: playerId, p_champion_id: championId, p_operation_id: operationId,
    });
    if (error) throw new ValidationError("No se pudo reasignar el árbol del campeón.");
    return Number(data ?? 0);
  }

  async issueBattle(input: IIssueOlympusBattleInput) {
    const { data, error } = await this.writeClient.rpc("issue_olympus_battle", {
      p_player_id: input.playerId, p_battle_id: input.battleId, p_champion_id: input.championId,
      p_opponent_id: input.opponentId, p_seed: input.seed, p_snapshot_hash: input.snapshotHash,
      p_snapshot_json: input.snapshot, p_protocol_version: input.protocolVersion,
      p_champion_snapshot_hash: input.championSnapshotHash,
      p_opponent_snapshot_hash: input.opponentSnapshotHash, p_expires_at: input.expiresAtIso,
    });
    if (error || !data) throw new ValidationError("No se pudo emitir el combate de Olimpo.");
    return mapOlympusBattle(data as Row);
  }

  async invalidateIssuedBattle(playerId: string, battleId: string): Promise<void> {
    const { error } = await this.writeClient.rpc("invalidate_olympus_battle", {
      p_player_id: playerId, p_battle_id: battleId,
    });
    if (error) throw new ValidationError("No se pudo renovar el combate de Olimpo.");
  }

  async forfeitIssuedBattle(playerId: string, battleId: string) {
    const { data, error } = await this.writeClient.rpc("forfeit_olympus_battle", {
      p_player_id: playerId, p_battle_id: battleId,
    });
    if (error || !data) throw new ValidationError("No se pudo cerrar el combate abandonado de Olimpo.");
    return mapOlympusBattle(data as Row);
  }

  async completeBattle(input: ICompleteOlympusBattleInput) {
    const { data, error } = await this.writeClient.rpc("complete_olympus_battle", {
      p_player_id: input.playerId, p_battle_id: input.battleId, p_outcome: input.outcome,
      p_reward_json: input.reward, p_fragment_amount: input.fragmentAmount,
      p_nexus_amount: input.nexusAmount, p_card_reward_id: input.cardRewardId,
    });
    if (error || !data) throw new ValidationError("No se pudo completar el combate de Olimpo.");
    return mapOlympusBattle(data as Row);
  }
}
