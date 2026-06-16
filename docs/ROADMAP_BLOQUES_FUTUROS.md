<!-- docs/ROADMAP_BLOQUES_FUTUROS.md - Guía de los próximos bloques de trabajo (rendimiento, fixes de producción, multijugador y onboarding). -->
# Roadmap de bloques futuros

Documento vivo con los próximos bloques a implementar. Cada bloque es independiente y debe entrar
por el flujo habitual (rama `features/<tema>` → gates en verde → `main`/`develop` sincronizados).

## Principios que aplican a TODOS los bloques

1. **El diseño y las animaciones no se tocan.** Cualquier mejora de rendimiento debe ser
   *visual-neutral* (idéntica píxel a píxel) salvo que el usuario apruebe explícitamente un cambio.
   > Aprendizaje (2026-06): se descartó servir un hub 2D o quitar luces en gama baja porque cambiaba
   > el aspecto. El objetivo es **mismo 3D y mismas animaciones en todos los dispositivos**, solo más fluido.
2. **Gates obligatorios antes de PR:** `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`.
3. **Tests co-localizados** junto al código que cambian.
4. **Sin warnings nuevos** en consola ni en build.

---

## Bloque 0 — Rendimiento del Hub 3D (sin tocar diseño ni animaciones)

**Estado:** completado · **Prioridad:** alta · **Rama:** `features/hub-3d-performance` · **Commit:** `feat(hub): Bloque 0 — rendimiento 3D sin cambiar diseño`

### Problema medido
- Stutter ("trompicones") y congelación en móviles/equipos viejos.
- `Largest Contentful Paint` ~12.6 s con 5x CPU slowdown.
- Pantalla negra larga al volver al hub.

### Diagnóstico (confirmado en código)
- El **elemento LCP es la etiqueta de un nodo** (`h2` en `HubNodeActionPanel`), renderizada con
  `<Html transform>` de drei **dentro del Canvas 3D** (`HubSceneNode3D.tsx`). Por tanto el LCP no
  pinta hasta que se ha descargado + parseado todo Three.js/R3F/drei, creado el contexto WebGL y
  montado los 5 paneles HTML en el espacio 3D. Bajo throttle de **CPU** (no GPU) eso domina el tiempo.
- `<Html transform>` × 5 nodos reescribe la matriz de transformación de 5 subárboles DOM **en cada
  frame** → layout thrashing en el hilo principal. Es el mayor coste de CPU del hub.
- Hay ~15 luces dinámicas (coste de **GPU**, relevante en móviles reales aunque no en el test de CPU).
- `supportsWebGL()` devuelve `false` en SSR → hoy el hub renderiza el fallback 2D en servidor y salta
  a 3D al hidratar (**hydration mismatch** latente que conviene cerrar de forma limpia).

### Enfoque propuesto (todo visual-neutral)
1. **Reducir el coste por frame de los paneles `<Html transform>`** sin cambiar su aspecto:
   investigar limitar el ritmo de actualización de la transformación, o montar/posicionar el panel
   solo cuando la cámara se mueve o el nodo está activo/hover, manteniendo el mismo render visual.
2. **Memoizar geometrías y materiales** de los cores para no recrearlos en re-render.
3. **Reducir teselado imperceptible** (p.ej. `circleGeometry`/`ringGeometry`/`torusGeometry` con
   segmentos que no se distinguen a esa escala) — validando que el resultado es idéntico.
4. **Reusar vectores temporales** en `useFrame` (evitar `.clone()` por frame → menos GC). Ej:
   `HubNodeDecorMultiplayer.tsx`.
5. **Cerrar el hydration mismatch** con un gate de hidratación que mantenga el 3D para todos (no 2D).
6. **Acortar la pantalla negra:** `app/hub/loading.tsx` (skeleton instantáneo durante el fetch del
   servidor) y/o precargar el chunk 3D. No cambia ningún render final.

