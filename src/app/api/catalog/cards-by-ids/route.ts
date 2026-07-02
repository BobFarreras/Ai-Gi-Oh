// src/app/api/catalog/cards-by-ids/route.ts - Carga cartas del catálogo por IDs para usuarios autenticados (EventPanel, DailyLoginModal).
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

// Tope defensivo: el catálogo completo son ~120 cartas; cualquier petición sensata cabe holgada.
const MAX_IDS = 120;

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json([]);
    // Cliente con la sesión del usuario: respeta RLS (cards_catalog solo es legible por 'authenticated').
    const client = createSupabaseRouteClient(request, response);
    // Exige sesión válida; lanza si no hay usuario autenticado.
    await getAuthenticatedUserId(client);

    const idsParam = request.nextUrl.searchParams.get("ids");
    if (!idsParam) return NextResponse.json({ error: "Parametro 'ids' requerido." }, { status: 400, headers: response.headers });
    // Normaliza, deduplica y limita para evitar consultas abusivas.
    const ids = Array.from(new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean))).slice(0, MAX_IDS);
    if (ids.length === 0) return NextResponse.json([], { headers: response.headers });

    // Reutiliza el cargador canónico (mismo SELECT/mapeo que el resto de repos): así la carta llega
    // completa —incluida la descripción, el efecto y la pasiva innata— y no un subconjunto de campos.
    const cardsById = await loadCardsByIds(client, ids);
    const result = Array.from(cardsById.values());
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las cartas.");
  }
}
