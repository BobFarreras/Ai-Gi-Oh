# Board Module

Guía rápida para entender la lógica de tablero y batalla.

## Flujo de alto nivel

1. `Board` compone HUD, mano, tablero y panel de fase.
2. `useBoard` centraliza estado UI + puente con motor (`GameEngine`).
3. `usePlayerActions` procesa acciones humanas (invocar, activar, atacar).
4. `useOpponentTurn` ejecuta pasos del rival con ritmo visual (delays + animación).

## Subfases y responsabilidades

1. `MAIN_1`
   - Jugar entidades o ejecuciones.
   - Activaciones `ACTIVATE` del rival se muestran primero y se resuelven en paso siguiente.

2. `BATTLE`
   - Selección de atacante.
   - Selección de objetivo o ataque directo.
   - Resolución mediante `GameEngine.executeAttack`.

## Reglas obligatorias de inicio de turno

1. Si el jugador entra al turno con 3 entidades:
   - debe sacrificar 1 entidad al cementerio antes del robo.

2. Si entra con 5 cartas en mano:
   - debe descartar 1 carta antes del robo.

3. `Board` no usa diálogo modal: muestra mensaje contextual y resalta opciones seleccionables.
4. En descarte por mano (5 cartas), se resaltan las cartas de mano y al pulsar una se descarta.
5. En sacrificio por campo lleno al inicio de turno, se resaltan las entidades de campo y al pulsar una se sacrifica.
6. El rival resuelve estas acciones automáticamente en `useOpponentTurn`.

## Reemplazo de invocación con campo lleno

1. Si el jugador intenta invocar entidad con 3 entidades ya en campo:
   - se muestra aviso contextual,
   - se resaltan las 3 entidades del campo,
   - al elegir una, se envía al cementerio y entra la nueva entidad.
2. Esta lógica usa `GameEngine.playCardWithEntityReplacement`.

## Estado UI importante

1. `activeAttackerId`
   - Marca visual del atacante actual (jugador o rival).

2. `isAnimating`
   - Bloquea inputs mientras hay animaciones de acción en curso.

3. `revealedEntities`
   - Volteo temporal de cartas defensivas al ser objetivo.

4. `lastError`
   - Error de dominio mapeado a mensaje UI central.

## Dónde tocar cada cosa

1. Reglas del juego: `src/core/use-cases/game-engine/*`.
2. Decisiones del rival: `src/core/services/opponent/*`.
3. Ritmo visual de acciones rival: `src/components/game/board/hooks/internal/useOpponentTurn.ts`.
4. Render y animación de campo: `src/components/game/board/battlefield/*`.
