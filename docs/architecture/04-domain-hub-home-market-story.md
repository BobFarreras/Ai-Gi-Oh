<!-- docs/architecture/04-domain-hub-home-market-story.md - Mapa de subdominios funcionales Hub/Home/Market/Story con entrada Academy para tutorial y training. -->
# Dominio Hub, Academy, Home, Market y Story

## Hub

1. `HubScene` y nodos 3D como capa de navegación.
2. Reglas de acceso no se deciden en componentes, se resuelven en políticas/casos de uso.
3. Estructura visual desacoplada por nodos y paneles.
4. Durante el gate de tutorial (`hasCompletedTutorial=false` y `hasSkippedTutorial=false`) solo queda desbloqueado `TRAINING`; el resto se bloquea por `HubAccessPolicy`.

## Academy (Tutorial + Training)

1. Entrada canónica: `/hub/academy`.
2. Selector visual: `TrainingModeSelection` con dos rutas activas:
3. Ruta tutorial guiado: `/hub/academy/tutorial` (nodos `arsenal`, `market`, `reward`).
4. Ruta arena de práctica: `/hub/academy/training/arena`.
5. Tutorial de combate: `/hub/academy/training/tutorial`.
6. La navegación y hardcodes se centralizan en `src/core/constants/routes/academy-routes.ts`.

## Home (Arsenal/Deck Builder)

1. Estado y handlers divididos en `internal/hooks`, `internal/actions`, `internal/dnd`, `internal/view`.
2. Actualizaciones optimistas encapsuladas en `internal/optimistic`.
3. Errores UX normalizados en `internal/errors`.

## Market

1. Escena principal desacoplada de detalles de compra/listado.
2. Inspector de carta separado en submódulos internos.
3. Repositorios y endpoints gestionan catálogo, wallet y transacciones.

## Story

1. Carga de oponente/duelo desde casos de uso y repositorios.
2. Cierre de duelo vía endpoint dedicado y recompensa posterior.
3. Integración con `Board` en modo `STORY` sin duplicar lógica del motor.
4. Desbloqueo y navegación del mapa mediante grafo puro en `core/services/story/world`.
5. Orquestación de estado/movimiento/resolución en `core/use-cases/story`.
6. Persistencia compacta de Story en `player_story_world_state` (`current_node_id`, `visited_node_ids`, `interacted_node_ids`).
