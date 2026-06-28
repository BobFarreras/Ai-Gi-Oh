// src/app/api/catalog/cards-by-ids/route.ts - Endpoint público para cargar cartas del catálogo por IDs (usado por EventPanel y DailyLoginModal).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/infrastructure/persistence/supabase/internal/require-supabase-env";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids");
    if (!idsParam) return NextResponse.json({ error: "Parametro 'ids' requerido." }, { status: 400 });
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return NextResponse.json([]);
    const env = requireSupabaseEnv();
    const client = createClient(env.url, env.anonKey);
    const cards = await loadCardsByIds(client, ids, { onlyActive: true });
    const result = ids.map((id) => {
      const card = cards.get(id);
      if (!card) return null;
      return { id: card.id, name: card.name, type: card.type, cost: card.cost, attack: card.attack ?? null, defense: card.defense ?? null, renderUrl: card.renderUrl ?? null, bgUrl: card.bgUrl ?? null, archetype: card.archetype ?? null };
    }).filter(Boolean);
    return NextResponse.json(result);
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las cartas.");
  }
}
