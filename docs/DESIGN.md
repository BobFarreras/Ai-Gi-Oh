<!-- docs/DESIGN.md - Sistema de diseño de AI-GI-OH: tokens, componentes, animaciones, responsive y guardrails de rendimiento. Fuente única para mantener la UI coherente y "espectacular". -->
# Sistema de Diseño — AI-GI-OH

Lenguaje visual **HUD táctico / cyberpunk**: superficies oscuras, acento cian neón, bordes con esquinas cortadas (clip-path), tipografía mono en mayúsculas y glows controlados. Este documento es la fuente de verdad; antes de crear una pantalla nueva, replica estos patrones en vez de inventar.

> Referencia viva: el bloque de progresión (`src/components/hub/progression/*`), el HUD del hub (`HubSceneHudOverlay`, `HubResetCameraButton`) y los overlays cinemáticos (`HomeEvolutionOverlay`) son los ejemplos canónicos.

---

## 1. Principios

1. **Coherencia HUD**: todo elemento flotante/overlay comparte el mismo lenguaje (borde cian, fondo navy translúcido, clip-path, mono uppercase).
2. **Rendimiento primero**: anima solo `transform` y `opacity`. Nunca animes `box-shadow`, `filter`/`blur` o `width/height` en bucle (ver §6).
3. **Adaptable a cada dispositivo**: respeta `safe-area-insets`, degrada animaciones en dispositivos limitados y con `prefers-reduced-motion` (ver §7).
4. **Legibilidad**: texto mínimo 11px; en diálogos cuerpo ≥14px (`text-sm`), títulos ≥18px (`text-lg`). Contraste alto (slate-50/200/300 sobre navy).
5. **Espectacular con criterio**: el "wow" sale del layout, el glow estático, la carta real y la entrada animada — no de saturar de bucles.

---

## 2. Tokens visuales

### 2.1 Superficies (fondos)
| Uso | Valor |
|-----|-------|
| Panel/botón HUD | `bg-[#03101c]/90` · variante `#030914`, `#040d18` |
| Diálogo (marco) | `bg-[#040d18]/96` o degradado `from-[#08141f] to-[#03090f]` |
| Celda interna / track | `bg-black/30`–`/60`, `bg-slate-800/40` |
| Backdrop modal | `bg-black/80 backdrop-blur-md` |

### 2.2 Acentos
| Color | Uso |
|-------|-----|
| **Cian** `cyan-400 #22d3ee` / `cyan-500` | acento primario, bordes (`border-cyan-500/40-50`), focus, progreso |
| **Fucsia** `fuchsia-400/500/600` | eventos y su moneda/tienda |
| **Ámbar** `amber-400` | Nexus, racha, "reclamable", hitos |
| **Esmeralda** `emerald-400/500` | éxito / reclamado / activo |
| **Rosa** `rose-300` | errores |
| **Borde tenue** | `border-cyan-900/50` (reposo), `border-cyan-300/90` (hover) |

### 2.3 Esquinas cortadas (clip-path) — la firma visual
```css
/* Botón / chip / item (notch arriba-izq + abajo-der) */
clip-path: polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
/* Variante pequeña (badges, botones bajos): usar 6px o 4px */
/* Diálogo grande (notch 14px) */
clip-path: polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%);
/* Rombo (indicadores) */
clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%);
```
Regla: el tamaño del notch escala con el del elemento (4px badge → 10px botón → 14px diálogo).

### 2.4 Scanlines (textura HUD)
```css
background-image: repeating-linear-gradient(0deg,rgba(34,211,238,0.05) 0,rgba(34,211,238,0.05) 1px,transparent 1px,transparent 3px);
```
Estática (cero coste). Úsala en superficies táctiles destacadas (botones del dock).

### 2.5 Tipografía
- **Etiquetas HUD**: `font-mono font-black uppercase tracking-[0.14em–0.2em]`. Tamaños `text-[10px]` (micro), `text-xs`/`text-sm` (estándar).
- **Cuerpo de diálogo**: `text-sm`/`text-base`, `text-slate-300`.
- **Títulos**: `text-lg`/`text-xl font-black uppercase tracking-[0.16em]`.
- Nunca por debajo de 11px (`text-[11px]`). Números/datos en `font-mono`.

### 2.6 Glows (siempre estáticos en reposo)
```css
/* halo de botón en hover */ box-shadow: 0 0 18px rgba(34,211,238,0.45);
/* glow de carta destacada */ drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]
/* glow por rareza (evolución) */ shadow-[0_0_70px_rgba(168,85,247,0.72)] /* V3 púrpura, V4 fucsia, V5 ámbar */
```
Para "pulsar" un glow, anima `opacity`/`scale` del elemento que lo lleva (no el `box-shadow`).

---

## 3. Componentes y primitivos

