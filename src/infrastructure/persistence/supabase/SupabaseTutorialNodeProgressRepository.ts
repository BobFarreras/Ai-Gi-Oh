// src/infrastructure/persistence/supabase/SupabaseTutorialNodeProgressRepository.ts - Persistencia Supabase del progreso de nodos tutorial.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { ITutorialNodeProgressRepository } from "@/core/repositories/ITutorialNodeProgressRepository";

interface ITutorialNodeProgressRow {
  player_id: string;
  node_id: string;
}

export class SupabaseTutorialNodeProgressRepository implements ITutorialNodeProgressRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCompletedNodeIds(playerId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("player_tutorial_node_progress")
      .select("player_id,node_id")
      .eq("player_id", playerId)
      .returns<ITutorialNodeProgressRow[]>();
    if (error) throw new ValidationError("No se pudo leer el progreso de nodos del tutorial.");
    return (data ?? []).map((row) => row.node_id);
  }

  async markNodeCompleted(playerId: string, nodeId: string): Promise<void> {
    const { error } = await this.client.from("player_tutorial_node_progress").upsert({
      player_id: playerId,
      node_id: nodeId,
    });
    if (error) throw new ValidationError("No se pudo guardar el progreso del nodo tutorial.");
  }
}
