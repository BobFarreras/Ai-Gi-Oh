# Guía de implementación — Batch "Comunidad + Rankings" (rama `feat/community-rankings-batch`)

> Estado: **planificación**. Rama creada desde `main` el 2026-07-12.
> Objetivo: 5 mejoras (1 bug crítico + 4 features) manteniendo calidad de producto, rendimiento en
> móvil/PCs viejos y sin abrir vulnerabilidades. Progreso server-authoritative, claims idempotentes.

Decisiones de producto ya tomadas con el usuario (2026-07-12):
- **Chat privado (punto 2)** → **DM 1-a-1 completo** (tablas propias + RLS estricta + no-leídos + realtime por conversación).
- **Rankings (punto 5)** → **dos clasificaciones separadas** (Actividad y Comercial) con **premios automáticos vía `pg_cron` los domingos**.
  - *Ranking de Actividad*: misiones + eventos + diarias completadas (puntos ya ganados) + combates (≈ **+20 por combate**).
  - *Ranking Comercial*: cartas compradas, packs, evoluciones, etc.

Orden de entrega recomendado (de menor a mayor riesgo, cada uno commit propio y verificable):
**P1 (bug Acto 3) → P4 (botones móvil) → P3 (drag-to-reply) → P5 (rankings) → P2 (DM 1-a-1)**.

Reglas del repo a respetar (memoria del proyecto):
- Usar **pnpm** (npm bloqueado). Verificar con `CI=true pnpm quality:check` (exit code real) **antes de commitear**.
- No correr `pnpm build` en la misma carpeta que el `pnpm dev` del usuario (corrompe `.next`). Verificar con lint+typecheck+tests; el build queda para antes de release.
- Frontera arquitectura: browser client de Supabase SOLO en `core/hooks` o `api/`; server actions/pages importan *services*, no infraestructura (regla eslint `no-restricted-imports`).
- Migraciones: `.sql` versionado en `docs/supabase/sql/NNN_*.sql` + aplicar a prod vía MCP `apply_migration`. Idempotentes. Si el dev usa Supabase local, aplicarlas también ahí.

---

## P1 — Bug Acto 3: soft-lock del puzzle caja→placa (CRÍTICO)

### Síntoma
En el Acto 3, la sala de la caché (donde luchas contra el Soldado-Laptop `story-ch3-duel-4`): abres la
compuerta empujando la caja sobre la placa, entras, ganas el duelo y, al volver, la puerta se ha vuelto a
cerrar y quedas atrapado dentro → bucle / soft-lock.

### Causa raíz (confirmada en código)
- La compuerta `story-a3-gate-puzzle` (6,23) — único acceso a la sala de recompensa/caché (`roomReward`,
  donde está `story-ch3-duel-4` en 7,18) — requiere `gateRequiredNodeIds: ["story-ch3-plate-1"]`
  (`src/services/story/overworld/act-3-overworld-tilemap.ts:179`).
- La placa solo cuenta como "satisfecha" **en vivo** mientras la caja la pisa: el engine la mete en el
  `interactedNodeIds` aumentado únicamente si `pressedPlateIds` la contiene
  (`src/components/hub/story/overworld/engine/OverworldEngine.ts:320-324`).
- **La posición de la caja NO se persiste.** Al lanzar `story-ch3-duel-4` se navega fuera del overworld;
  al volver, el engine re-inicializa la caja en su casilla de origen (`initBoxesAndPlates`), la placa se
  despresuriza, la compuerta se recalcula cerrada → el jugador reaparece dentro de `roomReward` sin salida.
- `story-ch3-plate-1` **no existe** en el registro clásico `act-3-map-definition.ts`, así que hoy tampoco
  podría persistirse vía `mark-interacted` (el servidor lo rechazaría por id desconocido).

### Fix (patrón ya usado para el puente del Acto 2 — "latch" de la placa)
La placa, una vez pulsada, se **enclava permanentemente** (server-authoritative, one-time). Es el
comportamiento natural de un puzzle resuelto y elimina el soft-lock de raíz.

