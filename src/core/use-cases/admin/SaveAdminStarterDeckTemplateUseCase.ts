// src/core/use-cases/admin/SaveAdminStarterDeckTemplateUseCase.ts - Orquesta guardado de plantilla starter y activación exclusiva opcional.
import { IAdminSaveStarterDeckTemplateCommand } from "@/core/entities/admin/IAdminStarterDeckCommands";
import { IAdminStarterDeckRepository } from "@/core/repositories/admin/IAdminStarterDeckRepository";
import { validateAdminSaveStarterDeckTemplateCommand } from "@/core/services/admin/validate-admin-starter-deck-template";

export class SaveAdminStarterDeckTemplateUseCase {
  constructor(private readonly repository: IAdminStarterDeckRepository) {}

  async execute(command: IAdminSaveStarterDeckTemplateCommand): Promise<void> {
    validateAdminSaveStarterDeckTemplateCommand(command);
    await this.repository.saveTemplate(command.templateKey, command.cardIds);
    if (command.activate) await this.repository.activateTemplate(command.templateKey);
  }
}
