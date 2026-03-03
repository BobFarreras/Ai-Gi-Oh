# AI-GI-OH! - Motor de Juego

Reglas implementadas en `GameEngine`, `CombatService` y estrategia de turno del oponente (`core/services/opponent`).

## 1. Estado global (`GameState`)

1. `playerA`, `playerB`.
2. `activePlayerId`.
3. `startingPlayerId` (jugador que inicia la partida).
4. `turn`.
5. `phase`: `MAIN_1 | BATTLE`.
6. `hasNormalSummonedThisTurn`.
7. `combatLog` (historial de eventos en memoria).

## 2. Reglas de fase (`nextPhase`)

1. Orden fijo: `MAIN_1 -> BATTLE -> (siguiente jugador MAIN_1)`.
2. Al pasar de `BATTLE` al siguiente turno:
   - cambia jugador activo,
   - incrementa turno,
   - fija fase en `MAIN_1`,
   - valida acciones obligatorias antes de robar,
   - suma energía `+2` al jugador entrante (tope `maxEnergy`),
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
6. Trampas (`TRAP`):
   - ocupan la misma zona de ejecuciones,
   - máximo 3 en zona,
   - modo válido: solo `SET` (no se activan manualmente).

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
2. Solo admite cartas de tipo `EXECUTION`.
3. Acciones actuales: `DAMAGE`, `HEAL`, `DRAW_CARD`, `BOOST_ATTACK_ALLIED_ENTITY`, `BOOST_DEFENSE_BY_ARCHETYPE`, `BOOST_ATTACK_BY_ARCHETYPE`.
4. Antes de resolver una ejecución se evalúan trampas rivales con trigger `ON_OPPONENT_EXECUTION_ACTIVATED`.
3. Tras resolver: sale de zona de ejecución y pasa a cementerio.

## 5.1 Trampas (`TRAP`)

1. Triggers soportados:
   - `ON_OPPONENT_ATTACK_DECLARED`
   - `ON_OPPONENT_EXECUTION_ACTIVATED`
2. Resolución mínima de cadena:
   - se activa la primera trampa `SET` compatible,
   - aplica su efecto,
   - se envía al cementerio.
3. Las trampas de ataque se evalúan antes de resolver el daño del combate.
4. Efectos de trampa soportados:
   - `DAMAGE` (daño directo al objetivo configurado),
   - `NEGATE_ATTACK_AND_DESTROY_ATTACKER` (anula ataque y destruye atacante),
   - `REDUCE_OPPONENT_ATTACK` (reduce ATQ de entidades rivales),
   - `REDUCE_OPPONENT_DEFENSE` (reduce DEF de entidades rivales).
5. Si una trampa destruye al atacante al declarar ataque, ese ataque termina sin resolver batalla.

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
2. Persistir `combatLog` (actualmente es solo en memoria).
3. Efectos avanzados (`DRAW_CARD`, `BOOST_ATK`).
4. Sustitución de heurística por estrategia LLM sin romper contratos.

## 9. CombatLog en memoria

El motor registra eventos técnicos para trazabilidad y UI:

1. `TURN_STARTED`, `PHASE_CHANGED`, `ENERGY_GAINED`.
2. `CARD_PLAYED`, `ATTACK_DECLARED`, `BATTLE_RESOLVED`.
3. `DIRECT_DAMAGE`, `CARD_TO_GRAVEYARD`.
4. `TRAP_TRIGGERED`, `MANDATORY_ACTION_RESOLVED`, `FUSION_SUMMONED`.

## 10. Fusión (implementada)

1. Las cartas `FUSION` no se juegan con `playCard`.
2. Se invocan con `GameEngine.fuseCards(...)`.
3. Requiere:
   - estar en `MAIN_1`,
   - turno propio,
   - seleccionar 2 materiales del campo propio,
   - cumplir receta estática (`fusion-recipes.ts`).
4. Los materiales van al cementerio y se registra:
   - `CARD_TO_GRAVEYARD` por cada material,
   - `FUSION_SUMMONED` para la invocación.

## 11. Fin de partida

1. Si `healthPoints` de un jugador llega a `0`, la partida termina.
2. Se bloquean nuevas acciones de juego hasta reinicio.
3. Se muestra overlay central de resultado (`victoria`, `derrota` o `empate`).

## 12. Sonido del tablero

1. Sonido ambiental de fondo (`soundtrack.mp3`).
2. Efectos por eventos:
   - cambio de turno/fase,
   - jugar carta/invocar,
   - daño directo,
   - fusión,
   - fin de tiempo de turno,
   - fin de partida.
3. El catálogo de pistas/volumen por evento está en `src/core/config/audio-catalog.ts`.
4. El jugador dispone de `mute` global persistente (localStorage).
