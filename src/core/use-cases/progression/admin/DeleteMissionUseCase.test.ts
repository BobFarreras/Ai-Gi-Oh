// src/core/use-cases/progression/admin/DeleteMissionUseCase.test.ts - Verifica el borrado de misión y la validación de id.
import { describe, it, expect, vi } from "vitest";
import { DeleteMissionUseCase } from "./DeleteMissionUseCase";
import { ValidationError } from "@/core/errors/ValidationError";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

function makeRepo(deleteMission = vi.fn().mockResolvedValue(undefined)) {
  return { deleteMission } as unknown as IProgressionAdminRepository & { deleteMission: ReturnType<typeof vi.fn> };
}

describe("DeleteMissionUseCase", () => {
  it("elimina la misión por id", async () => {
    const repo = makeRepo();
    await new DeleteMissionUseCase(repo).execute("evt-launch-mission-1");
    expect(repo.deleteMission).toHaveBeenCalledWith("evt-launch-mission-1");
  });

  it("rechaza un id vacío sin tocar el repositorio", async () => {
    const repo = makeRepo();
    await expect(new DeleteMissionUseCase(repo).execute("   ")).rejects.toBeInstanceOf(ValidationError);
    expect(repo.deleteMission).not.toHaveBeenCalled();
  });
});
