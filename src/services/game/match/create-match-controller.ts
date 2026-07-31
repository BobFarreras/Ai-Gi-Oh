// src/services/game/match/create-match-controller.ts - Fábrica de controllers de match para centralizar construcción por modo.
import { IMatchConfig, IMatchController } from "@/core/entities/match";
import { LocalMatchController } from "@/services/game/match/LocalMatchController";

/**
 * Los seis modos compartían el mismo runtime local y solo se distinguían por su `mode`, así que la
 * fábrica lo instancia directamente. Cuando un modo necesite comportamiento propio, recibirá su clase
 * aquí sin obligar a los demás a tener una vacía.
 */
export function createMatchController(config: IMatchConfig): IMatchController {
  return new LocalMatchController(config);
}
