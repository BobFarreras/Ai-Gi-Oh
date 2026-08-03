// src/services/game/match/progression/EphemeralMatchProgressionService.ts - Duelo que no deja rastro en la progresión de cartas del jugador.
import { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { IMatchProgressionService } from "@/services/game/match/progression/IMatchProgressionService";

/**
 * Para modos donde las cartas jugadas no son las del jugador: el tutorial y el mazo prestado de
 * Olimpo. Devolver la lista vacía deja que el tablero enseñe la experiencia PROYECTADA del duelo
 * sin escribir nada en `player_card_progress`.
 */
export class EphemeralMatchProgressionService implements IMatchProgressionService {
  public async applyBattleCardExperience(): Promise<IAppliedCardExperienceResult[]> {
    return [];
  }
}