1. **Registrar el nodo virtual** en `src/services/story/map-definitions/act-3-map-definition.ts`:
   añadir `v({ id: "story-ch3-plate-1", duelIndex: 309, nodeType: "EVENT", title: "Placa de Presión", unlockRequirementNodeId: null, position: {...} })`.
   (nodeType `EVENT` → `mark-interacted` lo acepta, igual que switches/terminal.)
2. **Persistir al pulsar** en `OverworldDevScene.tsx`, hook `onPlatePressed` (hoy solo reproduce el sonido
   de puerta, `~línea 493`): recibir el `plateId`, además del sonido:
   - `POST /api/story/overworld/mark-interacted` con `{ nodeId: plateId }` (mismo patrón que
     `ACT2_BRIDGE_EVENT_ID`, `OverworldDevScene.tsx:664`).
   - Añadir el `plateId` al set local de interacted (`seenEventIdsRef`/`initialInteracted`) y
     `engine.updateProgress(...)` para que la compuerta quede abierta también sin recargar.
3. **Verificar restauración**: `get-story-overworld-runtime` devuelve `interactedNodeIds`; con la placa
   dentro, `story-a3-gate-puzzle` queda satisfecha para siempre → al volver del duelo la puerta sigue
   abierta.

Nota: el hook `onPlatePressed` ya recibe el id de la placa desde el engine
(`OverworldEngine.ts:1062 → this.hooks.onPlatePressed?.(id)`); solo hay que consumir el parámetro en la escena.

### Verificación
- Test unitario (opcional pero recomendado): tras marcar la placa como interacted, la compuerta del puzzle
  no está en `blockedObjectIds`.
- Manual en navegador (`pnpm build && pnpm start`, no dev): empujar caja → placa → entrar → ganar duel-4 →
  confirmar que al volver se puede salir y que tras refrescar la puerta sigue abierta.
- Revisar que ningún otro acto reusa una placa como puerta a una sala con duelo obligatorio (Acto 3 es el único hoy).

---

## P4 — Recolocar los botones flotantes del hub en móvil

### Estado actual
`src/components/hub/HubSceneFloatingActions.tsx`: fila única (`flex items-center gap-2`) anclada
abajo-derecha con 4 botones: **Chat**, **Recentrar cámara** (condicional), **Toggle etiquetas**, **Logout**.
En pantallas estrechas se aprietan / desbordan contra el `safe-area`.

### Fix (solo CSS/estructura, sin lógica nueva)
- Permitir que la fila se ajuste al espacio: `flex-wrap` + `justify-end`, o pasar a rejilla compacta
  (p. ej. 2×2 en `< 380px`) manteniendo el orden lógico.
- Garantizar tamaños táctiles mínimos (≥ 40px) y separación uniforme; respetar
  `env(safe-area-inset-bottom/right)` (ya presente).
- Mantener consistencia visual con el resto de HUD cibernético (clip-path octagonal ya usado en otros botones).
- No cambiar la animación de entrada ni los timings (`HUB_HUD_*`).

### Verificación
Probar en viewport móvil (375×812) y en un ancho intermedio; los 4 botones deben quedar accesibles sin
solaparse ni salir del área segura. Usar el Browser pane con `resize_window` preset `mobile`.

---

## P3 — Arrastrar un mensaje para responderlo (reply, estilo WhatsApp)

Aplica al **chat de lobby** y (cuando exista) a los **DM**. Diseñar el componente de "responder" de forma
reutilizable para no duplicarlo.

### Backend
- Migración: añadir columna `reply_to_message_id uuid NULL REFERENCES chat_messages(id) ON DELETE SET NULL`
  a `chat_messages`. Aditiva, idempotente (`ADD COLUMN IF NOT EXISTS`).
