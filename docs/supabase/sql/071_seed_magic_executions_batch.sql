-- docs/supabase/sql/071_seed_magic_executions_batch.sql - Cartas mágicas (EXECUTION) con efectos nuevos.
-- claude-recharge (recupera energía) · hydra-attack-down (baja ATK a todas las entities rivales)
-- cursor-hand-purge (descarta 1 carta de la mano rival) · edge-trap-wipe (destruye todas las trampas del rival).
begin;

insert into public.cards_catalog
  (id, name, description, type, faction, cost, attack, defense, archetype, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active)
values
  ('exec-claude-recharge', 'Claude: Recarga', 'Recupera 3 de energía al instante.',
   'EXECUTION', 'BIG_TECH', 2, null, null, null, null, '/assets/renders/executions/exec-claude-recharge.webp',
   '{"action":"RESTORE_ENERGY","value":3}'::jsonb, null, '{}', null, true),
  ('exec-hydra-attack-down', 'Hydra: Fuerza Bruta', 'Reduce 700 de ataque a todas las entities rivales.',
   'EXECUTION', 'OPEN_SOURCE', 3, null, null, null, null, '/assets/renders/executions/exec-hydra-attack-down.webp',
   '{"action":"REDUCE_OPPONENT_ATTACK","value":700}'::jsonb, null, '{}', null, true),
  ('exec-cursor-hand-purge', 'Cursor: Purga', 'El rival descarta una carta de su mano.',
   'EXECUTION', 'NO_CODE', 3, null, null, null, null, '/assets/renders/executions/exec-cursor-hand-purge.webp',
   '{"action":"DISCARD_OPPONENT_HAND_CARD","count":1}'::jsonb, null, '{}', null, true),
  ('exec-edge-trap-wipe', 'Edge: Vórtice', 'Destruye todas las trampas puestas del rival.',
   'EXECUTION', 'BIG_TECH', 3, null, null, null, null, '/assets/renders/executions/exec-edge-trap-wipe.webp',
   '{"action":"DESTROY_ALL_TRAPS"}'::jsonb, null, '{}', null, true)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, type = excluded.type, faction = excluded.faction,
  cost = excluded.cost, render_url = excluded.render_url, effect = excluded.effect, is_active = excluded.is_active, updated_at = now();

commit;
