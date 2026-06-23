<!-- docs/PLAN_ANALYTICS.md - Plan de analytics y telemetría de usuarios para AI-GI-OH (revisión v2 con hardening). -->
# Plan de Analytics y Telemetría — AI-GI-OH

## Objetivo

Capturar el comportamiento real de los usuarios para entender flujos, detectar problemas y tomar decisiones de producto basadas en datos, sin afectar al rendimiento del juego.

---

## 0. Principios de Diseño (estándar de industria)

Estos 4 principios garantizan cero impacto en rendimiento y cero deuda técnica:

1. **Event-based + fire-and-forget**: el cliente solo empuja eventos a un buffer en memoria. Nunca espera respuesta.
2. **Batching + sendBeacon**: se envían en lotes (cada N s / al ocultar pestaña), no por evento. `navigator.sendBeacon` sobrevive a navegación/cierre y no bloquea el hilo.
3. **Desacoplado del game loop**: la telemetría nunca vive dentro del motor ni del render. Se instrumenta en los bordes (event handlers, casos de uso), no en el bucle de 60fps.
4. **Agregación en servidor**: el cliente manda eventos crudos; los KPIs se calculan en la BD (rollups/vistas), no en el navegador.

### Regla de oro: el tracker es un singleton vanilla, NO React

Un módulo `analytics-buffer.ts` con un array en memoria. `track()` es un push O(1) — sin estado React, sin Context, sin re-render. El motor (`core/use-cases`) queda PURO. Se instrumenta en `services/` y en handlers de UI.

### Feature flag

`ANALYTICS_ENABLED` (env var) permite apagar la ingesta al instante sin desplegar. Arrancar capturando poco (solo sesión + page_view) para validar el pipeline antes de instrumentar gameplay.

### Sampling

Eventos de alta frecuencia (`card_played`, `attack_declared`) se muestrean (ej. 1 de cada 5) para evitar ruido. Eventos de negocio (`duel_ended`, `pack_purchased`) nunca se muestrean.

---

## 1. Arquitectura Propuesta

### Ingesta (lado jugador, público)
```
analytics.track(event)           ← singleton vanilla, push O(1), sin React
  → buffer en memoria (ring, 50 eventos)
  → flush: requestIdleCallback + visibilitychange/pagehide + cada 30s
  → navigator.sendBeacon('/api/analytics/batch', payload)
  → API route valida + deriva user_id server-side
  → RecordAnalyticsBatchUseCase → SupabaseAnalyticsRepository → analytics_events
```

### Lectura (admin, igual que Auditoría)
```
/admin-portal/[slug]/analytics (Server Component) → assertAdminAccess
  → GetAnalyticsDashboardUseCase → IAnalyticsReadRepository (read-only)
GET /api/admin/analytics/* (paginado/filtrado, como /api/admin/audit)
```

### Mapa de capas (idéntico a admin/audit existente)

```
core/entities/analytics/*          ← IAnalyticsEvent, IAnalyticsSession, contratos
core/repositories/analytics/*      ← IAnalyticsWriteRepository, IAnalyticsReadRepository
core/use-cases/analytics/*         ← RecordAnalyticsBatchUseCase, GetAnalyticsDashboardUseCase
core/services/analytics/*          ← validadores (allowlist event_name/category, tamaño payload)
services/analytics/*               ← buffer cliente, device-info, track() singleton
infrastructure/persistence/supabase/SupabaseAnalyticsRepository.ts
components/admin/AdminAnalyticsPanel.tsx (read-only, estilo AdminAuditPanel)
```

---

## 2. Tablas Supabase (Nuevas)

### 2.1 Tabla principal de eventos
```sql
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL si anónimo
  session_id TEXT NOT NULL,                                   -- no confiable sin auth
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,  -- 'navigation', 'gameplay', 'shop', 'social', 'system'
  properties JSONB DEFAULT '{}',
  page_url TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
```

### 2.2 Sesiones de usuario
```sql
CREATE TABLE analytics_sessions (
  id TEXT PRIMARY KEY,  -- session_id generado en cliente
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT,  -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  os TEXT,
  referrer TEXT,
  is_pwa BOOLEAN DEFAULT false
);

CREATE INDEX idx_analytics_sessions_user ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_started ON analytics_sessions(started_at DESC);
```

### 2.3 RLS Policies (más restrictivo que el borrador anterior)

**Solo service_role puede insertar** (via endpoint API). No se concede INSERT a anon/authenticated.

