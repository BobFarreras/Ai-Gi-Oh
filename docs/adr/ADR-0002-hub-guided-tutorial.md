<!-- docs/adr/ADR-0002-hub-guided-tutorial.md - Decisión arquitectónica para el tour guiado de onboarding por los nodos del Hub. -->
# ADR-0002: Tour guiado del Hub como onboarding principal

## Estado

Aprobado.

## Contexto

El onboarding actual muestra un diálogo de BigLog sobre el Hub y, al aceptar, redirige a `/hub/academy/tutorial`, donde el jugador ve un mapa grid con 4 nodos. El usuario solicita un flujo más inmersivo:

1. BigLog explica primero el contexto narrativo y las reglas básicas del juego.
2. El jugador navega físicamente por los nodos reales del Hub (Market, Arsenal, Story).
3. Clicar un nodo activo ejecuta la transición de cámara del Hub y luego abre el tutorial correspondiente.
4. El nodo de combate muestra una simulación del circuito de Story antes de llevar al duelo tutorial.
5. Se mantiene la opción de saltar el tutorial y la persistencia actual de nodos completados.

## Decisión

1. Se crea un **tour guiado del Hub** (`src/components/hub/guided-tour/`) como módulo independiente.
2. El estado del tour se infiere de los nodos tutorial ya completados (`player_tutorial_node_progress`), sin nueva tabla.
3. El catálogo de pasos del tour vincula cada nodo del Hub con su tutorial:
   - `node-market` → `tutorial-market-basics` → `/hub/academy/tutorial/market`
   - `node-home` → `tutorial-arsenal-basics` → `/hub/academy/tutorial/arsenal`
   - `node-story` → `tutorial-combat-basics` → `/hub/academy/training/tutorial`
4. `HubScene` recibe el estado del tour y desactiva los nodos no activos, resaltando el nodo objetivo.
5. La simulación de Story para el paso de combate es un overlay propio (`HubStorySimulationOverlay`) que se muestra antes de navegar al tutorial de combate.
6. Se reutiliza `/hub/academy/training/tutorial` como duelo tutorial; no se crea uno nuevo.
7. Al completar cada nodo tutorial, el jugador vuelve a `/hub` para continuar el tour.
8. Se mantienen las páginas de tutorial existentes para acceso libre posterior.

## Consecuencias

1. Mayor inmersión y coherencia visual: el jugador aprende mientras navega el Hub real.
2. Se reutiliza toda la lógica de tutorial y combate ya existente, reduciendo riesgo y deuda técnica.
3. El estado del tour es determinista y derivado del progreso persistido; no hace falta sincronizar otro flag.
4. Se requiere tocar `HubScene` y los componentes de mapa para soportar nodos desactivados/resaltados.

## Reglas de implementación

1. Cada archivo del módulo `guided-tour` debe tener una única responsabilidad y no superar 150 líneas.
2. La lógica de estado del tour debe ser pura y testeable (`resolve-hub-tour-state.ts`).
3. La UI debe ser usable en desktop y móvil sin animaciones que degraden el rendimiento.
4. No se puede acceder a la base de datos directamente desde componentes React; se usan servicios/casos de uso.
5. Todo cambio de comportamiento debe incluir tests unitarios y/o de componente co-localizados.
