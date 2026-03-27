// src/core/services/admin/validate-admin-starter-deck-template.ts - Valida comandos de edición admin para mantener integridad de plantilla starter.
import { IAdminSaveStarterDeckTemplateCommand } from "@/core/entities/admin/IAdminStarterDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";

/**
 * Asegura formato mínimo y tamaño exacto de plantilla starter (20 slots).
 */
export function validateAdminSaveStarterDeckTemplateCommand(command: IAdminSaveStarterDeckTemplateCommand): void {
  if (!command.templateKey.trim()) throw new ValidationError("El templateKey es obligatorio.");
  if (command.cardIds.length !== HOME_DECK_SIZE) {
    throw new ValidationError("La plantilla starter debe tener exactamente 20 cartas.");
  }
  const hasInvalidCardId = command.cardIds.some((cardId) => typeof cardId !== "string" || cardId.trim().length === 0);
  if (hasInvalidCardId) throw new ValidationError("Todos los slots del starter deck requieren cardId válido.");
}
