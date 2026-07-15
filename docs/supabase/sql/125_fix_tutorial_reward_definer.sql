-- docs/supabase/sql/125_fix_tutorial_reward_definer.sql
-- 🐛 Último efecto dominó del cierre de seguridad de la cartera (migraciones 122/124).
--
-- Contexto: la migración 122 revocó a `authenticated` el EXECUTE de `wallet_credit_nexus` (solo `service_role`).
-- Pero `tutorial_claim_final_reward_nexus` seguía siendo SECURITY INVOKER y se llama con el cliente de SESIÓN
-- (ver create-supabase-tutorial-reward-claim-repository.ts → createSupabaseServerClient). Efecto en cadena:
--   1. La RPC corre como `authenticated`; su `perform public.wallet_credit_nexus(...)` interno da
--      `42501 permission denied for function wallet_credit_nexus` → la función entera revienta y la tx del
--      claim se revierte.
--   2. El repo (tryClaimAndApplyNexusReward) NO ve el error como de negocio: el mensaje contiene "function",
--      así que `isMissingRpcFunction` lo trata como "RPC no desplegada" y cae al FALLBACK de TS.
--   3. El fallback SÍ entrega la recompensa (inserta el claim + credita con service-role), PERO:
--        · la ruta atómica original queda muerta (nunca se ejecuta);
--        · claim e ingreso dejan de ser atómicos → si el credit falla tras insertar el claim, el jugador
--          queda marcado como "ya reclamado" sin haber recibido los Nexus (pérdida permanente);
--        · todo depende de que el texto del error siga conteniendo "function"; si cambiara, el claim fallaría
--          en duro con un ValidationError.
--
-- Arreglo (mismo patrón que la 124): la función pasa a SECURITY DEFINER con search_path fijo. Su dueño
-- (postgres) SÍ tiene execute sobre wallet_credit_nexus, así que la llamada interna vuelve a funcionar y se
-- recupera la atomicidad. La identidad se sigue validando con `auth.uid() = p_player_id`: es una RPC que el
-- jugador llama para SÍ MISMO, por eso conserva el grant a `authenticated` (a diferencia de las RPC de cartera,
-- que aceptan un player_id arbitrario y por eso solo las toca el servidor).
begin;

create or replace function public.tutorial_claim_final_reward_nexus(p_player_id uuid, p_reward_nexus integer)
returns table(applied boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_inserted_count integer := 0;
begin
  if p_reward_nexus <= 0 then
    raise exception 'La recompensa Nexus debe ser positiva.' using errcode = '22023';
  end if;

  if auth.uid() is distinct from p_player_id then
    raise exception 'No autorizado para reclamar esta recompensa tutorial.' using errcode = '42501';
  end if;

  insert into public.player_tutorial_reward_claims (player_id, reward_kind, reward_nexus)
  values (p_player_id, 'NEXUS', p_reward_nexus)
  on conflict (player_id) do nothing;

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count = 0 then
    return query select false;
    return;
  end if;

  perform public.wallet_credit_nexus(p_player_id, p_reward_nexus);

  insert into public.player_tutorial_node_progress (player_id, node_id)
  values (p_player_id, 'tutorial-final-reward')
  on conflict (player_id, node_id) do nothing;

  return query select true;
end;
$function$;

-- Sigue siendo una RPC de usuario (se auto-valida con auth.uid()); mantiene el grant a authenticated.
revoke all on function public.tutorial_claim_final_reward_nexus(uuid, integer) from public, anon;
grant execute on function public.tutorial_claim_final_reward_nexus(uuid, integer) to authenticated, service_role;

commit;

-- Comprobación posterior:
--   · tutorial_claim_final_reward_nexus es security definer y su búsqueda de path es fija (advisor limpio).
--   · un jugador que reclama por primera vez recibe los Nexus por la RUTA ATÓMICA (sin tocar el fallback).
