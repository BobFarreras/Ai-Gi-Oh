# Diseño — Chat/Foro de comunidad (ai-gi-oh)

> Estado: **diseño aprobado, sin implementar** (2026-07-11). Realtime elegido: **Supabase Realtime**.
> Retención elegida: **pg_cron** (purga a 3 meses). Este documento es la guía para implementarlo cuando toque.

## 1. Objetivo y alcance

Chat de comunidad para usuarios autenticados. Empezar con **una sala global "lobby"** (simple, barato,
suficiente para validar). Ampliable después a canales/hilos tipo foro.

- **MVP**: enviar/leer mensajes en vivo, borrar los propios, paginación, RLS, retención automática 3 meses.
- **Fase 2 (futuro)**: canales/salas múltiples o hilos, moderación avanzada (reportes + panel admin), presencia
  ("en línea"), menciones, adjuntos.

**No satura la BD** si se aplican: retención (pg_cron), paginación (no traer todo), rate limit (anti-spam),
índices. Los mensajes son texto pequeño; el riesgo real es crecimiento sin límite y spam, ambos controlados.

## 2. Modelo de datos

Tabla `chat_messages` (una migración nueva, p.ej. `NNN_chat_messages.sql`):

```sql
create table public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  room         text not null default 'lobby',
  user_id      uuid not null references auth.users (id) on delete cascade,
  content      text not null check (char_length(content) between 1 and 500),
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz            -- soft delete (moderación/recuperación); el purgado limpia definitivo
);

-- Consulta principal (últimos N por sala) y purga por antigüedad usan este índice.
create index chat_messages_room_created_idx on public.chat_messages (room, created_at desc);

alter table public.chat_messages enable row level security;
```

Denormalizar el nombre/avatar del autor **no** en esta tabla: se resuelve por join a `player_profiles`
(o se envía en el payload de realtime enriquecido desde el servidor). Evitar duplicar datos mutables.

## 3. RLS (seguridad)

```sql
-- Leer: cualquier autenticado, solo mensajes no borrados.
create policy chat_read on public.chat_messages
  for select to authenticated using (deleted_at is null);

-- Insertar: solo como uno mismo (el content-length ya lo valida el CHECK de la tabla).
create policy chat_insert on public.chat_messages
  for insert to authenticated with check (user_id = auth.uid());

-- Borrar: soft delete propio (update de deleted_at) — o borrado admin vía service-role (bypassa RLS).
create policy chat_soft_delete_own on public.chat_messages
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
```

- El borrado del usuario es un **UPDATE** que pone `deleted_at = now()` (soft delete), no un DELETE.
- El admin borra cualquiera desde el panel usando el **service-role** (como arena/market/story admin).
- RLS **no forzado** en la tabla, para que el service-role (retención/moderación) bypasee.

## 4. Realtime (Supabase Realtime)

- Suscripción a **Postgres Changes** de `chat_messages` con filtro `room=eq.lobby`, evento `INSERT` → los
  mensajes nuevos llegan en vivo sin polling.
- El cliente mantiene una lista local: carga inicial (últimos 50) + append de los INSERT recibidos.
- Para "en línea"/"escribiendo" (fase 2) usar **Realtime Presence/Broadcast** (efímero, NO toca la BD).
- Gotcha: hay que habilitar la publicación realtime de la tabla (`supabase_realtime`) en la migración:
  `alter publication supabase_realtime add table public.chat_messages;`

## 5. Retención automática — pg_cron (3 meses)

```sql
-- Requiere las extensiones pg_cron (y opcional pg_net) habilitadas en el proyecto Supabase.
create extension if not exists pg_cron;

-- Purga diaria de mensajes con más de 3 meses (incluye soft-deleted).
select cron.schedule(
  'purge_old_chat_messages',
  '17 3 * * *',                       -- cada día 03:17 UTC
  $$ delete from public.chat_messages where created_at < now() - interval '3 months' $$
);
```

- Correr a diario (no cada 3 meses) mantiene la tabla acotada de forma continua.
- El índice `(room, created_at)` hace el DELETE eficiente.
- Alternativa si no se quiere pg_cron: una **Edge Function** + Scheduled Trigger de Supabase con el mismo DELETE.

## 6. Anti-spam / rate limit

- Longitud máxima por `CHECK` (500) en la tabla.
- Rate limit por usuario (p.ej. 5 mensajes / 10 s): reutilizar el `admin-rate-limiter`/patrón de Upstash del
  proyecto en el endpoint de envío (nota: en prod el rate limiting está hoy inerte sin Upstash — ver
  `prod-env-rate-limit-gap`; para el chat conviene activarlo de verdad o un check simple en BD por `created_at`).
- Validación server-side del content (trim, longitud, no vacío) en el use case, no confiar solo en el CHECK.

## 7. Arquitectura (alineada con el proyecto)

- **Entidad**: `core/entities/chat/IChatMessage.ts`.
- **Repositorio**: `core/repositories/IChatRepository.ts` + `infrastructure/persistence/supabase/SupabaseChatRepository.ts`
  (list recientes, insert, soft-delete).
- **Use cases**: `SendChatMessageUseCase` (valida + inserta), `GetRecentChatMessagesUseCase` (paginación),
  `DeleteOwnChatMessageUseCase`.
- **API**: `app/api/chat/messages/route.ts` (GET paginado + POST enviar, con `requireTrustedMutationOrigin` +
  auth), `app/api/chat/messages/[id]/route.ts` (DELETE soft propio). La suscripción realtime va directa por el
  cliente de Supabase (no por API).
- **Cliente**: hook `use-community-chat.ts` (carga inicial + suscripción realtime + enviar/borrar optimista),
  y UI `components/hub/community/CommunityChat.tsx`. Reutilizar el patrón store local por instancia si hace falta.
- **Paginación**: `GET /api/chat/messages?before=<cursor>&limit=50` (keyset por `created_at,id`).

## 8. Plan de implementación (cuando se apruebe)

1. Migración: tabla + índice + RLS + publicación realtime + pg_cron. Aplicar a local y prod.
2. Entidad + repositorio + use cases + tests de dominio.
3. API routes (GET/POST/DELETE) con auth + origin guard + rate limit.
4. Hook cliente + suscripción realtime + UI en el hub.
5. Verificar: enviar/recibir en vivo (2 sesiones), borrar propio, paginación, y que el purgado funciona
   (probar el DELETE de retención manualmente).

## 9. Preguntas abiertas (decidir al implementar)

- ¿Una sala global o ya varios canales desde el inicio? (recomendado: empezar con `lobby`).
- ¿Moderación en el MVP (reportar/borrar admin) o fase 2?
- ¿Mostrar avatar/nombre desde `player_profiles` por join o enriquecer el payload en el servidor?
- ¿Activar Upstash para el rate limit real del chat (hoy inerte en prod)?
