-- docs/supabase/sql/139_skill_tree_activate_mulligan.sql
-- Ficha 8 — Activa la habilidad "Rebarajar" (node-cbt-rebarajar, efecto OPENING_MULLIGAN) ahora que su código
-- está construido (overlay de mulligan pre-duelo en PvE). No hay tablas ni RPC nuevas: solo se enciende el nodo
-- en el catálogo para que aparezca en la constelación y se pueda desbloquear.
--
-- ORDEN DE DESPLIEGUE: aplicar DESPUÉS de desplegar el código del mulligan. Si se activa antes, el jugador
-- podría comprar la habilidad sin que el overlay exista todavía (compra sin efecto visible).
--
-- Efecto: al tenerla desbloqueada, en combates PvE (Story/Arena) sale un overlay al empezar que permite
-- rebarajar la mano de apertura UNA vez. Rama Combate → solo tiene efecto en Story y Arena (no en Multi).
begin;

update public.character_skill_nodes set is_active = true where id = 'node-cbt-rebarajar';

commit;

-- Comprobación posterior:
--   select is_active from public.character_skill_nodes where id = 'node-cbt-rebarajar';  -- debe ser true
