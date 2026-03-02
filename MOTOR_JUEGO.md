# AI-GI-OH! - Motor de Juego

Reglas implementadas en `GameEngine`, `CombatService` y estrategia de turno del oponente (`core/services/opponent`).

## 1. Estado global (`GameState`)

1. `playerA`, `playerB`.
2. `activePlayerId`.
3. `startingPlayerId` (jugador que inicia la partida).
4. `turn`.
5. `phase`: `MAIN_1 | BATTLE`.
6. `hasNormalSummonedThisTurn`.

## 2. Reglas de fase (`nextPhase`)

1. Orden fijo: `MAIN_1 -> BATTLE -> (siguiente jugador MAIN_1)`.
2. Al pasar de `BATTLE` al siguiente turno:
   - cambia jugador activo,
   - incrementa turno,
   - fija fase en `MAIN_1`,
   - valida acciones obligatorias antes de robar,
   - restaura energía,
   - limpia flags de ataque y de invocación reciente.
3. Si el jugador entrante tiene 3 entidades en campo:
   - se crea acción obligatoria `SACRIFICE_ENTITY_FOR_DRAW`.
4. Si el jugador entrante tiene 5 cartas en mano:
   - se crea acción obligatoria `DISCARD_FOR_HAND_LIMIT`.
5. Solo cuando se resuelve la acción obligatoria se roba 1 carta del mazo.

## 3. Juego de cartas (`playCard`)

1. Solo jugador activo.
2. Solo en `MAIN_1`.
3. Requiere carta en mano y energía suficiente.
4. Entidades:
   - máximo 3,
   - 1 invocación normal por turno,
   - modos válidos: `ATTACK` o `DEFENSE`,
   - si la zona está llena y se quiere invocar otra entidad, se debe reemplazar una entidad existente (la reemplazada va a cementerio).
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
   - `MAIN_1`: intenta jugar mejor carta válida.
   - `BATTLE`: intenta mejor ataque disponible.

## 8. Pendientes funcionales

1. Persistencia de progreso de campaña (ahora se usa progreso temporal en memoria).
2. Historial persistente de decisiones de combate.
3. Efectos avanzados (`DRAW_CARD`, `BOOST_ATK`).
4. Sustitución de heurística por estrategia LLM sin romper contratos.
