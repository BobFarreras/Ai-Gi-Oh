-- docs/supabase/sql/141_skill_tree_activate_second_deck.sql
-- Ficha 8 — Activa la habilidad "Doble Arsenal" (node-ars-doble-mazo, efecto UNLOCK_SECOND_DECK) ahora que su
-- código está completo (backend de swap en la migración 140 + UI del switcher en el arsenal, Fase 2). Solo se
-- enciende el nodo en el catálogo para que aparezca en la constelación y se pueda desbloquear.
--
-- ORDEN DE DESPLIEGUE: aplicar DESPUÉS de desplegar el código de la Fase 2 (switcher del arsenal) y de haber
-- aplicado la 140 (tablas + RPC). Gate del nodo: Veterano Nv.5 (+ coste 5) → habilidad de veteranos.
begin;

update public.character_skill_nodes set is_active = true where id = 'node-ars-doble-mazo';

commit;

-- Comprobación posterior:
--   select is_active, prerequisites, cost_per_rank from public.character_skill_nodes where id = 'node-ars-doble-mazo';
