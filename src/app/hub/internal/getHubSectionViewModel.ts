// src/app/hub/internal/getHubSectionViewModel.ts - Resuelve en servidor el estado de una sección del hub para su página destino.
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { getHubRuntimeData } from "@/services/hub/get-hub-runtime-data";

export interface IHubSectionViewModel {
  section: IHubSection;
}

export async function getHubSectionViewModel(sectionType: HubSectionType): Promise<IHubSectionViewModel> {
  const { hubMap } = await getHubRuntimeData();
  const section = hubMap.sections.find((currentSection) => currentSection.type === sectionType);

  if (!section) {
    throw new Error(`No se encontró la sección ${sectionType} en el hub.`);
  }

  return { section };
}
