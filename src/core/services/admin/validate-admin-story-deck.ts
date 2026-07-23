// src/core/services/admin/validate-admin-story-deck.ts - Validadores de integridad para edición de decks Story en panel admin.
import { IAdminSaveStoryDeckCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER, MIN_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";

const MAX_STORY_DECK_SIZE = 60;
const MAX_COPIES_PER_CARD = 3;
// Las cartas de fusión del duelo son OPCIONALES: se admiten 0, 1 o 2 (antes se exigían exactamente 2,
// lo que impedía guardar duelos sin fusiones y bloqueaba el guardado del deck/recompensas del duelo).
const STORY_FUSION_MAX_CARDS = 2;
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
  if (command.duelConfig.fusionCardIds.length > STORY_FUSION_MAX_CARDS) throw new ValidationError("El duelo admite como máximo 2 cartas de fusión.");
  if (command.duelConfig.fusionCardIds.some((cardId) => !cardId.trim())) throw new ValidationError("Las cartas de fusión del duelo requieren cardId válido.");
  if (new Set(command.duelConfig.fusionCardIds).size !== command.duelConfig.fusionCardIds.length) throw new ValidationError("No se puede repetir carta en el bloque de fusión del duelo.");
  if (command.duelConfig.rewardCardIds.some((cardId) => !cardId.trim())) throw new ValidationError("Las cartas de recompensa requieren cardId válido.");
  if (new Set(command.duelConfig.rewardCardIds).size !== command.duelConfig.rewardCardIds.length) throw new ValidationError("No se pueden duplicar cartas de recompensa en un mismo duelo.");
  // Los topes salen de las reglas del juego (nivel máximo de carta y versión máxima), no de números sueltos:
  // el nivel llegó a 100 hace tiempo y este validador se quedó clavado en 30, así que rechazaba escalados
  // perfectamente válidos. Los mensajes dicen QUÉ carta y QUÉ slot fallan, que es lo que el admin necesita.
  const maxCardLevel = getMaxCardLevel();
  for (const slot of command.duelConfig.slotOverrides) {
    if (!slot.cardId.trim()) throw new ValidationError("Cada override requiere cardId válido.");
    const at = `Slot ${slot.slotIndex + 1} (${slot.cardId})`;
    if (slot.slotIndex < 0 || slot.slotIndex >= MAX_STORY_DECK_SIZE) throw new ValidationError("slotIndex fuera de rango.");
    if (!Number.isInteger(slot.versionTier) || slot.versionTier < MIN_CARD_VERSION_TIER || slot.versionTier > MAX_CARD_VERSION_TIER) {
      throw new ValidationError(`${at}: la versión debe ser un entero entre ${MIN_CARD_VERSION_TIER} y ${MAX_CARD_VERSION_TIER}.`);
    }
    if (!Number.isInteger(slot.level) || slot.level < 0 || slot.level > maxCardLevel) {
      throw new ValidationError(`${at}: el nivel debe ser un entero entre 0 y ${maxCardLevel}.`);
    }
    if (!Number.isFinite(slot.xp) || slot.xp < 0) throw new ValidationError(`${at}: la XP no puede ser negativa.`);
  }
}

