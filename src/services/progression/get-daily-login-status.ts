// src/services/progression/get-daily-login-status.ts - Servicio server-side: estado de la racha de login para el jugador de la sesión (o null si no hay sesión).
import { ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";
import { GetLoginStreakStatusUseCase } from "@/core/use-cases/progression/GetLoginStreakStatusUseCase";
import { SupabaseLoginStreakRepository } from "@/infrastructure/persistence/supabase/SupabaseLoginStreakRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getDailyLoginStatus(): Promise<ILoginStreakStatus | null> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return null;
  const client = await createSupabaseServerClient();
  const repository = new SupabaseLoginStreakRepository(client);
  return new GetLoginStreakStatusUseCase(repository).execute();
}
