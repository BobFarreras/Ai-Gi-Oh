-- docs/supabase/sql/092_chat_message_reactions.sql
-- Reacciones (emoji) a mensajes del chat de comunidad. Escrituras por API con service-role; lectura para
-- autenticados. Las reacciones se propagan en vivo por broadcast (no requieren publicación realtime propia)
-- y se borran en cascada con su mensaje (y con la purga de retención de mensajes).
begin;

create table if not exists public.chat_message_reactions (
  id          bigint generated always as identity primary key,
  message_id  uuid not null references public.chat_messages (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  emoji       text not null check (char_length(emoji) between 1 and 16),
  created_at  timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists chat_reactions_message_idx on public.chat_message_reactions (message_id);

alter table public.chat_message_reactions enable row level security;

drop policy if exists "chat_reactions_select_all" on public.chat_message_reactions;
create policy "chat_reactions_select_all" on public.chat_message_reactions
  for select to authenticated using (true);

revoke all on public.chat_message_reactions from anon, authenticated;
grant select on public.chat_message_reactions to authenticated;
grant all on public.chat_message_reactions to service_role;

commit;
