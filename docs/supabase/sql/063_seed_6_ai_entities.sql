-- docs/supabase/sql/063_seed_6_ai_entities.sql - Inserta 6 nuevas cartas ENTITY (modelos/plataformas de IA) en cards_catalog.
begin;

insert into public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) values
-- 2 cartas: 1800 ATK, 1200 DEF (cost 5, atacantes pesados)
('entity-aws', 'AWS', 'Cloud de Amazon que escala invocaciones y reforzamiento de entidades.', 'ENTITY', 'BIG_TECH', 5, 1800, 1200, 'TOOL', null, '/assets/bgs/bg-tech.webp', '/assets/renders/aws.webp', null, null, '{}', null, true),
('entity-qwen', 'Qwen', 'LLM de Alibaba con razonamiento profundo para cierre de duelo.', 'ENTITY', 'BIG_TECH', 5, 1800, 1200, 'LLM', null, '/assets/bgs/bg-tech.webp', '/assets/renders/qwen.webp', null, null, '{}', null, true),

-- 1 carta: 1200 ATK, 2000 DEF (cost 4, muro defensivo)
('entity-firebase', 'Firebase', 'Backend en tiempo real que estabiliza la línea defensiva y sincroniza el campo.', 'ENTITY', 'BIG_TECH', 4, 1200, 2000, 'DB', null, '/assets/bgs/bg-tech.webp', '/assets/renders/firebase.webp', null, null, '{}', null, true),

-- 2 cartas: 1500 ATK, 1300 DEF (cost 4, medio juego)
('entity-mistral', 'Mistral', 'LLM europeo open-source con razonamiento eficiente y presión de medio juego.', 'ENTITY', 'OPEN_SOURCE', 4, 1500, 1300, 'LLM', null, '/assets/bgs/bg-tech.webp', '/assets/renders/mistral.webp', null, null, '{}', null, true),
('entity-minimax', 'MiniMax', 'Modelo multimodal con sinergias de medio juego y presión constante.', 'ENTITY', 'NEUTRAL', 4, 1500, 1300, 'LLM', null, '/assets/bgs/bg-tech.webp', '/assets/renders/minimax.webp', null, null, '{}', null, true),

-- 1 carta: 1000 ATK, 1000 DEF (cost 3, tempo bajo costo)
('entity-copilot', 'Copilot', 'Asistente de código que optimiza jugadas de tempo bajo costo.', 'ENTITY', 'BIG_TECH', 3, 1000, 1000, 'LLM', null, '/assets/bgs/bg-tech.webp', '/assets/renders/copilot.webp', null, null, '{}', null, true)

on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  faction = excluded.faction,
  cost = excluded.cost,
  attack = excluded.attack,
  defense = excluded.defense,
  archetype = excluded.archetype,
  trigger = excluded.trigger,
  bg_url = excluded.bg_url,
  render_url = excluded.render_url,
  effect = excluded.effect,
  fusion_recipe_id = excluded.fusion_recipe_id,
  fusion_material_ids = excluded.fusion_material_ids,
  fusion_energy_requirement = excluded.fusion_energy_requirement,
  is_active = excluded.is_active;

commit;