### Criterios de aceptación
- 3D y animaciones **idénticos** en todos los dispositivos.
- Mejora medible de INP/LCP y menos stutter con CPU throttle.
- Sin hydration warnings. Gates en verde.

### Notas de implementación
- Se cerró el hydration mismatch con un gate de hidratación (`useSyncExternalStore`) que mantiene 3D para todos.
- Se añadió precarga del soundtrack de narración (`preload=auto`) y se optimizó el arranque del hub.

### Riesgos
- Tocar el render de `<Html>` puede alterar sutilmente la posición/escala del panel: validar con
  capturas antes/después.

---

## Bloque 1 — Botón FX solo en desarrollo

**Estado:** completado · **Prioridad:** alta · **Esfuerzo:** trivial · **Commit:** `feat(quality): Bloques 1 y 3 - FX solo en dev y auditoria de assets`

### Contexto
El botón flotante **FX: Auto/Mín/Máx** (`PerformanceProfileToggle`) se monta en el layout raíz y se
ve también en **producción**. Debe ser una herramienta solo de desarrollo.

- Componente: `src/components/internal/PerformanceProfileToggle.tsx`
- Montaje: `src/app/layout.tsx:47`

### Enfoque
Renderizarlo solo fuera de producción, p.ej. `{process.env.NODE_ENV !== "production" && <PerformanceProfileToggle />}`
en `layout.tsx`. (`process.env.NODE_ENV` se evalúa en build → en prod el botón ni se incluye.)

### Criterios de aceptación
- En `pnpm build` + producción: el botón no aparece.
- En `pnpm dev`: el botón sigue disponible.
- Test que cubra el gating (o documentar por qué no aplica en jsdom).

### Notas de implementación
- Se extrajo `shouldRenderPerformanceToggle(environment)` como función pura testeable en jsdom.
- `src/app/layout.tsx` aplica el gating y no monta `PerformanceProfileToggle` en producción.

### A decidir
- ¿El modo "Mín/Máx" (override de efectos) debe seguir disponible para usuarios reales por algún otro
  medio, o es puramente interno? Si es interno, ocultar el botón es suficiente.

---

## Bloque 2 — La música de narración (landing) no suena

**Estado:** completado · **Prioridad:** alta · **Esfuerzo:** bajo (es un asset, no código) · **Commit:** `feat(quality): Bloques 1 y 3 - FX solo en dev y auditoria de assets`

### Causa raíz (confirmada)
`public/audio/landing/soundtrack.m4a` pesa **0 bytes** — la conversión a `.m4a` falló solo para ese
archivo (los demás `.m4a` de la carpeta tienen contenido). La ruta en código es correcta:
`src/components/landing/useLandingAudio.ts` → `narrationTrack: "/audio/landing/soundtrack.m4a"`.

> El audio de narración lo gestiona `useLandingAudio` (no `CrawlText.tsx`, que solo es el texto/crawl).
> El crawl dispara la pista; al estar el archivo vacío, no suena nada.

### Enfoque
1. Regenerar/convertir el soundtrack a un `.m4a` válido (con contenido) y reemplazar el de 0 bytes.
2. Verificar reproducción en landing (respetando políticas de autoplay del navegador: requiere gesto
   de usuario; comprobar que el flujo actual ya lo cumple).
3. Añadir una verificación de assets para detectar archivos de 0 bytes (ver Bloque 3).

### Criterios de aceptación
- La narración suena al entrar en el crawl, en local y en producción.

### Notas de implementación
- Se reemplazó `public/audio/landing/soundtrack.m4a` (0 bytes) por un archivo válido.
- Se añadió soporte de `preload` opcional en `getAudio`/`audio-pool` para precargar la pista de narración con `preload=auto`.

---

## Bloque 3 — Imágenes que no se ven en producción (formato/ruta)

**Estado:** completado · **Prioridad:** alta · **Esfuerzo:** bajo-medio · **Commit:** `feat(quality): Bloques 1 y 3 - FX solo en dev y auditoria de assets`

