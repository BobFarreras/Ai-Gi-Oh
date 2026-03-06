// src/core/use-cases/hub/GetHubMapUseCase.ts - Caso de uso para obtener nodos y secciones del mapa central.
import { ValidationError } from "@/core/errors/ValidationError";
import { HubService, IHubMap } from "@/core/services/hub/HubService";

export class GetHubMapUseCase {
  constructor(private readonly hubService: HubService) {}

  async execute(playerId: string): Promise<IHubMap> {
    if (!playerId.trim()) {
      throw new ValidationError("El identificador de jugador es obligatorio.");
    }

    return this.hubService.getMap(playerId);
  }
}
