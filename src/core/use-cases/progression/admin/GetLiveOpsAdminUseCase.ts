// src/core/use-cases/progression/admin/GetLiveOpsAdminUseCase.ts - Obtiene todas las definiciones de live-ops para el panel admin.
import { ILiveOpsAdminData } from "@/core/entities/progression/ILiveOpsAdmin";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

export class GetLiveOpsAdminUseCase {
  constructor(private readonly repository: IProgressionAdminRepository) {}

  async execute(): Promise<ILiveOpsAdminData> {
    return this.repository.getLiveOps();
  }
}
