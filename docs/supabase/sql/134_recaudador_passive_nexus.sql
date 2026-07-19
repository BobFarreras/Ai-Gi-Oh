-- docs/supabase/sql/134_recaudador_passive_nexus.sql
-- Ficha 3 Fase B (v1.17): la entity "Recaudador" + la acreditación server-authoritative de su pasiva.
--
-- La pasiva "Recaudación" (registrada en card_passive_skills por la 133) da 200 Nexus por combate ganado.
-- El motor SOLO cuenta (GameState.nexusEarnedByPlayerId, commit 397c8b43); aquí vive el candado del dinero:
--   · credit_passive_nexus: idempotente por operación, tope 600/duelo y 1200/día (día UTC, reloj servidor),
--     ejecutable SOLO por service_role (una RPC de crédito ejecutable por authenticated sería una granja).
--   · Paga solo donde la llama el servidor: cierres de Story y Arena con duelo TERMINADO (abandono no cobra).
-- Decisión (2026-07-16): topes fijos 600/1200 sin escalado V5; el árbol de habilidades (ficha 8) podrá
-- subir este rango en el futuro.
begin;

-- ── 1) La entity portadora: floja a propósito (farmear cuesta); invertir en ella (niveles/objetos) es la
--       estrategia. Innata desde V0; fuera del mapa V5 de arquetipo (sin doble poder, patrón 079/133).
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement,
  innate_passive_skill_id, is_active
) VALUES
  ('entity-recaudador', 'Recaudador',
   'Dron recaudador de la red: débil en combate, pero convierte sus victorias en Nexus contantes.',
   'ENTITY', 'NEUTRAL', 2, 400, 300, 'TOOL', NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/recaudador.webp',
   NULL, NULL, '{}', NULL,
   'passive-nexus-on-battle-win', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement,
  innate_passive_skill_id = EXCLUDED.innate_passive_skill_id, is_active = EXCLUDED.is_active;

DELETE FROM public.card_mastery_passive_map WHERE card_id = 'entity-recaudador';

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-entity-recaudador', 'entity-recaudador', 'EPIC', 1500, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

-- ── 2) Idempotencia y tope diario ───────────────────────────────────────────────────────────────────
create table if not exists public.passive_nexus_operations (
  operation_id uuid primary key,
  player_id    uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table if not exists public.passive_nexus_daily (
  player_id      uuid not null references auth.users (id) on delete cascade,
  day            date not null,
  nexus_credited integer not null default 0 check (nexus_credited >= 0),
  primary key (player_id, day)
);

-- ── 3) Acreditación con candados. Devuelve lo REALMENTE acreditado (0 si ya se cobró o el tope corta) ─
create or replace function public.credit_passive_nexus(
  p_player_id    uuid,
  p_amount       integer,
  p_operation_id uuid
)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_capped  integer;
  v_already integer;
  v_credit  integer;
  v_day     date;
begin
  if p_player_id is null or p_operation_id is null then return 0; end if;

  -- Idempotencia: el mismo cierre de duelo (reintentos de red incluidos) cobra UNA vez.
  insert into public.passive_nexus_operations (operation_id, player_id)
  values (p_operation_id, p_player_id)
  on conflict (operation_id) do nothing;
  if not found then return 0; end if;

  -- Tope por duelo: aunque el cliente reporte de más, nunca entra más de 600 por cierre.
  v_capped := least(greatest(coalesce(p_amount, 0), 0), 600);
  if v_capped = 0 then return 0; end if;

  -- Tope diario (día UTC, reloj del SERVIDOR). FOR UPDATE serializa dos cierres simultáneos.
  v_day := (now() at time zone 'utc')::date;
  insert into public.passive_nexus_daily (player_id, day, nexus_credited)
  values (p_player_id, v_day, 0)
  on conflict (player_id, day) do nothing;
  select nexus_credited into v_already
    from public.passive_nexus_daily
   where player_id = p_player_id and day = v_day
   for update;
  v_credit := least(v_capped, greatest(0, 1200 - v_already));
  if v_credit = 0 then return 0; end if;

  -- El monedero se mueve por la RPC canónica post-122/124 (misma tubería que el resto de recompensas).
  perform public.wallet_credit_nexus(p_player_id, v_credit);
  update public.passive_nexus_daily
     set nexus_credited = nexus_credited + v_credit
   where player_id = p_player_id and day = v_day;
  return v_credit;
end;
$$;

-- ── 4) RLS y permisos: NADIE desde el cliente (ni leer hace falta hoy); solo el servidor ─────────────
alter table public.passive_nexus_operations enable row level security;
alter table public.passive_nexus_daily      enable row level security;

revoke all on public.passive_nexus_operations, public.passive_nexus_daily from anon, authenticated;
grant all on public.passive_nexus_operations, public.passive_nexus_daily to service_role;

revoke all on function public.credit_passive_nexus(uuid, integer, uuid) from public, anon, authenticated;
grant execute on function public.credit_passive_nexus(uuid, integer, uuid) to service_role;

commit;
