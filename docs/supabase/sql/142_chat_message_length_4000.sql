-- docs/supabase/sql/142_chat_message_length_4000.sql
-- Sube el tope de longitud de mensaje de chat (general y DM) de 500 a 4000 caracteres, relajando el CHECK de la
-- BD para que coincida con CHAT_MESSAGE_MAX_LENGTH (app). Es un "widening" compatible: los mensajes ≤500 ya
-- existentes siguen siendo válidos, y se mantiene un tope (protección frente a mensajes gigantes por Realtime).
--
-- ORDEN DE DESPLIEGUE: aplicar ANTES (o a la vez) que el deploy del código que permite escribir hasta 4000.
-- Si el código se desplegara antes que esta migración, un mensaje de >500 lo rechazaría la BD.
begin;

alter table public.chat_messages drop constraint if exists chat_messages_content_check;
alter table public.chat_messages add constraint chat_messages_content_check check (char_length(content) between 1 and 4000);

alter table public.dm_messages drop constraint if exists dm_messages_content_check;
alter table public.dm_messages add constraint dm_messages_content_check check (char_length(content) between 1 and 4000);

commit;

-- Comprobación posterior:
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conname in ('chat_messages_content_check','dm_messages_content_check');
