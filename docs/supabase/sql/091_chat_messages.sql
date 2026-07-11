-- docs/supabase/sql/091_chat_messages.sql
-- Chat/foro de comunidad: tabla de mensajes con soft-delete, RLS de solo-lectura para autenticados
-- (las escrituras van SIEMPRE por API con service-role validado), publicación realtime y retención a
-- 3 meses vía pg_cron (con guardas para no romper la migración si la extensión no está disponible).
begin;

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room        text not null default 'lobby',
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- Denormalizamos nick para no depender de un join por mensaje en el render del chat (el nick puede
  -- cambiar; se muestra el que tenía al enviar, aceptable para un chat).
  nickname    text not null default 'Operador',
  content     text not null check (char_length(content) between 1 and 500),
  -- Extensible sin nuevas tablas: 'TEXT' normal, 'CARD_SHARE' (metadata.cardId), 'SYSTEM' (anuncios).
  kind        text not null default 'TEXT' check (kind in ('TEXT', 'CARD_SHARE', 'SYSTEM')),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Consulta principal (últimos N por sala) y la purga por antigüedad usan este índice.
create index if not exists chat_messages_room_created_idx on public.chat_messages (room, created_at desc);

alter table public.chat_messages enable row level security;

-- Lectura: cualquier autenticado ve los mensajes NO borrados (también habilita realtime para el suscriptor).
drop policy if exists "chat_messages_select_visible" on public.chat_messages;
create policy "chat_messages_select_visible" on public.chat_messages
  for select to authenticated using (deleted_at is null);

-- Sin políticas de insert/update/delete para authenticated: TODAS las escrituras pasan por la API con
-- service-role (validación de contenido + rate limit + comprobación de propiedad en el borrado).
revoke all on public.chat_messages from anon, authenticated;
grant select on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;

-- Publicación realtime (guardada: no romper si ya estaba añadida).
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then raise notice 'publicación supabase_realtime no existe todavía; habilita realtime para chat_messages en el panel.';
end $$;

-- Retención a 3 meses vía pg_cron (guardada: no romper la migración si pg_cron no está disponible en local).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'purge_old_chat_messages',
    '17 3 * * *',
    $purge$ delete from public.chat_messages where created_at < now() - interval '3 months' $purge$
  );
exception
  when others then raise notice 'pg_cron no disponible; configura la retención de chat manualmente: %', sqlerrm;
end $$;

commit;