```sql
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Sin policy de INSERT para anon/authenticated.
-- El endpoint usa service_role key (server-side), que bypassa RLS.

-- Admin ve todo (lectura)
CREATE POLICY "admin_read_events" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "admin_read_sessions" ON analytics_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );
```

### 2.4 Vistas materializadas (Fase 4, refrescadas por pg_cron)
```sql
CREATE MATERIALIZED VIEW analytics_daily_active_users AS
SELECT
  DATE(created_at) AS day,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT session_id) AS sessions
FROM analytics_events
WHERE user_id IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY day DESC;

CREATE MATERIALIZED VIEW analytics_popular_cards AS
SELECT
  properties->>'cardId' AS card_id,
  properties->>'cardName' AS card_name,
  event_name,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users
FROM analytics_events
WHERE event_name IN ('card_purchased', 'card_played', 'card_fused')
  AND properties->>'cardId' IS NOT NULL
GROUP BY properties->>'cardId', properties->>'cardName', event_name
ORDER BY total_events DESC;
```

---

## 3. Eventos a Trackear

### 3.1 Navegación y Sesión
| Evento | Propiedades | Cuándo |
|--------|-------------|--------|
| `session_started` | `device_type`, `browser`, `is_pwa` | Al cargar la app |
| `session_ended` | `duration_seconds`, `page_views` | Al cerrar/navegar fuera |
| `page_viewed` | `page`, `referrer` | Cada cambio de ruta |
| `hub_node_clicked` | `node_id`, `node_type` | Click en nodo del Hub 3D |

### 3.2 Gameplay
| Evento | Propiedades | Cuándo | Sampling |
|--------|-------------|--------|----------|
| `duel_started` | `mode`, `opponent_id`, `difficulty` | Iniciar duelo | 100% |
| `duel_ended` | `mode`, `winner`, `duration_turns`, `duration_ms` | Finalizar duelo | 100% |
| `card_played` | `card_id`, `card_name`, `phase`, `energy_cost` | Jugar carta | 20% (1/5) |
| `card_summoned` | `card_id`, `card_name`, `zone` | Invocar entidad | 20% |
| `attack_declared` | `attacker_id`, `target_id`, `damage` | Declarar ataque | 20% |
| `fusion_performed` | `fusion_id`, `materials[]` | Realizar fusión | 100% |
| `trap_triggered` | `trap_id`, `effect` | Activar trampa | 100% |
| `turn_completed` | `turn_number`, `phase`, `actions_count` | Completar turno | 100% |

### 3.3 Tienda y Economía
| Evento | Propiedades | Cuándo |
|--------|-------------|--------|
| `pack_purchased` | `pack_id`, `price`, `cards_received[]` | Comprar pack |
| `card_purchased` | `card_id`, `card_name`, `price` | Comprar carta del market |
| `nexus_earned` | `amount`, `source` | Ganar nexus |
| `nexus_spent` | `amount`, `destination` | Gastar nexus |

### 3.4 Progreso
| Evento | Propiedades | Cuándo |
|--------|-------------|--------|
| `story_node_completed` | `chapter`, `node_index`, `duel_index` | Completar nodo story |
| `story_chapter_completed` | `chapter` | Completar capítulo |
| `tutorial_step_completed` | `step_id`, `duration_ms` | Completar paso tutorial |
| `card_level_up` | `card_id`, `new_level`, `xp_gained` | Subir nivel de carta |
| `card_xp_gained` | `card_id`, `xp_amount`, `source` | Ganar XP |

### 3.5 Multiplayer
| Evento | Propiedades | Cuándo |
|--------|-------------|--------|
| `matchmaking_started` | `mode` | Buscar partida |
| `matchmaking_completed` | `wait_time_ms`, `opponent_id` | Emparejado |
| `multiplayer_match_ended` | `result`, `rating_change`, `duration_ms` | Fin de partida |

### 3.6 Errores y Performance
| Evento | Propiedades | Cuándo |
|--------|-------------|--------|
| `error_occurred` | `error_code`, `message`, `component` | Error capturado |
| `performance_degraded` | `metric`, `value`, `threshold` | FPS bajo, carga lenta |
| `fx_profile_changed` | `from`, `to` | Cambio manual de perfil |

---

## 4. Implementación en Cliente

