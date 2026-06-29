// src/infrastructure/persistence/supabase/admin/SupabaseCardMasteryPassiveAdminRepository.ts - Implementa el repo admin de pasivas mastery sobre card_passive_skills y card_mastery_passive_map.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  ICardMasteryPassiveAdminRepository,
  IMasteryPassiveOption,
} from "@/core/repositories/ICardMasteryPassiveAdminRepository";

interface IAssignmentRow {
  card_id: string;
  passive_skill_id: string;
}

interface IInnateRow {
  id: string;
  innate_passive_skill_id: string | null;
}

export class SupabaseCardMasteryPassiveAdminRepository implements ICardMasteryPassiveAdminRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listActivePassives(): Promise<IMasteryPassiveOption[]> {
    const { data, error } = await this.client
      .from("card_passive_skills")
      .select("id,name")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw new ValidationError("No se pudieron leer las pasivas mastery.");
    return (data ?? []) as IMasteryPassiveOption[];
  }

  async listAssignments(): Promise<Record<string, string>> {
    const { data, error } = await this.client
      .from("card_mastery_passive_map")
      .select("card_id,passive_skill_id,priority")
      .order("priority", { ascending: true });
    if (error) throw new ValidationError("No se pudieron leer las asignaciones de pasiva mastery.");
    const assignments: Record<string, string> = {};
    // Respeta la regla del motor: la prioridad más baja gana, así que solo se conserva la primera por carta.
    for (const row of (data ?? []) as IAssignmentRow[]) {
      if (!(row.card_id in assignments)) assignments[row.card_id] = row.passive_skill_id;
    }
    return assignments;
  }

  async listInnateAssignments(): Promise<Record<string, string>> {
    const { data, error } = await this.client
      .from("cards_catalog")
      .select("id,innate_passive_skill_id")
      .not("innate_passive_skill_id", "is", null);
    if (error) throw new ValidationError("No se pudieron leer las pasivas innatas.");
    const assignments: Record<string, string> = {};
    for (const row of (data ?? []) as IInnateRow[]) {
      if (row.innate_passive_skill_id) assignments[row.id] = row.innate_passive_skill_id;
    }
    return assignments;
  }

  async upsertAssignment(cardId: string, passiveSkillId: string): Promise<void> {
    await this.removeAssignment(cardId);
    const insertion = await this.client
      .from("card_mastery_passive_map")
      .insert({ card_id: cardId, passive_skill_id: passiveSkillId, priority: 1 });
    if (insertion.error) throw new ValidationError("No se pudo asignar la pasiva a la carta.");
  }

  async removeAssignment(cardId: string): Promise<void> {
    const removal = await this.client.from("card_mastery_passive_map").delete().eq("card_id", cardId);
    if (removal.error) throw new ValidationError("No se pudo actualizar la pasiva de la carta.");
  }

  async setInnatePassive(cardId: string, passiveSkillId: string | null): Promise<void> {
    const update = await this.client.from("cards_catalog").update({ innate_passive_skill_id: passiveSkillId }).eq("id", cardId);
    if (update.error) throw new ValidationError("No se pudo actualizar la pasiva innata de la carta.");
  }
}
