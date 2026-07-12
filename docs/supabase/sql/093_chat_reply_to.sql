-- docs/supabase/sql/093_chat_reply_to.sql
-- Responder a un mensaje (estilo WhatsApp): añade la referencia opcional al mensaje citado.
-- Aditiva e idempotente. Si el mensaje citado se borra/purga, la cita se vacía (ON DELETE SET NULL)
-- en lugar de bloquear el borrado o dejar una FK colgante.
begin;

alter table public.chat_messages
  add column if not exists reply_to_message_id uuid
    references public.chat_messages (id) on delete set null;

-- Índice para resolver rápido las citas de un lote de mensajes (y futuras vistas de hilo).
create index if not exists chat_messages_reply_to_idx
  on public.chat_messages (reply_to_message_id)
  where reply_to_message_id is not null;

commit;