### 4.1 Singleton vanilla (NO React, NO hook, NO Context)
```typescript
// src/services/analytics/analytics-buffer.ts
// Singleton vanilla: push O(1), sin estado React, sin re-render.

const BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 30_000;
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

let buffer: IAnalyticsEvent[] = [];
let sessionId = "";
let deviceInfo: IDeviceInfo | null = null;

/** Trackea un evento. Fire-and-forget: nunca lanza ni bloquea. */
export function track(eventName: string, properties?: Record<string, unknown>): void {
  if (!ANALYTICS_ENABLED) return;
  try {
    if (shouldSample(eventName)) return;
    buffer.push({ eventName, properties, timestamp: Date.now(), sessionId, pageUrl: location.pathname });
    if (buffer.length >= BUFFER_SIZE) scheduleFlush();
  } catch { /* analytics nunca rompe el juego */ }
}

/** Flush fuera del frame budget: requestIdleCallback + sendBeacon. */
function scheduleFlush(): void {
  const flush = () => {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0, BUFFER_SIZE);
    navigator.sendBeacon("/api/analytics/batch", JSON.stringify({ events: batch, deviceInfo }));
  };
  if ("requestIdleCallback" in window) requestIdleCallback(flush);
  else setTimeout(flush, 50);
}

// Flush en visibilitychange / pagehide (sobrevive a cierre de pestaña)
// Flush cada 30s (setInterval)
```

### 4.2 Device Info (una vez por sesión)
```typescript
// src/services/analytics/device-info.ts
export function captureDeviceInfo(): IDeviceInfo {
  return {
    type: detectMobile() ? "mobile" : "desktop",
    browser: navigator.userAgent,
    os: navigator.platform,
    isPwa: window.matchMedia("(display-mode: standalone)").matches,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportResolution: `${window.innerWidth}x${window.innerHeight}`,
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
}
```

### 4.3 Sampling
```typescript
// src/services/analytics/sampling.ts
const SAMPLED_EVENTS: Record<string, number> = {
  card_played: 0.2,      // 1 de cada 5
  card_summoned: 0.2,
  attack_declared: 0.2,
};

function shouldSample(eventName: string): boolean {
  const rate = SAMPLED_EVENTS[eventName];
  if (!rate) return false;            // sin sampling = siempre trackea
  return Math.random() > rate;
}
```

### 4.4 Inicialización de sesión (una vez al montar la app)
```typescript
// src/services/analytics/analytics-init.ts
export function initAnalytics(): void {
  if (!ANALYTICS_ENABLED) return;
  sessionId = generateSessionId();
  deviceInfo = captureDeviceInfo();
  track("session_started", { ...deviceInfo });
  // Listeners: visibilitychange, pagehide, interval 30s
}
```

---

## 5. API Route (Batch Insert) — Hardened

### 5.1 Endpoint
```typescript
// src/app/api/analytics/batch/route.ts
import { securityRateLimiter } from "@/services/security/api/rate-limit/security-rate-limiter";
import { requireTrustedMutationOrigin } from "@/services/security/require-trusted-mutation-origin";

export async function POST(request: Request) {
  // 1. Origin validation (CSRF)
  if (!requireTrustedMutationOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });

  // 2. Rate limit por IP
  const rateLimit = await securityRateLimiter.check("analytics-batch", getClientIp(request));
  if (!rateLimit.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  // 3. Parse + validar payload
  const body = await request.json();
  if (!isValidBatchPayload(body)) return Response.json({ error: "Invalid payload" }, { status: 400 });

  // 4. Derivar user_id server-side (NO confiar en el cliente)
  const supabase = createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;  // NULL si anónimo

  // 5. Validar allowlist de event_name y event_category
  const validated = body.events.filter(e => isValidEvent(e));

  // 6. Insert batch via service_role (bypassa RLS)
  const { error } = await supabaseServiceRole
    .from("analytics_events")
    .insert(validated.map(e => mapToRow(e, userId)));

  return Response.json({ accepted: validated.length });
}
```

### 5.2 Seguridad (reutilizando primitivos existentes)

