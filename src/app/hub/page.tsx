// src/app/hub/page.tsx - Página servidor del mundo central con escena de ciudad y acceso a secciones.
import { HubScene } from "@/components/hub/HubScene";
import { HubService } from "@/core/services/hub/HubService";
import { GetHubMapUseCase } from "@/core/use-cases/hub/GetHubMapUseCase";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export default async function HubPage() {
  const repository = new InMemoryHubRepository();
  const service = new HubService(repository);
  const getHubMapUseCase = new GetHubMapUseCase(service);
  const hubMap = await getHubMapUseCase.execute("local-player");
  const session = await getCurrentUserSession();
  const playerLabel = session?.user.displayName ?? session?.user.email ?? "Operador local";

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-3 top-3 z-[300] border border-cyan-700/55 bg-[#031120]/85 px-3 py-2 text-[11px] text-cyan-100">
        <p className="font-black uppercase tracking-[0.12em] text-cyan-200/85">Usuario activo</p>
        <p className="mt-1 font-semibold">{playerLabel}</p>
      </div>
      <HubScene progress={hubMap.progress} sections={hubMap.sections} nodes={hubMap.nodes} />
    </div>
  );
}
