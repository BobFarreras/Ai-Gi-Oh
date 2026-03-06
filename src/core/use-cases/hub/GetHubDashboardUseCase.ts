// src/core/use-cases/hub/GetHubDashboardUseCase.ts - Caso de uso para obtener datos del dashboard del mundo central.
import { HubService, IHubDashboard } from "@/core/services/hub/HubService";
import { ValidationError } from "@/core/errors/ValidationError";

export class GetHubDashboardUseCase {
  constructor(private readonly hubService: HubService) {}

  async execute(playerId: string): Promise<IHubDashboard> {
    if (!playerId.trim()) {
      throw new ValidationError("El identificador de jugador es obligatorio.");
    }

    return this.hubService.getDashboard(playerId);
  }
}
