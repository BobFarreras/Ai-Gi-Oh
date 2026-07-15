-- docs/supabase/sql/124_fix_wallet_rpc_player_id_and_spend_progression.sql
-- 🐛 Regresión introducida en v1.15 (cierre de seguridad de la cartera).
--
-- Contexto: la migración 122 revocó a `authenticated` la escritura de la cartera y sus RPC, y el código pasó a
-- escribir con SERVICE-ROLE (`resolve-privileged-write-client.ts`). Pero `wallet_debit_nexus` /
-- `wallet_credit_nexus` seguían atadas a `auth.uid()` (mig. 044/060), que bajo service-role es NULL. Efecto:
--   1. Cada débito/crédito lanzaba `42501` y el repo caía a un FALLBACK directo (UPDATE no atómico).
--   2. El fallback mueve el dinero PERO se salta el hook de progresión `SPEND_NEXUS` que vivía DENTRO de
--      `wallet_debit_nexus`. Por eso la misión "Gasta 1000 Nexus" no contaba al comprar cartas/packs.
--   3. De paso, el fallback reintroduce la carrera que arreglaron las migraciones 042/044 (lee-luego-escribe).
--
-- Arreglo (server-authoritative): como tras la 122 SOLO `service_role` puede ejecutar estas RPC y el servidor ya
-- deriva el `playerId` de la sesión, la identidad pasa a ser el parámetro `p_player_id` (de confianza, viene del
-- servidor), no `auth.uid()`. El hook de progresión se registra para ese `p_player_id` con una función que
-- recibe el jugador explícito y NO se expone al cliente. Se mantiene el candado de la 122 (solo service_role).
begin;

-- ── Progresión por jugador EXPLÍCITO ────────────────────────────────────────────────────────────────
-- Igual que record_progression_event pero recibiendo el player_id (para caminos server-side sin auth.uid,
-- como dentro de las RPC de cartera bajo service-role). No se concede a `authenticated`: al aceptar un
-- player_id arbitrario, un cliente podría anotar progreso a otros. Solo la alcanza el servidor / las RPC.
create or replace function public.record_progression_event_for(
  p_player_id uuid,
  p_action_types text[],
  p_count integer default 1
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_def public.mission_definitions;
  v_period text;
  v_rule record;
begin
  if p_player_id is null or p_count <= 0 then return; end if;

  -- Misiones activas que casen con las acciones.
  for v_def in
    select * from public.mission_definitions where is_active = true and objective_type = any(p_action_types)
  loop
    v_period := public.progression_period_key(v_def.scope);
    insert into public.player_mission_progress (player_id, mission_id, period_key, progress, completed_at)
    values (p_player_id, v_def.id, v_period, least(p_count, v_def.target_count),
      case when p_count >= v_def.target_count then now() else null end)
    on conflict (player_id, mission_id, period_key) do update
      set progress = least(public.player_mission_progress.progress + p_count, v_def.target_count),
          completed_at = case
            when public.player_mission_progress.completed_at is not null then public.player_mission_progress.completed_at
            when public.player_mission_progress.progress + p_count >= v_def.target_count then now()
            else null end,
          updated_at = now();
  end loop;

  -- Puntos de evento (mismo bus) para las acciones con regla en un evento activo.
  for v_rule in
    select r.event_id, r.points_per from public.event_point_rules r
    join public.events e on e.id = r.event_id
    where e.is_active = true and now() between e.starts_at and e.ends_at and r.action_type = any(p_action_types)
  loop
    insert into public.player_event_points (player_id, event_id, points)
    values (p_player_id, v_rule.event_id, v_rule.points_per)
    on conflict (player_id, event_id) do update
      set points = public.player_event_points.points + v_rule.points_per, updated_at = now();
  end loop;
end;
$$;

-- El wrapper con `auth.uid()` se mantiene idéntico de cara a los llamadores TS (rutas con el cliente de
-- sesión: BUY_CARD, BUY_PACK, EVOLVE_CARD, PLAY_DUEL…). Ahora delega en la versión player-explícita.
create or replace function public.record_progression_event(p_action_types text[], p_count integer default 1)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_progression_event_for(auth.uid(), p_action_types, p_count);
end;
$$;

-- ── Cartera: identidad = p_player_id (server-authoritative, solo service_role llama) ────────────────
create or replace function public.wallet_debit_nexus(p_player_id uuid, p_amount integer)
returns table(player_id uuid, nexus integer)
language plpgsql
security definer
set search_path = ''
as $function$
-- use_column resuelve la ambigüedad entre los OUT params (player_id/nexus) y las columnas en `on conflict`.
#variable_conflict use_column
begin
  if p_player_id is null then
    raise exception 'player_id requerido para debitar monedero.' using errcode = '42501';
  end if;
  if p_amount <= 0 then
    raise exception 'El débito Nexus debe ser positivo.' using errcode = '22023';
  end if;

  insert into public.player_wallets (player_id, nexus)
  values (p_player_id, 1000)
  on conflict (player_id) do nothing;

  return query
  update public.player_wallets
     set nexus = player_wallets.nexus - p_amount
   where player_wallets.player_id = p_player_id
     and player_wallets.nexus >= p_amount
  returning player_wallets.player_id, player_wallets.nexus;

  if not found then
    raise exception 'Saldo Nexus insuficiente para completar el débito.' using errcode = 'P0001';
  end if;

  -- Progresión de misiones: cuenta el Nexus gastado. Aislado para no romper NUNCA la economía.
  begin
    perform public.record_progression_event_for(p_player_id, array['SPEND_NEXUS']::text[], p_amount);
  exception when others then
    null;
  end;
end;
$function$;

create or replace function public.wallet_credit_nexus(p_player_id uuid, p_amount integer)
returns table(player_id uuid, nexus integer)
language plpgsql
security definer
set search_path = ''
as $function$
#variable_conflict use_column
begin
  if p_player_id is null then
    raise exception 'player_id requerido para acreditar monedero.' using errcode = '42501';
  end if;
  if p_amount <= 0 then
    raise exception 'El crédito Nexus debe ser positivo.' using errcode = '22023';
  end if;

  insert into public.player_wallets (player_id, nexus)
  values (p_player_id, 1000)
  on conflict (player_id) do nothing;

  return query
  update public.player_wallets
     set nexus = player_wallets.nexus + p_amount
   where player_wallets.player_id = p_player_id
  returning player_wallets.player_id, player_wallets.nexus;
end;
$function$;

-- ── Permisos: se mantiene el candado de la 122 (solo el servidor mueve dinero) ──────────────────────
revoke execute on function public.wallet_debit_nexus(uuid, integer)  from public, anon, authenticated;
revoke execute on function public.wallet_credit_nexus(uuid, integer) from public, anon, authenticated;
grant  execute on function public.wallet_debit_nexus(uuid, integer)  to service_role;
grant  execute on function public.wallet_credit_nexus(uuid, integer) to service_role;

revoke all on function public.record_progression_event_for(uuid, text[], integer) from public, anon, authenticated;
grant execute on function public.record_progression_event_for(uuid, text[], integer) to service_role;

commit;

-- Comprobación posterior:
--   · authenticated NO ejecuta las RPC de cartera ni record_progression_event_for (false).
--   · service_role SÍ; y una compra de carta ahora incrementa la misión SPEND_NEXUS.
