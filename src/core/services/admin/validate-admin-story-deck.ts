// src/core/services/admin/validate-admin-story-deck.ts - Validadores de integridad para edición de decks Story en panel admin.
import { IAdminSaveStoryDeckCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";

const MAX_STORY_DECK_SIZE = 60;
const MAX_COPIES_PER_CARD = 3;

/**
 * Verifica formato, tamaño y copias máximas por carta para persistir un mazo Story.
 */
export function validateAdminSaveStoryDeckCommand(command: IAdminSaveStoryDeckCommand): void {
  if (!command.deckListId.trim()) throw new ValidationError("El deckListId es obligatorio.");
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

