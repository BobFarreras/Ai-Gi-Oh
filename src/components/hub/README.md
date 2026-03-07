<!-- src/components/hub/README.md - Documenta la arquitectura UI del Hub 3D, sus componentes y reglas de mantenimiento. -->
# Hub UI (3D)

## Objetivo

La UI del Hub representa un centro de control interactivo en 3D, manteniendo:

1. Navegación real por secciones (`/hub/*`).
2. Reglas de bloqueo en dominio (UI solo representa estado).
3. Accesibilidad en interacción de nodos.

## Estructura

1. `HubShell.tsx`: contenedor raíz visual (fondo + escena directa).
2. `HubScene.tsx`: orquesta HUD 2D, acciones flotantes y selección de modo 3D/fallback.
3. `HubSceneWorld3D.tsx`: encapsula `Canvas`, suelo, cámara y nodos 3D.
4. `HubSceneNode3D.tsx`: nodo 3D individual (core + panel HTML).
5. `HubNodeActionPanel.tsx`: capa accesible (`button`, `aria-label`, lock reason, navegación).
6. `internal/hub-3d-node-math.ts`: utilidades puras de mapeo (posición/color).
7. `nodes/*`: núcleos visuales 3D por sección.
8. `nodes/market/*`: radar de mercado desacoplado por piezas para rendimiento.
9. `internal/HubErrorDialog.tsx`: diálogo reutilizable de error (auto-cierre, cierre manual y sonido común).
10. `internal/hub-node-navigation-flow.ts`: máquina de estados de navegación de nodos (`idle`, `targeting`, `routing`, `timeout`).
11. `internal/use-hub-node-navigation.ts`: integra máquina + timers para bloquear doble click y disparar `router.push` tras transición.
12. `internal/hub-camera-fit.ts`: además del encuadre global, calcula foco de cámara por nodo (`resolveHubNodeFocusPose`).
13. `internal/use-hub-route-prefetch.ts`: precarga rutas del Hub para reducir latencia percibida al navegar.
14. `internal/hub-camera-path.ts`: genera el arco de trayectoria para la transición cinematográfica de cámara.
15. `sections/HubSectionLoading.tsx`: loading reutilizable para fases donde sí se quiera feedback explícito de carga.
16. `sections/HubSectionEntryBurst.tsx`: explosión de entrada al montar una sección, ya con página renderizada.
17. `internal/use-hub-sfx.ts`: centraliza SFX del Hub (hover de nodo, entrada HUD y click UI).

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
5. La entrada del Hub monta escena directamente para reducir latencia percibida.
6. La transición de navegación de nodos se modela con estado puro para evitar dobles clicks y facilitar testeo antes de conectar cámara/loader.
7. Mientras hay transición activa, los nodos no objetivo quedan deshabilitados y el nodo objetivo muestra estado `CONECTANDO`.
8. Durante `targeting/routing`, la cámara se desplaza al nodo activo antes de cambiar de ruta.
9. El Hub ejecuta prefetch de rutas de secciones al montar escena.
10. La navegación entre nodos evita loaders intermedios (incluyendo `/hub/loading.tsx`) para mantener continuidad visual de escena.
11. El movimiento de cámara usa trayectoria curva (arco) para evitar desplazamientos lineales bruscos.
12. El tiempo de `targeting` está optimizado para respuesta más rápida al click.
13. El HUD reproduce `button-click.mp3` en acciones de recenter, ocultar HUD, toggle de progreso y logout.
14. El efecto de explosión visual ocurre al montar la sección destino (`HubSectionEntryBurst`), nunca antes.

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
10. `src/components/hub/internal/hub-node-navigation-flow.test.ts`
11. `src/components/hub/internal/hub-route-prefetch.test.ts`
12. `src/components/hub/internal/hub-camera-path.test.ts`

Comando:

```bash
pnpm vitest src/components/hub --run
```
