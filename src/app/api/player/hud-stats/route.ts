// src/app/api/player/hud-stats/route.ts - Stats ligeras del jugador para el HUD del hub (carga lazy al desplegar): ELO, Nexus y tamaño de colección.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true });
    const client = createSupabaseRouteClient(request, response);
    const userId = await getAuthenticatedUserId(client);

    const [profileResult, walletResult, collectionResult] = await Promise.all([
      client.from("player_profiles").select("elo_rating").eq("player_id", userId).maybeSingle(),
      client.from("player_wallets").select("nexus").eq("player_id", userId).maybeSingle(),
      client
        .from("player_collection_cards")
        .select("card_id", { count: "exact", head: true })
        .eq("player_id", userId)
        .gt("owned_copies", 0),
    ]);

    return NextResponse.json(
      {
        eloRating: (profileResult.data?.elo_rating as number | undefined) ?? 1200,
        nexus: (walletResult.data?.nexus as number | undefined) ?? 0,
        collectionCount: collectionResult.count ?? 0,
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las estadísticas del jugador.");
  }
}
