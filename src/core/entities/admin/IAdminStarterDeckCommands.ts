// src/core/entities/admin/IAdminStarterDeckCommands.ts - Comandos de escritura administrativa para plantillas starter deck versionadas.
export interface IAdminSaveStarterDeckTemplateCommand {
  templateKey: string;
  cardIds: string[];
  activate: boolean;
}
