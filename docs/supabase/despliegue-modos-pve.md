<!-- docs/supabase/despliegue-modos-pve.md - Runbook del despliegue de Supervivencia y Olimpo (migraciones 149-160). -->
# Despliegue de los modos PvE (migraciones 149 → 160)

Producción va por la **148**. Esta entrega añade **doce** migraciones. Todas son aditivas: crean
tablas y funciones nuevas, o amplían objetos existentes sin quitar nada.

## Orden (obligatorio)

Se pegan una a una en el SQL Editor de Supabase producción, **en este orden**. Cada fichero abre su
propia transacción (`begin; … commit;`), así que una que falle no deja nada a medias.

| # | Fichero | Qué hace |
| --- | --- | --- |
| 149 | `149_buy_item_commercial_ranking.sql` | puntúa la compra de objetos en el ranking comercial |
| 150 | `150_arena_modes_foundation.sql` | tablas, RLS y RPC base de Supervivencia y Olimpo |
| 151 | `151_survival_idempotent_start_issue.sql` | arrancar expedición y emitir combate se vuelven idempotentes |
| 152 | `152_forfeit_abandoned_survival_battles.sql` | cierra como derrota los combates abandonados |
| 153 | `153_combat_session_journal_checkpoint.sql` | `combat_sessions.journal_json` + checkpoint por turno |
| 154 | `154_olympus_runtime_foundation.sql` | ajustes de Olimpo, leyendas Zeus/Loki/Hefes y respec de pago |
| 155 | `155_pve_modes_admin_publishing.sql` | RPC de publicación versionada para el panel admin |
| 156 | `156_olympus_deck_level_100.sql` | sube a 100 el tope de nivel del deck legendario |
| 157 | `157_olympus_backfill_champion_unlocks.sql` | recupera los campeones ya ganados en Arena |
| 158 | `158_olympus_tree_redesign.sql` | rediseño del árbol (Identidad sube versión, no nivel) |
| 159 | `159_olympus_upgrade_ranks.sql` | las mejoras pasan a subir por rangos acumulables |
| 160 | `160_olympus_nexus_and_card_rewards.sql` | Nexus y carta de botín por leyenda |

## Antes o después del deploy

**Antes.** Son tablas y funciones nuevas: aplicarlas con el código viejo desplegado no rompe nada
—nadie las llama todavía— mientras que desplegar el código primero deja Supervivencia y Olimpo
apuntando a tablas que no existen.

> Ojo: esto es lo contrario de la regla de [db-sync-guide.md](./db-sync-guide.md) para **cerrar**
> tablas de valor a `service_role`, que siempre va **después** del deploy. Aquí no se cierra nada
> que el código actual esté escribiendo.

Las dos que tocan objetos ya existentes son compatibles hacia atrás:

1. La **149** reemplaza `buy_level_candy` conservando su firma; el crédito de ranking va dentro de
   la misma ruta idempotente que ya cobraba.
2. La **153** añade `journal_json` a `combat_sessions` con default, sin tocar las columnas que lee
   el código actual.

La **160** recrea `complete_olympus_battle` con dos argumentos más (Nexus y carta). Deja de existir
la firma de cinco argumentos, pero solo la llama código de esta misma entrega.

## Después de aplicarlas

1. Comprobar que el catálogo quedó sembrado:
   ```sql
   select (select count(*) from survival_rulesets where is_active) as rulesets,
          (select count(*) from olympus_settings where is_active) as ajustes,
          (select count(*) from olympus_champions where is_active) as campeones,
          (select count(*) from olympus_opponents where is_active) as leyendas,
          (select count(*) from olympus_champion_upgrade_nodes where is_active) as nodos;
   ```
   Esperado: `1 | 1 | 8 | 3 | 32`.
2. Desplegar el código (push a `main`).
3. Entrar en `/hub/academy/training/arena` y verificar que el portal abre los tres modos.
4. Repasar en el panel de admin (`Modos PvE`) que las tres leyendas tienen su Nexus y su carta.
