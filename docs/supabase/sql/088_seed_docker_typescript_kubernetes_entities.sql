-- docs/supabase/sql/088_seed_docker_typescript_kubernetes_entities.sql
-- Consistencia catálogo: sella en la fuente de verdad las 3 ENTITY que ya estaban en producción
-- (Docker, TypeScript, Kubernetes) y tienen render en public/assets/renders. Antes solo existían en un
-- fichero de migración local (no versionado) junto a otras 3 SIN arte (tensorflow/redis/graphql), que
-- se descartan a propósito por no tener assets. Valores idénticos a producción. Idempotente.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('entity-docker', 'Docker', 'Conteneriza recursos y estabiliza la mesa.', 'ENTITY', 'OPEN_SOURCE', 4, 1500, 1300, 'TOOL', NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/docker.webp', NULL, NULL, '{}', NULL, true),
  ('entity-typescript', 'TypeScript', 'Tipado estricto para duelos consistentes.', 'ENTITY', 'OPEN_SOURCE', 4, 1550, 1250, 'LANGUAGE', NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/typescript.webp', NULL, NULL, '{}', NULL, true),
  ('entity-kubernetes', 'Kubernetes', 'Orquestación robusta con defensa escalable.', 'ENTITY', 'OPEN_SOURCE', 5, 1900, 1300, 'TOOL', NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/kubernetes.webp', NULL, NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;
