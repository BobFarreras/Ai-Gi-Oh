// src/core/use-cases/progression/admin/UpsertPromotionUseCase.ts - Valida y persiste una promoción/noticia desde el panel admin.
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminPromotionConfig } from "@/core/entities/progression/ILiveOpsAdmin";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

const VALID_KINDS = new Set(["PACK", "CARD", "EVENT", "NEWS", "SYSTEM", "MAINTENANCE", "STORY"]);

export class UpsertPromotionUseCase {
  constructor(private readonly repository: IProgressionAdminRepository) {}

  async execute(promotion: IAdminPromotionConfig): Promise<void> {
    if (!promotion.id.trim()) throw new ValidationError("El id de la promoción es obligatorio.");
    if (!VALID_KINDS.has(promotion.kind)) throw new ValidationError("Tipo de promoción inválido.");
    if (!promotion.title.trim()) throw new ValidationError("El título de la promoción es obligatorio.");
    await this.repository.upsertPromotion(promotion);
  }
}
