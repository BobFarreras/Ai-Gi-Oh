// src/app/api/analytics/batch/route.ts - Endpoint de ingesta de eventos de analytics con hardening: origin, rate limit, allowlist, user_id server-side + upsert de sesiones.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabaseAnalyticsRepository } from "@/infrastructure/persistence/supabase/SupabaseAnalyticsRepository";
import { RecordAnalyticsBatchUseCase } from "@/core/use-cases/analytics/RecordAnalyticsBatchUseCase";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { consumeAnalyticsBatchRateLimit } from "@/services/analytics/api/security/analytics-rate-limiter";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { AnalyticsEventCategory, IAnalyticsBatchInput, IAnalyticsEventInput } from "@/core/entities/analytics/IAnalyticsEvent";
import { ALLOWED_EVENT_CATEGORIES, ALLOWED_EVENT_NAMES, MAX_BATCH_SIZE, sanitizeDeviceInfo } from "@/core/services/analytics/validate-analytics-event";

/** Tope duro del body para rechazar payloads gigantes antes de parsear (DoS barato). */
const MAX_BODY_BYTES = 512 * 1024;

/** Valida que el payload del batch tenga la estructura correcta antes de pasar al use-case. */
function isValidBatchPayload(payload: unknown): payload is IAnalyticsBatchInput {
  if (typeof payload !== "object" || payload === null) return false;
  const body = payload as Record<string, unknown>;
  if (!Array.isArray(body.events)) return false;
  if (body.events.length > MAX_BATCH_SIZE) return false;
  if (typeof body.deviceInfo !== "object" || body.deviceInfo === null) return false;
  return body.events.every((event) => {
    if (typeof event !== "object" || event === null) return false;
    const e = event as Record<string, unknown>;
    return (
      typeof e.eventName === "string" && ALLOWED_EVENT_NAMES.has(e.eventName) &&
      typeof e.eventCategory === "string" && ALLOWED_EVENT_CATEGORIES.has(e.eventCategory as AnalyticsEventCategory) &&
      typeof e.sessionId === "string" && e.sessionId.trim().length > 0
    );
  });
}

/** Mapea el payload crudo del cliente al formato esperado por el use-case. */
function mapPayloadToBatchInput(payload: IAnalyticsBatchInput): IAnalyticsBatchInput {
  return {
    events: payload.events.map((e): IAnalyticsEventInput => ({
      eventName: e.eventName,
      eventCategory: e.eventCategory,
      properties: e.properties ?? {},
      pageUrl: e.pageUrl ?? "",
      timestamp: e.timestamp ?? Date.now(),
      sessionId: e.sessionId,
    })),
    deviceInfo: sanitizeDeviceInfo(payload.deviceInfo),
  };
}

/** Agrupa eventos por session_id y upserta sesiones + actualiza contadores. */
async function upsertSessionsFromBatch(
  repository: SupabaseAnalyticsRepository,
  batchInput: IAnalyticsBatchInput,
  userId: string | null,
): Promise<void> {
  const sessionMap = new Map<string, { eventsCount: number; pageViews: number; firstTimestamp: number }>();
  for (const event of batchInput.events) {
    const existing = sessionMap.get(event.sessionId);
    if (existing) {
      existing.eventsCount += 1;
      if (event.eventName === "page_viewed") existing.pageViews += 1;
    } else {
      sessionMap.set(event.sessionId, {
        eventsCount: 1,
        pageViews: event.eventName === "page_viewed" ? 1 : 0,
        firstTimestamp: event.timestamp,
      });
    }
  }
  const device = batchInput.deviceInfo;
  for (const [sessionId, stats] of sessionMap) {
    await repository.upsertSession({
      sessionId,
      userId,
      startedAt: new Date(stats.firstTimestamp).toISOString(),
      deviceType: device.type,
      browser: device.browser,
      os: device.os,
      isPwa: device.isPwa,
    });
    await repository.updateSessionMeta(sessionId, stats.eventsCount, stats.pageViews);
  }
}

export async function POST(request: NextRequest) {
  // 1. Origin validation (CSRF)
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;

  // 2. Feature flag: permite apagar la ingesta sin desplegar
  if (process.env.ANALYTICS_ENABLED !== "true") {
    return NextResponse.json({ accepted: 0 }, { status: 200 });
  }

  // 3. Rate limit por IP
  const allowed = await consumeAnalyticsBatchRateLimit(request);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones de analytics." }, { status: 429 });
  }

  // 3b. Rechazar payloads gigantes antes de parsear (DoS barato)
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload demasiado grande." }, { status: 413 });
  }

  try {
    // 4. Parse + validar payload
    const payload = await request.json();
    if (!isValidBatchPayload(payload)) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }
    const batchInput = mapPayloadToBatchInput(payload);

    // 5. Derivar user_id server-side (NO confiar en el cliente)
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.headers.set("Cache-Control", "no-store");
    const routeClient = createSupabaseRouteClient(request, response);
    const { data: { user } } = await routeClient.auth.getUser();
    const userId = user?.id ?? null;

    // 6. Insert batch via service_role (bypassa RLS)
    const serviceClient = createSupabaseServiceRoleClient();
    const repository = new SupabaseAnalyticsRepository(serviceClient);
    const useCase = new RecordAnalyticsBatchUseCase(repository);
    const accepted = await useCase.execute(batchInput, userId);

    // 7. Upsert sesiones y actualizar contadores
    await upsertSessionsFromBatch(repository, batchInput, userId);

    return NextResponse.json({ accepted }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo procesar el batch de analytics.");
  }
}