- Entidad `IChatMessage` + repo + use-case `sendChatMessage`: aceptar `replyToMessageId` opcional y
  devolverlo en el fetch inicial y en realtime (ya viaja en el row de `postgres_changes`).
- El endpoint `app/api/chat/messages` valida que el mensaje citado exista en la misma sala.

### Frontend (`CommunityChatClient.tsx` y hook `use-community-chat`)
- Gesto: `pointerdown`/`pointermove` sobre la burbuja; al arrastrar horizontalmente > umbral se fija el
  estado `replyingTo`. Fallback accesible: botón "Responder" en el menú de acciones de cada mensaje
  (imprescindible para teclado/lectores de pantalla — el drag no puede ser el único camino).
- Preview de la cita encima del input (autor + extracto, botón "x" para cancelar).
- Render: la burbuja con `replyToMessageId` muestra arriba un bloque citado clicable (hace scroll al original).
- Rendimiento: el gesto debe usar transform/opacity y no provocar re-render de toda la lista (memoizar la
  fila de mensaje; el estado de arrastre es local a la burbuja activa).

### Verificación
Arrastrar en desktop y touch; responder, cancelar, y confirmar que la cita persiste tras refresco y llega
por realtime a otro cliente.

---

## P5 — Rankings semanales (Actividad + Comercial) con premios automáticos los domingos

### Modelo de datos (migración nueva `NNN_weekly_leaderboards.sql`)
- `weekly_leaderboard_points(player_id, week_key text, board 'ACTIVITY'|'COMMERCIAL', points int, updated_at)`,
  PK `(player_id, week_key, board)`. Acumulador incremental por semana.
- `weekly_leaderboard_prizes(board, rank_from int, rank_to int, reward_nexus int, reward_event_points int, ...)`
  editable desde admin (config de premios por rango y por tablero).
- `weekly_leaderboard_history(week_key, board, player_id, final_rank, points, awarded_nexus, awarded_at)`
  snapshot de cierre (archivo + auditoría de premios).
- `week_key`: clave de semana que **cierra el domingo** (definir explícitamente; el usuario quiere reset
  y premios los domingos). Ojo: `reset-schedule.ts` actual usa **lunes UTC** para misiones semanales —
  NO reutilizar tal cual; crear un helper de "semana que termina domingo" y decidir zona horaria (UTC
  recomendado por consistencia con el resto del backend). Documentar la decisión.

### Acumulación de puntos (server-authoritative)
- Extender el bus `record_progression_event` (o una RPC nueva `record_weekly_points`) para, además de
  misiones/eventos, **acreditar puntos al tablero correcto** según el tipo de acción:
  - Actividad: claim de misión/evento/diaria (usar los puntos ya ganados) + **+20 por combate**
    (story/arena/MP — decidir cuáles; el usuario mencionó "combates").
  - Comercial: compra de carta/pack, evolución, etc. (engancha en `buy-card`, apertura de packs, `evolve`).
- Todo idempotente y atómico (patrón `wallet_credit_nexus`). Identidad por `auth.uid()`. RLS: el jugador
  solo lee; la escritura va por RPC `SECURITY DEFINER` / service_role.

### Cierre semanal + premios (`pg_cron`, domingos)
- Job programado el domingo (fin de semana): calcular ranking final de cada tablero, repartir premios del
  top-N (Nexus + moneda de evento) usando las RPCs de wallet existentes, escribir `weekly_leaderboard_history`
  y arrancar la nueva `week_key`. Idempotente (no repartir dos veces la misma semana).
- Reutilizar el patrón de `pg_cron` del chat (memoria: chat ya usa Realtime + pg_cron).

### Frontend
- Nueva sección/pestañas de ranking semanal (reutilizar `RankingList`/`RankingRow` de
  `src/components/hub/ranking/`): dos tableros, tu posición destacada, cuenta atrás al domingo
  (helper de reset) y preview de premios. Analytics: trackear vistas/claims si aplica.
