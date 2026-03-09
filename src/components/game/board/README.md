<!-- src/components/game/board/README.md - Guía del módulo Board: flujo, reglas, overlays y puntos de extensión. -->
# Módulo Board

Guía rápida para entender la lógica de tablero y batalla.

## Flujo de alto nivel

1. `Board` actúa como composición ligera (shell) y delega en subcapas UI:
   - `ui/overlays/BoardStatusOverlays`
   - `ui/layout/BoardTopBar`
   - `ui/layers/BoardPlayersLayer`
   - `ui/layers/BoardInteractiveLayer`
   - `ui/layout/BoardActionButtons`
2. `useBoard` centraliza estado UI + puente con motor (`GameEngine`).
3. La configuración inicial del duelo se resuelve en `hooks/internal/match/create-board-match-config.ts` (modo/seed/jugadores/decks), evitando hardcodes en UI.
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

## Narración reactiva

1. La narración se resuelve sin consultas a BD durante el duelo.
2. `Board` recibe un `narrationPack` pre-cargado (o usa pack por defecto local).
3. `useMatchNarration` traduce `combatLog` y resultado final en acciones narrativas:
   - `HUD`: burbuja breve junto al avatar en `PlayerHUD`.
   - `CINEMATIC`: overlay lateral para inicio/fusión/final.
4. Los disparadores actuales:
   - inicio de combate (`TURN_STARTED` inicial),
   - ataque directo (`BATTLE_RESOLVED` sin defensor),
   - invocación de fusión (`FUSION_SUMMONED`),
   - cierre de partida (`winnerPlayerId`).
5. El audio de narración se reproduce en cola local para evitar solapes.

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
7. Subcomponentes internos de mano del jugador: `src/components/game/board/internal/player-hand/*`.
8. Narración y scripts: `src/components/game/board/narration/*`.

## Responsive desktop (fase previa a móvil)

1. La escala de tablero y densidad de mano se calcula en:
   - `hooks/internal/layout/board-layout-metrics.ts`
   - `hooks/internal/layout/use-board-viewport-scale.ts`
2. Objetivo:
   - mantener la misma UI desktop,
   - reducir escala en pantallas desktop pequeñas,
   - evitar pisadas entre tablero, mano y paneles laterales.
3. Métricas expuestas:
   - `boardScale`,
   - `handCardScale`,
   - `handOverlapPx`,
   - `handYOffsetPx`,
   - `handContainerHeightPx`.

## Shell móvil (fase 0-2)

1. `Board` conmuta por viewport entre:
   - layout desktop existente,
   - shell móvil base.
2. Piezas nuevas del shell móvil:
   - `hooks/internal/layout/use-board-viewport-mode.ts`,
   - `ui/layout/BoardMobileTopBar.tsx`,
   - `ui/layout/BoardMobileActionsFab.tsx`,
   - `ui/OpponentHandCompact.tsx`.
3. En esta fase solo cambia la composición visual; reglas y motor se mantienen en `useBoard` y `GameEngine`.

## Fase 3 móvil: paneles laterales como diálogo

1. En móvil, `SidePanels` desktop se desactiva.
2. El detalle de carta e historial se renderizan como diálogos laterales:
   - izquierda: detalle de carta,
   - derecha: combat log.
3. Archivo de esta capa:
   - `ui/overlays/BoardMobilePanelsDialog.tsx`.

## Incidencias resueltas (mobile board) y solución aplicada

1. **Selección incoherente entre mano/tablero/oponente**
   - **Problema:** en móvil, algunas selecciones del oponente se interpretaban como mano y mostraban acciones incorrectas.
   - **Solución:** se unificó la detección de origen (`HAND`/`BOARD`) con inferencia por `instanceId` y fallback por `selectedCard` mapeada a entidades activas. Además, prioridad explícita a `playingCard` para evitar falsos positivos.

2. **Overlay móvil bloqueando ataque en fase de combate**
   - **Problema:** al seleccionar entidad propia en `BATTLE`, el overlay impedía flujo de ataque.
   - **Solución:** en combate se desactiva overlay para selección de tablero propia; se mantiene interacción nativa de ataque.

3. **Mano del oponente no adaptativa según dispositivo**
   - **Problema:** en algunos tamaños quedaba descentrada o invadía HUD/turno.
   - **Solución:** `BoardMobileTopBar` calcula en runtime el hueco real entre bloque de turno y HUD rival, y centra la mano dentro de ese espacio. `OpponentHand` se centra internamente por `left-1/2`.

4. **Escala de cartas de mano del oponente fija**
   - **Problema:** con distintas resoluciones o número de cartas se recortaban visualmente.
   - **Solución:** escala calculada por fórmula (`ancho disponible`, `nº cartas`, `separación`) con clamps para evitar extremos.

5. **Mano del jugador en móvil heredando comportamiento desktop**
   - **Problema:** distribución irregular (se veían pocas cartas, solapes inconsistentes).
   - **Solución:** se creó componente dedicado `MobilePlayerHand` con layout y spacing responsive propios, separado de `PlayerHand` desktop.

6. **Botones de fase poco legibles en móvil**
   - **Problema:** recortes y poca legibilidad en anchos reducidos.
   - **Solución:** rediseño horizontal adaptativo por ancho de viewport, con texto solo en fase activa y animación de barrido de fase.

7. **Overlay de carta seleccionada con contraste bajo**
   - **Problema:** botones de acción con color poco visible.
   - **Solución:** se subió saturación, contraste y glow en botones de acción; se movieron acciones arriba junto al cierre para lectura rápida.

## Auditoría técnica (2026-03-08)

1. **Quality gates**
   - `pnpm lint`: OK.
   - `pnpm build`: OK.
   - `pnpm test`: con fallos activos (ver tests de referencia abajo).

2. **Tests con regresión detectada**
   - `src/components/game/board/Board.hud-and-phase.test.tsx`
   - `src/components/game/board/Board.history-toggle.test.tsx`
   - `src/components/game/board/hooks/useBoard.battle-position.integration.test.ts`
   - `src/components/game/board/ui/DuelResultOverlay.test.tsx`
   - `src/core/use-cases/game-engine/effects/resolve-execution-return.integration.test.ts`
   - `src/core/use-cases/game-engine/fusion/fuse-cards.rules.integration.test.ts`

3. **Deuda técnica estructural pendiente (regla <150 líneas)**
   - ✅ `src/components/game/board/index.tsx` quedó reducido a shell de composición con secciones internas en `src/components/game/board/internal/*`.
   - ✅ `src/components/game/board/ui/DuelResultOverlay.tsx` quedó dividido por SRP en `src/components/game/board/ui/internal/duel-result-overlay/*`.
   - ✅ `src/components/game/board/ui/overlays/BoardStatusOverlays.tsx` quedó dividido por SRP en:
     - `ui/overlays/internal/BoardErrorOverlay.tsx`
     - `ui/overlays/internal/BoardZoneBrowsers.tsx`
   - Pendiente: mantener esta segmentación en futuras iteraciones de UX sin volver a agrupar responsabilidades.

