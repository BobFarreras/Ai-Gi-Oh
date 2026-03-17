<!-- docs/story/IMPLEMENTATION-PHASES.md - Seguimiento fase a fase de implementación técnica del modo Story. -->
# Story - Implementación por Fases

## Fase 4 - Estado/UI de escena Story

### Objetivo

Separar el estado de interacción del mapa Story de la capa de renderizado.

### Implementado

1. Store local Zustand para escena Story:
   - `src/components/hub/story/internal/story-scene-store.ts`.
2. Escena cliente `StoryScene` con selección de nodo e historial:
   - `src/components/hub/story/StoryScene.tsx`.
3. `StoryCircuitMap` adaptado a selección de nodo + nodo actual + layout móvil.
4. `StoryHistoryPanel` para timeline del jugador.

### Validación

1. Mapa renderiza con nodo seleccionado.
2. Historial Story visible en panel inferior.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 5 - Navegación semi-abierta y rutas

### Objetivo

Permitir movimiento explícito por nodos desbloqueados y mostrar caminos visuales.

### Implementado

1. API `POST /api/story/world/move` con casos de uso Story.
2. Persistencia del movimiento en estado/historial Story.
3. Rutas visuales en `StoryCircuitMap` (segmentos entre nodos).
4. Panel de nodo en `StoryScene` con acción `Moverse aquí`.

### Validación

1. El movimiento a nodo bloqueado devuelve error controlado.
2. El movimiento válido actualiza nodo actual e historial.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 6 - Interacciones por tipo de nodo

### Objetivo

Desacoplar la acción principal de la UI respecto al tipo de nodo Story.

### Implementado

1. Resolver de interacción por tipo:
   - `core/services/story/world/resolve-story-node-interaction.ts`.
2. Cobertura de tests de interacción por tipos (`DUEL`, `EVENT`, `REWARD_*`).
3. `StoryMapRuntimeData` expone `nodeType`.
4. `StoryScene` y `StoryCircuitMap` muestran/consumen la semántica de tipo.

### Validación

1. El label de acción en inspector depende del `nodeType`.
2. El mapa muestra etiqueta de tipo por nodo.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 7 - Motor narrativo de capítulo

### Objetivo

Mostrar contexto de acto/capítulo en el mapa sin hardcodear texto en componentes.

### Implementado

1. Servicio `build-story-chapter-briefing`.
2. Tests del servicio y fallback.
3. Panel UI de briefing (`StoryBriefingPanel`).
4. Integración en `StoryPage` con capítulo desbloqueado máximo.

### Validación

1. El mapa muestra briefing narrativo del capítulo activo.
2. Capítulos no definidos usan fallback estable.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 8 - Integración mapa/combate Story

### Objetivo

Alinear entrada a combate con el estado real del mundo Story (nodo activo + desbloqueo).

### Implementado

1. `get-story-duel-runtime-data` usa `GetStoryWorldStateUseCase` para validar desbloqueo.
2. Se comprueba `currentNodeId` persistido antes de permitir iniciar duelo.
3. Página de duelo bloquea entrada con mensaje claro si el nodo no está activo.

### Validación

1. Si el jugador no está en el nodo, no entra al duelo.
2. Si el nodo está activo y desbloqueado, el flujo de combate funciona.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 9 - Hardening de rendimiento Story (mobile)

### Objetivo

Reducir coste visual del mapa Story en móviles low-end sin cambiar flujo de juego.

### Implementado

1. Perfil de rendimiento Story por viewport:
   - `resolve-story-performance-profile.ts`.
2. `StoryCircuitMap` aplica degradación visual en low-power:
   - menos capas decorativas,
   - sin trazado SVG de caminos,
   - sombras reducidas.
3. `StoryHistoryPanel` modo compacto para móvil.

### Validación

1. En móvil estrecho se reducen efectos del mapa.
2. En desktop se mantiene estética completa.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 10 - Seguridad y QA de flujos Story

### Objetivo

Blindar rutas Story ante entradas inválidas y documentar hardening aplicado.

### Implementado

1. Validador de `nodeId` en capa de aplicación:
   - `assert-valid-story-node-id.ts`.
2. Tests de validación de formato.
3. API `/api/story/world/move` reforzada con validación explícita.
4. Documento de hardening:
   - `docs/security/story-world-hardening.md`.

### Validación

1. `nodeId` inválido dispara `ValidationError`.
2. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 11 - Cierre de entrega Story

### Objetivo

Entregar un cierre auditable con quality gate dedicado al módulo Story.

### Implementado

