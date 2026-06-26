// src/core/use-cases/progression/admin/UpsertMissionUseCase.test.ts - Verifica la validación de misiones, incluido el requisito de evento para recompensas de puntos.
import { describe, it, expect, vi } from "vitest";
import { UpsertMissionUseCase } from "./UpsertMissionUseCase";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminMissionDefinition } from "@/core/entities/progression/ILiveOpsAdmin";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

function makeRepo(upsertMission = vi.fn().mockResolvedValue(undefined)) {
  return { upsertMission } as unknown as IProgressionAdminRepository & { upsertMission: ReturnType<typeof vi.fn> };
}

const BASE: IAdminMissionDefinition = {
  id: "m1", scope: "EVENT", objectiveType: "WIN_FLAWLESS_MP", objectiveParam: null, targetCount: 1,
  rewardNexus: 50, rewardType: "EVENT_POINTS", eventId: "evt-launch", title: "Reto", description: null, sortOrder: 1, isActive: true,
};

describe("UpsertMissionUseCase", () => {
  it("guarda una misión de evento válida (puntos + evento)", async () => {
    const repo = makeRepo();
    await new UpsertMissionUseCase(repo).execute(BASE);
    expect(repo.upsertMission).toHaveBeenCalledWith(BASE);
  });

  it("rechaza recompensa de puntos sin evento", async () => {
    const repo = makeRepo();
    await expect(new UpsertMissionUseCase(repo).execute({ ...BASE, eventId: null })).rejects.toBeInstanceOf(ValidationError);
    expect(repo.upsertMission).not.toHaveBeenCalled();
  });

  it("guarda una misión normal de Nexus", async () => {
    const repo = makeRepo();
    await new UpsertMissionUseCase(repo).execute({ ...BASE, scope: "DAILY", rewardType: "NEXUS", eventId: null });
    expect(repo.upsertMission).toHaveBeenCalledTimes(1);
  });

  it("rechaza cantidad objetivo no positiva", async () => {
    const repo = makeRepo();
    await expect(new UpsertMissionUseCase(repo).execute({ ...BASE, targetCount: 0 })).rejects.toBeInstanceOf(ValidationError);
  });
});
