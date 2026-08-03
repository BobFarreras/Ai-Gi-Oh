// src/components/admin/internal/pve/admin-survival-preview.ts - Simula los primeros combates del ruleset en edición con el resolutor real.
import { IAdminSurvivalRuleset, IAdminSurvivalStage } from "@/core/entities/admin/IAdminPveModes";
import { ISurvivalRuleset, ISurvivalScalingStage } from "@/core/entities/survival/ISurvival";
import { resolveSurvivalEncounter } from "@/core/services/survival/resolve-survival-encounter";

export type SurvivalDraft = Pick<
  IAdminSurvivalRuleset,
  "startTier" | "battlesPerTier" | "roster" | "milestoneInterval" | "milestoneHeal" | "stages"
>;

export interface ISurvivalPreviewRow {
  battleIndex: number;
  opponentId: string;
  effectiveTier: number;
  aiProfile: IAdminSurvivalStage["aiProfile"];
  ascensionRank: number;
  opponentLpBonus: number;
  statBonusPerRank: number;
  /** Victoria que dispara curación, asumiendo que el jugador gana todos los combates anteriores. */
  isMilestone: boolean;
}

function toRulesetContract(draft: SurvivalDraft): ISurvivalRuleset {
  return {
    id: "draft",
    version: 0,
    startTier: draft.startTier,
    battlesPerTier: draft.battlesPerTier,
    roster: draft.roster,
    milestoneInterval: draft.milestoneInterval,
    milestoneHeal: draft.milestoneHeal,
  };
}

const toStageContract = (stage: IAdminSurvivalStage): ISurvivalScalingStage => ({ ...stage });

/**
 * Usa el mismo `resolveSurvivalEncounter` que el servidor: la vista previa no puede divergir de lo que
 * jugará el jugador, que es justo el motivo de tenerla. Devuelve vacío si el borrador aún no es jugable.
 */
export function previewSurvivalRun(draft: SurvivalDraft, battles: number): ISurvivalPreviewRow[] {
  if (draft.roster.length === 0 || draft.stages.length === 0) return [];
  if (!draft.stages.some((stage) => stage.fromBattle <= 1)) return [];
  const ruleset = toRulesetContract(draft);
  const stages = draft.stages.map(toStageContract);
  const rows: ISurvivalPreviewRow[] = [];
  for (let battleIndex = 1; battleIndex <= battles; battleIndex += 1) {
    try {
      const encounter = resolveSurvivalEncounter(ruleset, stages, battleIndex);
      rows.push({
        battleIndex,
        opponentId: encounter.opponentId,
        effectiveTier: encounter.effectiveTier,
        aiProfile: encounter.aiProfile as IAdminSurvivalStage["aiProfile"],
        ascensionRank: encounter.ascensionRank,
        opponentLpBonus: encounter.maxLpBonus,
        statBonusPerRank: encounter.statBonusPerRank * encounter.ascensionRank,
        isMilestone: draft.milestoneInterval > 0 && battleIndex % draft.milestoneInterval === 0,
      });
    } catch {
      // Un borrador incompleto deja de simular en vez de romper el panel entero.
      break;
    }
  }
  return rows;
}

/** Combate en el que cada tramo toma el relevo, para etiquetar su rango sin recalcularlo en la vista. */
export function resolveStageRanges(stages: IAdminSurvivalStage[]): { fromBattle: number; untilBattle: number | null }[] {
  const ordered = [...stages].sort((left, right) => left.fromBattle - right.fromBattle);
  return stages.map((stage) => {
    const next = ordered.find((candidate) => candidate.fromBattle > stage.fromBattle);
    return { fromBattle: stage.fromBattle, untilBattle: next ? next.fromBattle - 1 : null };
  });
}
