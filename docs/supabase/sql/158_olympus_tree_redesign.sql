-- docs/supabase/sql/158_olympus_tree_redesign.sql - Corrige topes caducados del árbol y da a Identidad un efecto propio.
begin;

/**
 * 1. Los topes de nivel se sembraron cuando el máximo del juego eran 30. Ya son 100, así que un nodo que
 *    prometía "+5 nivel (máx. 30)" dejaba de servir en cuanto el mazo base pasaba de ahí.
 */
update public.olympus_champion_upgrade_nodes
set effect_json = effect_json || jsonb_build_object('cap', 100)
where effect_json ->> 'kind' in ('GLOBAL_LEVEL', 'SIGNATURE_CARD_LEVEL')
  and (effect_json ->> 'cap')::integer = 30;

/**
 * 2. Identidad hacía lo mismo que Potencia, y más caro: `SIGNATURE_CARD_LEVEL` sin selector sube el fusion
 *    deck, que ya está incluido en el "+nivel a todo el mazo" de la rama de Potencia.
 *
 *    Pasa a subir la VERSIÓN, que es mecánicamente distinta: el nivel da ATK/DEF y la versión potencia las
 *    pasivas de maestría. Eso sí es identidad —el campeón despliega sus habilidades propias— y no solapa.
 */
update public.olympus_champion_upgrade_nodes
set effect_json = jsonb_build_object('kind', 'GLOBAL_VERSION_TIER', 'amount', 1, 'cap', 5)
where branch = 'IDENTITY'
  and effect_json ->> 'kind' = 'SIGNATURE_CARD_LEVEL';

/**
 * 3. Resistencia es "LP, consistencia y energía" según el diseño, pero solo tenía LP. La energía extra
 *    abre jugadas que el aguante puro no da.
 */
insert into public.olympus_champion_upgrade_nodes
  (id, champion_id, branch, prerequisite_node_ids, effect_json, fragment_cost, sort_order)
select champion.id || '-resilience-2', champion.id, 'RESILIENCE',
  array[champion.id || '-resilience-1'],
  '{"kind":"STARTING_ENERGY","amount":1,"cap":3}'::jsonb, 70, 21
from public.olympus_champions champion
on conflict (id) do nothing;

commit;
