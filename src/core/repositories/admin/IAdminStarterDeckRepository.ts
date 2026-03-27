// src/core/repositories/admin/IAdminStarterDeckRepository.ts - Contrato de persistencia para administrar plantillas starter deck desde panel interno.
import { ICard } from "@/core/entities/ICard";
import {
  IAdminStarterDeckTemplate,
  IAdminStarterDeckTemplateSummary,
} from "@/core/entities/admin/IAdminStarterDeckTemplate";

export interface IAdminStarterDeckRepository {
  listTemplateSummaries(): Promise<IAdminStarterDeckTemplateSummary[]>;
  getTemplate(templateKey: string): Promise<IAdminStarterDeckTemplate | null>;
  saveTemplate(templateKey: string, cardIds: string[]): Promise<void>;
  activateTemplate(templateKey: string): Promise<void>;
  listAvailableCards(): Promise<ICard[]>;
}
