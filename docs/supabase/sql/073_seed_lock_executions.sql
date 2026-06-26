-- docs/supabase/sql/073_seed_lock_executions.sql - Cartas de bloqueo: Brave (2 turnos) y GitHub (3 turnos).
-- LOCK_OPPONENT_ENTITY: el jugador elige una entity rival que no podrá atacar durante N turnos.
begin;

insert into public.cards_catalog
  (id, name, description, type, faction, cost, attack, defense, archetype, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active)
values
  ('exec-brave-lock-2', 'Brave: Escudo', 'Bloquea una entity rival elegida: no podrá atacar durante 2 turnos.',
   'EXECUTION', 'OPEN_SOURCE', 3, null, null, null, null, '/assets/renders/executions/exec-brave-lock-2.webp',
   '{"action":"LOCK_OPPONENT_ENTITY","turns":2}'::jsonb, null, '{}', null, true),
  ('exec-github-lock-3', 'GitHub: Atadura', 'Bloquea una entity rival elegida: no podrá atacar durante 3 turnos.',
   'EXECUTION', 'OPEN_SOURCE', 4, null, null, null, null, '/assets/renders/executions/exec-github-lock-3.webp',
   '{"action":"LOCK_OPPONENT_ENTITY","turns":3}'::jsonb, null, '{}', null, true)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, type = excluded.type, faction = excluded.faction,
  cost = excluded.cost, render_url = excluded.render_url, effect = excluded.effect, is_active = excluded.is_active, updated_at = now();

insert into public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available)
values
  ('listing-exec-brave-lock-2',  'exec-brave-lock-2',  'RARE', 320, null, true),
  ('listing-exec-github-lock-3', 'exec-github-lock-3', 'EPIC', 400, null, true)
on conflict (id) do update set rarity = excluded.rarity, price_nexus = excluded.price_nexus, is_available = excluded.is_available, updated_at = now();

commit;