### Causa raíz (confirmada)
Tras convertir los assets a `.webp`, el catálogo de narración sigue referenciando `.png`:
`src/services/story/story-opponent-narration-catalog.ts` (líneas ~52–108) usa
`intro-GenNvim.png`, `victoria-BigLog.png`, etc., pero en `public/assets/story/opponents/...` esos
retratos **solo existen como `.webp`** (`intro-GenNvim.webp`, …). Resultado: imagen rota (404).

> Por qué puede "funcionar en local y fallar en prod": Vercel corre en Linux (**case-sensitive**),
> mientras Windows es **case-insensitive**. Una referencia con mayúsculas/minúsculas o extensión que
> no coincide exactamente con el archivo real falla solo en producción.

### Enfoque
1. Actualizar las extensiones del catálogo de narración de `.png` → `.webp` (5 oponentes × 3 retratos).
2. **Auditoría general:** script que recorra referencias a imágenes en `src/**` y verifique que el
   archivo existe en `public/` con **ruta y mayúsculas/minúsculas exactas**. Falla el check si no.
3. Integrar esa verificación (assets + archivos de 0 bytes del Bloque 2) en CI o en `quality:check`.

### Criterios de aceptación
- Todos los retratos de oponentes se ven en producción.
- El check de assets pasa y previene futuras roturas por formato/case.

### Notas de implementación
- Se actualizaron las extensiones `.png` → `.webp` en `src/services/story/story-opponent-narration-catalog.ts`.
- Se creó `scripts/quality/check-assets.mjs` para auditar referencias en `src/` contra `public/` (existencia, tamaño > 0, case-sensitive).
- Se integró el check en `quality:check` vía `quality:check:assets`. Se corrigieron referencias rotas adicionales encontradas (templates admin, fallbacks de audio, typo de `movimiento.m4a`, `Chromed Horizon.m4a`).

---

## Bloque 4 — Multijugador profesional

**Estado:** pospuesto · **Prioridad:** media-alta · **Esfuerzo:** alto

### Objetivo
Partidas 1v1 entre jugadores reales, **mismo diseño** del tablero actual, con el mejor flujo,
rendimiento y robustez (anti-trampas, reconexión).

### Activos a favor
- El motor de combate es **determinista y puro** (`src/core/...`), ideal para una autoridad que valide
  jugadas aplicando el mismo motor en ambos lados.
- `combatLog` ya es la **fuente canónica** del historial/estado → encaja perfecto como stream de
  sincronización entre jugadores (cada acción produce eventos reproducibles).
- Ya hay infraestructura de Supabase y de rate-limiting/hardening.

### Decisiones de arquitectura (a evaluar)
1. **Transporte realtime:** Supabase Realtime (channels + presence) vs servicio dedicado. Empezar por
   Supabase encaja con el stack y es turn-based (tolerante a latencia).
2. **Autoridad del estado (anti-trampas):** el cliente **no** debe ser de confianza para RNG ni para
   validar jugadas. Opciones: Edge Function como árbitro que aplica el motor y emite el `combatLog`,
   o modelo host-validado. **El RNG (sorteo de moneda, robos) lo siembra el servidor.**
3. **Modelo de sincronización:** ambos clientes envían *intenciones*; la autoridad valida, aplica con
   el motor y difunde los eventos resultantes. UI optimista solo donde sea seguro.

### Fases sugeridas
- **F4.1 – Partida privada por código:** crear/unirse a sala con código, 1v1 con amigos. Mínimo viable.
- **F4.2 – Reconexión y estado persistente:** rejoin tras caída, timeout de turno.
- **F4.3 – Matchmaking público.**
- **F4.4 – Ranked/ELO y, opcionalmente, espectador.**

### Criterios de aceptación (F4.1)
- Dos jugadores juegan una partida completa con el tablero y diseño actuales.
- Estado consistente entre ambos (sin divergencias), validado por la autoridad.
- Sin acciones ilegales aceptadas; reconexión básica.

