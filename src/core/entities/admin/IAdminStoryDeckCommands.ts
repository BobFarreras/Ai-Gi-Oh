// src/core/entities/admin/IAdminStoryDeckCommands.ts - Comandos de guardado administrativo para mazos de oponentes Story.
export interface IAdminSaveStoryDeckCommand {
  deckListId: string;
  cardIds: string[];
}

