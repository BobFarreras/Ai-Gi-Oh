<!-- src/components/hub/academy/training/modes/tutorial/README.md - Documenta el sandbox mock y el flujo guiado del tutorial de combate. -->
# Tutorial de Combate

## Objetivo

Ejecutar el tutorial sobre el tablero real (`Board`) con runtime mock reproducible para enseñar controles, reglas y resolución de combate sin depender del mazo del jugador.

## Mock Runtime

El sandbox del tutorial está en:

1. `internal/create-tutorial-combat-loadout.ts`
2. `internal/create-tutorial-opponent-strategy.ts`

Incluye:

1. mazo jugador guiado (`ChatGPT`, `Gemini`, `Python`, buff +400, restauración de energía, fusión),
2. mazo rival estable con secuencia didáctica (ataque inicial, trampa, entidad superior),
3. ejecución rival de recuperación de energía para evitar bloqueos de guion por coste,
4. seed fija `tutorial-combat-seed-v3`.

## Flujo Pedagógico

La secuencia declarativa vive en:

1. `src/services/tutorial/combat/resolve-combat-tutorial-steps.ts`

La orquestación por eventos reales vive en:

1. `src/components/game/board/internal/BoardTutorialFlowOverlay.tsx`

Bloques del flujo:

1. Controles HUD: `combatlog`, `mute` (opcional), `auto`, `pausa`.
2. Reglas base: primer turno sin ataque, coste por energía, temporizador de 30 segundos en combate normal.
3. Subturnos: explicación visual de `Invocar`, `Combate`, `Pasar`.
4. Secuencia de juego: invocación, buff, set de trampa, respuesta rival y lectura de resultados.
5. Gestión de energía: restaurar energía antes de invocar unidad de coste alto.
6. Ataques directos guiados: selección de entidad atacante y zona rival cuando no hay entidades enemigas.
7. Cierre técnico: fusión contra defensa y cierre con ataque directo de Python.
8. Post-duelo guiado: explicación del panel final (EXP de cartas, EXP jugador, Nexus y regalo si aplica).
9. Claim final del nodo: contenedor de cierre con botón `Recompensa Final` y diálogo de carta.

## Reglas de UX del Tutorial

1. El tutorial no avanza de forma inmediata en pasos críticos de efectos (`mágica`, `trampa`, `recarga`): se deja ventana de observación antes del siguiente foco.
2. El botón de `mute` queda utilizable durante todo el tutorial, incluso con guard de interacción activo.
3. Los banners de turno/fase deben permanecer activos para enseñar claramente a quién le toca actuar.
4. En pasos de ataque final guiado, el oscurecido global del spotlight se reduce para no ocultar lectura del campo.

## Recompensa de Combate (Supabase)

El claim de la carta final del tutorial usa:

1. Caso de uso: `src/core/use-cases/tutorial/ClaimTutorialCombatRewardUseCase.ts`.
2. Endpoint: `POST /api/tutorial/combat/reward/claim`.
3. Orquestación de UI: `TrainingTutorialClient.tsx` + `CombatTutorialRewardOverlay.tsx`.

Reglas:

1. Requiere tener completado `tutorial-combat-basics`.
2. Es idempotente por marcador de progreso `tutorial-combat-reward-gemgpt`.
3. Inserta en almacén la carta `exec-fusion-gemgpt` mediante `ICardCollectionRepository`.

## Notas de Mantenibilidad

1. Si cambias `data-tutorial-id`, debes actualizar objetivos en `resolve-combat-tutorial-steps.ts`.
2. Si cambias guion rival o costes, valida `create-tutorial-opponent-strategy.ts` para evitar bucles o turnos bloqueados.
3. Los pasos de tipo `USER_ACTION` dependen de eventos reales del tablero/combatLog: no reemplazar por estados de UI frágiles.