### 3.1 Botón táctico (HUD)
Borde cian + `bg-[#03101c]/90` + clip-path + mono uppercase + barra de acento lateral + glow en hover. Referencia: `HubResetCameraButton`, `ProgressionDock > DockButton`.
```
border border-cyan-500/45 bg-[#03101c]/90 text-cyan-100
hover:border-cyan-300/90 hover:bg-[#04192b]/95 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]
+ clipPath + scanlines + <span accent inset-y-1.5 left-0 w-[3px] bg-cyan-500/70>
```
En desktop muestra icono + label; en móvil solo icono (`hidden sm:inline` en el label).

### 3.2 Badge / contador
Vive **fuera** del elemento con clip-path (si no, se recorta). Diseño angular con notch 4px + halo de pulso por `transform/opacity`. Tonos: ámbar (reclamable), cian (info/contador). Ver `ProgressionDock > CountBadge`.

### 3.3 Diálogo (shell estándar)
`ProgressionDialogShell`: marco con clip-path 14px, barra de acento superior, cabecera (icono en caja + título mono + cerrar), cuerpo con scroll del juego. Se **despliega desde su origen** (ver §5.3). Úsalo para paneles de listas/forms (misiones, novedades, evento).

### 3.4 Overlay cinemático (hero)
Para momentos "wow" (recompensa diaria, evolución, revelado de sobre): backdrop con blur, halo de glow radial, la **carta real** escalada con glow, chips tácticos y entrada con spring. Ver `HomeEvolutionOverlay`, `DailyLoginModal`.

### 3.5 Inputs de admin
Estilo del juego: `border border-cyan-900/60 bg-[#03101c] text-slate-100 focus:border-cyan-400`. Toggles como botón con punto de estado. Selector de carta con preview (`CardThumbnail`). Ver `components/admin/internal/live-ops/live-ops-controls.tsx`.

### 3.6 Scrollbars (clases globales en `globals.css`)
| Clase | Uso |
|-------|-----|
| `home-modern-scroll` / `custom-scrollbar` | scroll cian de 6–8px para paneles y diálogos |
| `card-description-scroll` | scroll fino (4px) para textos dentro de cartas |
Aplica `home-modern-scroll` a cualquier contenedor con `overflow-y-auto`.

---

## 4. Cartas: `Card` vs `CardThumbnail`

| | `Card` (`game/card/Card.tsx`) | `CardThumbnail` (`game/card/CardThumbnail.tsx`) |
|--|--|--|
| Tamaño | Fijo **260×380** | Llena su caja (impón `aspect-[13/19]`) |
| Coste | Alto (frame completo, holograma si `boardMode`) | Bajo (~15 nodos, 0 animaciones) |
| Cuándo | **Hero / showcase**: pocas cartas, protagonismo (recompensa diaria, tienda de evento, evolución) | **Grids/listas**: muchas cartas, previews, selectores admin |

Reglas al usar `Card` fuera del tablero:
- Pásale `disableHologram disableHoverEffects disableDefaultShadow` (el holograma es lo caro y solo aplica en tablero).
- Para encajarlo, **escálalo con un wrapper** (no estira): contenedor de tamaño fijo + `transform: scale(k)` con `transform-origin: top left`. Ej. tienda de evento: `scale(0.527)` → 137×200; hero diario: `scale(0.692)` → 180×263.
- Ambos componentes están **memoizados**; no rompas la memoización pasando props nuevas en cada render.

---

## 5. Animaciones y transiciones (framer-motion)

### 5.1 Timings canónicos (`hub-entry-timings.ts`)
```ts
HUB_HUD_START_DELAY_MS = 120;     // gate antes de mostrar el HUD
HUB_HUD_ANIMATION_DURATION = 0.8; // entrada de elementos del HUD
HUB_NODE_STAGGER_DELAY = 0.12;    // stagger entre nodos
// Easing de entrada del HUD:
ease: [0.16, 1, 0.3, 1]
```

### 5.2 Entrada tipo HUD (carga de página)
Gate con `useState(false)` + `setTimeout(HUB_HUD_START_DELAY_MS)`, luego `motion.div` que entra por su borde:
```tsx
initial={{ x: "-120vw" }} animate={{ x: 0 }}
transition={{ duration: HUB_HUD_ANIMATION_DURATION, ease: [0.16,1,0.3,1] }}
style={{ willChange: "transform" }}
```
El dock de progresión entra desde la izquierda; el HUD de usuario desde la derecha; el progreso desde arriba. Mantén esa coreografía.

### 5.3 "Desplegar desde origen" (abrir diálogo)
El diálogo nace del control que lo abrió: `scale`+`opacity` con `transform-origin` hacia ese punto, dentro de `<AnimatePresence>` (para animar también la salida):
```tsx
initial={{ opacity:0, scale:0.82, y:28 }} animate={{ opacity:1, scale:1, y:0 }}
exit={{ opacity:0, scale:0.9, y:14 }}
transition={{ type:"spring", stiffness:280, damping:26 }}
style={{ transformOrigin:"left bottom" }}
```

