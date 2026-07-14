// src/app/api/progression/weekly-prize/ack/route.ts - Marca como avisados los premios de ranking semanal que
// el jugador acaba de ver. NO otorga nada: el premio ya lo acreditó el cierre semanal (migración 094); esto
// solo evita que el diálogo vuelva a saltar. La identidad la pone auth.uid() dentro de la función SQL, así que
// mandar ids de otro jugador no marca nada.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";

/** Tope defensivo: un jugador solo puede tener premios pendientes de dos tableros por semana. */
const MAX_IDS = 20;

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const payload = await readJsonObjectBody(request, "Payload inválido.");

    const ids = Array.isArray(payload.ids)
      ? payload.ids.filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0).slice(0, MAX_IDS)
      : [];
    if (ids.length === 0) return NextResponse.json({ ok: true }, { status: 200, headers: response.headers });

    const { error } = await client.rpc("ack_weekly_prizes", { p_ids: ids });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo marcar el premio como visto.");
  }
}
