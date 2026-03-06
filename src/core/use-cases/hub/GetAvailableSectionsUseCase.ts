// src/core/use-cases/hub/GetAvailableSectionsUseCase.ts - Caso de uso para listar secciones accesibles del hub.
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { ValidationError } from "@/core/errors/ValidationError";
import { HubService } from "@/core/services/hub/HubService";

export class GetAvailableSectionsUseCase {
  constructor(private readonly hubService: HubService) {}

  async execute(playerId: string): Promise<IHubSection[]> {
    if (!playerId.trim()) {
      throw new ValidationError("El identificador de jugador es obligatorio.");
    }

    return this.hubService.getAvailableSections(playerId);
  }
}