- Admin: pestaña en `/admin-portal/[slug]/live-ops` para editar `weekly_leaderboard_prizes`
  (reutilizar átomos de form de `components/admin/internal/live-ops/`).

### Verificación
- Tests puros del cálculo de `week_key` (domingo) y del ordenado/ranking.
- Simular acumulación de puntos por cada acción y verificar el reparto del job (en local con Supabase Docker).

---

## P2 — Chat privado 1-a-1 (DM completo) + rediseño/estructura del chat

Es la pieza más grande y la que más toca la BD; va al final. Rediseño de estructura del chat (punto 2 del
usuario) para soportar navegación entre canal de lobby y conversaciones privadas.

### Modelo de datos (migración nueva `NNN_direct_messages.sql`)
- `dm_conversations(id uuid, player_low uuid, player_high uuid, last_message_at, created_at,
  UNIQUE(player_low, player_high))` — par ordenado para garantizar una sola conversación por pareja.
- `dm_participants` opcional si se quiere generalizar; para 1-a-1 basta con las 2 columnas + una vista.
- `dm_messages(id, conversation_id, sender_id, content, kind, metadata, reply_to_message_id, created_at,
  deleted_at)` — reutiliza el diseño de `chat_messages` (soft-delete, kinds CARD_SHARE/DUEL, reacciones si
  se quiere; empezar sin reacciones).
- `last_read_at` por participante para **no-leídos** (badge). Índices por `conversation_id, created_at`.
- **RLS estricta**: un jugador solo ve conversaciones donde es `player_low` o `player_high`, y solo los
  mensajes de esas conversaciones. Escritura solo como `sender_id = auth.uid()` y siendo participante.

### Dominio / API (reusar frontera del chat existente)
- `core/{entities,repositories,use-cases,services}/chat` → añadir sub-área DM (o extender): abrir/obtener
  conversación por par, listar conversaciones con último mensaje + no-leídos, enviar, marcar leído.
- API `app/api/chat/dm/*` (o extender `app/api/chat/messages`).
- Realtime: hook `use-direct-messages` (en `core/hooks`) suscrito a `postgres_changes` filtrado por
  `conversation_id`; lista de conversaciones suscrita a cambios de `last_message_at`/no-leídos.

### Frontend (rediseño de estructura)
- `/hub/chat` pasa a layout de dos zonas: lista de conversaciones (lobby + DMs) ↔ panel de conversación
  activa (patrón WhatsApp). En móvil, navegación tipo push (lista → conversación).
- Iniciar DM: desde la lista de conectados del chat / perfil del jugador ("Enviar mensaje").
- Reutiliza P3 (reply) y el compartir carta/retar existentes.
- Rendimiento móvil: virtualizar/paginar si una conversación crece; carga inicial server-side para LCP
  (como hace hoy `page.tsx`).

### Seguridad
- Rate limit real requiere Upstash (hoy inerte, ver memoria `prod-env-rate-limit-gap`). Como mínimo,
  validación de longitud/kind server-side (ya existe `validate-chat-message`) y RLS. No exponer ids de
  jugador sensibles en URLs.

### Verificación
- Tests de use-cases con repos falsos + verificación en BD real de que RLS bloquea el acceso cruzado
  (gotcha de memoria: los unit tests con repos falsos NO detectan tabla/RLS ausente — probar contra
  Supabase local/preview).

---

## Checklist de release del batch
- [ ] P1 bug Acto 3 (migración registro virtual + persistencia placa)
- [ ] P4 botones móvil
- [ ] P3 drag-to-reply (migración `reply_to_message_id`)
- [ ] P5 rankings semanales (migración + RPCs + pg_cron + UI + admin)
- [ ] P2 DM 1-a-1 (migración + dominio + API + UI rediseñada)
- [ ] `CI=true pnpm quality:check` verde
- [ ] Migraciones aplicadas a prod (MCP) y a Supabase local
- [ ] CHANGELOG + bump de versión (`pnpm release:prepare`)
</content>
</invoke>
