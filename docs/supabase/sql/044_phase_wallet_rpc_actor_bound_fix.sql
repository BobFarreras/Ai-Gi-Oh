-- docs/supabase/sql/044_phase_wallet_rpc_actor_bound_fix.sql - Corrige RPC wallet para operar siempre sobre auth.uid() y evitar falsos mismatch de player_id.
create or replace function public.wallet_debit_nexus(
  p_player_id uuid,
  p_amount integer
)
returns table (
  player_id uuid,
  nexus integer
)
language plpgsql
security invoker
as $$
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

  -- El actor autenticado es la única identidad fuente de verdad.
  -- p_player_id se mantiene por compatibilidad de firma.
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
end;
$$;

create or replace function public.wallet_credit_nexus(
  p_player_id uuid,
  p_amount integer
)
returns table (
  player_id uuid,
  nexus integer
)
language plpgsql
security invoker
as $$
declare
  actor_id uuid;
begin
  actor_id := auth.uid();
  if actor_id is null then
    raise exception 'Sesión no autenticada para acreditar monedero.' using errcode = '42501';
  end if;

  if p_amount <= 0 then
    raise exception 'El crédito Nexus debe ser positivo.' using errcode = '22023';
  end if;

  -- El actor autenticado es la única identidad fuente de verdad.
  -- p_player_id se mantiene por compatibilidad de firma.
  insert into public.player_wallets (player_id, nexus)
  values (actor_id, 1000)
  on conflict (player_id) do nothing;

  return query
  update public.player_wallets
     set nexus = player_wallets.nexus + p_amount
   where player_wallets.player_id = actor_id
  returning player_wallets.player_id, player_wallets.nexus;
end;
$$;

grant execute on function public.wallet_debit_nexus(uuid, integer) to authenticated;
grant execute on function public.wallet_credit_nexus(uuid, integer) to authenticated;
