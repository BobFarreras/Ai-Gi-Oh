// src/core/use-cases/progression/GetEventOverviewUseCase.ts - Obtiene el evento activo y su tienda para el jugador.
import { IEventOverview } from "@/core/entities/progression/IEvent";
import { IEventRepository } from "@/core/repositories/progression/IEventRepository";

export class GetEventOverviewUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(): Promise<IEventOverview | null> {
    return this.repository.getOverview();
  }
}
