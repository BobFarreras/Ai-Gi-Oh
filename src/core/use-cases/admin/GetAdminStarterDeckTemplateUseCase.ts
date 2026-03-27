// src/core/use-cases/admin/GetAdminStarterDeckTemplateUseCase.ts - Resuelve plantilla starter seleccionada junto al catálogo de plantillas disponible.
import { IAdminStarterDeckTemplateData } from "@/core/entities/admin/IAdminStarterDeckTemplate";
import { IAdminStarterDeckRepository } from "@/core/repositories/admin/IAdminStarterDeckRepository";

export class GetAdminStarterDeckTemplateUseCase {
  constructor(private readonly repository: IAdminStarterDeckRepository) {}

  async execute(templateKey?: string): Promise<IAdminStarterDeckTemplateData> {
    const summaries = await this.repository.listTemplateSummaries();
    if (summaries.length === 0) return { summaries, template: null };
    const targetKey = templateKey ?? summaries.find((entry) => entry.isActive)?.templateKey ?? summaries[0].templateKey;
    return { summaries, template: await this.repository.getTemplate(targetKey) };
  }
}