### Preguntas abiertas para el dueño
- ¿Alcance del MVP: solo amigos por código, o matchmaking desde el inicio?
- ¿Ranked/ELO entra en el roadmap inicial o más adelante?

---

## Bloque 5 — Nueva transición/onboarding para nuevos jugadores + tutorial

**Estado:** exploración · **Prioridad:** media · **Esfuerzo:** medio-alto

### Objetivo
Probar un **diseño y flujo nuevos** para la primera experiencia (jugador nuevo) y el tutorial.

### Enfoque
1. Definir qué falla o se quiere mejorar del flujo actual (fricción, abandono, claridad).
2. Prototipar el nuevo flujo **aislado y detrás de un flag**, sin romper el actual.
3. Reutilizar el motor y el combate de tutorial existentes (no reescribir lógica de juego).
4. Medir: tasa de finalización del tutorial y abandono por paso, antes/después.

### Preguntas abiertas para el dueño
- ¿Qué problema concreto del onboarding actual quieres resolver?
- ¿Dirección de diseño deseada (más guiado, más cinemático, más corto…)?

---

## Bloque 6 — Botón "Salir al hub" inoperativo en Story (móvil)

**Estado:** completado · **Prioridad:** alta · **Esfuerzo:** bajo

### Problema
En el mapa Story, en flujo móvil (`isMobileVerticalFlow`), el botón con flecha hacia atrás
(`aria-label="Salir al hub"` en `StoryMapZoomControls`) no navega al hub. El callback
`onExitToHub` no se propagaba desde `StoryScene` hasta `StoryMapZoomControls` porque
`StorySceneMapPane` no lo pasaba a `StoryCircuitMap`.

### Archivos a revisar
- `src/components/hub/story/internal/map/components/StoryMapZoomControls.tsx`
- `src/components/hub/story/StoryScene.tsx` (donde se define `exitToHub`)
- `src/components/hub/story/internal/scene/view/StorySceneMapPane.tsx`

### Criterios de aceptación
- Tocar el botón de salida en Story móvil redirige a `/hub`.
- El test existente `StoryMapZoomControls.test.tsx` pasa y, si es necesario, se amplía para cubrir la acción real de navegación.

### Notas de implementación
- Se añadió `onExitToHub={props.onExitToHub}` en `StorySceneMapPane` para propagar el callback a `StoryCircuitMap` y `StoryMapZoomControls`.
- Se amplió `StoryScene.test.tsx` con un test que simula modo móvil y verifica que `router.push("/hub")` se dispara al pulsar "Salir al hub".

---

## Bloque 7 — Imágenes de duelo Story rotas en producción (formato `.webp` inexistente)

**Estado:** completado · **Prioridad:** alta · **Esfuerzo:** bajo

### Problema
Varios assets referenciados en el flujo Story duelo/map están en `.webp` pero el archivo real no
existe (o existe en otro formato), por lo que `next/image` muestra la imagen por defecto / fallback.

### Casos detectados
- `createStoryDuelPresentationRuntime` usa `/assets/story/player/bob.webp` como avatar del jugador.
- `StoryCircuitCanvas` referencia `/assets/renders/nexus.webp`, `/assets/renders/react.webp`, `/assets/renders/wrap.webp`.
- El avatar del oponente proviene de `duel.opponentAvatarUrl` (BBDD/catálogo); en el oponente "soldado" el valor apunta a un `.png` que no existe.

### Enfoque
1. Auditar qué archivos reales existen en `public/` para cada ruta.
2. Unificar el formato real con las referencias del código (convertir o renombrar, manteniendo consistencia case-sensitive).
3. Aprovechar `scripts/quality/check-assets.mjs` para asegurar que no queden referencias rotas.

