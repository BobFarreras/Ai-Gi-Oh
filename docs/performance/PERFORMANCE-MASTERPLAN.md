<!-- docs/performance/PERFORMANCE-MASTERPLAN.md - Guía maestra de refactorización de rendimiento. Producto final, no MVP. -->

# Plan Maestro de Rendimiento — ai-gi-oh

> **Filosofía:** Producto final de estudio de videojuegos. Sin parches temporales. Cada fase entrega valor medible al jugador, respeta el diseño visual actual y queda cubierta por tests de rendimiento.

---

## 0. Diagnóstico Ejecutivo

### Problema central

El tablero de combate y las cartas se renderizan **100% con DOM + CSS 3D transforms + Framer Motion**. No hay Canvas ni WebGL en el combate. Esto fuerza a la CPU a computar perspectiva, `preserve-3d`, `clip-path`, sombras, y animaciones infinitas por cada carta y slot, cuando la GPU debería asumir ese trabajo. En móviles y equipos de bajas prestaciones, el resultado es:
- Caída de FPS por debajo de 30 durante el combate
- Jank perceptible en animaciones de cartas (hologramas, auras de maestría)
- Bloqueos del hilo principal al procesar combat log y re-renderizar el árbol completo

### Estadísticas de assets estáticos (estado actual)

| Categoría | Peso | Nota |
|-----------|------|------|
| Videos de fusión (3) | 63,3 MB | MP4 sin compresión adaptativa |
| Videos de story (2) | 27,2 MB | MP4 sin compresión adaptativa |
| Audio (104 archivos) | 34,1 MB | MP3, sin lazy loading |
| Imágenes story opponents (PNG) | 4,2 MB | No convertidas a WebP |
| bg-tech.jpg | ~~283 KB~~ → **Eliminado** | Migrado a `bg-tech.webp` (64 KB). Código actualizado. |
| HUD PNGs | ~~275 KB~~ → **Eliminados** | Archivos obsoletos eliminados (no referenciados en código). |
| Renders de cartas (WebP) | 3.850 KB | Ya en WebP |
| **Total public** | **138,8 MB** | — |

### Bibliotecas de renderizado actuales

| Biblioteca | Uso | Peso estimado (gzip) |
|---|---|---|
| `framer-motion` | Animaciones en 587 puntos de importación | ~45 KB |
| `@react-three/fiber` + `@react-three/drei` + `three` | Solo Hub (lobby 3D) | ~150 KB |
| `zustand` | Estado global (mínimo en combate, más en story) | ~2 KB |

### Cuellos de rendimiento por dominio

#### CRÍTICO — Combate (Board)

1. **Estado monolítico sin selectores:** `useState<GameState>` único. Cada acción reemplaza el objeto completo. Todo el árbol `Board` se re-renderiza. Solo 3 componentes tienen `React.memo`.
2. **CardFrameMasteryAura:** 15 partículas `<motion.div>` con `repeat: Infinity` + 1 anillo dorado pulsante. Con 2 cartas V5 en campo = 32 animaciones infinitas concurrentes.
3. **CardHologram:** Float infinito `y: [0, -12, -4, -15, 0]` de 6s por cada entidad en campo (hasta 6 concurrentes).
4. **VFX compuestos:** `TrapActivationVfx` + `ExecutionActivationVfx` encadenan 3-4 capas de VFX simultáneas, cada una generando 5+ `<motion.div>`.
5. **CSS 3D en cascada:** `perspective-[1200px]` + `rotate-x-[55deg]` + `preserve-3d` en 4+ niveles de nesting (zone → lanes → slot → entity). La GPU debe compositar cada capa 3D de forma independiente.
6. **Combat log sin indexar:** Crecimiento no acotado + `[...events].reverse()` ejecutado 5+ veces por actualización de feedback.
7. **DrawCardFlowVfx:** Usa `document.querySelector` para leer posiciones DOM dinámicas por cada entrada del combat log.

#### ALTO — Hub / Landing

8. **CyberBackground:** 100 partículas con O(n²) de conexiones (≈5000 cálculos de distancia por frame). Sin throttling, sin delta-time, sin `devicePixelRatio`.
9. **Triple pipeline de render:** Hub = CyberBackground (Canvas 2D) + HubSceneWorld3D (WebGL/R3F) + HUD overlay (DOM). Los tres compiten por GPU simultáneamente.
10. **MeshReflectorMaterial en R3F:** Reflejo en tiempo real del suelo del hub. Costoso en GPUs integradas.
11. **No pausa inteligente del Canvas 2D:** CyberBackground corre incluso cuando la pestaña está visible pero el jugador interactúa con el HUD 3D.

#### MEDIO — Arsenal (Home) / Market

12. **Cartas completas a escala mínima:** Market listings renderizan `<Card>` completa a `scale-[0.21]`. Pack mosaics a `0.20`. Cada Card pesa ~15 nodos DOM, múltiples CSS clip-paths y gradientes.
13. **Animaciones infinitas en cartas evolucionables:** `HomeCollectionPanel` aplica `repeat: Infinity` a cartas evolucionables en el viewport.
14. **`useVirtualGridWindow` sin throttle:** Se recalcula en cada evento `scroll` sin `requestAnimationFrame`.
15. **`backdrop-blur-2xl`** en overlay de revelación de packs: Costoso en GPUs móviles.

#### MEDIO — Story

