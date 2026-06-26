// src/core/repositories/progression/IMissionRepository.ts - Contrato de lectura/claim de misiones. La identidad la deriva el backend (auth.uid()).
import { IMissionClaimResult, IMissionView } from "@/core/entities/progression/IMission";

export interface IMissionRepository {
  /** Misiones (daily + weekly) del periodo actual con el progreso del jugador. */
  getMissions(): Promise<IMissionView[]>;
  /** Reclama la recompensa de una misión completada (idempotente). */
  claim(missionId: string, periodKey: string): Promise<IMissionClaimResult>;
}