### Criterios de aceptación
- La moneda del inicio del duelo muestra las caras del jugador y del oponente correctamente.
- Los renders/avatars del mapa Story no caen en fallback genérico.
- `pnpm quality:check:assets` pasa sin excepciones documentadas.

### Notas de implementación
- Solucionado por el usuario: las rutas en base de datos seguían usando `.png`; se actualizaron a `.webp` para que coincidan con los assets reales en `public/`.

---

## Bloque 8 — Moneda inicial del duelo Story no muestra la cara del oponente soldado

**Estado:** completado · **Prioridad:** alta · **Esfuerzo:** bajo

### Problema
En el overlay `StoryDuelCoinTossOverlay`, la imagen de uno de los lados de la moneda falla para el
oponente "soldado". El avatar del oponente (`opponentAvatarUrl`) llega desde el runtime del duelo y,
para ese oponente, parece apuntar a un archivo `.png` inexistente en lugar de al `.webp` real.

### Archivos a revisar
- `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelCoinTossOverlay.tsx`
- `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/internal/story-duel-runtime.ts`
- `src/services/story/get-story-duel-runtime-data.ts`
- Catálogo de oponentes Story (BBDD o `story-opponent-catalog.ts` si aplica).

### Criterios de aceptación
- El lanzamiento de moneda muestra ambas caras sin error de imagen.
- Si un oponente no tiene avatar específico, se usa un fallback explícito y documentado.

### Notas de implementación
- Solucionado por el usuario: la ruta del avatar del oponente en base de datos estaba en `.png`; se actualizó a `.webp`.

---

## Bloque 9 — Seguridad del pipeline de deploy en Vercel

**Estado:** pendiente · **Prioridad:** alta · **Esfuerzo:** bajo (configuración)

### Problema
Actualmente cualquier `push` a cualquier rama dispara un deploy en Vercel que parece apuntar a
producción (`main`). Esto es peligroso: una rama de feature sin mergear puede reemplazar el producto
en producción si pasa los checks.

### Posibles causas
- El proyecto Vercel está configurado para hacer deploy automático de cualquier push.
- GitHub Actions o la integración Vercel no limitan el deploy a la rama `main` (o a PRs mergeadas).
- Falta protección de rama (`branch protection` / ruleset) en `main`.

### Enfoque
1. Revisar la configuración del proyecto en el dashboard de Vercel:
   - Production Branch: debe ser `main`.
   - Preview Deployments: solo para PRs, no para cualquier push.
2. Revisar GitHub Actions (`.github/workflows/` si existen) para asegurar que el deploy a producción
   solo se ejecute en `push` a `main` y tras pasar `quality:check`.
3. Proteger `main` con ruleset: requerir PR, requerir checks en verde, bloquear push directo.

> **Nota:** para investigar y modificar la configuración de Vercel/GitHub se necesitan los MCPs
> correspondientes o acceso manual al dashboard. Desde el código del repositorio solo se puede
> auditar la parte de GitHub Actions (`.github/workflows`).

### Criterios de aceptación
- Pushear una rama `features/*` no publica en producción.
- Solo los cambios mergeados en `main` (y que pasen los gates) generan deploy de producción.
- Documentar el flujo en este roadmap o en `docs/DESPLIEGUE.md`.

---

## Orden recomendado

### Completados (release de mantenimiento)
1. **Bloque 1, 2, 3** (fixes de producción visibles).
2. **Bloque 0** (rendimiento del hub, visual-neutral).

### Completados (fixes de producción)
3. **Bloque 6** (salir al hub en Story móvil).
4. **Bloque 7** (imágenes Story rotas).
5. **Bloque 8** (moneda del oponente soldado).

### Pendientes (fixes de producción críticos)
6. **Bloque 9** (seguridad del deploy) — antes que cualquier nuevo código, para no romper producción.

### Pospuestos
7. **Bloque 4** (multijugador) — se retrasa hasta estabilizar producción.
8. **Bloque 5** (onboarding) — en paralelo cuando haya capacidad.
