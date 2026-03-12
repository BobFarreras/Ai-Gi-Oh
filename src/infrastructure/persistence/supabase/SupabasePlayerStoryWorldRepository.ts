// src/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository.ts - Persistencia Supabase del estado compacto de navegación Story.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerStoryWorldCompactState } from "@/core/entities/story/IPlayerStoryWorldCompactState";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";

interface IStoryWorldStateRow {
  player_id: string;
  current_node_id: string | null;
  visited_node_ids?: string[] | null;
  interacted_node_ids?: string[] | null;
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

}
