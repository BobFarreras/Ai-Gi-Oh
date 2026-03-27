<!-- docs/training/IMPLEMENTATION_LOG.md - Bitácora de implementación por fases del módulo de entrenamiento. -->
# Training Implementation Log

> Estado canónico actual de rutas: `Tutorial` y `Training` viven exclusivamente bajo `/hub/academy/*`. Las referencias anteriores a `/hub/tutorial` o `/hub/training` se mantienen en este log solo como traza histórica de fases antiguas.

## Fase 1 - Dominio agnóstico y TDD

1. Se creó el subdominio `core/services/training` con reglas puras:
   - catálogo editable de tiers,
   - acceso/desbloqueo por victorias,
   - aplicación de resultado de combate.
2. Se añadieron entidades de entrenamiento en `core/entities/training`.
3. Se añadieron tests co-localizados para garantizar comportamiento base.
4. Commit: `ec0cd6f`.

## Fase 2 - Backend y persistencia

1. Se implementó `CompleteTrainingMatchUseCase` con:
   - idempotencia por `battleId`,
   - actualización de progreso training,
   - recompensa Nexus + experiencia de jugador.
2. Se añadieron repositorios de contrato + adaptadores Supabase.
3. Se creó endpoint `POST /api/training/matches/complete`.
4. Se añadió migración SQL `022_phase_training_progression.sql` y documentación de Supabase.
5. Commit: `0df32f2`.

## Fase 3 - Navegación de modos (Tutorial o Training)

1. `/hub/training` pasa a ser selector de modo.
2. Se crean rutas separadas:
   - `/hub/training/tutorial`
   - `/hub/training/arena`
3. Se reutiliza guard de deck incompleto para ambas rutas.
4. Se añade test del selector de modos para accesibilidad y rutas.
5. Commit: `a36fd67`.

## Fase 4 - Arena progresiva con tiers y cierre remoto

1. Se añadió `GetTrainingArenaStateUseCase` para resolver tier efectivo y bloqueo/desbloqueo.
2. `Arena` ahora carga progreso persistido y muestra tiers disponibles en UI.
3. El cierre del combate en arena se sincroniza con `POST /api/training/matches/complete` usando `battleId` idempotente.
4. Se muestran recompensas Nexus/EXP y desbloqueos tras finalizar duelo.
5. Commit: `2218f49`.

## Fase 5 - Tutorial completion persistente

1. Se añadió endpoint `POST /api/training/tutorial/complete`.
2. El tutorial marca `hasCompletedTutorial=true` al ganar.
3. Se orquesta desde `TrainingTutorialClient` con retorno a selector.
4. Test del procesador interno de tutorial completado.
5. Commit: `99b7e5a`.

> Estado actual: flujo retirado en hardening posterior para evitar duplicidad con progreso por nodo.

## Fase 6 - Tutorial guiado dinámico sobre combate real

1. Se añadió secuencia guiada de pasos del tutorial (`moneda inicial`, `primer turno`, `selección`, `ataque/defensa`, `mágica`, `fusión`, `cementerio/revive`, `combatLog`, `victoria`).
2. La guía vive en `Board` y avanza con eventos reales de `combatLog` y estado de pantalla (sin motor paralelo duplicado).
3. Se bloquea visualmente el inicio con overlay de moneda y se define quién comienza el duelo antes de liberar interacción.
4. Se añadieron tests de la máquina de pasos para validación TDD del avance automático/manual.
5. Commit: pendiente en esta sesión.

## Fase 7 - Rediseño V2: mapa tutorial por nodos (base)

1. Se define el plan V2 en `docs/training/TUTORIAL-REDESIGN-V2.md` con migración, Market y recompensa final.
2. Se crea dominio agnóstico para catálogo y estado de nodos tutorial.
3. Se añade `GetTutorialMapStateUseCase` y runtime server-side para `/hub/tutorial`.
4. Training pasa a enlazar al nuevo mapa tutorial como entrada principal.
5. Se crean páginas de nodo (`arsenal`, `market`, `reward`) como base de migración progresiva.
6. Commit: pendiente en esta sesión.

## Fase 8 - Motor reusable de spotlight + bloqueo + diálogo

1. Se implementa motor de pasos con `completionType` (`MANUAL_NEXT`, `USER_ACTION`, `BOTH`) y transición determinista.
2. Se añaden componentes reutilizables:
   - spotlight de objetivo activo,
   - guard global de interacción fuera del target permitido,
   - diálogo BigLog con botón `Siguiente`.
