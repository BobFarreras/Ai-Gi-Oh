# AI-GI-OH! - Motor de Juego

Reglas implementadas en `GameEngine`, `CombatService` y estrategia de turno del oponente (`core/services/opponent`).

## 1. Estado global (`GameState`)

1. `playerA`, `playerB`.
2. `activePlayerId`.
3. `startingPlayerId` (jugador que inicia la partida).
4. `turn`.
5. `phase`: `DRAW | MAIN_1 | BATTLE | MAIN_2 | END`.
6. `hasNormalSummonedThisTurn`.

## 2. Reglas de fase (`nextPhase`)

1. Orden fijo: `DRAW -> MAIN_1 -> BATTLE -> MAIN_2 -> END`.
2. En `DRAW -> MAIN_1`, el jugador activo roba 1 carta de su mazo.
3. En `END`:
   - cambia jugador activo,
   - incrementa turno,
   - reinicia fase a `DRAW`,
   - restaura energía,
   - limpia flags de ataque y de invocación reciente.

## 3. Juego de cartas (`playCard`)

1. Solo jugador activo.
2. Solo en `MAIN_1` o `MAIN_2`.
3. Requiere carta en mano y energía suficiente.
4. Entidades:
   - máximo 3,
   - 1 invocación normal por turno,
   - modos válidos: `ATTACK` o `DEFENSE`.
5. Ejecuciones:
   - máximo 3,
   - modos válidos: `SET` o `ACTIVATE`.

## 4. Combate (`executeAttack` + `CombatService`)

1. Solo se puede atacar en `BATTLE` y con el jugador activo.
2. El jugador inicial (`startingPlayerId`) no puede atacar en el turno `1`.
3. Atacante debe existir, estar en `ATTACK` y no haber atacado.
4. Ataque directo solo si no hay entidades enemigas.
5. Resolución:
   - `ATK vs ATK`: diferencia daña al defensor.
   - `ATK vs DEF/SET`: si ATK supera DEF destruye sin daño penetrante; si no, daño de rebote.
6. Cartas destruidas van a `graveyard`.

## 5. Ejecuciones (`resolveExecution`)

1. Debe existir ejecución activa y tener `effect`.
2. Acciones actuales: `DAMAGE`, `HEAL`.
3. Tras resolver: sale de zona de ejecución y pasa a cementerio.

## 6. Errores de dominio

Se usa jerarquía tipada en `core/errors`:

1. `ValidationError`.
2. `GameRuleError`.
3. `NotFoundError`.

Esto permite distinguir validaciones de reglas e inexistencias en UI/tests.

## 7. Turno del oponente (heurístico)

1. Servicio: `runOpponentStep`.
2. Estrategia: `HeuristicOpponentStrategy`.
3. En cada step, según fase:
   - `DRAW`: roba y avanza fase.
   - `MAIN_1`: intenta jugar mejor carta válida.
   - `BATTLE`: intenta mejor ataque disponible.
   - `MAIN_2` y `END`: avanza hasta devolver turno.

## 8. Pendientes funcionales

1. Dificultad configurable (agresivo/control/aleatorio).
2. Historial persistente de decisiones de combate.
3. Efectos avanzados (`DRAW_CARD`, `BOOST_ATK`).
4. Sustitución de heurística por estrategia LLM sin romper contratos.
