<!-- skills/performance-rendering-guardrails/SKILL.md - Reglas de rendimiento de render y UI para no degradar la fluidez en gama baja al desarrollar features. -->
---
name: performance-rendering-guardrails
description: Úsala al crear o tocar UI, animaciones, listas/grids de cartas, estado de combate, escenas 3D o nuevas features (p. ej. multijugador) para no degradar el rendimiento en móviles y equipos lentos.
---

# Guardarraíles de rendimiento de render y UI

## Cuándo usar esta skill
Aplicar siempre que un cambio:
- Añada o modifique **animaciones** (Framer Motion, CSS), **blur**, sombras o efectos visuales.
- Renderice **muchos elementos** (grids de cartas, slots de tablero, listas, mapas de nodos).
- Toque el **estado del combate** o cualquier estado que se propague a un árbol grande.
- Use **detección de dispositivo/viewport** en cliente, `next/image`, o escenas **3D (R3F/Three.js)**.
- Introduzca una **feature nueva** (multijugador, nuevos modos): partir de estas prácticas desde el diseño, no optimizar después.

## Principio rector
> El diseño y las animaciones **no cambian**. Solo cambia **cómo** se renderiza y se gestiona el estado. Un cambio de rendimiento que altera el aspecto en gama alta es un bug, no una optimización.

## Diagnóstico: dónde está el coste real
El cuello casi nunca son los assets (ya están en WebP/AAC). El coste real es el **render**:
1. **Animaciones infinitas de Framer Motion** (`repeat: Infinity`) y **`filter: blur` grandes** → queman CPU/GPU por frame.
2. **Estado monolítico** que re-renderiza todo el árbol en cada acción.
3. **Props globales** que cambian para todos los hijos a la vez (anulan la memoización).

## Reglas obligatorias

### 1. Listas y grids: miniatura estática, nunca `<Card>` completa escalada
- En grids/mosaicos/logs usa `CardThumbnail` (estático, ~15 nodos, 0 animaciones). La `<Card>` completa solo en inspector de detalle, overlays y el tablero de combate.
- La miniatura **impone su propia proporción** (`aspect-[13/19]`) y **llena su celda**; la imagen es la que se adapta (`object-contain`/`object-cover`). El contenedor fija el ancho; el texto nunca debe poder estirar la carta (`min-w-0` + nombre en bloque con `truncate`).

### 2. Memoización: `memo` + comparador por contenido (patrón del codebase)
- Patrón establecido: `export const X = memo(XComponent, areEqualXProps)` con comparador **puro y testeado** (ver `hand-props-equality.ts`, `hud-props-equality.ts`, `board-interactive-equality.ts`).
- Compara **objetos por sus campos relevantes**, no por referencia (el motor crea objetos nuevos cada acción). Ej.: el HUD compara `player` por LP/energía/nombre, no `player === player`.
- Los **callbacks que reciben los componentes memoizados deben ser estables** (`useCallback`), o el memo no sirve.
- No fuerces selectores de Zustand en un árbol con prop-drilling existente: el patrón `memo + comparador` es más simple y de menor riesgo aquí. El store Zustand local (`board-state-store.ts`) es el cimiento para suscripciones futuras.

### 3. Props por ítem/slot, nunca globales que cambian para todos
- Si un valor global (p. ej. `activeAttackerId`, datos de buff/xp, id seleccionado) cambia en cada acción y se pasa a N hijos memoizados, **anula la memoización de todos**.
- Pre-calcula en el padre el booleano/valor **que concierne a cada hijo** (`isAttacking` por slot, buff/xp gateados a la entidad afectada). Así una acción re-renderiza solo el ítem afectado.

### 4. Modo rendimiento: DESMONTAR efectos, no suprimirlos con CSS
- Las animaciones de Framer Motion solo dejan de costar si el componente **no se monta**. CSS (`.reduced-combat-effects`) **no detiene** Framer Motion.
- Usa `useBoardPerformanceProfile()` (`shouldReduceCombatEffects`) para **desmontar** auras/hologramas caros y degradar a versión "lite". Respeta el toggle global FX (`combat-effects-profile` en localStorage, servicio `combat-effects-override.ts`).
- Información funcional barata (stats ATK/DEF/energía como texto estático) se **mantiene** incluso en modo rendimiento; solo se quita lo caro (flotado infinito, blur).

### 5. Animaciones caras: prohibido lo que repinta a pantalla completa
- **No animar** `box-shadow` con spread enorme (`0 0 0 9999px`): repinta toda la pantalla cada frame. Mantén el backdrop **estático** y anima solo un glow pequeño.
- **No matar `filter: blur` globalmente por CSS** (deja glows con borde duro). Sustituye blurs decorativos por **gradientes radiales** equivalentes (mismo aspecto, sin coste de filtro).
- Para movimiento usa `transform` (`x`/`scale`) → se compone en GPU, no repinta. Evita animar `width`/`top`/`box-shadow`/`filter` en bucle.

### 6. Detección en cliente: valor SSR-seguro + `useEffect` (evita hydration mismatch)
- Cualquier hook que lea `window`/`navigator`/`localStorage`/`matchMedia` (perfil de dispositivo, viewport, override FX) **debe inicializar `useState` con un valor SSR-seguro estable** (el mismo que renderiza el servidor) y calcular el real **dentro de `useEffect`** tras montar.
- Inicializar con `useState(() => detectClientValue())` provoca `Hydration failed` cuando el valor real difiere del SSR y afecta al DOM (clases condicionales, ramas de render).

### 7. `next/image`
- El `quality` usado **debe estar en `images.qualities`** de `next.config.ts`, o Next avisa en cada request. Reutiliza valores ya configurados.
- WebP/GIF **animados** → añade `unoptimized` (Next no puede optimizarlos; sin esto avisa y malgasta el optimizador).

### 8. 3D pesado (R3F/Three.js)
- Carga el mundo 3D con `next/dynamic` (`ssr: false`) + placeholder ligero, para que el shell aparezca al instante y el chunk pesado entre después.
- Perfil de render **adaptativo**: en móvil/constrained/FX:Mín desactiva lo más caro (reflejo en tiempo real → material plano), reduce DPR y resolución. Engánchalo al toggle FX.

## Medición (obligatoria para validar)
- **Mide SIEMPRE en producción**: `pnpm build && pnpm start`. En `pnpm dev` el LCP/INP están inflados por la compilación on-demand (no son reales). `pnpm start` requiere `pnpm build` previo.
- Simula gama baja con **CPU 4x slowdown** en DevTools. Objetivo: fluido con 4x throttle.
- Herramientas: LCP/INP/CLS de DevTools, `countRender` / `window.__AIGIOH_PERF__` para re-renders, baselines `pnpm perf:baseline:mobile:auto:prod`.
- Hoja de ruta y estado: `docs/performance/PERFORMANCE-MASTERPLAN.md`. PixiJS (capa de render del combate) es el último recurso: solo si tras optimizar estado/DOM la gama baja aún no llega.

## Para features nuevas (p. ej. multijugador)
- Diseña los componentes ya **memoizados con comparador por contenido** y con **props por ítem**.
- Evita estado monolítico que se propague a árboles grandes; usa store local + suscripciones granulares o memoización.
- Toda animación nueva: ¿se puede desmontar en modo rendimiento? ¿usa transform en vez de blur/box-shadow? ¿hay versión "lite"?

## Gates antes de cerrar
`pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` en verde. Comparadores de igualdad y perfiles → **tests unitarios puros**. Verificación visual de que el diseño y las animaciones quedan idénticos en gama alta.