3. Se integra en el nodo `Preparar Deck` con simulación funcional de acciones.
4. Se añaden tests de motor y flujo de cliente para validar avance guiado.
5. Commit: pendiente en esta sesión.

## Fase 9 - Nodo Market guiado con motor reusable

1. Se implementa el flujo guiado de Market sobre `/hub/tutorial/market` con pasos de:
   - filtro por tipo,
   - orden,
   - compra de sobre,
   - apertura de historial.
2. Se reutiliza el mismo stack de spotlight + guard + diálogo BigLog sin duplicar lógica.
3. Se añade simulación funcional de Nexus e historial para aprendizaje práctico.
4. Se añaden tests de UI para validar avance completo del nodo.
5. Commit: pendiente en esta sesión.

## Fase 10 - Migración del tutorial de combate al motor unificado

1. Se reemplaza el panel legacy del board por overlay narrativo BigLog con spotlight y guard de interacción.
2. El avance del flujo usa eventos reales de combate (`combatLog`, selección, cementerio, historial y victoria).
3. Se añaden targets `data-tutorial-id` en mano, popover de acciones, battlefield, phase controls, cementerio e historial.
4. Se crea catálogo de pasos de combate reutilizable y test de contrato.
5. Commit: `f77c45c`.

## Fase 11 - Persistencia por nodo + recompensa final idempotente

1. Se añade persistencia de progreso por nodo tutorial (`POST /api/tutorial/nodes/complete`).
2. Se implementa claim final idempotente (`POST /api/tutorial/reward/claim`) con validación de elegibilidad por nodos.
3. Se conecta sincronización automática desde nodos `Arsenal`, `Combat` y `Market`.
4. Se activa UI de claim en `/hub/tutorial/reward` y runtime del mapa con progreso real persistido.
5. Se añade SQL `023_phase_tutorial_node_progress_and_reward.sql` + documentación Supabase.
6. Commit: pendiente en esta sesión.

## Fase 12 - Limpieza legacy y unificación del flujo tutorial

1. Se elimina endpoint legacy `POST /api/training/tutorial/complete` y su cliente asociado.
2. Se elimina compatibilidad legacy del mapa tutorial basada en `hasCompletedLegacyTutorial`.
3. El mapa pasa a depender únicamente de `player_tutorial_node_progress`.
4. Se actualiza documentación para retirar referencias obsoletas.
5. Commit: pendiente en esta sesión.

## Fase 13 - Preparar Deck sobre UI real + mejora BigLog

1. El nodo `Preparar Deck` deja de ser simulación y usa `HomeDeckBuilderScene` real.
2. Se añaden puntos guiados reales (`colección`, `añadir`, `evolucionar`, `inspector`) con `data-tutorial-id`.
3. Se mejora el diálogo inferior de BigLog con avatar persistente y tipografía de lectura más grande.
4. Se añade intro de BigLog al inicio de nodos tutorial (Arsenal, Market y Combate).
5. Commit: pendiente en esta sesión.

## Fase 14 - Limpieza de fronteras App Router + naming de Academia

1. Se extrae el cliente HTTP de progreso/claim tutorial fuera de `app/` hacia `services/tutorial/tutorial-node-progress-client.ts`.
2. Se elimina el módulo legacy `app/hub/tutorial/internal/tutorial-node-progress-client.ts` para respetar separación de capas.
3. Se define `Academia` como página canónica para la entrada conjunta de Tutorial + Entrenamiento (`/hub/academy`).
4. `/hub/training` pasa a ser alias legacy con redirección server-side a `/hub/academy`.
5. Se actualizan retornos de flujo (Tutorial map y cierre de Arena/Combate) para volver a `Academia`.
6. Commit: pendiente en esta sesión.

## Fase 15 - Co-location de módulos Training/Tutorial bajo Academia

1. Se reorganizan componentes de presentación en `src/components/hub/academy/{training,tutorial}`.
2. Se actualizan imports desde páginas App Router para consumir el nuevo módulo `academy`.
3. Se mantienen intactas las rutas funcionales (`/hub/tutorial`, `/hub/training`, `/hub/academy`) para no romper navegación.
4. Se ajustan cabeceras de ruta y tests co-localizados tras el movimiento.
5. Commit: pendiente en esta sesión.

## Fase 16 - App Router como entrypoint puro para nodos tutorial

