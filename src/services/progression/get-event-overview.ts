// src/services/progression/get-event-overview.ts - Servicio server-side: evento activo para el jugador de la sesión (o null).
import { IEventOverview } from "@/core/entities/progression/IEvent";
import { GetEventOverviewUseCase } from "@/core/use-cases/progression/GetEventOverviewUseCase";
import { SupabaseEventRepository } from "@/infrastructure/persistence/supabase/SupabaseEventRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getEventOverview(): Promise<IEventOverview | null> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return null;
  const client = await createSupabaseServerClient();
  return new GetEventOverviewUseCase(new SupabaseEventRepository(client)).execute();
}
