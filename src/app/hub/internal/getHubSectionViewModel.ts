// src/app/hub/internal/getHubSectionViewModel.ts - Resuelve en servidor el estado de una sección del hub para su página destino.
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { HubService } from "@/core/services/hub/HubService";
import { GetHubMapUseCase } from "@/core/use-cases/hub/GetHubMapUseCase";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";

export interface IHubSectionViewModel {
  section: IHubSection;
}

export async function getHubSectionViewModel(sectionType: HubSectionType): Promise<IHubSectionViewModel> {
  const repository = new InMemoryHubRepository();
  const service = new HubService(repository);
  const useCase = new GetHubMapUseCase(service);
  const hubMap = await useCase.execute("local-player");
  const section = hubMap.sections.find((currentSection) => currentSection.type === sectionType);

  if (!section) {
    throw new Error(`No se encontró la sección ${sectionType} en el hub.`);
  }

  return { section };
}
