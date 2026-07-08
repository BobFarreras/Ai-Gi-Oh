// src/app/api/story/overworld/warp/route.ts - Salto entre mapas del overworld: valida el acceso al portal (gate del mapa) y fija el mapa/posición destino.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { buildOverworldTilemap, isKnownOverworldMap } from "@/services/story/overworld/resolve-overworld-tilemap";
import { isOverworldNodeAccessible } from "@/services/story/overworld/resolve-overworld-node-access";

const NODE_ID_PATTERN = /^story-[a-z0-9-]{1,80}$/i;
const MAP_ID_PATTERN = /^act-\d{1,3}$/;

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const payload = await readJsonObjectBody(request, "Payload inválido para salto de overworld.");
    const fromMapId = typeof payload.fromMapId === "string" ? payload.fromMapId : "";
    const nodeId = typeof payload.nodeId === "string" ? payload.nodeId : "";
    if (!MAP_ID_PATTERN.test(fromMapId) || !NODE_ID_PATTERN.test(nodeId)) {
      return NextResponse.json({ error: "Parámetros de salto inválidos." }, { status: 400 });
    }

    // El portal y su destino los dicta el propio tilemap de origen (no el cliente).
    const fromTilemap = buildOverworldTilemap(fromMapId);
    const warpObject = fromTilemap?.objects.find((object) => object.id === nodeId && object.kind === "WARP");
    if (!warpObject?.warp) {
      return NextResponse.json({ error: "Portal no encontrado." }, { status: 404 });
    }

    // Acceso server-authoritative: el portal solo se usa si sus requisitos (gate) están cumplidos.
    const progressEntries = await createSupabasePlayerStoryDuelProgressRepository().then((repo) =>
      repo.listByPlayerId(session.user.id),
    );
    const completedNodeIds = new Set(
      progressEntries.filter((entry) => entry.bestResult === "WON").map((entry) => entry.duelId),
    );
    if (!isOverworldNodeAccessible(fromMapId, nodeId, completedNodeIds)) {
      return NextResponse.json({ error: "Portal bloqueado." }, { status: 403 });
    }

    // Destino aún no disponible (p. ej. un acto sin construir): no es error, solo "muy pronto".
    const toMapId = warpObject.warp.toMapId;
    const toTilemap = isKnownOverworldMap(toMapId) ? buildOverworldTilemap(toMapId) : null;
    if (!toTilemap) {
      return NextResponse.json({ available: false }, { status: 200 });
    }

    const spawn =
      toTilemap.spawns.find((entry) => entry.id === warpObject.warp!.toSpawnId) ?? toTilemap.spawns[0];
    const worldRepository = await createSupabasePlayerStoryWorldRepository();
    await worldRepository.saveOverworldState(session.user.id, {
      currentNodeId: undefined,
      mapId: toMapId,
      position: { tileX: spawn.tileX, tileY: spawn.tileY },
    });
    return NextResponse.json({ available: true }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cruzar el portal de acto.");
  }
}
