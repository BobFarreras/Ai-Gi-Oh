-- docs/supabase/sql/137_skill_tree_catalog_v1.sql
-- Ficha 8 — Contenido v1 del árbol (filas de character_skill_nodes). Separado de la maquinaria (136) para
-- poder tunear nombres/costes/gates sin tocar tablas ni RPC. Requiere la 136 aplicada.
--
-- is_active: los nodos cuyo EFECTO ya está enganchado salen activos; los que dependen de features aún no
-- construidas van is_active=false (el policy de lectura filtra por is_active → no se muestran) hasta que su
-- fase llegue:
--   · OPENING_MULLIGAN (Rebarajar)      → necesita UI pre-duelo (F6)
--   · EDIT_OPENING_DECK (Apertura)      → necesita pantalla pre-duelo (F6)
--   · GRANT_RESPEC_TOKEN (Reasignación) → necesita la RPC de respec (F4+)
--   · GHOST_DAILY_LIMIT_BONUS (Cazador) → necesita la ficha 6 (ghosts)
--   · UNLOCK_SECOND_DECK (Doble Arsenal)→ sub-tanda propia (deck secundario)
begin;

insert into public.character_skill_nodes (id, branch, tier, max_rank, cost_per_rank, effect, prerequisites, display, is_active) values
  -- ── Raíz ────────────────────────────────────────────────────────────────────────────────────────────
  ('node-core', 'ROOT', 0, 1, 1,
   '{"kind":"STARTING_LP_BONUS","valuePerRank":300}',
   '[]',
   '{"name":"Núcleo del Operador","blurb":"Enciende tu árbol de Operador. +300 LP iniciales en combate.","icon":"core"}',
   true),

  -- ── Rama ECONOMÍA (servidor, todos los modos) ───────────────────────────────────────────────────────
  ('node-econ-comision', 'ECONOMY', 1, 5, 1,
   '{"kind":"NEXUS_REWARD_MULT","valuePerRank":0.02}',
   '[{"nodeId":"node-core","minRank":1}]',
   '{"name":"Comisión","blurb":"+2% de Nexus por duelo por rango (hasta +10%).","icon":"nexus"}',
   true),
  ('node-econ-aprendizaje', 'ECONOMY', 1, 5, 1,
   '{"kind":"XP_REWARD_MULT","valuePerRank":0.02}',
   '[{"nodeId":"node-core","minRank":1}]',
   '{"name":"Aprendizaje","blurb":"+2% de XP de Operador por rango (hasta +10%).","icon":"xp"}',
   true),
  ('node-econ-consuelo', 'ECONOMY', 1, 3, 1,
   '{"kind":"LOSS_CONSOLATION_MULT","valuePerRank":0.10}',
   '[{"nodeId":"node-core","minRank":1}]',
   '{"name":"Premio de Consuelo","blurb":"Suaviza el castigo de Nexus al perder, +10% por rango.","icon":"shield-half"}',
   true),
  ('node-econ-recaudo', 'ECONOMY', 2, 3, 2,
   '{"kind":"PASSIVE_NEXUS_CAP_BONUS","perWinPerRank":25,"dailyPerRank":200}',
   '[{"nodeId":"node-econ-comision","minRank":3}]',
   '{"name":"Recaudador Mejorado","blurb":"Sube los topes de la pasiva de Recaudación (+25/combate, +200/día por rango).","icon":"coins"}',
   true),
  ('node-econ-socio', 'ECONOMY', 3, 4, 3,
   '{"kind":"NEXUS_REWARD_MULT","valuePerRank":0.5}',
   '[{"nodeId":"node-econ-comision","minRank":5},{"nodeId":"node-econ-recaudo","minRank":3}]',
   '{"name":"Socio Mayoritario","blurb":"Multiplicador fuerte de Nexus: +50% por rango (hasta triplicar el Nexus del duelo).","icon":"crown"}',
   true),

  -- ── Rama COMBATE (preparación de partida, PvE en v1) ────────────────────────────────────────────────
  ('node-cbt-blindaje', 'COMBAT', 1, 5, 1,
   '{"kind":"STARTING_LP_BONUS","valuePerRank":100}',
   '[{"nodeId":"node-core","minRank":1}]',
   '{"name":"Blindaje Reforzado","blurb":"+100 LP iniciales por rango (hasta +500).","icon":"heart"}',
   true),
  ('node-cbt-arranque', 'COMBAT', 2, 1, 2,
   '{"kind":"TURN1_ENERGY_BONUS","value":1}',
   '[{"nodeId":"node-cbt-blindaje","minRank":3}]',
   '{"name":"Arranque en Frío","blurb":"+1 de energía al empezar tu primer turno.","icon":"bolt"}',
   true),
  ('node-cbt-nucleo', 'COMBAT', 3, 2, 3,
   '{"kind":"MAX_ENERGY_BONUS","valuePerRank":1}',
   '[{"nodeId":"node-cbt-arranque","minRank":1}]',
   '{"name":"Núcleo Sobrecargado","blurb":"+1 al techo de energía por rango (10 → 12).","icon":"battery"}',
   true),
  ('node-cbt-rebarajar', 'COMBAT', 2, 1, 2,
   '{"kind":"OPENING_MULLIGAN"}',
   '[{"nodeId":"node-cbt-blindaje","minRank":5}]',
   '{"name":"Rebarajar","blurb":"Una vez por duelo, rehaz tu mano inicial.","icon":"refresh"}',
   false),
  ('node-cbt-apertura', 'COMBAT', 4, 1, 4,
   '{"kind":"EDIT_OPENING_DECK","count":5}',
   '[{"nodeId":"node-cbt-nucleo","minRank":2},{"nodeId":"node-cbt-rebarajar","minRank":1}]',
   '{"name":"Apertura Programada","blurb":"Eliges sin azar tus 5 primeras cartas del duelo.","icon":"cards"}',
   false),

  -- ── Rama ARSENAL (meta/utilidad) ────────────────────────────────────────────────────────────────────
  ('node-ars-veterano', 'ARSENAL', 1, 5, 1,
   '{"kind":"XP_REWARD_MULT","valuePerRank":0.02}',
   '[{"nodeId":"node-core","minRank":1}]',
   '{"name":"Veterano","blurb":"+2% de XP de Operador por rango (acumula con Aprendizaje).","icon":"medal"}',
   true),
  ('node-ars-reasignar', 'ARSENAL', 2, 1, 1,
   '{"kind":"GRANT_RESPEC_TOKEN","value":1}',
   '[{"nodeId":"node-core","minRank":1}]',
   '{"name":"Reasignación","blurb":"Una ficha para reasignar tu árbol.","icon":"rotate"}',
   false),
  ('node-ars-cazador', 'ARSENAL', 2, 3, 1,
   '{"kind":"GHOST_DAILY_LIMIT_BONUS","valuePerRank":1}',
   '[{"nodeId":"node-ars-veterano","minRank":3}]',
   '{"name":"Cazador de Redes","blurb":"+1 combate de red al día por rango.","icon":"ghost"}',
   false),
  ('node-ars-doble-mazo', 'ARSENAL', 3, 1, 5,
   '{"kind":"UNLOCK_SECOND_DECK"}',
   '[{"nodeId":"node-ars-veterano","minRank":5},{"nodeId":"node-ars-cazador","minRank":1}]',
   '{"name":"Doble Arsenal","blurb":"Desbloquea un segundo mazo y el selector de mazo principal.","icon":"layers"}',
   false)
on conflict (id) do update set
  branch = excluded.branch, tier = excluded.tier, max_rank = excluded.max_rank,
  cost_per_rank = excluded.cost_per_rank, effect = excluded.effect, prerequisites = excluded.prerequisites,
  display = excluded.display, is_active = excluded.is_active;

commit;
