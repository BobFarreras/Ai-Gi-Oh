<!-- docs/game-engine/04-executions-and-fusion.md - Ejecuciones de cartas mágicas y flujo de invocación por fusión. -->
# Ejecuciones y Fusión

## Ejecuciones (`resolveExecution`)

1. Debe existir ejecución activa y con `effect`.
2. Solo cartas `EXECUTION`.
3. Antes de resolver, se evalúan trampas rivales de ejecución.
4. Tras resolver, la ejecución sale de zona y va a cementerio.

## Efectos de ejecución soportados

1. `DAMAGE`
2. `HEAL`
3. `DRAW_CARD`
4. `BOOST_ATTACK_ALLIED_ENTITY`
5. `BOOST_DEFENSE_BY_ARCHETYPE`
6. `BOOST_ATTACK_BY_ARCHETYPE`
7. `FUSION_SUMMON`

## Fusión implementada

### Flujo

1. Activar ejecución de fusión (`ACTIVATE`).
2. `resolveExecution` crea acción pendiente `SELECT_FUSION_MATERIALS`.
3. Seleccionar dos materiales del campo propio.
4. Resolver fusión y crear entidad fusionada.
5. Si la ejecución se activa sin materiales válidos, se suspende a `SET` con evento `FUSION_WAITING_MATERIALS`.

### Reglas

1. Solo en `MAIN_1` y turno propio.
2. Materiales distintos.
3. Receta válida en `fusion-recipes.ts`.
4. Energía validada por receta y jugador.
5. Si el bloque está configurado, la carta final debe existir en `fusionDeck`.
6. La selección de materiales debe cumplir `requiredMaterialIds` y/o `requiredArchetypes`.

### Resultado

1. Materiales al cementerio.
2. Carta de ejecución al cementerio.
3. Carta de fusión al campo.
4. Logs: `CARD_TO_GRAVEYARD` y `FUSION_SUMMONED`.

### Fusiones actuales

1. `chatgpt + gemini -> gemgpt`
2. `claude + kali-linux -> kaclauli`
3. `python + postgress -> pytgress`
