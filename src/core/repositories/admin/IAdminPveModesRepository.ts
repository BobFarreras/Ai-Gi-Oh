// src/core/repositories/admin/IAdminPveModesRepository.ts - Puerto de administración de Supervivencia y Olimpo.
import {
  IAdminPveModesSnapshot,
  IPublishOlympusSettingsCommand,
  IPublishSurvivalRulesetCommand,
  IUpsertOlympusChampionCommand,
  IUpsertOlympusLegendCommand,
  IUpsertOlympusNodeCommand,
} from "@/core/entities/admin/IAdminPveModes";

export interface IAdminPveModesRepository {
  getSnapshot(): Promise<IAdminPveModesSnapshot>;
  /** Publica una versión nueva y mueve el flag activo; nunca reescribe la que usan las partidas en curso. */
  publishSurvivalRuleset(command: IPublishSurvivalRulesetCommand): Promise<number>;
  publishOlympusSettings(command: IPublishOlympusSettingsCommand): Promise<number>;
  upsertLegend(command: IUpsertOlympusLegendCommand): Promise<void>;
  upsertChampion(command: IUpsertOlympusChampionCommand): Promise<void>;
  upsertNode(command: IUpsertOlympusNodeCommand): Promise<void>;
  deleteLegend(id: string): Promise<void>;
  deleteNode(id: string): Promise<void>;
}