16. **Imágenes PNG de oponentes:** ~4,2 MB en PNG. Cada derrota/victoria avatar pesa 300-466 KB.
17. **Composición de hooks:** `StoryScene` monta 9+ hooks, algunos con observables que disparan re-renders en cascada.
18. **Mapa de circuito interactivo:** Continuous framer-motion motion values + zoom/pan gestures.

#### BAJO — Assets / Infraestructura

19. **bg-tech.jpg (283 KB):** Existe `bg-tech.webp` (64 KB) pero el código sigue referenciando `.jpg`.
20. **HUD PNGs (275 KB):** Sin convertir a WebP.
21. **Audio eager loading:** 5 clips MP3 del landing se pre-cargan en `useLandingAudio`, sumando ~1,2 MB. Audio de hub/story también eager.
22. **Videos de fusión de 19-23 MB cada uno:** Sin streaming progresivo ni lazy load por vista.

---

## 1. Arquitectura Objetivo

### Principio rector

> **La UI no cambia. El diseño se mantiene idéntico. Solo cambia cómo se renderiza y gestiona el estado.**

No hay cambio visual para el usuario. El objetivo es que la misma interfaz funcione a 60 FPS en un móvil de gama media.

### Roadmap de tecnología de renderizado

| Dominio | Estado actual | Estado objetivo | Justificación |
|---------|---------------|-----------------|---------------|
| Combate (Board) | DOM + CSS 3D + Framer Motion | **PixiJS v8 (Canvas/WebGL)** | 3D fake perspective → 2D isométrico real en Canvas. Elimina `preserve-3d`, animaciones DOM infinitas, compositing en capas. |
| Cartas (Board) | DOM + CSS clip-path + Framer Motion | **PixiJS Sprites/Containers** | Cartas como texturas pre-renderizadas en Canvas. Hologramas y auras como shaders WebGL o spritesheet animations. |
| VFX (Board) | Framer Motion `<motion.div>` stacks | **PixiJS ParticleContainer + Timeline** | Partículas y flashes gestionados por el motor interno de Pixi, no por el reconciler de React. |
| Hub (Lobby) | R3F + Canvas 2D (CyberBackground) + DOM | **R3F optimizado** + Canvas 2D inteligente | CyberBackground con throttling adaptativo. R3F con LOD y pause-on-interaction. |
| Arsenal (Home) | DOM + Framer Motion | DOM optimizado | Cartas thumbnail en vez de Card completa a escala 0.21. Virtual grid con rAF throttle. |
| Market | DOM + Framer Motion | DOM optimizado | Card thumbnails. Lazy reveal progresivo. |
| Story | DOM + Framer Motion | DOM optimizado | Imágenes WebP. Memoización de historia. |
| Estado (Combate) | `useState<GameState>` sin selectores | **Zustand con selectores granulares** | Re-render solo del sub-árbol que cambió. Sin cambiar GameEngine puro. |
| Landing | CyberBackground O(n²) + Framer Motion | Canvas 2D optimizado | Throttling adaptativo, delta-time, DPR, skip frames en tab oculta. |

### ¿Por qué PixiJS y no Three.js/R3F para el combate?

1. **El combate es 2D con perspectiva isométrica** — No se necesita un motor 3D real. PixiJS v8 con WebGL renderer es suficiente para texturas 2D con transformaciones afines (escala, rotación, translate)批次. Three.js/R3F sería overkill para perspectiva isométrica.
2. **PixiJS v8 (released 2024) tiene batch rendering, particle containers y soporte nativo de texturas en atlas** — Ideal para decenas de cartas simultáneas.
3. **Menorbundle size** — PixiJS v8 core ~90 KB gzip vs R3F+Three ~150 KB gzip (que ya pagamos para el Hub).
4. **La API de React se mantiene** — `@pixi/react` permite componentes React que mapean a objetos PixiJS, manteniendo el paradigma declarativo.
5. **El GameEngine puro no cambia** — Solo se reemplaza la capa de presentación. Los casos de uso, la lógica de combate y las entidades permanecen intactas.

---

## 2. Fases de Implementación

> Orden: **Market → Arsenal → Hub → Story → Combate**. Las primeras fases son DOM-optimization (riesgo bajo, impacto alto). El combate es la reescritura más ambiciosa y va al final con la mayor experiencia ganada.

---

### FASE 1 — Optimización de Assets y Core DOM (1-2 semanas)

> **Objetivo:** Reducir peso de carga y eliminar cuellos de botella obvios sin tocar la arquitectura de renderizado.

#### 1.1. Migración de imágenes a WebP

| Acción | Archivos | Estado | Impacto |
|--------|----------|--------|---------|
| Reemplazar `bg-tech.jpg` → `bg-tech.webp` en código y datos | `entities.ts`, `fusions.ts`, `cards_catalog.json`, `TFMHeroHeader.tsx`, `admin-card-catalog-draft.ts`, `AdminAuditPanel.tsx`, `create-tutorial-*.ts`, test files | **Completado** ✅ | -219 KB por carga |
| Eliminar `bg-tech.jpg` del servidor | `public/assets/bgs/bg-tech.jpg` | **Completado** ✅ | Archivo eliminado |
| Eliminar HUD PNGs obsoletos | `hud-container.png`, `hud-header.png`, `hud-section.png` | **Completado** ✅ | -275 KB eliminados (no usados) |
| Convertir story opponent PNGs → WebP | 16+ archivos en `public/assets/story/opponents/` | Pendiente | -~3,5 MB estimado |
| Convertir story player PNGs → WebP | `public/assets/story/player/` | Pendiente | -~2,8 MB estimado |

