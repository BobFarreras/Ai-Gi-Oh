// src/core/services/progression/mission-sort.test.ts - Tests de ordenación de misiones por prioridad de reclamación.
import { describe, expect, it } from "vitest";
import { IMissionView } from "@/core/entities/progression/IMission";
import { sortMissionsByPriority } from "./mission-sort";

function makeMission(overrides: Partial<IMissionView>): IMissionView {
  return {
    missionId: overrides.missionId ?? "m1",
    scope: "DAILY",
    objectiveType: "WIN_DUEL",
    title: "Test Mission",
    description: null,
    targetCount: 3,
    rewardNexus: 100,
    rewardType: "NEXUS",
    rewardCurrency: "Nexus",
    eventId: null,
    periodKey: "2026-W28",
    progress: 2,
    completed: false,
    claimed: false,
    ...overrides,
  };
}

describe("sortMissionsByPriority", () => {
  it("coloca reclamables antes que en progreso", () => {
    const inProgress = makeMission({ missionId: "progress", completed: false, claimed: false });
    const claimable = makeMission({ missionId: "claimable", completed: true, claimed: false });
    const result = sortMissionsByPriority([inProgress, claimable]);
    expect(result.map((m) => m.missionId)).toEqual(["claimable", "progress"]);
  });

  it("coloca reclamables antes que reclamadas", () => {
    const claimed = makeMission({ missionId: "claimed", completed: true, claimed: true });
    const claimable = makeMission({ missionId: "claimable", completed: true, claimed: false });
    const result = sortMissionsByPriority([claimed, claimable]);
    expect(result.map((m) => m.missionId)).toEqual(["claimable", "claimed"]);
  });

  it("coloca en progreso antes que reclamadas", () => {
    const claimed = makeMission({ missionId: "claimed", completed: true, claimed: true });
    const inProgress = makeMission({ missionId: "progress", completed: false, claimed: false });
    const result = sortMissionsByPriority([claimed, inProgress]);
    expect(result.map((m) => m.missionId)).toEqual(["progress", "claimed"]);
  });

  it("mantiene orden original dentro de la misma prioridad", () => {
    const a = makeMission({ missionId: "a", completed: false, progress: 1 });
    const b = makeMission({ missionId: "b", completed: false, progress: 2 });
    const result = sortMissionsByPriority([a, b]);
    expect(result.map((m) => m.missionId)).toEqual(["a", "b"]);
  });

  it("ordena completo: reclamable > progreso > reclamada", () => {
    const claimed = makeMission({ missionId: "claimed", completed: true, claimed: true });
    const progress1 = makeMission({ missionId: "p1", completed: false });
    const claimable = makeMission({ missionId: "claimable", completed: true, claimed: false });
    const progress2 = makeMission({ missionId: "p2", completed: false });
    const result = sortMissionsByPriority([claimed, progress1, claimable, progress2]);
    expect(result.map((m) => m.missionId)).toEqual(["claimable", "p1", "p2", "claimed"]);
  });

  it("no muta el array original", () => {
    const original = [
      makeMission({ missionId: "claimed", completed: true, claimed: true }),
      makeMission({ missionId: "claimable", completed: true, claimed: false }),
    ];
    const copy = [...original];
    sortMissionsByPriority(original);
    expect(original).toEqual(copy);
  });

  it("retorna array vacío si no hay misiones", () => {
    expect(sortMissionsByPriority([])).toEqual([]);
  });
});
