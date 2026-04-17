-- docs/supabase/sql/042_phase_wallet_atomic_mutations.sql - Añade RPCs atómicas para débito/crédito de Nexus evitando carreras de concurrencia.
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
begin
  if p_amount <= 0 then
    raise exception 'El débito Nexus debe ser positivo.' using errcode = '22023';
  end if;

  if auth.uid() is distinct from p_player_id then
    raise exception 'No autorizado para debitar este monedero.' using errcode = '42501';
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
begin
  if p_amount <= 0 then
    raise exception 'El crédito Nexus debe ser positivo.' using errcode = '22023';
  end if;

  if auth.uid() is distinct from p_player_id then
    raise exception 'No autorizado para acreditar este monedero.' using errcode = '42501';
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
$$;

grant execute on function public.wallet_debit_nexus(uuid, integer) to authenticated;
grant execute on function public.wallet_credit_nexus(uuid, integer) to authenticated;