**Verificación:** `pnpm build` + Lighthouse mobile con throttling 4x. LCP debe bajar >30%.

#### 1.2. Optimización de CyberBackground

```
Archivo: src/components/landing/CyberBackground.tsx
```

| Modificación | Detalle |
|--------------|---------|
| Reducir `PARTICLE_COUNT` de 100 a 50 en móvil | Detectar con `window.matchMedia('(max-width: 768px)')` |
| Añadir skip-frames cada 2 frames en móvil | `if (frameCount % 2 === 0) { draw; } frameCount++;` |
| Añadir delta-time | `elapsed += deltaTime; nodes[i].update(deltaTime, ...)` en vez de `vx/vy` fijos |
| Añadir `devicePixelRatio` limitado | `canvas.width = window.innerWidth * Math.min(dpr, 2)` |
| Debounce resize handler | En vez de redibujar inmediatamente, usar `requestAnimationFrame` |
| Pausar animación cuando `document.hidden === true` | `document.addEventListener('visibilitychange', ...)` |
| Connection distance check with squared distance | Eliminar `Math.sqrt`: comparar `dx*dx + dy*dy < CONNECTION_DISTANCE_SQ` |

**Verificación:** Chrome Performance panel en movil emulado. El frame time de CyberBackground debe bajar de ~8ms a <2ms.

#### 1.3. Optimización de audio: lazy loading

```
Archivos: src/components/landing/ (useLandingAudio), src/components/hub/internal/use-hub-sfx.ts, combate hooks de audio
```

| Modificación | Detalle |
|--------------|---------|
| Reemplazar `new Audio(src)` eager por lazy `createAudio()` factory | Solo instanciar cuando se reproduce por primera vez |
| Usar `preload="none"` en `<audio>` para música de fondo | Solo cargar metadata hasta `play()` |
| Comprimir MP3 a AAC/Opus para navegadores modernos | Reducción ~40% de peso de audio |
| Implementar un `AudioPool` singleton que cachea y reutiliza instancias | Evitar `new Audio()` en BackButton y otros componentes |

**Verificación:** Network tab en primera carga. Solo debe cargar el audio del estado actual (landing → solo landing soundtrack).

#### 1.4. Optimización de `useVirtualGridWindow`

```
Archivo: src/components/hub/internal/useVirtualGridWindow.ts
```

| Modificación | Detalle |
|--------------|---------|
| Throttle del scroll handler con `requestAnimationFrame` | Evitar recalcular en cada pixel de scroll |
| Memoizar cálculos con `useMemo` para `startIndex`, `endIndex` | Recalcular solo cuando `scrollTop` o `containerHeight` cambien significativamente |
| Usar `IntersectionObserver` para viewport detection | Reemplazar cálculo manual de overflow |

---

### FASE 2 — Market: Dominio DOM optimizado (1-2 semanas)

> **Objetivo:** Market es la pantalla con peor ratio de nodos DOM por elemento visible (full Card a scale 0.21). Optimizar aquí da el mayor impacto por esfuerzo invertido.

#### 2.1. Card Thumbnail Component

Crear `CardThumbnail` — componente simplificado de carta para listas y mosaicos:

| Propiedad | Card completa | CardThumbnail |
|-----------|---------------|---------------|
| Arte de carta | `<Image>` con responsive sizes | Mini `<img>` o `<Image>` fijo 80x120 |
| clip-path angular | CSS polygon completo | Simplificado o border-radius |
| Holograma | motion.div con 3 capas 3D | N/A o simple CSS shimmer |
| Mastery aura | 15 motion.div infinitos | Badge de nivel (texto) |
| Stats animados | `AnimatedStatNumber` con rAF | Texto estático |
| Frame gradient | 4+ capas CSS gradient | Gradiente CSS simple o background color |
| Peso DOM aproximado | ~15 nodos + 3 motion.div + Image | ~4 nodos + 1 img |
| Peso de animación | 1-16 infinite loops | 0 infinite loops |

**Regla:** Card completa solo se renderiza en el inspector de detalle y en el tablero de combate. Todo lo demás usa CardThumbnail.

#### 2.2. Market Packs — Lazy reveal

| Modificación | Detalle |
|--------------|---------|
| Pack mosaic tiles → CardThumbnail | En vez de 4 Cards a scale 0.20, usar 4 CardThumbnails sin escala |
| Pack reveal overlay → Card completa con lazy mount | Solo renderizar Card completa cuando la carta se revela, no todas a la vez |
| remplazar `backdrop-blur-2xl` por `backdrop-blur-sm` o overlay opaco | Reducir coste GPU en móvil |
| stagger reveal: solo montar Card cuando `isRevealed[index] === true` | Evitar 8+ Cards en DOM simultáneamente |

#### 2.3. Market Listings — Performance mode automático

| Modificación | Detalle |
|--------------|---------|
| `isPerformanceMode` → detección automática con `navigator.hardwareConcurrency < 4` o `matchMedia('(prefers-reduced-motion: reduce)')` | No depender de prop manual |
| en `performanceMode`: usar CardThumbnail exclusivamente, overscan=0, sin animaciones de entrada | Reducir nodos DOM de ~300 a ~40 |

**Verificación:** Chrome Performance en móvil emulado. INP de interacción `market.buyCard` < 150ms.

---

### FASE 3 — Arsenal (Home): Optimización de renderizado (1-2 semanas)

#### 3.1. Card infinitas → CardThumbnail en colección

