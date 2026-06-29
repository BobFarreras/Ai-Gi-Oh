// src/core/repositories/ICardMasteryPassiveAdminRepository.ts - Contrato admin para leer pasivas mastery y asignar la pasiva V5 de cada carta.

/** Opción de pasiva mastery para el selector del panel admin. */
export interface IMasteryPassiveOption {
  id: string;
  name: string;
}

export interface ICardMasteryPassiveAdminRepository {
  /** Pasivas activas disponibles para asignar (orden alfabético por nombre). */
  listActivePassives(): Promise<IMasteryPassiveOption[]>;
  /** Mapa cardId → passiveSkillId con la asignación efectiva (prioridad más baja gana). */
  listAssignments(): Promise<Record<string, string>>;
  /** Fija la pasiva V5 de una carta (una única fila autoritativa por carta). */
  upsertAssignment(cardId: string, passiveSkillId: string): Promise<void>;
}
