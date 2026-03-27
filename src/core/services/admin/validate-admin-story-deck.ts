// src/core/services/admin/validate-admin-story-deck.ts - Validadores de integridad para edición de decks Story en panel admin.
import { IAdminSaveStoryDeckCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";

const MAX_STORY_DECK_SIZE = 60;
const MAX_COPIES_PER_CARD = 3;
const DIFFICULTIES = new Set(["ROOKIE", "STANDARD", "ELITE", "BOSS", "MYTHIC"]);

/**
 * Verifica formato, tamaño y copias máximas por carta para persistir un mazo Story.
 */
export function validateAdminSaveStoryDeckCommand(command: IAdminSaveStoryDeckCommand): void {
  if (!command.deckListId.trim()) throw new ValidationError("El deckListId es obligatorio.");
  if (command.updateBaseDeck) {
    if (command.cardIds.length === 0) throw new ValidationError("El mazo Story no puede quedar vacío.");
    if (command.cardIds.length > MAX_STORY_DECK_SIZE) throw new ValidationError("El mazo Story no puede superar 60 cartas.");
    const copiesByCardId = new Map<string, number>();
    for (const cardId of command.cardIds) {
      if (!cardId.trim()) throw new ValidationError("Todas las cartas del mazo Story requieren cardId válido.");
      const nextCopies = (copiesByCardId.get(cardId) ?? 0) + 1;
      if (nextCopies > MAX_COPIES_PER_CARD) throw new ValidationError(`La carta ${cardId} supera el máximo de 3 copias.`);
      copiesByCardId.set(cardId, nextCopies);
    }
  }
  if (!command.duelConfig && !command.updateBaseDeck) throw new ValidationError("Debes enviar configuración de duelo o activar actualización de deck base.");
  if (!command.duelConfig) return;
  if (!command.duelConfig.duelId.trim()) throw new ValidationError("duelId es obligatorio al guardar configuración de duelo.");
  if (!DIFFICULTIES.has(command.duelConfig.difficulty)) throw new ValidationError("La dificultad del duelo no es válida.");
  if (!command.duelConfig.aiProfile.style.trim()) throw new ValidationError("El perfil IA requiere style.");
  if (command.duelConfig.aiProfile.aggression < 0 || command.duelConfig.aiProfile.aggression > 1) throw new ValidationError("La agresividad IA debe estar entre 0 y 1.");
  for (const slot of command.duelConfig.slotOverrides) {
    if (!slot.cardId.trim()) throw new ValidationError("Cada override requiere cardId válido.");
    if (slot.slotIndex < 0 || slot.slotIndex >= MAX_STORY_DECK_SIZE) throw new ValidationError("slotIndex fuera de rango.");
    if (slot.versionTier < 0 || slot.versionTier > 5) throw new ValidationError("versionTier debe estar entre 0 y 5.");
    if (slot.level < 0 || slot.level > 30) throw new ValidationError("level debe estar entre 0 y 30.");
    if (slot.xp < 0) throw new ValidationError("xp no puede ser negativo.");
  }
}