| Riesgo | Mitigación (primitivos existentes) |
|--------|-----------------------------------|
| Flood/spam → coste y bloat de BD | `security-rate-limiter` por IP; batch ≤100, payload ≤32KB |
| Spoofing de user_id | `user_id` se deriva server-side de la cookie Supabase. `session_id` anónimo = no confiable |
| Eventos falsos / poisoning | Allowlist estricta de `event_name` y `event_category` (validadores en `core/services/analytics/`) |
| Inyección / XSS | Validación server-side del `properties` (tamaño/profundidad/longitud). React escapa, nunca `dangerouslySetInnerHTML` |
| PII / GDPR | No guardar IP, email ni PII. `user_id` = UUID seudónimo. Retención >90d |
| Fuga de datos vía RLS | `analytics_events`: insert solo `service_role` (vía endpoint). Sin grant de INSERT a anon/authenticated |
| Abuso cross-site / CSRF | `requireTrustedMutationOrigin` en el endpoint (ya usado en finish/route.ts) |
| Queries admin lentas (DoS) | Paginación + tope de rango de fechas + índices (igual que panel de Auditoría) |

---

## 6. Impacto en Rendimiento

### CPU y Red
| Aspecto | Impacto | Mitigación |
|---------|---------|------------|
| `track()` calls | ~0.01ms cada una | Push a array en memoria, sin React state |
| Flush cada 30s | ~5ms (1 batch HTTP) | `sendBeacon` no bloquea; `requestIdleCallback` fuera del frame budget |
| Device info | 1 vez por sesión | Cache en memoria |
| Tabla analytics_events | Writes en background | Índices optimizados, tablas separadas del juego |
| Errores de analytics | try/catch traga | Si analytics falla, el juego ni se entera |

### Base de Datos
| Operación | Frecuencia | Coste |
|-----------|------------|-------|
| INSERT batch | Cada 30s por usuario activo | 1 write por batch |
| SELECT dashboards | Solo admin | Materialized views (Fase 4) |
| Cleanup old events | Mensual (pg_cron) | DELETE + VACUUM |

**Con 100 usuarios concurrentes:**
- 100 writes cada 30s = ~3.3 writes/segundo
- Supabase soporta 100+ writes/segundo
- Sin impacto en queries del juego (son tablas separadas)

---

## 7. Orden de Implementación

### F1 — Infraestructura + ingesta (1-2 días)
1. Tablas en Supabase (`analytics_events`, `analytics_sessions`) + RLS + índices
2. API route `/api/analytics/batch` con hardening (rate limit, origin, allowlist, user_id server-side)
3. Singleton vanilla `analytics-buffer.ts` + `device-info.ts` + `sampling.ts`
4. Inicialización de sesión (`initAnalytics`)
5. Eventos `session_started`/`ended` y `page_viewed`
6. Feature flag `ANALYTICS_ENABLED`
7. Tests: buffer, flush, validadores, API route

### F2 — Eventos core (2-3 días)
1. `duel_started`/`ended` (instrumentado en `services/game/match/`, no en el motor)
2. Compras (`pack_purchased`, `card_purchased`) en `services/market/`
3. Multiplayer (`matchmaking_started`/`completed`, `multiplayer_match_ended`)
4. Tests de integración por evento

### F3 — Dashboard admin (2-3 días)
1. `core/repositories/analytics/IAnalyticsReadRepository` + `SupabaseAnalyticsRepository`
2. `GetAnalyticsDashboardUseCase` (KPIs: DAU, sesiones, cartas populares)
3. `AdminAnalyticsPanel.tsx` (read-only, estilo `AdminAuditPanel`)
4. SVG a mano para gráficas (cero deps)
5. Nuevo item en `AdminSidebarNav`
6. Tests del panel

### F4 — Agregación + limpieza ✅ (implementada 2026-06-23)
**Decisión de diseño:** en lugar de vistas materializadas + refresh por `pg_cron`, se usa una **función SQL de agregación on-demand** (`public.analytics_dashboard(p_since)`, migración 054). Razón: el dashboard es admin-only y se consulta rara vez, el volumen es bajo, y así (a) se elimina de raíz el tope de 1000 filas del cliente Supabase, (b) los KPIs salen siempre frescos sin lag de refresh, y (c) se evita la complejidad del refresh programado.
1. ✅ Función `analytics_dashboard` (DAU, totales, top eventos, distribución de dispositivos, duración media calculada desde `ended_at - started_at`). `security invoker` + `search_path=''` (sin avisos del linter), `execute` solo a `authenticated`/`service_role`.
2. ✅ `SupabaseAnalyticsReadRepository` reescrito para una sola llamada RPC (antes traía filas crudas → tope 1000).
3. ✅ `pg_cron` para retención: job `analytics-retention-90d` (DELETE eventos/sesiones >90 días, diario 03:17 UTC).
4. ✅ Hardening adicional: REVOKE de grants por defecto (053), saneamiento server-side de `deviceInfo`, tope de body 512KB.

