// src/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository.ts - Persistencia Supabase del estado compacto de navegación Story.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerStoryWorldCompactState } from "@/core/entities/story/IPlayerStoryWorldCompactState";
import {
  IPlayerOverworldPosition,
  IPlayerOverworldState,
  ISaveOverworldStateInput,
} from "@/core/entities/story/IPlayerOverworldState";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";

interface IStoryWorldStateRow {
  player_id: string;
  current_node_id: string | null;
  visited_node_ids?: string[] | null;
  interacted_node_ids?: string[] | null;
  overworld_map_id?: string | null;
  overworld_position?: { tileX?: unknown; tileY?: unknown } | null;
}

export class SupabasePlayerStoryWorldRepository implements IPlayerStoryWorldRepository {
  constructor(private readonly client: SupabaseClient) {}

  private normalizeStringArray(value: string[] | null | undefined): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.filter((entry) => typeof entry === "string" && entry.length > 0)));
  }

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

  async getCompactStateByPlayerId(playerId: string): Promise<IPlayerStoryWorldCompactState> {
    const { data, error } = await this.client
      .from("player_story_world_state")
      .select("player_id,current_node_id,visited_node_ids,interacted_node_ids")
      .eq("player_id", playerId)
      .maybeSingle<IStoryWorldStateRow>();
    if (error) throw new ValidationError("No se pudo cargar estado compacto de Story.");
    return {
      currentNodeId: data?.current_node_id ?? null,
      visitedNodeIds: this.normalizeStringArray(data?.visited_node_ids),
      interactedNodeIds: this.normalizeStringArray(data?.interacted_node_ids),
    };
  }

  async saveCompactStateByPlayerId(
    playerId: string,
    state: IPlayerStoryWorldCompactState,
  ): Promise<void> {
    const { error } = await this.client.from("player_story_world_state").upsert(
      {
        player_id: playerId,
        current_node_id: state.currentNodeId,
        visited_node_ids: this.normalizeStringArray(state.visitedNodeIds),
        interacted_node_ids: this.normalizeStringArray(state.interactedNodeIds),
      },
      { onConflict: "player_id" },
    );
    if (error) throw new ValidationError("No se pudo guardar estado compacto de Story.");
  }

  private normalizePosition(
    value: { tileX?: unknown; tileY?: unknown } | null | undefined,
  ): IPlayerOverworldPosition | null {
    if (!value || typeof value.tileX !== "number" || typeof value.tileY !== "number") return null;
    if (!Number.isInteger(value.tileX) || !Number.isInteger(value.tileY)) return null;
    return { tileX: value.tileX, tileY: value.tileY };
  }

  async getOverworldStateByPlayerId(playerId: string): Promise<IPlayerOverworldState> {
    const { data, error } = await this.client
      .from("player_story_world_state")
      .select("player_id,overworld_map_id,overworld_position")
      .eq("player_id", playerId)
      .maybeSingle<IStoryWorldStateRow>();
    if (error) throw new ValidationError("No se pudo cargar la posición de overworld Story.");
    return {
      mapId: data?.overworld_map_id ?? null,
      position: this.normalizePosition(data?.overworld_position),
    };
  }

  async saveOverworldState(playerId: string, input: ISaveOverworldStateInput): Promise<void> {
    const payload: Record<string, unknown> = {
      player_id: playerId,
      overworld_map_id: input.mapId,
      overworld_position: { tileX: input.position.tileX, tileY: input.position.tileY },
    };
    // Solo tocamos current_node_id cuando se pide explícitamente (no pisamos el resto del estado).
    if (input.currentNodeId !== undefined) payload.current_node_id = input.currentNodeId;
    const { error } = await this.client
      .from("player_story_world_state")
      .upsert(payload, { onConflict: "player_id" });
    if (error) throw new ValidationError("No se pudo guardar la posición de overworld Story.");
  }
}
