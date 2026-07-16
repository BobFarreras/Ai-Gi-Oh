-- docs/supabase/sql/126_advisor_hardening.sql
-- 🧹 Limpieza de advertencias del linter de Supabase (Security Advisor) + un IDOR encontrado de paso.
--
-- Qué NO se toca y por qué: la mayoría de avisos `authenticated_security_definer_function_executable` (0029) son
-- RPC de usuario legítimas (buy_level_candy, claim_daily_login, get_player_missions, record_progression_event…)
-- que DEBEN ser SECURITY DEFINER para saltarse la RLS de forma controlada y se autovalidan con auth.uid().
-- Pasarlas a SECURITY INVOKER las rompería (justo el patrón que causó el dominó de la 122). Ese aviso es de
-- "confirma que es intencional", no un bug: se dejan como están.
begin;

-- ── 1) search_path fijo (advisor 0011: function_search_path_mutable) ─────────────────────────────────
-- Solo ALTER (no se toca el cuerpo). Todas usan refs cualificadas o builtins de pg_catalog, así que '' es seguro.
alter function public.set_updated_at()                                     set search_path = '';
alter function public.weekly_leaderboard_week_key(timestamp with time zone) set search_path = '';
alter function public.card_upgrade_budget(integer)                         set search_path = '';
alter function public.story_register_duel_result(uuid, text, boolean)      set search_path = '';

-- ── 2) anon no debe ejecutar RPC de usuario logueado (advisor 0028) ─────────────────────────────────
revoke execute on function public.award_weekly_points(text[], integer)   from anon;
revoke execute on function public.dm_get_or_create_conversation(uuid)     from anon;

-- ── 3) Funciones server-only / de trigger: fuera del alcance del cliente (0028 + 0029) ──────────────
-- find_or_create_match solo se llama con service-role (ruta de matchmaking); handle_new_auth_user es la función
-- del trigger de alta de usuario (los triggers corren como dueño de la tabla, no necesitan grant a nadie).
revoke execute on function public.find_or_create_match(uuid, text[])      from anon, authenticated;
revoke execute on function public.handle_new_auth_user()                  from anon, authenticated;

-- ── 4) 🔴 IDOR: dm_list_conversations era SECURITY DEFINER y NO validaba que p_self fuese el propio jugador.
-- Cualquier `authenticated` podía llamar /rest/v1/rpc/dm_list_conversations con el UUID de otro y leer su lista
-- de conversaciones (con previews y no leídos). Se ancla la identidad a auth.uid(): si p_self no coincide, el CTE
-- `me` queda vacío y la función no devuelve nada. No cambia el comportamiento legítimo (el repo pasa su propio id).
create or replace function public.dm_list_conversations(p_self uuid)
 returns table(conversation_id uuid, other_id uuid, other_nickname text, other_avatar_url text,
               last_message_at timestamp with time zone, last_preview text, last_kind text, unread_count integer)
 language sql
 security definer
 set search_path to ''
as $function$
  with me as (select p_self as uid where p_self = auth.uid())
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
$function$;

-- Grants explícitos tras el replace: solo el jugador logueado (y el servidor); nunca anon.
revoke execute on function public.dm_list_conversations(uuid) from public, anon;
grant  execute on function public.dm_list_conversations(uuid) to authenticated, service_role;

commit;

-- Pendiente FUERA de SQL (no se puede desde migración):
--   · auth_leaked_password_protection → activar en Dashboard → Authentication → Policies (HaveIBeenPwned).
--   · inventory_operations "RLS sin policy" es INFO y es el estado correcto: tabla server-only (ledger de compras
--     escrito por funciones SECURITY DEFINER); ningún cliente la lee. No se añade policy a propósito.
