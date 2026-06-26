-- docs/supabase/sql/070_seed_fusion_cards_batch2.sql - Segundo lote de fusiones: CursHost, KuberLinnet, RustyFox, Super-C.
-- Cada fusión = carta FUSION (resultado, 3000 atk / 2000 def) + carta EXECUTION que la invoca (FUSION_SUMMON, 2 materiales).
begin;

insert into public.cards_catalog
  (id, name, description, type, faction, cost, attack, defense, archetype, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active)
values
  -- CursHost = Cursor + Hostinger
  ('fusion-curshost', 'CursHost', '[Fusión: Cursor + Hostinger] El stack autónomo que escribe, despliega y hospeda sin intervención humana. Levanta infraestructura enemiga en segundos.',
   'FUSION', 'NO_CODE', 7, 3000, 2000, 'TOOL', '/assets/bgs/bg-tech.webp', '/assets/renders/curshost.webp', null, 'fusion-curshost', array['entity-cursor','entity-hostinger'], 9, true),
  ('exec-fusion-curshost', 'Fusion Compiler: CursHost', 'Invoca CursHost fusionando 2 materiales: Cursor + Hostinger.',
   'EXECUTION', 'NO_CODE', 4, null, null, null, null, '/assets/renders/executions/exec-fusion-curshost.webp',
   '{"action":"FUSION_SUMMON","recipeId":"fusion-curshost","materialsRequired":2}'::jsonb, null, '{}', null, true),

  -- KuberLinnet = Linux + Kubernetes
  ('fusion-kuberlinnet', 'KuberLinnet', '[Fusión: Linux + Kubernetes] Un enjambre de contenedores indestructible sobre kernel endurecido. Se autorrepara y escala más rápido de lo que el rival puede atacar.',
   'FUSION', 'OPEN_SOURCE', 7, 3000, 2000, 'TOOL', '/assets/bgs/bg-tech.webp', '/assets/renders/kuberlinnet.webp', null, 'fusion-kuberlinnet', array['entity-linux','entity-kubernetes'], 9, true),
  ('exec-fusion-kuberlinnet', 'Fusion Compiler: KuberLinnet', 'Invoca KuberLinnet fusionando 2 materiales: Linux + Kubernetes.',
   'EXECUTION', 'OPEN_SOURCE', 4, null, null, null, null, '/assets/renders/executions/exec-fusion-kuberlinnet.webp',
   '{"action":"FUSION_SUMMON","recipeId":"fusion-kuberlinnet","materialsRequired":2}'::jsonb, null, '{}', null, true),

  -- RustyFox = Rust + Firefox
  ('fusion-rustyfox', 'RustyFox', '[Fusión: Rust + Firefox] Velocidad nativa y memoria a prueba de balas dentro del navegador. Compila ataques sin fugas ni concesiones.',
   'FUSION', 'OPEN_SOURCE', 7, 3000, 2000, 'LANGUAGE', '/assets/bgs/bg-tech.webp', '/assets/renders/rustyfox.webp', null, 'fusion-rustyfox', array['entity-rust','entity-firefox'], 9, true),
  ('exec-fusion-rustyfox', 'Fusion Compiler: RustyFox', 'Invoca RustyFox fusionando 2 materiales: Rust + Firefox.',
   'EXECUTION', 'OPEN_SOURCE', 4, null, null, null, null, '/assets/renders/executions/exec-fusion-rustyfox.webp',
   '{"action":"FUSION_SUMMON","recipeId":"fusion-rustyfox","materialsRequired":2}'::jsonb, null, '{}', null, true),

  -- Super-C = C++ + C#
  ('fusion-super-c', 'Super-C', '[Fusión: C++ + C#] La potencia bruta de C++ con la productividad de C#. Rendimiento de bajo nivel y arquitectura empresarial en un solo coloso.',
   'FUSION', 'BIG_TECH', 7, 3000, 2000, 'LANGUAGE', '/assets/bgs/bg-tech.webp', '/assets/renders/super-c.webp', null, 'fusion-super-c', array['entity-cpp','entity-csharp'], 9, true),
  ('exec-fusion-super-c', 'Fusion Compiler: Super-C', 'Invoca Super-C fusionando 2 materiales: C++ + C#.',
   'EXECUTION', 'BIG_TECH', 4, null, null, null, null, '/assets/renders/executions/exec-fusion-super-c.webp',
   '{"action":"FUSION_SUMMON","recipeId":"fusion-super-c","materialsRequired":2}'::jsonb, null, '{}', null, true)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, type = excluded.type, faction = excluded.faction,
  cost = excluded.cost, attack = excluded.attack, defense = excluded.defense, archetype = excluded.archetype,
  bg_url = excluded.bg_url, render_url = excluded.render_url, effect = excluded.effect,
  fusion_recipe_id = excluded.fusion_recipe_id, fusion_material_ids = excluded.fusion_material_ids,
  fusion_energy_requirement = excluded.fusion_energy_requirement, is_active = excluded.is_active, updated_at = now();

commit;
