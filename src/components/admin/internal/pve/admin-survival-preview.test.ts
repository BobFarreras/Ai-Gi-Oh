// src/components/admin/internal/pve/admin-survival-preview.test.ts - Verifica que la vista previa refleja el escalado real de una expedición.
import { describe, expect, it } from "vitest";
import { SurvivalDraft, previewSurvivalRun, resolveStageRanges } from "./admin-survival-preview";

const draft: SurvivalDraft = {
  startTier: 4,
  battlesPerTier: 2,
  roster: ["training-tier-1", "training-tier-2"],
  milestoneInterval: 5,
  milestoneHeal: 2000,
  stages: [
    { fromBattle: 1, aiProfile: "HARD", maxTier: 5, maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "base" },
    { fromBattle: 5, aiProfile: "MYTHIC", maxTier: 5, maxLpBonus: 1000, statBonusPerRank: 175, rewardDefinitionId: "asc" },
  ],
};

describe("previewSurvivalRun", () => {
  it("recorre el roster en orden circular", () => {
    const rows = previewSurvivalRun(draft, 4);
    expect(rows.map((row) => row.opponentId)).toEqual([
      "training-tier-1", "training-tier-2", "training-tier-1", "training-tier-2",
    ]);
  });

  it("sube un tier cada bloque de combates y lo frena en el tope del tramo", () => {
    const rows = previewSurvivalRun(draft, 8);
    expect(rows.map((row) => row.effectiveTier)).toEqual([4, 4, 5, 5, 5, 5, 5, 5]);
  });

  it("cambia el perfil de IA al entrar en el tramo siguiente", () => {
    const rows = previewSurvivalRun(draft, 6);
    expect(rows[3].aiProfile).toBe("HARD");
    expect(rows[4].aiProfile).toBe("MYTHIC");
  });

  it("acumula Ascensión por vuelta completa una vez alcanzado el tier máximo", () => {
    const rows = previewSurvivalRun(draft, 8);
    // El tier tope llega en el combate 3, así que la primera vuelta de Ascensión se cierra en el 5.
    expect(rows[2].ascensionRank).toBe(0);
    expect(rows[4].ascensionRank).toBe(1);
    expect(rows[4].opponentLpBonus).toBe(1000);
  });

  it("marca los combates que curan al jugador", () => {
    const rows = previewSurvivalRun(draft, 10);
    expect(rows.filter((row) => row.isMilestone).map((row) => row.battleIndex)).toEqual([5, 10]);
  });

  it("no simula nada si el borrador aún no cubre el primer combate", () => {
    expect(previewSurvivalRun({ ...draft, roster: [] }, 5)).toEqual([]);
    expect(previewSurvivalRun({ ...draft, stages: [{ ...draft.stages[0], fromBattle: 3 }] }, 5)).toEqual([]);
  });
});

describe("resolveStageRanges", () => {
  it("cierra cada tramo justo antes del siguiente y deja el último abierto", () => {
    expect(resolveStageRanges(draft.stages)).toEqual([
      { fromBattle: 1, untilBattle: 4 },
      { fromBattle: 5, untilBattle: null },
    ]);
  });

  it("respeta el orden aunque los tramos lleguen desordenados", () => {
    expect(resolveStageRanges([draft.stages[1], draft.stages[0]])).toEqual([
      { fromBattle: 5, untilBattle: null },
      { fromBattle: 1, untilBattle: 4 },
    ]);
  });
});
