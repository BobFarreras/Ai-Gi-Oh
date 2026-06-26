-- docs/supabase/sql/060_phase_progression_objective_types.sql - Nuevos objetivos de misión: SPEND_NEXUS (gasto de Nexus, vía wallet_debit_nexus) y WIN_ARENA/PLAY_ARENA (emitidos desde training). Añade misiones de ejemplo.
begin;

-- Recrea wallet_debit_nexus añadiendo el registro de progresión SPEND_NEXUS por el importe gastado.
-- El hook va en un bloque aislado: si la progresión falla, NUNCA rompe el débito de la economía.
create or replace function public.wallet_debit_nexus(p_player_id uuid, p_amount integer)
returns table(player_id uuid, nexus integer)
language plpgsql
as $function$
-- use_column resuelve la ambigüedad entre los OUT params (player_id/nexus) y las columnas
-- en `on conflict (player_id)`. Sin esto la RPC fallaba y el repo caía al fallback (sin hook).
#variable_conflict use_column
declare
  actor_id uuid;
begin
  actor_id := auth.uid();
  if actor_id is null then
    raise exception 'Sesión no autenticada para debitar monedero.' using errcode = '42501';
  end if;

  if p_amount <= 0 then
    raise exception 'El débito Nexus debe ser positivo.' using errcode = '22023';
  end if;

  insert into public.player_wallets (player_id, nexus)
  values (actor_id, 1000)
  on conflict (player_id) do nothing;

  return query
  update public.player_wallets
     set nexus = player_wallets.nexus - p_amount
   where player_wallets.player_id = actor_id
     and player_wallets.nexus >= p_amount
  returning player_wallets.player_id, player_wallets.nexus;

  if not found then
    raise exception 'Saldo Nexus insuficiente para completar el débito.' using errcode = 'P0001';
  end if;

  -- Progresión de misiones: cuenta el Nexus gastado. Aislado para no romper la economía.
  begin
    perform public.record_progression_event(array['SPEND_NEXUS']::text[], p_amount);
  exception when others then
    null;
  end;
end;
$function$;

-- Misiones de ejemplo con los nuevos objetivos.
insert into public.mission_definitions (id, scope, objective_type, target_count, reward_nexus, title, description, sort_order) values
  ('daily-spend-nexus', 'DAILY', 'SPEND_NEXUS', 1000, 200, 'Gran comprador', 'Gasta 1000 Nexus', 4),
  ('weekly-win-arena', 'WEEKLY', 'WIN_ARENA', 3, 400, 'Dominio de la arena', 'Gana 3 combates en la arena', 13)
on conflict (id) do nothing;

commit;