| Modificación | Detalle |
|--------------|---------|
| `HomeCollectionPanel` → usar CardThumbnail en vez de Card para cartas en grid | Eliminar animaciones `repeat: Infinity` por carta evolucionable |
| Solo renderizar Card completa en `HomeCardInspector` (panel de detalle) | Inspector ya lo hace; verificar que no se renderizan Cards fuera de vista |
| Eliminar `contentVisibility: "auto"` en favor de unmounting fuera de viewport | `contentVisibility` no evita animaciones Framer Motion |

#### 3.2. Memoización estratégica

| Componente | Estrategia |
|------------|------------|
| `HomeCollectionPanel` | `React.memo` con shallow comparison de `collection.length` y `filter` hash |
| `HomeDeckPanel` | `React.memo` con shallow comparison de `deck.slots` y `deck.fusionSlots` |
| Cartas individuales en grid | `React.memo` con comparación de `card.id`, `card.level`, `isSelected` |
| `HomeDeckFilterControls` | `React.memo` — filtros cambian con poca frecuencia |
| `usedByCardId` Map | Memoizar con `useMemo` key=deck version, no recalcular en cada render |

#### 3.3. Event listeners

| Modificación | Detalle |
|--------------|---------|
| `HomeResponsiveWorkspace` resize → debounce de 150ms | Evitar layout thrashing |
| `HomeDeckActionBar` → eliminar re-renders por `useViewportWidth()` | Memoizar breakpoint result en vez de valor numérico |

**Verificación:** Medir renders con `window.__AIGIOH_PERF__?.renders` en Arsenal. Ningún componente debe renderizar >2 veces por interacción.

---

### FASE 4 — Hub: Pipeline de render optimizado (1-2 semanas)

#### 4.1. CyberBackground adaptativo

| Modificación | Detalle |
|--------------|---------|
| Pausar CyberBackground cuando HubScene 3D está activo y el jugador no está en landing | No renderizar Canvas 2D bajo WebGL si no es visible |
| Opción: reemplazar CyberBackground en Hub por un `<video>` pre-renderizado del efecto de partículas | `<video autoplay muted loop>` de 5-10 segundos pesa ~500 KB vs CPU cost continuo |
| Reducir partículas dinámicamente: 100 desktop, 30 móvil, 0 si WebGL está activo | `window.matchMedia` + existencia de R3F Canvas |

#### 4.2. HubSceneWorld3D — LOD y optimizaciones

| Modificación | Detalle |
|--------------|---------|
| Añadir `performance` monitor R3F: reducir DPR y desactivar antialias si FPS < 30 | `useFrame` con `gl.info.render.calls` |
| `MeshReflectorMaterial` →одовременно desactivar en móvil y bajo rendimiento | Solo activar reflejo si `capability !== 'low'` |
| Implementar LOD para nodos 3D: simplificar geometría a distancia | Nodo 3D → billboard sprite si está lejos de la cámara |
| Pre-cargar texturas de nodos con `useTexture` y `suspense` | Evitar pop-in visual |

#### 4.3. Hub HUD overlay

| Modificación | Detalle |
|--------------|---------|
| Envolver `HubSceneHudOverlay` con `React.memo` | Re-renderizar solo cuando `progress` o `playerLabel` cambien |
| Eliminar animaciones Framer Motion del HUD si `prefers-reduced-motion` | Accesibilidad + rendimiento |

**Verificación:** Chrome Performance en móvil. El Hub debe mantener >30 FPS continuos durante navegación entre nodos.

---

### FASE 5 — Story: Assets y memoización (1 semana)

#### 5.1. Conversión de assets

| Acción | Detalle |
|--------|---------|
| Oponente PNGs → WebP con calidad 80 | Ahorro estimado: 3,5 MB → ~0,7 MB |
| Player PNGs → WebP | Ahorro estimado: 2,8 MB → ~0,5 MB |
| Story soundtrack MP3 → AAC/Opus | Reducción ~40% de peso |
| Videos de story → streaming con `<video preload="metadata">` | No descargar 13,6 MB hasta que el usuario inicie el video |

#### 5.2. StoryScene memoización

| Modificación | Detalle |
|--------------|---------|
| Crear `useStorySceneStore` con Zustand selectores granulares | Evitar que cambios de `selectedNodeId` re-rendericen el sidebar |
| `React.memo` en `StoryCircuitMap` con shallow comparison de nodos seleccionados | Re-renderizar mapa solo cuando cambie la ruta visual |
| `React.memo` en sidebar, floating actions, soundtrack | Aislar re-renders por componente |
| Extraer saga de hooks de StoryScene en hooks individuales con estado local | Reducir composición de 9 hooks monolíticos |

**Verificación:** Story map scroll y selección de nodo en móvil. INP < 200ms.

---

### FASE 6 — Combate: Estado y re-renders (1-2 semanas)

> **Esta es la fase más técnica. No se toca la capa visual todavía (eso es Fase 7-8). Se optimiza el estado para reducir re-renders innecesarios en el DOM actual.**

#### 6.1. Migrar estado de combate a Zustand con selectores

**Estado actual:** `useBoard` → `useState<GameState>` único.

**Estado objetivo:** Zustand store con slices independientes.

```typescript
// Estructura objetivo (no implementar aún — plan)
interface IBoardStore {
  // Slice 1: Estado del juego (sin UI)
  gameState: GameState;
  // Slice 2: Estado de UI (selección, highlighted, etc.)
  uiState: BoardUiState;
  // Slice 3: Feedback visual (combat animations, damage flash)
  combatFeedback: BoardCombatFeedback;
  // Slice 4: Progresión (XP, recompensas)
  progression: BoardProgressionState;
}
```

