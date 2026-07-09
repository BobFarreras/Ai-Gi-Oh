// src/app/api/story/overworld/claim-reward/route.ts - Otorga (una sola vez) la recompensa de un nodo de recolección del overworld.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";

const NODE_ID_PATTERN = /^story-[a-z0-9-]{1,80}$/i;

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const playerId = session.user.id;

    const payload = await readJsonObjectBody(request, "Payload inválido para reclamar recompensa.");
    const nodeId = typeof payload.nodeId === "string" ? payload.nodeId : "";
    if (!NODE_ID_PATTERN.test(nodeId)) {
      return NextResponse.json({ error: "nodeId inválido." }, { status: 400 });
    }

    // El servidor deriva la recompensa del registro de nodos (no confía en el cliente).
    const definition = findStoryVirtualNodeDefinition(nodeId);
    if (!definition || (definition.nodeType !== "REWARD_NEXUS" && definition.nodeType !== "REWARD_CARD")) {
      return NextResponse.json({ error: "El nodo no es una recompensa." }, { status: 400 });
    }

    const worldRepository = await createSupabasePlayerStoryWorldRepository();
    const compact = await worldRepository.getCompactStateByPlayerId(playerId);
    // Recompensa de un solo uso: si ya está en interacted, no se vuelve a otorgar.
    if (compact.interactedNodeIds.includes(nodeId)) {
      return NextResponse.json({ alreadyClaimed: true, rewardNexus: 0, rewardCardId: null }, { status: 200 });
    }

    const rewardNexus = definition.nodeType === "REWARD_NEXUS" ? definition.rewardNexus : 0;
    const rewardCardId = definition.nodeType === "REWARD_CARD" ? definition.rewardCardId ?? null : null;

    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    if (rewardNexus > 0) await repositories.walletRepository.creditNexus(playerId, rewardNexus);
    if (rewardCardId) await repositories.collectionRepository.addCards(playerId, [rewardCardId]);

    await worldRepository.saveCompactStateByPlayerId(playerId, {
      currentNodeId: compact.currentNodeId,
      visitedNodeIds: compact.visitedNodeIds,
      interactedNodeIds: [...compact.interactedNodeIds, nodeId],
    });

    // La carta otorgada se devuelve completa (nombre/ATK/DEF/render) para que el cliente anime su
    // revelado con el componente Card real, sin una segunda petición al catálogo.
    let rewardCard = null;
    if (rewardCardId) {
      const catalogClient = createSupabaseRouteClient(request, response);
      const cardsById = await loadCardsByIds(catalogClient, [rewardCardId]);
      rewardCard = cardsById.get(rewardCardId) ?? null;
    }

    return NextResponse.json(
      { alreadyClaimed: false, rewardNexus, rewardCardId, rewardCard },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo reclamar la recompensa.");
  }
}