**Pendiente (no bloqueante):** acumular `events_count`/`page_views` por sesión (hoy se sobreescriben por batch), emitir `session_ended` en cliente.

### F5 — Insights de producto ✅ (implementada 2026-06-23)
Paneles orientados a "cómo mejorar el juego" (migración 055 amplía `analytics_dashboard`):
1. ✅ **Top 10 jugadores** por duelos terminados, con nickname (join `player_profiles`).
2. ✅ **Top 10 cartas más usadas**: instrumentado `card_played`/`card_summoned` en el borde del tablero (`useExecutePlayAction`); nombre vía join a `cards_catalog`. (Muestreado al 20% → ranking representativo, conteos absolutos ≈1/5.)
3. ✅ **Top 10 cartas más compradas**: `card_purchased` enriquecido con `cardId`+precio; sobres vía `jsonb_array_elements_text(openedCardIds)`.
4. ✅ **Lista de usuarios conectados**: nickname, última sesión, nº de sesiones y dispositivo.
- Componentes SVG/tabla nuevos en `components/admin/internal/` (cero deps), integrados en `AdminAnalyticsPanel`.

---

## 8. Alternativas Externas (SaaS)

| Servicio | Coste | Pros | Contras |
|----------|-------|------|---------|
| **PostHog** | Free tier generoso | Auto-hosted, feature flags, session recording | Más pesado, learning curve |
| **Mixpanel** | Free hasta 20M events/mes | Analytics potente, dashboards listos | Externo, datos fuera de Supabase |
| **Amplitude** | Free hasta 10M events/mes | Machine learning, cohortes | Externo |
| **Plausible** | Desde €9/mes | Privacy-first, lightweight | Solo page views |

**Recomendación:** Sistema propio (Supabase) para control total y cero deps. Si se necesitan dashboards avanzados después, integrar PostHog self-hosted.

---

## 9. Ejemplo de Uso en Componentes

```typescript
// Import directo, sin hook, sin Context, sin re-render
import { track } from "@/services/analytics/analytics-buffer";

// En un handler de UI (no en el game loop)
function handleDuelStart() {
  track("duel_started", { mode: "STORY", opponentId: opponent.id, difficulty: opponent.difficulty });
}

// En un servicio (no en core/use-cases)
function recordPurchase(transaction: IMarketTransaction) {
  track("pack_purchased", { packId: transaction.packId, price: transaction.amount });
}
```

---

## 10. Decisiones Tomadas

| Decisión | Valor | Razón |
|----------|-------|-------|
| Alcance inicial | F1 (sesión + page_view) | Validar pipeline antes de gameplay |
| Gráficas dashboard | SVG a mano (cero deps) | Sin aumentar bundle, control total |
| Usuarios anónimos | Sí, con `session_id` | Capturar funnel completo pre-login |
| Código en repo público | Sí | Seguridad por identidad + rol, no por secretismo |
| Feature flag | `ANALYTICS_ENABLED` | Apagar sin desplegar |
| Sampling高频 | 20% (1/5) | Reducir ruido sin perder señal |
| Retención | 90 días | GDPR + coste de almacenamiento |

---

## 11. Checklist de Calidad

- [ ] Tablas creadas con índices
- [ ] RLS: insert solo service_role, lectura solo admin
- [ ] API route con rate limit + origin validation + allowlist
- [ ] user_id derivado server-side (no confiar en cliente)
- [ ] Buffer singleton vanilla (sin React state, sin re-render)
- [ ] Flush via requestIdleCallback + visibilitychange/pagehide + sendBeacon
- [ ] try/catch que traga errores (analytics nunca rompe el juego)
- [ ] Feature flag ANALYTICS_ENABLED
- [ ] Sampling para eventos de alta frecuencia
- [ ] Device info capturado 1 vez por sesión
- [ ] Eventos core trackeados (session, page_view, duel, shop)
- [ ] No impacto en 60fps del juego
- [x] Dashboard admin read-only (estilo Auditoría)
- [x] Gráficas SVG a mano (cero deps)
- [x] Agregación server-side vía RPC (sin tope de 1000 filas)
- [x] pg_cron para retención >90 días
- [x] No guardar PII (IP, email)
- [x] Saneamiento server-side de deviceInfo + tope de body