**Regla:** Los componentes consumen solo el slice que necesitan via `useBoardStore(state => state.uiState.selectedEntityId)`. Un cambio en `combatFeedback` NO re-renderiza el `PlayerHand` que solo lee `gameState.playerA.hand`.

**Implementación incremental:**
1. Crear `useBoardStore` con Zustand, replicando la estructura actual
2. Migrar `uiState` como primer slice (mayor impacto en re-renders)
3. Migrar `combatFeedback` como segundo slice
4. Migrar `gameState` como tercer slice (el más grande, hacerlo último)
5. Cada slice se migra en su propio PR con tests de no-regresión

#### 6.2. Combat log — indexación

| Modificación | Detalle |
|--------------|---------|
| `buildBoardCombatFeedback` → cachear resultado por `gameState.turn` + `combatLog.length` | Evitar escanear todo el log en cada render |
| Reemplazar `[...events].reverse()` con iteración desde el final | Eliminar la creación de 5+ arrays reversed por render |
| Añadir `lastEventIndex` al `GameState` | Referencia rápida al último evento sin reverse |

#### 6.3. React.memo exhaustivo en Board

| Componente | Memoizar con | Razón |
|-----------|-------------|-------|
| `PlayerHand` | `React.memo` + comparación de `hand.length` y `hand` IDs | Re-renderizar solo cuando cambie la mano |
| `OpponentHand` | `React.memo` + `hand.length` | Re-renderizar solo cuando cambie el count |
| `PlayerHUD` | `React.memo` + `hp`, `energy` | Re-renderizar solo cuando cambien stats |
| `SidePanels` | `React.memo` + `turn`, `phase` | Re-renderizar solo en cambio de turno/fase |
| `BoardStatusAndTopBarSection` | `React.memo` | Re-renderizar solo cuando cambie info textual |
| `SlotCellEntity` | `React.memo` + entity props | Ya parcial, confirmar que `areEqual` cubre todos los casos |
| `CardHologram` | `React.memo` + shallow comparison | Evitar re-renders infinitos de animación |

#### 6.4. `useBoardPerformanceProfile` — auto-detección

| Modificación | Detalle |
|--------------|---------|
| Detectar dispositivo con `navigator.hardwareConcurrency`, `navigator.deviceMemory`, y `performance.now()` benchmark | Ejecutar un micro-benchmark (5ms) al montar |
| Definir 3 perfiles: `high`, `medium`, `low` | high: efectos completos + hologramas. medium: hologramas simplificados. low: sin hologramas ni auras. |
| Exponer perfil via React Context para que componentes hoja lo consuman sin prop drilling | `useCombatVisualProfile()` hook |

**Verificación:** Captura de baseline antes y después con `pnpm perf:baseline:mobile:realistic`. Objetivo: ≥30% reducción de renders por interacción en combate.

---

### FASE 7 — Combate: Capa PixiJS — Board y Slots (3-4 semanas)

> **FASE CRÍTICA. Reescritura de la capa de presentación del tablero. El GameEngine puro no se modifica.**

#### 7.1. Arquitectura PixiJS para el tablero

```
src/components/game/board/internal/pixi-renderer/
├── BoardPixiApp.tsx              — Contenedor R3F-análogo para PixiJS
├── BoardPixiContext.tsx          — Context provider para la instancia de PixiJS App
├── internal/
│   ├── factories/
│   │   ├── createSlotTexture.ts  — Genera textura de slot vacío (cacheable)
│   │   ├── createCardTexture.ts  — Genera textura de carta desde datos pre-render
│   │   └── createBoardTexture.ts — Genera textura del tablero base
│   ├── sprites/
│   │   ├── SlotSprite.ts        — Sprite de slot con estados (vacío, highlight, selected)
│   │   ├── EntitySprite.ts      — Sprite de entidad en slot con holograma integrado
│   │   ├── CardBackSprite.ts    — Sprite de carta boca abajo
│   │   └── ProjectileSprite.ts   — Sprite para VFX de ataque/proyectil
│   ├── containers/
│   │   ├── BattlefieldContainer.ts  — Contenedor isométrico del campo
│   │   ├── PlayerZoneContainer.ts   — Zona del jugador (entities + executions)
│   │   ├── OpponentZoneContainer.ts — Zona del oponente
│   │   └── HandContainer.ts         — Contenedor de la mano del jugador
│   ├── animations/
│   │   ├── HologramAnimator.ts  — Animación de holograma (float, shimmer) vía timeline
│   │   ├── MasteryAuraAnimator.ts — Aura de maestría vía spritesheet o shader
│   │   ├── DamageFlashAnimator.ts — Flash de daño en zona
│   │   └── VfxAnimator.ts      — Orquestador de VFX compuestos
│   └── shaders/
│       ├── hologram.frag         — Shader WebGL para efecto holográfico
│       └── mastery-aura.frag    — Shader WebGL para aura de maestría
```

#### 7.2. Estrategia de texturas

| Elemento | Textura | Fuente | Caché |
|----------|---------|--------|-------|
| Slot vacío | 1 textura de 80x100px | Generada programáticamente | Sí, atlas |
| Carta entity | 1 textura de 160x220px por carta | Renderizada offscreen desde Card render → capturada una vez | Sí, atlas |
| Carta boca abajo | 1 textura compartida | Generada programáticamente | Sí |
| Holograma glow | Sustituido por shader fragment | Renderizado en GPU | N/A |
| Mastery aura | Sustituido por shader vertex/fragment | Partículas GLSL | N/A |
| Fondo del tablero | 1 textura de 1050x800px | Pre-renderizada | Sí |

