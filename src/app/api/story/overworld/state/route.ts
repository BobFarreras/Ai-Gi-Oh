// src/app/api/story/overworld/state/route.ts - Persiste posición del overworld y fija el nodo actual (validando unlock) antes de un duelo.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { isOverworldNodeAccessible } from "@/services/story/overworld/resolve-overworld-node-access";

const MAX_TILE = 1023;
const NODE_ID_PATTERN = /^story-[a-z0-9-]{1,80}$/i;

function readTile(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_TILE) {
    throw new Error("Coordenada de overworld inválida.");
  }
  return value;
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const payload = await readJsonObjectBody(request, "Payload inválido para estado de overworld.");
    const mapId = typeof payload.mapId === "string" ? payload.mapId.trim() : "";
    if (mapId.length === 0 || mapId.length > 40) {
      return NextResponse.json({ error: "mapId inválido." }, { status: 400 });
    }
    const tileX = readTile(payload.tileX);
    const tileY = readTile(payload.tileY);
    const rawNodeId = typeof payload.currentNodeId === "string" ? payload.currentNodeId : null;

    const worldRepository = await createSupabasePlayerStoryWorldRepository();

    // Solo fijamos el nodo actual si está bien formado y accesible en el overworld para
    // este jugador: evita que un cliente marque como "activo" un nodo tras una puerta que
    // aún no ha abierto. En mundo abierto el acceso lo dictan los gates del propio mapa
    // (no la cadena legacy "gana el anterior"), así que el Acto 1 permite todos los duelos.
    let currentNodeId: string | undefined;
    if (rawNodeId && NODE_ID_PATTERN.test(rawNodeId)) {
      const progressRepository = await createSupabasePlayerStoryDuelProgressRepository();
      const progressEntries = await progressRepository.listByPlayerId(session.user.id);
      const completedNodeIds = new Set(
        progressEntries.filter((entry) => entry.bestResult === "WON").map((entry) => entry.duelId),
      );
      if (isOverworldNodeAccessible(mapId, rawNodeId, completedNodeIds)) currentNodeId = rawNodeId;
    }

    await worldRepository.saveOverworldState(session.user.id, {
      currentNodeId,
      mapId,
      position: { tileX, tileY },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el estado de overworld.");
  }
}