1. Script `pnpm quality:story` en `package.json`.
2. Reporte técnico de fases 4-11:
   - `docs/story/PHASES-4-11-REPORT.md`.

### Validación

1. `pnpm quality:story` ejecuta tests Story + lint + build.

## Fase C - Nodos virtuales y rutas secundarias

### Objetivo

Introducir rutas alternativas e interacciones no-duelo en el mapa Story sin acoplar UI al motor de persistencia.

### Implementado

1. Definiciones por acto con `virtualNodes`:
   - `src/services/story/map-definitions/act-1-map-definition.ts`
   - `src/services/story/map-definitions/act-2-map-definition.ts`
2. `mergeStoryMapVisualDefinition` agrega nodos virtuales al runtime en memoria.
3. Acción primaria contextual:
   - navegación real para duelos (`ROUTE`),
   - interacción local para nodos virtuales (`VIRTUAL_INTERACTION`),
   - estado deshabilitado para nodos bloqueados.
4. `StoryScene`/`StorySidebar` muestran feedback de interacción virtual sin tocar BD.

### Validación

1. El mapa muestra nodos laterales de `EVENT` y `REWARD_*`.
2. Nodos virtuales no fuerzan navegación a duelo.
3. `pnpm lint`, tests Story añadidos y `pnpm build` en verde.

## Fase D - Transición visual de movimiento en mapa

### Objetivo

Evitar saltos instantáneos del avatar al mover el cursor Story y proteger la interacción durante el tránsito.

### Implementado

1. Hook dedicado de movimiento visual:
   - `src/components/hub/story/internal/use-story-avatar-travel.ts`.
2. `StoryCircuitMap` usa motion values del hook para desplazar avatar con arco breve.
3. Lock de interacción mientras se confirma y anima el movimiento (`isMoving`).
4. Indicador visual `En transito...` para feedback de estado al jugador.

### Validación

1. Al mover nodo, avatar ya no hace salto seco.
2. Durante tránsito no se puede re-seleccionar nodos.
3. `pnpm lint`, tests Story relevantes y `pnpm build` en verde.

## Fase E - Diálogos narrativos por nodo

### Objetivo

Añadir narrativa interactiva encadenada para nodos virtuales (`EVENT`, `REWARD_*`) sin acoplar la UI a la persistencia.

### Implementado

1. Resolver de diálogo por `nodeId` con fallback por `nodeType`:
   - `src/services/story/resolve-story-node-interaction-dialogue.ts`.
2. Hook de estado secuencial del diálogo:
   - `src/components/hub/story/internal/use-story-node-interaction-dialog.ts`.
3. Modal dedicado de interacción narrativa:
   - `src/components/hub/story/internal/StoryNodeInteractionDialog.tsx`.
4. Integración en `StoryScene`:
   - acción primaria virtual abre secuencia,
   - lock de interacción mientras el diálogo está activo.

### Validación

1. Nodos virtuales abren modal narrativo con avance por líneas.
2. Nodos de duelo real no abren diálogo local.
3. `pnpm lint`, tests Story relevantes y `pnpm build` en verde.

## Fase F - Persistencia de interacción narrativa

### Objetivo

Registrar en backend las interacciones de nodos virtuales para trazabilidad y variantes de diálogo por repetición.

### Implementado

1. Nuevo caso de uso:
   - `src/core/use-cases/story/RegisterStoryInteractionUseCase.ts`.
2. API dedicada:
   - `POST /api/story/world/interact`.
3. Evento de historial nuevo:
   - `INTERACTION` en entidades y repositorio Story.
4. Resolver de diálogo con variante por contador de interacciones.
5. Migración SQL:
   - `docs/supabase/sql/014_phase_e_story_virtual_interactions.sql`.

### Validación

1. Interacción virtual se persiste y aparece en historial Story.
2. Repetir interacción muestra texto resumido de reintento.
3. `pnpm lint`, tests Story relevantes y `pnpm build` en verde.

## Fase G - Integración local de assets narrativos

### Objetivo

Permitir que el equipo de contenido gestione imágenes y audios de diálogos Story dentro del repositorio, sin depender de BD para multimedia.

### Implementado

1. Catálogo local de multimedia por nodo/línea:
   - `src/services/story/story-node-dialogue-media.ts`.

## Fase 4 (nueva) - Expansión de roster jugable en Story

### Objetivo

Conectar los nuevos oponentes al flujo real de mapa/duelo para validar progresión end-to-end sin hardcodes de avatar únicos.

### Implementado (inicio)