**Proceso de pre-renderizado de cartas:**
1. Al montar el Board, renderizar cada carta de la mano y del campo en un `<canvas>` offscreen usando el componente `Card` existente
2. Capturar el resultado con `canvas.toDataURL()` → `PIXI.Texture.from()`
3. Al actualizar stats o nivel de carta, re-renderizar solo esa textura
4. Cachear en un `Map<cardId, Texture>` para la duración de la partida

> **Ventaja:** Se elimina el DOM de las cartas durante el combate. Las cartas se convierten en sprites. El holograma y las auras se convierten en shaders — 0 nodos DOM para animaciones infinitas.

#### 7.3. Isometría en Canvas vs CSS 3D

**Estado actual (CSS 3D):**
```
perspective: 1200px (en contenedor)
rotateX: 55deg (en plano del tablero)
preserve-3d (en 4+ niveles de nesting)
translateZ: 20-100px (en hologramas)
```

**Estado objetivo (PixiJS):**
```
Contenedor PIXI.Container con:
  - scale.y: 0.57 (cos(55°)) — aplastamiento isométrico
  - Transformación affine simple, sin preserve-3d
  - Ordenamiento Z manual por depth sort
```

Se elimina compositing de GPU en 4+ layers 3D. El tablero entero es un solo Container con scale.y. Los hologramas son sprites con translateY animado en vez de translateZ con preserve-3d.

#### 7.4. Estrategia de migración incremental

**NO se reescribe todo de golpe.** Se migra componente a componente:

| Sprint | Componente migrado | DOM residual | Validación |
|--------|-------------------|--------------|------------|
| 7.1 | `BattlefieldView` isométrico → PixiJS Container | Slots siguen siendo DOM | Test visual + baseline de FPS |
| 7.2 | `SlotCell` + `SlotCellEntity` → PixiJS Sprites | Entidades siguen siendo DOM Card | Test visual + baseline |
| 7.3 | `Card rendering` → PixiJS texture pre-render | Hologramas siguen siendo DOM | Test visual + baseline |
| 7.4 | `Hologram` → PixiJS animation/shader | Mastery auras siguen siendo DOM | Test visual |
| 7.5 | `MasteryAura` → PixiJS shader/particles | Resto de VFX siguen siendo DOM | Test visual + FPS ≥ objetivo |
| 7.6 | `Hand` (Player + Opponent) → PixiJS Container | VFX siguen siendo DOM | Test visual |
| 7.7 | VFX (Summon, Trap, Beam, Buff) → PixiJS Animators | HUD y panels DOM | Test visual |
| 7.8 | Limpieza: eliminar todos los componentes DOM residuales del board | Solo PixiJS + HUD/panels DOM | Test de regresión completo |

Cada sprint produce un PR único, mergeable, con tests E2E de no-regresión visual.

#### 7.5. Coexistencia DOM + PixiJS durante la migración

Durante los sprints 7.1-7.7, el tablero tendrá:
- Una capa PixiJS (`<canvas>`) para elementos migrados
- Una capa DOM overlay para elementos no migrados
- Un bridge (`useBoardPixiSync`) que sincroniza el estado del juego entre ambas capas

**Regla de coexistencia:** Un elemento existe en DOM O en Canvas, nunca en ambos. La capa DOM se va vaciando conforme se migra cada componente.

---

### FASE 8 — Combate: VFX y Polish final (2-3 semanas)

#### 8.1. VFX PixiJS — Detalle por efecto

| Efecto VFX | Estado actual (DOM) | Estado objetivo (PixiJS) |
|-----------|---------------------|--------------------------|
| SummonHologramVfx | 5 `motion.div` escalonados | 1 ParticleContainer con 5 sprites + timeline |
| ChargeCastVfx | 5 smoke `motion.div` + radial gradient | 1 shader de glow + 5 sprites de humo en atlas |
| ExecutionActivationVfx | ChargeCastVfx + overlay | Mismos componentes reutilizados |
| TrapActivationVfx | 3-4 VFX layers simultáneas | 1 VfxAnimator compuesto con timeline |
| BuffImpactVfx | 4 `motion.div` (aura, rays, fire, text) | 1 shader de aura + 1 spritesheet de rays/fire + 1 texto PIXI |
| DigitalBeam | `motion.div` translateY 1200px | 1 sprite de beam con animación Y en timeline |
| DrawCardFlowVfx | framer-motion bezier path | 1 sprite con interpolación cúbica en timeline |
| CardFloatingQueueVfx | Queue de eventos DOM | Sistema de colas en PixiJS con `app.ticker` |
| CardXpGainVfx | Float-up text DOM | 1 PIXI.Text con animación Y + opacity |
| FusionCinematicLayer | `<video>` + DOM overlays | Video + PixiJS overlay para la carta de fusión |
| MasteryAura (15 flames) | 15 `motion.div` `repeat: Infinity` | 1 shader fragment con 15 pseudo-random flame offsets |
| Hologram float | 1 `motion.div` infinite loop | 1 sprite con animación Y ciclica en `app.ticker` |

**Ahorro estimado por efecto:**
- MasteryAura: 15 nodos DOM + 15 animaciones Framer Motion → 1 shader. **~100 DOM nodes eliminados en un duelo con 2 V5 cards.**
- Hologram: 3 nodos DOM + 1 animación infinita → 1 sprite. **~18 nodos DOM eliminados (6 entities × 3).**
- SummonHologram: 5 nodos DOM → 5 sprites en ParticleContainer. **Batch rendering en vez de compositing individual.**

