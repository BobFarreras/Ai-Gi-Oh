// src/services/progression/get-active-promotions.ts - Servicio server-side: promociones activas para el jugador de la sesión (o lista vacía).
import { IFeaturedPromotion } from "@/core/entities/progression/IPromotion";
import { GetActivePromotionsUseCase } from "@/core/use-cases/progression/GetActivePromotionsUseCase";
import { SupabasePromotionRepository } from "@/infrastructure/persistence/supabase/SupabasePromotionRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getActivePromotions(): Promise<IFeaturedPromotion[]> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return [];
  const client = await createSupabaseServerClient();
  return new GetActivePromotionsUseCase(new SupabasePromotionRepository(client)).execute();
}
