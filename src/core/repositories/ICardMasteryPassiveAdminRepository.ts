// src/core/repositories/ICardMasteryPassiveAdminRepository.ts - Contrato admin para leer pasivas mastery y asignar la pasiva V5 de cada carta.

/** Opción de pasiva mastery para el selector del panel admin. */
export interface IMasteryPassiveOption {
  id: string;
  name: string;
}

export interface ICardMasteryPassiveAdminRepository {
  /** Pasivas activas disponibles para asignar (orden alfabético por nombre). */
  listActivePassives(): Promise<IMasteryPassiveOption[]>;
  /** Mapa cardId → passiveSkillId de la pasiva V5 (solo a maestría). */
  listAssignments(): Promise<Record<string, string>>;
  /** Mapa cardId → passiveSkillId de la pasiva innata (activa desde V1). */
  listInnateAssignments(): Promise<Record<string, string>>;
  /** Fija la pasiva V5 de una carta (una única fila autoritativa por carta). */
  upsertAssignment(cardId: string, passiveSkillId: string): Promise<void>;
  /** Quita la pasiva V5 de una carta del mapa. */
  removeAssignment(cardId: string): Promise<void>;
  /** Fija (o limpia con null) la pasiva innata de una carta en el catálogo. */
  setInnatePassive(cardId: string, passiveSkillId: string | null): Promise<void>;
}