#### 8.2. Performance profile adaptativo en combate

| Perfil | Hologramas | Mastery Aura | VFX completos | Beam FX | DPR |
|--------|-----------|-------------|---------------|---------|-----|
| High | Completos con shader | Shader de partículas GLSL | Completos | Completos | Min(dpr, 2) |
| Medium | Simplificados (sin float) | Spritesheet animada | Simplificados (sin smoke) | Simplificados | Min(dpr, 1.5) |
| Low | Desactivados | Badge de texto | Mínimos (solo flash) | Desactivados | 1 |

**Auto-detección:** Ejecutar micro-benchmark al montar el Board:
```typescript
const start = performance.now();
for (let i = 0; i < 1000; i++) { /* lightweight math */ }
const elapsed = performance.now() - start;
const profile = elapsed < 5 ? 'high' : elapsed < 15 ? 'medium' : 'low';
```

Complementar con `navigator.deviceMemory` y `navigator.hardwareConcurrency`.

#### 8.3. Combat log — Optimización final

| Modificación | Detalle |
|--------------|---------|
| Mantener `combatLog` inmutable para el GameEngine | No cambiar la interfaz del motor |
| Exponer `latestCombatEvents(turn: number): ICombatLogEvent[]` como método derivado cachéable | Componentes observan solo los eventos del turno actual |
| Reemplazar `buildBoardCombatFeedback` con selector Zustand memoizado | Recalcular solo cuando `combatLog.length` cambie |
| Añadir `combatEventCount` al estado para comparación barata en `shouldComponentUpdate` | Evitar deep comparison del array completo |

---

### FASE 9 — Hub/Story: Pulido y optimización final (1 semana)

#### 9.1. Story circuit map — Propiedad `will-change` y GPU hints

| Modificación | Detalle |
|--------------|---------|
| Añadir `will-change: transform` a StoryCircuitMap container | Hint GPU para compositing |
| Usar `framer-motion` `useMotionValue` + `useTransform` sin re-renders |Ya parcialmente implementado, verificar que no hay re-renders innecesarios |
| Throttle de zoom/pan gestures en móvil | `framer-motion` `tap` event con debounce |

#### 9.2. Hub 3D — Optimizaciones WebGL

| Modificación | Detalle |
|--------------|---------|
| Implementar `suspense` con `React.lazy` para HubSceneWorld3D | No bloquear la carga del Hub |
| Reducir `MeshReflectorMaterial` resolution en móvil de 1024 → 256 | Reflejo menos nítido pero +30% FPS |
| Añadir `dispose()` para texturas y geometrías en `useEffect` cleanup | Evitar memory leaks al navegar fuera del Hub |
| Implementar `frameloop="demand"` cuando no hay interacción | Solo renderizar frame cuando hay animación o interacción |

---

## 3. Métricas Objetivo

> Basado en los KPIs definidos en `docs/performance/PHASE-1-BASELINE.md`.

| Métrica | Baseline actual (estimado móvil) | Objetivo Fase 1-5 (DOM opt) | Objetivo Fase 7-8 (PixiJS) |
|---------|-----------------------------------|-------------------------------|----------------------------|
| INP (interacción) | > 500ms | < 200ms | < 100ms |
| LCP (landing) | > 3s | < 2.5s | < 2s |
| FPS combate (móvil low-end) | < 20 FPS | 25-30 FPS | 55-60 FPS |
| FPS combate (móvil mid) | 25-30 FPS | 40-45 FPS | 60 FPS |
| FPS hub (móvil low-end) | < 20 FPS | 30 FPS | 30+ FPS |
| DOM nodes en combate | ~800+ | ~400 (memo-opt) | ~150 (HUD + panels) |
| Animaciones infinitas por carta V5 | 16 | 16 (Fase 5), 0 (Fase 7) | 0 DOM (1 shader) |
| Peso terreno de batalla (JS bundle) | ~45 KB framer-motion | ~45 KB | ~90 KB (pixi + @pixi/react) |
| Bundle total estimado incremento | — | ~0 KB | ~90 KB (pixi v8 tree-shakeado ~50 KB gzip) |

---

## 4. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| PixiJS v8 + @pixi/react inestable con Next.js SSR | Media | Alto | Renderizar PixiJS solo en cliente (`useClient` + dynamic import sin SSR). Already existe patente con R3F. |
| Capture de texturas de cartas da resultados diferentes entre navegadores | Media | Medio | Usar canvas offscreen con dimensiones fijas y font rendering simplificado. Testear en Chrome, Firefox, Safari. |
| Migración incremental DOM → PixiJS causa z-index/layering bugs | Alta | Medio | Bridge de sincronización con `requestAnimationFrame` para posicionar overlays DOM correctamente sobre Canvas. Test visual en cada sprint. |
| PixiJS WebGL context loss en móvil | Baja | Alto | Implementar `renderer.on('contextlost', ...)` con re-creación automática del Canvas y re-carga de texturas desde caché. |
| Performance profile auto-detectado es incorrecto | Media | Bajo | Permitir override manual en Settings. Guardar preferencia en localStorage. |
| Bundle size incremento por PixiJS | Baja | Medio | Usar tree-shaking de PixiJS v8 (modular). Importar solo `@pixi/core`, `@pixi/sprite`, `@pixi/text`, `@pixi/graphics`, `@pixi/particle-container`. Estimado ~50 KB gzip. |
| Regression visual en migración DOM → PixiJS | Alta | Medio | Screenshot testing con Playwright (`toHaveScreenshot()`) en cada PR de migración. Comparar con baseline DOM. |

