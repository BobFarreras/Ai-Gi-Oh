<!-- src/app/hub/training/tutorial/README.md - Documenta el sandbox mock y el flujo guiado del tutorial de combate. -->
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

1. Controles HUD: `combatlog`, `mute` (interacción obligatoria), `auto`, `pausa`.
2. Reglas base: primer turno sin ataque, coste por energía, temporizador de 30 segundos en combate normal.
3. Subturnos: explicación visual de `Invocar`, `Combate`, `Pasar`.
4. Secuencia de juego: invocación, buff, set de trampa, respuesta rival y lectura de resultados.
5. Gestión de energía: restaurar energía antes de invocar unidad de coste alto.
6. Ejemplo de fuerza rival: entender por qué una entidad con más ATQ gana el intercambio.
7. Cierre: robo, fusión y ejemplo ataque sobre defensa + final de duelo.

## Reglas de UX del Tutorial

1. El tutorial no avanza de forma inmediata en pasos críticos de efectos (`mágica`, `trampa`, `recarga`): se deja ventana de observación antes del siguiente foco.
2. El botón de `mute` queda utilizable durante todo el tutorial, incluso con guard de interacción activo.
3. Los banners de turno/fase deben permanecer activos para enseñar claramente a quién le toca actuar.

## Notas de Mantenibilidad

1. Si cambias `data-tutorial-id`, debes actualizar objetivos en `resolve-combat-tutorial-steps.ts`.
2. Si cambias guion rival o costes, valida `create-tutorial-opponent-strategy.ts` para evitar bucles o turnos bloqueados.
3. Los pasos de tipo `USER_ACTION` dependen de eventos reales del tablero/combatLog: no reemplazar por estados de UI frágiles.
