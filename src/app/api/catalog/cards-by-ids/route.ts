// src/app/api/catalog/cards-by-ids/route.ts - Endpoint público para cargar cartas del catálogo por IDs (usado por EventPanel y DailyLoginModal).
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids");
    if (!idsParam) return NextResponse.json({ error: "Parametro 'ids' requerido." }, { status: 400 });
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return NextResponse.json([]);
    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client
      .from("cards_catalog")
      .select("id,name,type,cost,attack,defense,archetype,render_url,bg_url")
      .in("id", ids)
      .eq("is_active", true);
    if (error) throw error;
    const result = (data ?? []).map((row) => ({
      id: row.id, name: row.name, type: row.type, cost: row.cost,
      attack: row.attack ?? null, defense: row.defense ?? null,
      renderUrl: row.render_url ?? null, bgUrl: row.bg_url ?? null,
      archetype: row.archetype ?? null,
    }));
    return NextResponse.json(result);
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las cartas.");
  }
}
