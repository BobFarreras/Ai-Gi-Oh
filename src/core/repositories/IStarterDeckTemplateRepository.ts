// src/core/repositories/IStarterDeckTemplateRepository.ts - Contrato para leer la plantilla activa de deck inicial del onboarding.
export interface IStarterDeckTemplateRepository {
  getActiveStarterDeckCardIds(templateKey: string): Promise<string[]>;
}

