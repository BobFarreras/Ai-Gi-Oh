<!-- docs/architecture/08-survival-progression-settlement.md - Decisión de arquitectura para progreso y liquidación de Supervivencia. -->
# Progresión y liquidación de Supervivencia

## Problema

La run ya transportaba LP y acreditaba Fragmentos, pero la UI no disponía de un contrato completo para mostrar récord, saldo, curación de hito y cierre de expedición. Tampoco debía aceptar importes calculados por el navegador.

## Opciones evaluadas

1. Persistir un contador `best_wins` adicional y actualizarlo en cada combate. Facilita la lectura, pero duplica un dato derivable y añade riesgo de desincronización.
2. Derivar el récord con `max(wins)` sobre el historial inmutable de runs y añadir un índice `(player_id, wins desc)`. Mantiene una única fuente de verdad y su lectura es eficiente.

## Decisión

Se adopta la segunda opción. `ISurvivalRepository.getProgress` compone el récord histórico y el saldo de Fragmentos bajo RLS. Las mutaciones siguen limitadas a RPCs de `service_role`.

`CompleteSurvivalBattleUseCase` devuelve un settlement autoritativo con:

- run actualizada;
- batalla liquidada y curación auditada;
- recompensa versionada;
- récord y saldo posterior a la transacción.

La UI desmonta el tablero al recibir el settlement y presenta `SurvivalDebrief`. El botón de continuación solo solicita una nueva batalla; no calcula LP, dificultad ni recompensas.

## Garantías

- El replay firmado deriva outcome y LP finales.
- La RPC aplica curación, cierre de run y crédito en una transacción idempotente.
- Los retries recuperan la liquidación persistida sin volver a acreditar.
- El escalado continúa gobernado por el ruleset histórico de la run.
- Tras alcanzar los caps de nivel y versión, cada rango de Ascensión mantiene crecimiento de ATK/DEF y LP mediante modificadores data-driven.
- Survival comparte Fisher–Yates con el Board, reparte cuatro cartas y sortea iniciador desde la seed firmada.
- Reentrar en una batalla `ISSUED` conserva su snapshot; el lobby la identifica como reanudación y no como combate nuevo.