1. `IStoryDuelSummary`, grafo world y runtime Story ahora transportan `opponentAvatarUrl`.
2. `StoryMapNode` deja de usar un único avatar fijo y consume avatar por nodo cuando existe.
3. Migración de duelos ampliada:
   - `docs/supabase/sql/018_phase_5_3_story_duel_rotation_expansion.sql`.
4. Layout visual de acto 2 extendido con nodos de `story-ch2-duel-3` a `story-ch2-duel-6` y nodos virtuales intermedios.

## Fase 5 (nueva) - Identidad BOSS en duelo (audio + tema visual)

### Objetivo

Dar identidad de jefe a los duelos `isBossDuel` sin alterar reglas de combate ni rendimiento.

### Implementado

1. `get-story-duel-runtime-data.ts` expone `isBossDuel` en el runtime de duelo.
2. Soundtrack BOSS dedicado en cliente:
   - `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/use-story-boss-soundtrack.ts`.
3. Sincronización con mute del board:
   - usa `localStorage board-muted` + evento `board-muted-changed`.
4. Tema visual BOSS en `Board`:
   - acento cromático y viñeta distinta vía clase `board-boss-theme`,
   - sin cambios de layout, tamaño de render ni mecánicas.
5. Flujo en `StoryDuelClient`:
   - se elimina diálogo de intro BOSS,
   - coin toss y combate siguen el flujo estándar con identidad visual/sonora BOSS.

## Fase 6 (nueva) - Acto 1 real (grafo productivo)

### Objetivo

Sustituir el acto 1 de pruebas por un grafo real con bifurcaciones e interacciones completas antes del BOSS final.

### Implementado

1. `act-1-map-definition.ts` se reestructura con:
   - ruta principal,
   - bifurcación superior/inferior,
   - múltiples nodos `MOVE`, `REWARD_CARD`, `REWARD_NEXUS`, `EVENT`,
   - duelos reales conectados a `story_duels`.
2. `merge-story-map-visual-definition.test.ts` se actualiza a los nuevos IDs virtuales del acto 1.
3. Se documenta migración de BD asociada:
   - `docs/supabase/sql/020_phase_6_act1_real_flow.sql`.
2. Resolver narrativo enriquece líneas con `portraitUrl` y `audioUrl`.
3. Modal de interacción renderiza retrato y reproductor de audio cuando existen assets.

### Validación

1. Los diálogos de nodos configurados muestran rutas de retrato/audio.
2. Nodos sin assets siguen funcionando por fallback de texto.
3. `pnpm lint`, tests Story relevantes y `pnpm build` en verde.

## Fase H - Flujo de mapa interactivo directo

### Objetivo

Reducir fricción de navegación: click en nodo ejecuta flujo directo (movimiento/interacción) y reforzar lectura visual del mapa.

### Implementado

1. Selección automática por nodo:
   - `src/components/hub/story/internal/use-story-auto-node-selection.ts`.
   - nodos de ruta disparan movimiento,
   - nodos virtuales disparan interacción narrativa.
2. Plataformas decorativas no jugables:
   - `platforms` en definiciones por acto.
   - render en `StoryMapPlatforms` para enriquecer mapa sin lógica extra.
3. Bloqueo estricto por progreso completado:
   - nodos virtuales dependientes solo se activan cuando el nodo previo está `completed`.
4. Duelos completados con presencia reducida (estado visual derrotado).

### Validación

1. Click en nodo desbloqueado dispara acción sin usar botón intermedio.
2. Nodos detrás de un duelo no completado permanecen bloqueados.
3. `pnpm lint`, tests Story relevantes y `pnpm build` en verde.

## Fase I - Mapa vivo (zoom + rutas extensas)

### Objetivo

Escalar el mapa Story a una experiencia más de mundo semi-abierto con mayor densidad de interacción y navegación visual.

### Implementado

1. Zoom del mapa:
   - rueda de ratón,
   - controles `+`, `-`, `1x`.
2. Nodo inicial exclusivo del jugador (`story-ch1-player-start`) y siguiente pasarela vacía jugable (`MOVE`).
3. Múltiples interacciones por camino (4-5+) y rutas tipo árbol con reconvergencias selectivas (no obligatorias).
4. Plataformas vacías jugables modeladas como nodos `MOVE` (sin icono de oponente).
5. Restricción de desbloqueo reforzada:
   - nodos detrás de un duelo/interacción previa permanecen inactivos hasta completar requisito.

### Validación

1. El jugador puede explorar con zoom y rutas densas sin romper flujo.
2. Los nodos virtuales en cadena se desbloquean por `INTERACTION`.
3. `pnpm lint`, tests Story relevantes y `pnpm build` en verde.
