<!-- docs/game-engine/06-logs-audio-and-cinematics.md - Eventos observables del duelo para UI, sonido y cinemáticas. -->
# Logs, Audio y Cinemática

## `combatLog` como fuente de trazabilidad

Eventos principales usados por UI/feedback:

1. `TURN_STARTED`, `PHASE_CHANGED`, `ENERGY_GAINED`.
2. `CARD_PLAYED`, `ATTACK_DECLARED`, `BATTLE_RESOLVED`.
3. `DIRECT_DAMAGE`, `CARD_TO_GRAVEYARD`.
4. `TRAP_TRIGGERED`, `MANDATORY_ACTION_RESOLVED`, `FUSION_SUMMONED`.

## Sonido del tablero

1. Música ambiental de fondo.
2. Efectos por eventos de turno, invocación, daño, fusión y fin de partida.
3. Catálogo central en `src/core/config/audio-catalog.ts`.
4. `mute` global persistente en `localStorage`.

## Cinemática de fusión

1. Al evento `FUSION_SUMMONED`, la UI lanza `FusionCinematicLayer`.
2. Durante la cinemática, se bloquea input para evitar desincronización.
3. Secuencia:
   - vídeo de fusión,
   - aparición de carta fusionada hacia su slot.
4. Al terminar la secuencia se libera el lock de interacción.

## Fin de partida

1. Con `healthPoints = 0`, la partida termina.
2. Se bloquean nuevas acciones.
3. Overlay central informa `victoria`, `derrota` o `empate`.
