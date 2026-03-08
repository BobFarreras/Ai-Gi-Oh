<!-- MOTOR_JUEGO.md - Reglas funcionales implementadas del motor de juego y flujo de combate/fusión. -->
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

1. Flujo principal actual: fusión desde carta mágica (`EXECUTION` con efecto `FUSION_SUMMON`).
2. Secuencia:
   - activar ejecución de fusión (`ACTIVATE`),
   - `resolveExecution` inicia acción pendiente `SELECT_FUSION_MATERIALS`,
   - seleccionar 2 materiales en el campo propio,
   - resolver fusión y generar entidad fusionada.
3. Reglas:
   - solo en `MAIN_1` y turno propio,
   - materiales distintos,
   - receta válida en `fusion-recipes.ts`,
   - energía validada por receta/carta.
4. Resolución al completar:
   - materiales al cementerio,
   - carta mágica de fusión al cementerio,
   - carta fusionada entra al campo.
5. Fusiones disponibles:
   - `chatgpt + gemini -> gemgpt`,
   - `claude + kali-linux -> kaclauli`,
   - `python + postgress -> pytgress`.
6. Eventos de log:
   - `CARD_TO_GRAVEYARD` (materiales y ejecución),
   - `FUSION_SUMMONED`.

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

## 13. Cinemática de fusión

1. Al recibir `FUSION_SUMMONED`, la UI muestra cinemática central (`FusionCinematicLayer`).
2. Durante la cinemática se bloquean inputs del jugador para evitar acciones desincronizadas.
3. Rutas actuales de vídeo:
   - `/assets/videos/gemgpt.mp4`
   - `/assets/videos/kaclouli.mp4`
   - `/assets/videos/pytgress.mp4`
4. La cinemática tiene dos etapas:
   - reproducción de vídeo completo (con fallback máximo de seguridad),
   - aparición de la carta fusionada desde el centro hacia su slot final del tablero.
5. Al terminar la segunda etapa se libera el lock de interacción.

## 14. Convención documental de cabecera

1. Primera línea obligatoria por archivo: comentario con ruta + descripción corta.
2. La convención busca reducir ambigüedad durante refactors del motor y acelerar code review.

## 15. Integración con Hub Central

1. El hub (`/hub`) funciona como capa de navegación previa al motor de combate.
2. El estado de desbloqueo de módulos (historia/multijugador) se resuelve en `HubService` antes de entrar a cada ruta.
3. El módulo `training` puede reutilizar temporalmente el flujo de combate existente mientras se define tutorial guiado dedicado.

## 16. Runtime de Match desacoplado (Fase 0)

1. Se definen contratos de match en `core/entities/match` para unificar entrada de modos:
   - `TRAINING`, `STORY`, `MULTIPLAYER`, `TUTORIAL`.
2. Se crea `IMatchController` como frontera de orquestación por modo.
3. Primera implementación disponible:
   - `services/game/match/LocalMatchController`,
   - fábrica `createMatchController`.
4. Esta fase no modifica reglas del `GameEngine`; prepara desacoplamiento para fases siguientes.

## 17. Recompensas por modo desacopladas (Fase 1)

1. Se añade política pura de recompensas de duelo en `core/services/match/rewards/match-reward-policy.ts`.
2. La política calcula:
   - `nexus`,
   - `playerExperience`.
3. Reglas iniciales:
   - `TUTORIAL`: siempre `0`.
   - `STORY`: recompensa escalada por tier del oponente.
   - `TRAINING` y `MULTIPLAYER`: curvas separadas.
4. El motor de juego sigue sin llamadas a BD; la persistencia de recompensas se aplicará fuera del motor.

## 18. Diseño objetivo próximo (Bloque Combate - Fase 0)

1. Política de carteleras de estado (banners):
   - eventos transitorios con `latest-wins`,
   - eventos críticos (error bloqueante/resultado de duelo) no descartables.
2. Fusión endurecida:
   - requisito conjunto de carta mágica + 2 materiales + carta final en `fusionDeck`.
3. `fusionDeck` tendrá 2 slots dedicados fuera de las 20 cartas del deck principal.
4. Distribución UI acordada:
   - en Arsenal, `fusionDeck` debajo del bloque del deck,
   - en Combate, bloque visible junto al área deck/cementerio.
5. Nueva zona por jugador `destroyedPile`:
   - separada de `graveyard`,
   - preparada para efectos futuros de destrucción permanente/exilio.
6. Integridad de mazo:
   - no se permitirá salir de Arsenal con deck principal distinto de `20` cartas.

## 19. Estado implementado (Bloque Combate - Fase 2)

1. `IPlayer` soporta zonas adicionales:
   - `fusionDeck` (lectura en combate),
   - `destroyedPile` (visualización inicial junto a cementerio).
2. El tablero muestra:
   - `fusionDeck` al lado del deck,
   - `destroyedPile` al lado del cementerio.
3. La resolución de fusión ahora valida carta final en `fusionDeck` cuando ese bloque está configurado.
4. Arsenal persistido:
   - `IDeck` incluye `fusionSlots` (2 slots),
   - acciones API dedicadas para equipar/quitar cartas de fusión.
