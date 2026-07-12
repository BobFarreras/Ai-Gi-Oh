-- docs/supabase/sql/095_direct_messages.sql
-- Mensajes privados 1-a-1 (estilo WhatsApp). Una conversación por PAREJA (par ordenado low/high para
-- garantizar unicidad). Los mensajes reutilizan el diseño del chat de comunidad (soft-delete, kinds,
-- reply_to). RLS ESTRICTA: cada jugador solo ve/escribe en sus propias conversaciones.
-- No-leídos por participante vía *_read_at en la conversación. Realtime en dm_messages.
begin;

-- ── Conversaciones (una por pareja) ─────────────────────────────────────────────────────────────────
create table if not exists public.dm_conversations (
  id                 uuid primary key default gen_random_uuid(),
  player_low         uuid not null references auth.users (id) on delete cascade,
  player_high        uuid not null references auth.users (id) on delete cascade,
  last_message_at    timestamptz not null default now(),
  player_low_read_at timestamptz not null default now(),
  player_high_read_at timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  constraint dm_conversations_ordered check (player_low < player_high),
  unique (player_low, player_high)
);
create index if not exists dm_conversations_low_idx on public.dm_conversations (player_low, last_message_at desc);
create index if not exists dm_conversations_high_idx on public.dm_conversations (player_high, last_message_at desc);

-- ── Mensajes privados ────────────────────────────────────────────────────────────────────────────────
create table if not exists public.dm_messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.dm_conversations (id) on delete cascade,
  sender_id           uuid not null references auth.users (id) on delete cascade,
  content             text not null check (char_length(content) between 1 and 500),
  kind                text not null default 'TEXT' check (kind in ('TEXT', 'CARD_SHARE')),
  metadata            jsonb not null default '{}'::jsonb,
  reply_to_message_id uuid references public.dm_messages (id) on delete set null,
  created_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index if not exists dm_messages_conversation_created_idx
  on public.dm_messages (conversation_id, created_at desc);

alter table public.dm_conversations enable row level security;
alter table public.dm_messages enable row level security;

-- Lectura de conversaciones: solo los dos participantes.
drop policy if exists "dm_conversations_participants" on public.dm_conversations;
create policy "dm_conversations_participants" on public.dm_conversations
  for select to authenticated using (auth.uid() in (player_low, player_high));

-- Lectura de mensajes: solo participantes de la conversación y solo los NO borrados (habilita realtime).
drop policy if exists "dm_messages_participants_read" on public.dm_messages;
create policy "dm_messages_participants_read" on public.dm_messages
  for select to authenticated using (
    deleted_at is null and exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id and auth.uid() in (c.player_low, c.player_high)
    )
  );

-- Escrituras SIEMPRE por API con service-role (validación de contenido + rate limit + pertenencia).
revoke all on public.dm_conversations, public.dm_messages from anon, authenticated;
grant select on public.dm_conversations, public.dm_messages to authenticated;
grant all on public.dm_conversations, public.dm_messages to service_role;

-- ── Abre (o recupera) la conversación con otro jugador; devuelve su id ───────────────────────────────
create or replace function public.dm_get_or_create_conversation(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_self uuid;
  v_low uuid;
  v_high uuid;
  v_id uuid;
begin
  v_self := auth.uid();
  if v_self is null then raise exception 'Sesión no autenticada.' using errcode = '42501'; end if;
  if p_other is null or p_other = v_self then raise exception 'Destinatario no válido.' using errcode = '22023'; end if;
  if not exists (select 1 from auth.users where id = p_other) then
    raise exception 'El destinatario no existe.' using errcode = 'P0001';
  end if;
  v_low := least(v_self, p_other);
  v_high := greatest(v_self, p_other);
  insert into public.dm_conversations (player_low, player_high)
  values (v_low, v_high)
  on conflict (player_low, player_high) do nothing;
  select id into v_id from public.dm_conversations where player_low = v_low and player_high = v_high;
  return v_id;
end;
$$;

grant execute on function public.dm_get_or_create_conversation(uuid) to authenticated, service_role;

-- ── Lista de conversaciones del jugador: otro participante, último mensaje y no-leídos ──────────────
-- p_self lo aporta el servidor (sesión validada); la función corre con service-role, por eso no usa auth.uid().
create or replace function public.dm_list_conversations(p_self uuid)
returns table (
  conversation_id  uuid,
  other_id         uuid,
  other_nickname   text,
  other_avatar_url text,
  last_message_at  timestamptz,
  last_preview     text,
  last_kind        text,
  unread_count     integer
)
language sql
security definer
set search_path to ''
as $$
  with me as (select p_self as uid)
  select
    c.id,
    (case when c.player_low = me.uid then c.player_high else c.player_low end) as other_id,
    coalesce(lp.nickname, 'Duelista'),
    lp.avatar_url,
    c.last_message_at,
    lm.content,
    lm.kind,
    coalesce(uc.cnt, 0)::int
  from public.dm_conversations c
  cross join me
  left join public.player_profiles lp
    on lp.player_id = (case when c.player_low = me.uid then c.player_high else c.player_low end)
  left join lateral (
    select m.content, m.kind from public.dm_messages m
    where m.conversation_id = c.id and m.deleted_at is null
    order by m.created_at desc limit 1
  ) lm on true
  left join lateral (
    select count(*) as cnt from public.dm_messages m
    where m.conversation_id = c.id and m.deleted_at is null and m.sender_id <> me.uid
      and m.created_at > (case when c.player_low = me.uid then c.player_low_read_at else c.player_high_read_at end)
  ) uc on true
  where me.uid in (c.player_low, c.player_high)
  order by c.last_message_at desc
  limit 100;
$$;

grant execute on function public.dm_list_conversations(uuid) to service_role;

-- Publicación realtime (guardada: no romper si ya estaba añadida).
do $realtime$
begin
  alter publication supabase_realtime add table public.dm_messages;
exception
  when duplicate_object then null;
  when undefined_object then raise notice 'publicación supabase_realtime no existe; habilita realtime para dm_messages en el panel.';
end $realtime$;

-- Retención a 6 meses vía pg_cron (guardada).
do $cronwrap$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'purge_old_dm_messages',
    '23 3 * * *',
    $cron$ delete from public.dm_messages where created_at < now() - interval '6 months' $cron$
  );
exception
  when others then raise notice 'pg_cron no disponible; configura la retención de DM manualmente: %', sqlerrm;
end $cronwrap$;

commit;
