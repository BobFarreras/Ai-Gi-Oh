<!-- src/components/game/board/README.md - Guía del módulo Board: flujo, reglas, overlays y puntos de extensión. -->
# Board Module

Guía rápida para entender la lógica de tablero y batalla.

## Flujo de alto nivel

1. `Board` actúa como composición ligera (shell) y delega en subcapas UI:
   - `ui/overlays/BoardStatusOverlays`
   - `ui/layout/BoardTopBar`
   - `ui/layers/BoardPlayersLayer`
   - `ui/layers/BoardInteractiveLayer`
   - `ui/layout/BoardActionButtons`
2. `useBoard` centraliza estado UI + puente con motor (`GameEngine`).
3. `usePlayerActions` procesa acciones humanas (invocar, activar, atacar).
4. `useOpponentTurn` ejecuta pasos del rival con ritmo visual (delays + animación).
5. `hooks/internal` se organiza por subcarpetas:
   - `board-state/` (estado y proyecciones de UI),
   - `player-actions/` (acciones del jugador),
   - `opponent-turn/` (pasos del rival),
   - `audio/` (runtime de sonido).

## Subfases y responsabilidades

1. `MAIN_1`
   - Jugar entidades o ejecuciones.
   - Activaciones `ACTIVATE` del rival se muestran primero y se resuelven en paso siguiente.

2. `BATTLE`
   - Selección de atacante.
   - Selección de objetivo o ataque directo.
   - Resolución mediante `GameEngine.executeAttack`.

## Reglas obligatorias de inicio de turno

1. Si entra con 5 cartas en mano:
   - debe descartar 1 carta antes del robo.

2. `Board` usa mensajes contextuales y, en reemplazo de entidad con campo lleno, muestra confirmación explícita antes de enviar la carta al cementerio.
3. En descarte por mano (5 cartas), se resaltan las cartas de mano y al pulsar una se descarta.
4. El rival resuelve estas acciones automáticamente en `useOpponentTurn`.
5. Si el timer expira durante una acción obligatoria del jugador:
   - descarte por mano llena: descarta la carta más a la izquierda.

## Reemplazo de invocación con campo lleno

1. Si el jugador intenta invocar entidad con 3 entidades ya en campo:
   - se muestra aviso contextual,
   - se resaltan las 3 entidades del campo,
   - al elegir una, aparece confirmación (`Sí/No`) para evitar errores,
   - al confirmar, se envía al cementerio y entra la nueva entidad.
2. Esta lógica usa `GameEngine.playCardWithEntityReplacement`.

## Invocación por fusión

1. Si seleccionas una carta `FUSION` en mano, el tablero entra en modo selección de materiales.
2. Debes elegir 2 entidades de tu campo.
3. El motor valida receta/energía y ejecuta `GameEngine.fuseCards`.
4. Los materiales van al cementerio y la carta fusionada entra al campo.
5. Las entidades ya elegidas como material quedan marcadas visualmente con estado dedicado (`MATERIAL` + ring cian).
6. Al confirmarse la fusión, la cinemática sigue flujo en 2 etapas:
   - vídeo de fusión,
   - transición de carta invocada desde centro a slot final.

## Estado UI importante

1. `activeAttackerId`
   - Marca visual del atacante actual (jugador o rival).

2. `isAnimating`
   - Bloquea inputs mientras hay animaciones de acción en curso.

3. `revealedEntities`
   - Volteo temporal de cartas defensivas al ser objetivo.

4. `lastError`
   - Error de dominio mapeado a mensaje UI central.

5. `combatLog`
   - Fuente única de historial visible.
   - También alimenta carteleras centrales (`BattleBannerCenter`).

6. `lastDamageTargetPlayerId`
   - Derivado de `combatLog` para aplicar feedback de daño solo al HUD correcto.
7. `lastHealTargetPlayerId`
   - Derivado de `combatLog` para mostrar animación de curación `+LP` en el HUD del jugador curado.
