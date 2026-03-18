<!-- docs/training/IMPLEMENTATION_LOG.md - Bitácora de implementación por fases del módulo de entrenamiento. -->
# Training Implementation Log

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
5. Commit: pendiente en esta sesión.

## Validación global aplicada por fase

1. `pnpm lint`
2. `pnpm test`
3. `pnpm build`
