// src/services/game/match/progression/create-match-progression-service.ts - Fábrica de persistencia post-duelo desacoplada por modo de combate.
import { IMatchMode } from "@/core/entities/match";
import { IMatchProgressionService } from "@/services/game/match/progression/IMatchProgressionService";
import { RemoteMatchProgressionService } from "@/services/game/match/progression/RemoteMatchProgressionService";
import { EphemeralMatchProgressionService } from "@/services/game/match/progression/EphemeralMatchProgressionService";

const remoteService = new RemoteMatchProgressionService();
const ephemeralService = new EphemeralMatchProgressionService();

/**
 * Los modos que NO juegan con el mazo del jugador no pueden escribir en su progresión de cartas.
 * En Olimpo el mazo es prestado del campeón: guardar su experiencia subía de nivel cartas que el
 * jugador puede ni tener, que es justo el atajo que el modo evita.
 */
const MODES_WITHOUT_CARD_PROGRESSION: ReadonlySet<IMatchMode> = new Set(["TUTORIAL", "OLYMPUS"]);

export function createMatchProgressionService(mode: IMatchMode): IMatchProgressionService {
  if (MODES_WITHOUT_CARD_PROGRESSION.has(mode)) return ephemeralService;
  return remoteService;
}
