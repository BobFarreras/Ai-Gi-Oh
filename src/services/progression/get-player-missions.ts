// src/services/progression/get-player-missions.ts - Servicio server-side: misiones del jugador de la sesión (o lista vacía si no hay sesión).
import { IMissionView } from "@/core/entities/progression/IMission";
import { GetMissionsUseCase } from "@/core/use-cases/progression/GetMissionsUseCase";
import { SupabaseMissionRepository } from "@/infrastructure/persistence/supabase/SupabaseMissionRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getPlayerMissions(): Promise<IMissionView[]> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return [];
  const client = await createSupabaseServerClient();
  return new GetMissionsUseCase(new SupabaseMissionRepository(client)).execute();
}