8. `lastBuffTargetEntityIds`
   - Derivado de `combatLog` para resaltar temporalmente entidades que reciben buff (`ATK` rojo, `DEF` azul).

## Feedback visual

1. `PlayerHUD` solo parpadea en rojo para el jugador realmente dañado en la última acción.
2. La zona del tablero del jugador dañado también recibe flash rojo localizado.
3. Las curaciones muestran texto flotante azul `+LP` en el HUD del objetivo.
4. Los buffs de estadísticas muestran aura temporal en cartas afectadas (ATK rojo, DEF azul).
5. Las ejecuciones `ACTIVATE` usan VFX por tipo de efecto:
   - daño directo: haz ofensivo,
   - curación: pulso azul,
   - buff de estadísticas: impacto energético rojo/azul y número `+valor` grande sobre entidad objetivo.
6. El HUD consume deltas (`damageAmount`/`healAmount`) solo por `eventId`, evitando mezclar daño antiguo con curación nueva.
7. `SidePanels` incluye filtros por turno y actor para depurar partidas.
8. `BattleBannerCenter` muestra solo turno y subturno (fase), con transición de entrada/salida.
9. `GraveyardTransitionLayer` anima cualquier evento `CARD_TO_GRAVEYARD` (descarte, sacrificio, destrucción, fusión).
10. `GraveyardBrowser` permite abrir el cementerio desde el tablero y previsualizar cualquier carta en el panel lateral.
11. Para QA de fusión, `initialDeckFactory` usa mazos mock con más consistencia de materiales + cartas mágicas de fusión para ambos lados.

## Sonido y resultado

1. `useGameAudio` reproduce efectos según `combatLog`.
2. El fin de partida muestra `DuelResultOverlay` central y bloquea acciones.
3. Al finalizar duelo se detiene y reinicia el soundtrack base antes de reproducir resultado.
4. Cada nueva partida/reinicio crea mazos barajados para ambos jugadores.
5. El jugador puede activar/desactivar audio global con botón `mute` junto al historial.
6. El catálogo de audio y volúmenes está centralizado en `src/core/config/audio-catalog.ts`.
7. Eventos con sonido específico:
   - turno/subturno (banner),
   - ataque/magia/fusión,
   - daño y pérdida de LP,
   - aviso de 5 segundos y fin de temporizador,
   - apertura/cierre de sidebars,
   - victoria/derrota/empate.

## Interacción avanzada

1. En `BATTLE`, al pulsar dos veces la misma entidad atacante propia:
   - se cambia su modo a `DEFENSE` (si aún no atacó).
2. El `Combat Log` muestra:
   - color por actor (jugador/rival),
   - mini-carta clicable,
   - delta de impacto (`-LP`, `+LP`, `+ATK`, `+DEF`) cuando aplica.
3. Clic en cementerio (jugador o rival):
   - abre visor central de cartas del cementerio,
   - al seleccionar una carta, se abre su detalle en el panel lateral.
4. Los sidebars respetan zonas seguras de HUD:
   - margen superior para no invadir HUD rival,
   - margen inferior para no invadir HUD del jugador.
5. El sidebar de detalle se limita al espacio entre panel de turno (arriba) y HUD del jugador (abajo), evitando solapes.

## Dónde tocar cada cosa

1. Reglas del juego: `src/core/use-cases/game-engine/*`.
2. Decisiones del rival: `src/core/services/opponent/*`.
3. Ritmo visual de acciones rival: `src/components/game/board/hooks/internal/useOpponentTurn.ts`.
4. Render y animación de campo: `src/components/game/board/battlefield/*`.
5. Subcomponentes internos de UI del historial: `src/components/game/board/ui/internal/combat-log-row/*`.
6. Subcomponentes internos de zona de batalla: `src/components/game/board/battlefield/internal/*`.