### 5.4 Glow / pulso vivo
`opacity`/`scale` en bucle sobre un elemento (el blur del glow es estático):
```tsx
animate={{ opacity:[0.5,0.85,0.5], scale:[0.9,1.05,0.9] }}
transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
```
Para efectos intensos (partículas, rayos), usa `repeat: 1` (one-shot), no infinito.

### 5.5 Hover / tap
`whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.94 }}` + cambio de borde/glow por clases CSS (no animes el box-shadow).

---

## 6. Guardrails de rendimiento (OBLIGATORIO)

Ver `docs/performance/` y `docs/engram/decision/rendering-engine.md`.

- ✅ **Anima**: `transform` (translate/scale/rotate) y `opacity`. Añade `style={{ willChange: "transform" }}` en lo que se anima de forma continua.
- ❌ **No animes en bucle**: `box-shadow`, `filter`/`blur`, `width/height`, `top/left`, `background`. (Estáticos sí: un `blur-2xl` o `box-shadow` fijo es barato.)
- 🎞️ Efectos pesados (halos grandes, partículas): `repeat: 1`, y degrada o elimínalos en dispositivos limitados / reduced-motion.
- 🧠 Memoiza componentes de lista (cartas) y no recrees props en cada render.
- La clase global `reduced-combat-effects` corta animaciones/transiciones a ~0ms cuando el usuario fuerza modo reducido.

---

## 7. Responsive y adaptable

### 7.1 Dos niveles de decisión
1. **Tailwind `sm:`** (640px) para ajustes rápidos de un componente (mostrar label, columnas, padding). Ej.: dock con icono-only en móvil → `sm:px-3.5` + label `hidden sm:inline`.
2. **Breakpoint de layout** `DESKTOP_LAYOUT_MIN_WIDTH_PX = 900` (`layout-breakpoints.ts`) para decisiones estructurales (móvil vs desktop) vía `useViewportWidth()` + `isMobileLayoutViewport()`. Úsalo cuando cambia la disposición, no solo estilos.

### 7.2 Safe-area (notch / barras del sistema)
Ancla siempre los elementos flotantes con `env(safe-area-inset-*)`:
```
bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-[max(0.5rem,env(safe-area-inset-left))] sm:bottom-6 sm:left-6
```

### 7.3 Capacidad de dispositivo (`useHubDeviceCapability`)
Devuelve `{ prefersReducedMotion, isConstrainedDevice }` (CPU ≤4 / RAM ≤4 GB, o toggle FX global). Patrón:
```ts
const shouldUseLiteAnimation = prefersReducedMotion || isConstrainedDevice || isCompactViewport;
```
En modo lite: menos partículas, glows sin bucle, escalas de carta menores. Ver `HomeEvolutionOverlay`.

### 7.4 Escalado de carta por viewport
`Card` es de tamaño fijo: en móvil redúcelo (`scale-[0.56]`), en desktop normal. Usa un contenedor de tamaño fijo + `transform: scale()` para que el layout reserve el alto correcto.

### 7.5 Diálogos
`w-full max-w-md/lg` + `max-h-[88-92dvh] overflow-y-auto` con `home-modern-scroll`. Padding interno `p-4/5`. Cierre arriba-derecha y backdrop clicable para cerrar.

---

## 8. Posicionamiento del HUD (no chocar)

Esquinas ocupadas en `/hub`:
- **Arriba-centro**: progreso del jugador.
- **Abajo-izquierda** (móvil) / **abajo-derecha** (desktop): banner de Operador.
- **Abajo-derecha**: acciones (recentrar / labels / logout).
- **Abajo-izquierda**: dock de progresión (sobre el Operador en móvil con offset de safe-area).

Antes de añadir algo flotante, comprueba estas zonas. Los elementos del dock se ocultan fuera de `/hub` (igual que el HUD).

---

## 9. Checklist para una pantalla/feature nueva

- [ ] Superficie navy + acento cian; estados con fucsia/ámbar/esmeralda/rosa según semántica.
- [ ] Esquinas con clip-path (notch proporcional) y, si destaca, scanlines.
- [ ] Tipografía mono uppercase en etiquetas; cuerpo ≥14px y buen contraste.
- [ ] Entrada animada (HUD: slide+gate; diálogo: desplegar desde origen con `AnimatePresence`).
- [ ] Solo `transform`/`opacity` en animaciones; glows/blur estáticos; `willChange` donde toque.
- [ ] `safe-area-inset` en flotantes; `sm:` para ajustes y breakpoint 900 para layout.
- [ ] Degradación en `prefersReducedMotion`/`isConstrainedDevice`.
- [ ] `Card` real para hero/showcase (escalado, sin holograma); `CardThumbnail` para grids.
- [ ] Scroll con `home-modern-scroll`.
- [ ] No solapar las zonas del HUD; ocultar fuera de su contexto.
