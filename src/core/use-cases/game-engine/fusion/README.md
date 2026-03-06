# Fusion Module

Reglas de invocación por fusión del motor.

## Archivos

1. `fuse-cards.ts`
   - Fachada del caso de uso de fusión.
   - Ejecuta la resolución final cuando ya hay 2 materiales elegidos.

2. `start-fusion-summon.ts`
   - Inicia flujo con `pendingTurnAction` tipo `SELECT_FUSION_MATERIALS`.

3. `start-fusion-summon-from-execution.ts`
   - Inicia flujo de selección desde una carta mágica de fusión ya activada.

4. `fusion-recipes.ts`
   - Recetas estáticas (`requiredMaterialIds`, `requiredArchetypes`, energía mínima).

5. `internal/validate-fusion-context.ts`
   - Valida turno/fase, carta de fusión, materiales, receta y energía.

6. `internal/apply-fusion-result.ts`
   - Aplica consumo de energía, mueve materiales al cementerio e invoca entidad fusionada.

7. `internal/append-fusion-logs.ts`
   - Registra eventos `CARD_TO_GRAVEYARD` y `FUSION_SUMMONED`.

8. `fuse-cards-from-execution.ts`
   - Resuelve la invocación final desde ejecución (`EXECUTION`) y envía la magia al cementerio.

## Reglas actuales

1. Solo en fase `MAIN_1` y turno activo.
2. Deben seleccionarse exactamente 2 materiales distintos del campo.
3. Debe existir receta válida para la carta de fusión.
4. Se valida energía por material, total de receta y energía disponible del jugador.
5. La fusión consume energía del jugador.
6. El flujo oficial puede ser:
   - `startFusionSummon` -> selección de materiales vía `resolvePendingTurnAction` -> `fuseCards`.
   - `resolveExecution(FUSION_SUMMON)` -> `startFusionSummonFromExecution` -> `resolvePendingTurnAction` -> `fuseCardsFromExecution`.
7. Las recetas activas del proyecto:
   - `chatgpt + gemini -> gemgpt`
   - `claude + kali-linux -> kaclauli`
   - `python + postgress -> pytgress`
8. Las cartas de resultado (`FUSION`) documentan explícitamente sus materiales requeridos en `core/data/mock-cards/fusions.ts`.

## Tests

1. `fuse-cards.integration.test.ts`: flujo base de éxito/fracaso por receta.
2. `fuse-cards.rules.integration.test.ts`: energía, materiales duplicados, materiales inexistentes y protección de slots.
