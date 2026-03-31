// src/core/entities/admin/IAdminStarterDeckTemplate.ts - Contratos de datos para lectura y edición administrativa de plantilla starter deck.
import { ICard } from "@/core/entities/ICard";

export interface IAdminStarterDeckTemplateSummary {
  templateKey: string;
  isActive: boolean;
}

export interface IAdminStarterDeckTemplateSlot {
  slotIndex: number;
  cardId: string;
  card: ICard | null;
}

export interface IAdminStarterDeckTemplate {
  templateKey: string;
  isActive: boolean;
  slots: IAdminStarterDeckTemplateSlot[];
}

export interface IAdminStarterDeckTemplateData {
  summaries: IAdminStarterDeckTemplateSummary[];
  template: IAdminStarterDeckTemplate | null;
}
