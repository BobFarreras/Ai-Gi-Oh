// src/app/api/story/overworld/mark-interacted/route.ts - Persiste un nodo de evento del overworld como "interactuado" (p. ej. el vídeo que abre las puertas), para que su efecto sobreviva a un reinicio/combate.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";

const NODE_ID_PATTERN = /^story-[a-z0-9-]{1,80}$/i;

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const playerId = session.user.id;

    const payload = await readJsonObjectBody(request, "Payload inválido.");
    const nodeId = typeof payload.nodeId === "string" ? payload.nodeId : "";
    // Solo nodos de evento registrados (no recompensas: esas van por claim-reward, que otorga).
    const definition = nodeId && NODE_ID_PATTERN.test(nodeId) ? findStoryVirtualNodeDefinition(nodeId) : null;
    if (!definition || definition.nodeType !== "EVENT") {
      return NextResponse.json({ error: "El nodo no es un evento válido." }, { status: 400 });
    }

    const worldRepository = await createSupabasePlayerStoryWorldRepository();
    const compact = await worldRepository.getCompactStateByPlayerId(playerId);
    if (compact.interactedNodeIds.includes(nodeId)) {
      return NextResponse.json({ ok: true, alreadyInteracted: true }, { status: 200 });
    }
    await worldRepository.saveCompactStateByPlayerId(playerId, {
      currentNodeId: compact.currentNodeId,
      visitedNodeIds: compact.visitedNodeIds,
      interactedNodeIds: [...compact.interactedNodeIds, nodeId],
    });
    return NextResponse.json({ ok: true, alreadyInteracted: false }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo marcar el evento.");
  }
}
