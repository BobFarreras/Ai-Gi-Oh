// src/app/hub/page.tsx - Página servidor del mundo central con escena de ciudad y acceso a secciones.
import { HubScene } from "@/components/hub/HubScene";
import { HubService } from "@/core/services/hub/HubService";
import { GetHubMapUseCase } from "@/core/use-cases/hub/GetHubMapUseCase";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";

export default async function HubPage() {
  const repository = new InMemoryHubRepository();
  const service = new HubService(repository);
  const getHubMapUseCase = new GetHubMapUseCase(service);
  const hubMap = await getHubMapUseCase.execute("local-player");

  return <HubScene progress={hubMap.progress} sections={hubMap.sections} nodes={hubMap.nodes} />;
}