---

## 5. Herramientas y Protocolo de Medición

### Baseline reproducible

Antes de cada fase, ejecutar:

```bash
pnpm build && pnpm start
pnpm perf:baseline:mobile:auto:prod
pnpm perf:combat:e2e:real:auto:prod -- --email=... --password=...
```

Guardar resultados en `docs/performance/results/` con fecha.

### Métricas por capturar

| Métrica | Herramienta | Frecuencia |
|---------|------------|------------|
| LCP, INP, CLS | Lighthouse + Chrome DevTools Performance | Antes y después de cada fase |
| FPS combate | Chrome DevTools Rendering > FPS meter | Antes y después de cada fase |
| DOM node count | Chrome DevTools > Elements > Stats | Antes y después de cada fase |
| Re-render count | `window.__AIGIOH_PERF__?.renders` | Durante desarrollo |
| JS bundle size | `pnpm build` output + `@next/bundle-analyzer` | Antes y después de cada fase |
| Memory usage | Chrome DevTools > Memory > HEAP snapshot | Antes y después de Fase 7-8 |

### Tests de no-regresión visual

- Playwright screenshot testing en rutas clave: `/`, `/hub`, `/hub/arsenal`, `/hub/market`, `/hub/story`, combate
- Comparar con baseline antes de cada merge
- Añadir a CI/CD pipeline

---

## 6. Plan de Trabajo por Semanas

| Semana | Fase | Entregable | Tests requeridos |
|--------|------|-----------|-----------------|
| 1 | 1.1-1.4 | Assets WebP, CyberBackground optimizado, audio lazy, virtualGrid throttle | Baseline LCP/INP comparado |
| 2 | 2.1-2.3 | Market con CardThumbnail, performance mode, lazy reveal | INP market < 150ms |
| 3 | 3.1-3.3 | Arsenal con CardThumbnail, memoización, debounce | Render count Arsenal ≤2 por clic |
| 4 | 4.1-4.3 | Hub CyberBackground adaptativo, R3F LOD, HUD memo | FPS hub ≥30 en móvil |
| 5 | 5.1-5.2 | Story WebP assets, Zustand store, memoización | Story INP < 200ms |
| 6 | 6.1-6.4 | Combate: Zustand store, combat log cache, React.memo, perf profile | Reducción renders ≥30% |
| 7-8 | 7.1-7.3 | PixiJS Board isométrico, Slots, Card textures | FPS combate ≥40 en móvil |
| 9 | 7.4-7.6 | PixiJS Hologram, Mastery Aura, Hand | FPS combate ≥50 en móvil |
| 10 | 8.1-8.3 | PixiJS VFX, profile adaptativo, combat log final | FPS combate ≥55 en móvil |
| 11 | 9.1-9.2 | Hub/Story pulido, cleanup final | Todos los KPIs objetivo alcanzados |

**Total estimado: 11 semanas (2,5 meses)** con 1 desarrollador. Reducible a 6-7 semanas con 2 desarrolladores en paralelo (DOM optimization + PixiJS setup concurrentes).

---

## 7. Notas Finales

### Sobre la decisión tecnológica PixiJS vs Three.js/R3F

Se elige **PixiJS v8** para el combate porque:
1. El combate es 2D isométrico, no 3D real. PixiJS es el motor correcto para 2D acelerado por GPU.
2. Menor curva de aprendizaje que R3F para el equipo (ya lo usamos en el Hub).
3. Bundle size menor con tree-shaking (~50 KB gzip vs ~150 KB para R3F+Three).
4. `@pixi/react` mantiene el modelo declarativo de componentes React — migración más natural.
5. Performance de PixiJS v8 con particle containers y batch rendering es superior a DOM para este tipo de UI.

**Three.js/R3F ya está en uso para el Hub** (3D lobby). Esa decisión fue correcta porque el Hub necesita perspectiva 3D real, cámara orbital y reflejos. No se migra el Hub a PixiJS.

### Sobre el orden de las fases

Market y Arsenal se optimizan primero porque:
1. Son las pantallas con más nodos DOM simultáneos (colección de cartas + deck).
2. Las optimizaciones son puramente DOM (CardThumbnail, memoización, debounce) — bajo riesgo.
3. CardThumbnail es un prerrequisito para el combate PixiJS (se reutiliza como fallback).
4. Dan métricas rápidas de mejora para validar la dirección.

El combate va al final porque:
1. Es la reescritura más grande y arriesgada.
2. Las optimizaciones de estado (Fase 6) son prerrequisito para que PixiJS funcione bien (zona de estado estable, sin re-renders salvajes).
3. La experiencia ganada en las fases 2-5 informa las decisiones de diseño de PixiJS.

### Sobre la coexistencia DOM + PixiJS

Es aceptable durante la migración (Fase 7, sprints 7.1-7.7) tener ambas capas. La capa DOM se reduce sprint a sprint hasta que solo quedan los HUD, panels y overlays (información textual, no gráfica). El resultado final es:

- **Canvas (PixiJS):** Tablero, slots, cartas, hologramas, auras, VFX, mano
- **DOM:** HUD (HP, energía), panels de información, combat log, overlays de fase/turno, diálogos

Esta separación es estándar en juegos web profesionales (ej. Riot Games, KingsIsle).