1. Se movieron `TutorialArsenalClient`, `TutorialMarketClient`, `TutorialRewardClient` e internos a `src/components/hub/academy/tutorial/nodes/*`.
2. `src/app/hub/tutorial/*/page.tsx` queda como capa de entrada server-side (sin lógica cliente acoplada).
3. Se ajustaron imports de tests co-localizados para apuntar al nuevo módulo.
4. Se actualizaron cabeceras de ruta y se añadieron comentarios de intención/JSDoc en hooks y runtime tutorial para facilitar mantenimiento junior.
5. Commit: pendiente en esta sesión.

## Fase 17 - Canonical routing: Tutorial y Training bajo Academia

1. Se definieron rutas canónicas:
   - `/hub/academy/tutorial/*`
   - `/hub/academy/training/*`
2. Las rutas legacy (`/hub/tutorial/*`, `/hub/training/*`) se mantienen con redirección para compatibilidad.
3. Se movió el bloque App Router de entrenamiento (`arena` y `tutorial`) a `src/app/hub/academy/training/*`.
4. Se actualizaron `href` internos, catálogo de nodos tutorial y sección TRAINING del hub para apuntar a rutas canónicas de Academia.
5. Se mantuvieron quality gates en verde tras la migración.
6. Commit: pendiente en esta sesión.

## Fase 18 - App Router puro para Training + co-location de tutorial de combate

1. Se movió la lógica cliente de `training/arena` y `training/tutorial` desde `app/` a `components/hub/academy/training/modes/*`.
2. `src/app/hub/academy/training/*/page.tsx` quedó como entrypoint server-side sin orquestación cliente embebida.
3. Se reubicaron mocks y estrategia del tutorial de combate en el módulo `components` con tests co-localizados.
4. Se actualizaron imports, cabeceras de ruta y comentarios/JSDoc de intención en handlers críticos.
5. Commit: pendiente en esta sesión.

## Fase 19 - Eliminación de duplicidad de rutas legacy en `app/hub`

1. Se eliminaron las carpetas `src/app/hub/tutorial/*` y `src/app/hub/training/*` para evitar duplicidad estructural con `academy`.
2. Se retiró la capa de compatibilidad legacy y se eliminó también la redirección centralizada para evitar reglas de routing ocultas.
3. La única jerarquía funcional para tutorial/training en App Router queda bajo `src/app/hub/academy/*` sin aliases legacy.
4. Commit: pendiente en esta sesión.

## Fase 20 - Arena progresiva con rival por tier y lobby VS

1. Se implementó resolución de oponente por tier con mazo/fusión, identidad visual y dificultad base.
2. Se añadió pantalla previa `VS` para iniciar combate desde Arena.
3. Se conectó `HeuristicOpponentStrategy` con dificultad del tier efectivo.
4. Se validó con tests de resolver de loadout por tier/template.
5. Commit: `05dda82`.

## Fase 21 - Rotación de rivales, arquetipos y balance de recompensas

1. Se añadió rotación de rival por tier y dificultad adaptativa por `winrate` del jugador en ese tier.
2. Se añadieron pools de mazos por arquetipo para evitar repetición de estilo de partida.
3. Se unificó cálculo de recompensa de Training con `resolveTrainingTierReward` (backend + preview UI).
4. Se añadió variante rival alterna en nivel inicial para evitar repeticiones consecutivas.
5. Commits:
   - `0af867c`
   - `edb994a`
   - `17865ad`

## Fase 22 - Narración/audio por `opponentId` y retorno de resultado en Arena

1. Se conectó Training al mismo sistema narrativo de Story (`buildStoryOpponentNarrationPack`) por `opponentId` canónico (`opp-ch1-*`).
2. Se añadió `storyOpponentId` en presets/loadout de Training para resolver audios y diálogos correctos por carpeta.
3. Se ajustó el CTA final de resultado para que `Volver a selección` retorne a `Arena` del nivel activo.
4. Se aplicó regla de recompensa por derrota en Arena: 50% de Nexus/EXP respecto a victoria del mismo nivel.
5. Tests ajustados y en verde para recompensa por nivel, loadout y acción final de resultado.
6. Commit: pendiente en esta sesión (bloque listo para commit).

## Fase 23 - Redirects legacy explícitos para cierre de contrato Academy

1. Se añadieron redirects explícitos en `next.config.ts` para rutas legacy:
   - `/hub/training/* -> /hub/academy/training/*`
   - `/hub/tutorial/* -> /hub/academy/tutorial/*`
2. Se mantiene `Academy` como entrada canónica y única jerarquía funcional en `app/hub/academy/*`.
3. La compatibilidad legacy queda declarada en configuración de runtime, no duplicada en App Router.
4. Commit: pendiente en esta sesión.

## Validación global aplicada por fase

1. `pnpm lint`
2. `pnpm test`
3. `pnpm build`
