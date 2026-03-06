<!-- src/components/hub/README.md - Documenta la arquitectura UI del Hub 3D, sus componentes y reglas de mantenimiento. -->
# Hub UI (3D)

## Objetivo

La UI del Hub representa un centro de control interactivo en 3D, manteniendo:

1. Navegación real por secciones (`/hub/*`).
2. Reglas de bloqueo en dominio (UI solo representa estado).
3. Accesibilidad en interacción de nodos.

## Estructura

1. `HubShell.tsx`: contenedor raíz visual (fondo + escena).
2. `HubScene.tsx`: orquesta HUD 2D superpuesto y mundo 3D (`Canvas`).
3. `HubSceneNode3D.tsx`: nodo 3D individual (core + panel HTML).
4. `HubNodeActionPanel.tsx`: capa accesible (`button`, `aria-label`, lock reason, navegación).
5. `internal/hub-3d-node-math.ts`: utilidades puras de mapeo (posición/color).
6. `nodes/*`: núcleos visuales 3D por sección.
7. `nodes/market/*`: radar de mercado desacoplado por piezas para rendimiento.

## Flujo de interacción

1. El usuario hace click en un nodo.
2. Si está desbloqueado: navega con `router.push(section.href)`.
3. Si está bloqueado: muestra `lockReason` en el panel del nodo.

## Rendimiento

1. Un único `Canvas` para toda la escena.
2. Configuración de render en `HubScene`:
   - `dpr={[1, 1.5]}`
   - `antialias: false`
   - `powerPreference: "high-performance"`
3. El nodo `MARKET` está dividido en submódulos (`grid`, `sweep`, `blips`) para limitar complejidad y facilitar tuning.

## Accesibilidad

1. Todo nodo interactivo usa `button` semántico.
2. Etiquetas accesibles:
   - `Abrir {sección}`
   - `Mostrar bloqueo de {sección}`

## Tests recomendados

1. `src/components/hub/HubNodeActionPanel.test.tsx`
2. `src/components/hub/internal/hub-3d-node-math.test.ts`
3. `src/components/hub/nodes/market/market-radar-utils.test.ts`
4. `src/components/hub/sections/HubSectionScreen.test.tsx`

Comando:

```bash
pnpm vitest src/components/hub --run
```
