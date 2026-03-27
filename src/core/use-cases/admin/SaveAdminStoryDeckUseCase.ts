// src/core/use-cases/admin/SaveAdminStoryDeckUseCase.ts - Orquesta guardado de mazo Story admin con reglas de validación previas.
import { IAdminSaveStoryDeckCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { IAdminStoryDeckRepository } from "@/core/repositories/admin/IAdminStoryDeckRepository";
import { validateAdminSaveStoryDeckCommand } from "@/core/services/admin/validate-admin-story-deck";

export class SaveAdminStoryDeckUseCase {
  constructor(private readonly repository: IAdminStoryDeckRepository) {}

  async execute(command: IAdminSaveStoryDeckCommand): Promise<void> {
    validateAdminSaveStoryDeckCommand(command);
    await this.repository.saveDeck(command.deckListId, command.cardIds, command.duelConfig, command.updateBaseDeck);
  }
}

