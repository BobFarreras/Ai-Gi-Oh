// src/services/admin/api/read-admin-pve-command.test.ts - Verifica que la API rechaza configuraciones PvE que romperían el runtime.
import { describe, expect, it } from "vitest";
import {
  readPublishOlympusSettingsCommand,
  readPublishSurvivalRulesetCommand,
  readUpsertOlympusChampionCommand,
  readUpsertOlympusLegendCommand,
  readUpsertOlympusNodeCommand,
} from "./read-admin-pve-command";

const stage = {
  fromBattle: 1, aiProfile: "HARD", maxTier: 8,
  maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "survival-base",
};

const ruleset = {
  startTier: 4, battlesPerTier: 2, roster: ["training-tier-1"],
  milestoneInterval: 5, milestoneHeal: 2000, stages: [stage],
};

const legend = {
  id: "zeus", code: "ZEUS", displayName: "Zeus", deckTemplateId: "gokernel-ultra",
  aiProfile: "MYTHIC", startingLp: 14000, energyBonus: 2, rewardDefinitionId: "olympus-v1-zeus",
  avatarPath: "/a.webp", introPath: null, victoryPath: null, defeatPath: null, lore: null,
  specialRules: ["Comienza con 14.000 LP"], baseFragmentReward: 150,
  firstVictoryFragmentBonus: 400, defeatFragmentReward: 20,
  availableFromIso: null, availableUntilIso: null, isActive: true, sortOrder: 10,
  deckCards: [{ cardId: "entity-a" }], fusionCards: [],
};

const node = {
  id: "gennvim-power-1", championId: "gennvim", branch: "POWER", prerequisiteNodeIds: [],
  effectKind: "GLOBAL_LEVEL", effectAmount: 5, effectCap: 30, effectCardIds: [],
  fragmentCost: 40, sortOrder: 10, isActive: true,
};

describe("readPublishSurvivalRulesetCommand", () => {
  it("acepta un ruleset completo", () => {
    expect(readPublishSurvivalRulesetCommand({ ...ruleset })).toMatchObject({ startTier: 4, stages: [stage] });
  });

  it("rechaza un roster vacío", () => {
    expect(() => readPublishSurvivalRulesetCommand({ ...ruleset, roster: [] })).toThrow(/roster no puede quedar vacío/i);
  });

  it("exige que el escalado cubra el primer combate", () => {
    expect(() => readPublishSurvivalRulesetCommand({ ...ruleset, stages: [{ ...stage, fromBattle: 3 }] }))
      .toThrow(/empezar en el combate 1/i);
  });

  it("rechaza un perfil de IA que el motor no conoce", () => {
    expect(() => readPublishSurvivalRulesetCommand({ ...ruleset, stages: [{ ...stage, aiProfile: "IMPOSIBLE" }] }))
      .toThrow(/perfil de IA/i);
  });
});

describe("readPublishOlympusSettingsCommand", () => {
  it("acepta la configuración vigente", () => {
    expect(readPublishOlympusSettingsCommand({
      dailyAttemptLimit: 3, battleTtlMinutes: 45, respecFreeAllowance: 1, respecCost: 60, respecRefundPercent: 75,
    })).toMatchObject({ dailyAttemptLimit: 3, respecCost: 60 });
  });

  it("rechaza un límite diario fuera del rango que soporta la tabla", () => {
    expect(() => readPublishOlympusSettingsCommand({
      dailyAttemptLimit: 99, battleTtlMinutes: 45, respecFreeAllowance: 1, respecCost: 60, respecRefundPercent: 75,
    })).toThrow(/límite diario/i);
  });

  it("rechaza un reembolso mayor que el 100 por ciento", () => {
    expect(() => readPublishOlympusSettingsCommand({
      dailyAttemptLimit: 3, battleTtlMinutes: 45, respecFreeAllowance: 1, respecCost: 60, respecRefundPercent: 150,
    })).toThrow(/reembolso/i);
  });
});

describe("readUpsertOlympusLegendCommand", () => {
  it("normaliza el deck legendario al tope de versión y nivel", () => {
    const command = readUpsertOlympusLegendCommand({ ...legend });
    expect(command.deckCards[0]).toMatchObject({ cardId: "entity-a", level: 30, versionTier: 5 });
  });

  it("rechaza una ventana de disponibilidad invertida", () => {
    expect(() => readUpsertOlympusLegendCommand({
      ...legend,
      availableFromIso: "2026-08-10T00:00:00.000Z",
      availableUntilIso: "2026-08-01T00:00:00.000Z",
    })).toThrow(/termina antes de empezar/i);
  });

  it("rechaza un perfil de IA fuera del vocabulario de Olimpo", () => {
    expect(() => readUpsertOlympusLegendCommand({ ...legend, aiProfile: "HARD" })).toThrow(/perfil de IA/i);
  });
});

describe("readUpsertOlympusChampionCommand", () => {
  it("acepta el vínculo con su rival de Arena", () => {
    expect(readUpsertOlympusChampionCommand({
      id: "gennvim", arenaOpponentId: "training-tier-1", requiredTier: 1, requiredLadderPosition: 1,
      baseDeckVariantId: "starter-tools", baseLevel: 14, baseVersionTier: 2, baseStartingLp: 8000, isActive: true,
    })).toMatchObject({ id: "gennvim", baseLevel: 14 });
  });

  it("rechaza una versión base por encima del tope del juego", () => {
    expect(() => readUpsertOlympusChampionCommand({
      id: "gennvim", arenaOpponentId: "training-tier-1", requiredTier: 1, requiredLadderPosition: 1,
      baseDeckVariantId: "starter-tools", baseLevel: 14, baseVersionTier: 9, baseStartingLp: 8000, isActive: true,
    })).toThrow(/versión base/i);
  });
});

describe("readUpsertOlympusNodeCommand", () => {
  it("acepta un nodo con efecto soportado", () => {
    expect(readUpsertOlympusNodeCommand({ ...node })).toMatchObject({ effectKind: "GLOBAL_LEVEL", fragmentCost: 40 });
  });

  it("rechaza un efecto que el resolutor no sabe aplicar", () => {
    expect(() => readUpsertOlympusNodeCommand({ ...node, effectKind: "TELEPORT" })).toThrow(/tipo de efecto/i);
  });

  it("rechaza que un nodo sea prerrequisito de sí mismo", () => {
    expect(() => readUpsertOlympusNodeCommand({ ...node, prerequisiteNodeIds: ["gennvim-power-1"] }))
      .toThrow(/prerrequisito de sí mismo/i);
  });

  it("rechaza un coste de cero para que ningún nodo salga gratis", () => {
    expect(() => readUpsertOlympusNodeCommand({ ...node, fragmentCost: 0 })).toThrow(/coste en Fragmentos/i);
  });
});
