<!-- src/components/hub/README.md - Documenta la arquitectura UI del Hub 3D, sus componentes y reglas de mantenimiento. -->
# Hub UI (3D)

## Objetivo

La UI del Hub representa un centro de control interactivo en 3D, manteniendo:

1. Navegación real por secciones (`/hub/*`).
2. Reglas de bloqueo en dominio (UI solo representa estado).
3. Accesibilidad en interacción de nodos.

## Estructura

1. `HubShell.tsx`: contenedor raíz visual (fondo + boot loader de escena).
2. `boot/HubSceneBootLoader.tsx`: transición de arranque (puertas + loading) antes de montar escena.
3. `boot/HubBootTransition.tsx`: overlay animado de puertas mecánicas durante carga.
4. `HubScene.tsx`: orquesta HUD 2D, acciones flotantes y selección de modo 3D/fallback.
5. `HubSceneWorld3D.tsx`: encapsula `Canvas`, suelo, cámara y nodos 3D.
6. `HubSceneNode3D.tsx`: nodo 3D individual (core + panel HTML).
7. `HubNodeActionPanel.tsx`: capa accesible (`button`, `aria-label`, lock reason, navegación).
8. `internal/hub-3d-node-math.ts`: utilidades puras de mapeo (posición/color).
9. `nodes/*`: núcleos visuales 3D por sección.
10. `nodes/market/*`: radar de mercado desacoplado por piezas para rendimiento.

## Flujo de interacción

1. El usuario hace click en un nodo.
2. Si está desbloqueado: navega con `router.push(section.href)`.
3. Si está bloqueado: muestra `lockReason` en el panel del nodo.

## Rendimiento

1. Un único `Canvas` para toda la escena.
2. Configuración de render adaptativa:
   - Perfil por viewport en `internal/hub-render-profile.ts` (DPR, blur, reflexión y grid).
   - `antialias: false`.
   - `powerPreference: "high-performance"`.
3. El nodo `MARKET` está dividido en submódulos (`grid`, `sweep`, `blips`) para limitar complejidad y facilitar tuning.
4. El render 3D se pausa automáticamente cuando la pestaña no está visible (`frameloop: never`).
5. El arranque usa `boot/HubSceneBootLoader` para ocultar artefactos iniciales y mostrar escena solo al completar transición.

## Fallback WebGL

1. Si el entorno no soporta WebGL, el hub utiliza `HubSceneFallback2D`.
2. El fallback mantiene:
   - nodos clicables,
   - navegación por `href`,
   - visualización de `lockReason` en secciones bloqueadas.
3. Detección centralizada en `internal/hub-webgl-support.ts`.

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
5. `src/components/hub/HubSceneFallback2D.test.tsx`
6. `src/components/hub/HubScene.fallback.test.tsx`
7. `src/components/hub/internal/hub-webgl-support.test.ts`
8. `src/components/hub/boot/HubSceneBootLoader.test.tsx`
9. `src/components/hub/internal/hub-render-profile.test.ts`

Comando:

```bash
pnpm vitest src/components/hub --run
```
