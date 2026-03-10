<!-- docs/game-engine/02-card-play-and-zones.md - Reglas de juego de cartas por tipo y límites de zonas del tablero. -->
# Juego de Cartas y Zonas

## Reglas generales (`playCard`)

1. Solo jugador activo.
2. Solo en `MAIN_1`.
3. Carta en mano y energía suficiente.

## Entidades

1. Máximo `3` entidades en campo.
2. Una invocación normal por turno.
3. Modos válidos: `ATTACK` y `DEFENSE`.
4. Con campo lleno, la invocación requiere reemplazo de una entidad existente (la reemplazada va a cementerio).

## Ejecuciones

1. Máximo `3` en zona de ejecuciones.
2. Modos válidos: `SET` o `ACTIVATE`.

## Trampas

1. Comparten zona con ejecuciones.
2. Máximo `3`.
3. Solo modo `SET` (sin activación manual directa).

## Zonas extendidas implementadas

1. `fusionDeck` (lectura y validación en combate/fusión).
2. `destroyedPile` (visualización inicial junto a cementerio).
