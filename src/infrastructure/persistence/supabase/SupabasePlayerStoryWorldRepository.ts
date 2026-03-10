// src/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository.ts - Persistencia Supabase del cursor de mapa Story e historial de eventos.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";

interface IStoryWorldStateRow {
  player_id: string;
  current_node_id: string | null;
}

interface IStoryHistoryRow {
  event_id: string;
  player_id: string;
  node_id: string;
  kind: "MOVE" | "NODE_RESOLVED" | "REWARD_GRANTED";
  details: string;
  created_at: string;
}

function toHistoryEntity(row: IStoryHistoryRow): IPlayerStoryHistoryEvent {
  return {
    eventId: row.event_id,
    playerId: row.player_id,
    nodeId: row.node_id,
    kind: row.kind,
    details: row.details,
    createdAtIso: row.created_at,
  };
}

export class SupabasePlayerStoryWorldRepository implements IPlayerStoryWorldRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentNodeIdByPlayerId(playerId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("player_story_world_state")
      .select("player_id,current_node_id")
      .eq("player_id", playerId)
      .maybeSingle<IStoryWorldStateRow>();
    if (error) throw new ValidationError("No se pudo leer el nodo actual de Story.");
    return data?.current_node_id ?? null;
  }

  async saveCurrentNodeId(playerId: string, currentNodeId: string | null): Promise<void> {
    const { error } = await this.client
      .from("player_story_world_state")
      .upsert({ player_id: playerId, current_node_id: currentNodeId }, { onConflict: "player_id" });
    if (error) throw new ValidationError("No se pudo guardar el nodo actual de Story.");
  }

  async listHistoryByPlayerId(playerId: string, limit = 20): Promise<IPlayerStoryHistoryEvent[]> {
    const { data, error } = await this.client
      .from("player_story_history_events")
      .select("event_id,player_id,node_id,kind,details,created_at")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new ValidationError("No se pudo cargar el historial Story.");
    return ((data ?? []) as IStoryHistoryRow[]).map(toHistoryEntity);
  }

  async appendHistoryEvents(playerId: string, events: IPlayerStoryHistoryEvent[]): Promise<void> {
    if (events.length === 0) return;
    const rows = events.map((event) => ({
      event_id: event.eventId,
      player_id: playerId,
      node_id: event.nodeId,
      kind: event.kind,
      details: event.details,
      created_at: event.createdAtIso,
    }));
    const { error } = await this.client
      .from("player_story_history_events")
      .upsert(rows, { onConflict: "event_id" });
    if (error) throw new ValidationError("No se pudo guardar eventos de historial Story.");
  }
}
