// src/core/repositories/progression/ILoginStreakRepository.ts - Contrato de lectura/claim de la racha de login. La identidad la deriva el backend (auth.uid()).
import { IDailyLoginClaimResult, ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";

export interface ILoginStreakRepository {
  /** Estado actual de la racha del jugador de la sesión (RLS = fila propia). */
  getStatus(): Promise<ILoginStreakStatus>;
  /** Reclama el login diario de forma atómica e idempotente (server-authoritative). */
  claim(): Promise<IDailyLoginClaimResult>;
}
