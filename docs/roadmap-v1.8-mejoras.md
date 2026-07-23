# Roadmap v1.8 — Guía de implementación (mejoras y nuevas features)

> Rama: `feat/v1.8-improvements` (creada desde `main` v1.7.2), con una sub-rama por fase (o agrupando fases pequeñas) y merge a `develop` → `main` siguiendo el flujo ya documentado (push directo a `main` para el mantenedor).
> Estado (2026-07-01): **Fases 1, 2 y 4 IMPLEMENTADAS** ✅ · siguiente = Fase 3 (admin mobile). El resto sigue como guía.
> Fuente de las 5 ideas originales del usuario, reordenadas por dependencia técnica y riesgo, no por prioridad de negocio.

**Progreso:**
- ✅ **Fase 1** — Arena cambia de nivel sin recarga (soft-nav).
- ✅ **Fase 2** — Animaciones de las **10** pasivas V5 en combate (el diagnóstico inicial se quedó corto; ver bloque de la fase).
- ✅ **Fase 4** — 2 oponentes nuevos (Guill nivel 6 + Midutech comodín), migración 086 aplicada a prod.
- ✅ **Fase 3** — Admin mobile (Catálogo, Market, Starter, Story, Arena con detalle en diálogo; desktop intacto).
- ⬜ **Fases 5 + 7 (FUSIONADAS)** — Academy 3D estilo "selección de campaña" (3 pilares holográficos: Tutorial, Oponentes, Documentación).
- ⬜ Fase 6 — documentación interactiva (el contenido que abre el pilar de Documentación).
- 🅿️ Fase 8 — codegen catálogo (aplazada; el guard de `db:validate` ya cubre el dolor inmediato).

---

## Principios transversales (aplican a TODAS las fases)

**Seguridad**
- Ninguna tabla nueva usa `auth.role()`/`auth.email()` en RLS (rompe entre versiones de Supabase). Patrón: `to authenticated using (true)` para lectura general, `auth.uid() = <col>` para propiedad. Ver histórico del bug en migración 048/049.
- Toda escritura desde el panel admin pasa por **gate de rol admin + cliente service-role en servidor** (patrón ya usado en `/api/admin/arena`, `/api/admin/progression/upsert`, `/api/admin/story-decks/deck`). Nunca exponer la service-role key al cliente ni saltarse el gate "por comodidad" en un endpoint nuevo.
- Cualquier input de formulario admin que referencie una carta debe restringirse al catálogo válido (`CARD_BY_ID` / `cards_catalog`), igual que hace hoy el selector de mazos de Arena — nunca aceptar un `cardId` arbitrario sin validar contra el catálogo real.
- Si algún panel nuevo permite texto enriquecido (p. ej. documentación editable desde admin), no usar `dangerouslySetInnerHTML` con contenido de admin sin sanitizar — usar un renderer de markdown con esquema restringido (sin `<script>`/`on*`/`iframe`).
- Toda carta nueva en `cards_catalog` (para los oponentes nuevos) necesita su `INSERT` real en una migración `docs/supabase/sql/`, y pasar `pnpm db:validate` — la "regla de oro" del proyecto (gotcha real: `entity-ubuntu`/`entity-duckduckgo` rompieron el `db reset` limpio por saltarse esto).

**Calidad**
- Antes de cada push: `CI=true pnpm quality:check` completo (tipos + lint + build + `db:validate`), leyendo el exit code real, sin enmascarar con pipes.
- Medir rendimiento SIEMPRE con `pnpm build && pnpm start`, nunca en `pnpm dev` (el dev server da métricas falsas, LCP artificialmente alto).

**Rendimiento (crítico en fases 2, 5, 6, 7)**
- Activar el criterio de `skills/performance-rendering-guardrails/SKILL.md` para cualquier animación/3D nueva.
- Animaciones Framer Motion se **desmontan**, no se ocultan con CSS (`display:none` sigue pagando el coste de layout/paint en algunos casos).
- Evitar `filter: blur` global nuevo; usar gradientes radiales con borde duro para glows.
- Todo efecto visual "caro" nuevo (hologramas 3D, VFX de pasivas) debe respetar el gating existente `isPerformanceMode` / override `combat-effects-profile` (`reduced`/`full`) para no romper gama baja / móvil.
- El proyecto YA tiene `three` + `@react-three/fiber` + `@react-three/drei` instalados y un patrón de referencia (`HubSceneWorld3D.tsx`, cargado con `next/dynamic({ ssr: false })`) — reutilizar ese patrón, no añadir una librería 3D nueva.

---

## Fase 1 — Cambio de nivel en Arena sin recarga 🟢 fácil-medio · ✅ IMPLEMENTADA (commit `5b4eef5`)

> **Hecho:** `TrainingArenaClient.tsx` usa `router.push({ scroll: false })` + `useTransition` + `router.prefetch` de los tiers desbloqueados; nuevo prop `isTierSwitching` en `TrainingArenaLobby` (spinner + atenuado). Se mantiene `window.location.replace` solo en `onResultAction`/`onExitMatch` (teardown deliberado del `Board` post-combate).

**Diagnóstico.** El selector de nivel en el lobby de Arena dispara una recarga completa del navegador porque usa `window.location.replace()` en vez de navegación de Next.js:

```ts
// src/components/hub/academy/training/modes/arena/internal/TrainingArenaClient.tsx
onSelectTier={(tier) => window.location.replace(`/hub/academy/training/arena?tier=${tier}`)}
```

Hay 3 usos más del mismo patrón en el mismo archivo (`onBack`, `onResultAction`, `onExitMatch`) que también fuerzan hard-reload. La página `src/app/hub/academy/training/arena/page.tsx` (Server Component) lee la cookie `arena_tier` / el `searchParam`, valida el tier contra el progreso guardado y recalcula el loadout del oponente (`resolveTrainingOpponentLoadout`) — esa parte de lógica está bien y debe conservarse intacta; el problema es solo el **transporte** de la navegación.

**Qué hacer.**
1. Sustituir `window.location.replace(...)` por `router.push(...)` (`useRouter` de `next/navigation`) con `{ scroll: false }` para las 4 navegaciones internas del flujo de Arena. Esto convierte la navegación en un **soft-nav de App Router**: solo re-renderiza el segmento de servidor afectado (RSC payload), sin recargar `<head>`/scripts/estado global del hub.
2. Envolver el cambio de tier en `useTransition()` y mostrar `isPending` como un overlay/skeleton **solo sobre el panel del oponente** (no toda la pantalla), para que el cambio se perciba instantáneo aunque el fetch tarde unos ms.
3. Precargar los tiers vecinos con `router.prefetch(`/hub/academy/training/arena?tier=${n}`)` al montar el lobby (los tiers desbloqueados son pocos, 5-6), así el soft-nav casi no tiene latencia de red.
4. **Opcional (mejora futura, no obligatoria para "instantáneo"):** si tras (1)-(3) sigue sin sentirse fluido, extraer `resolveTrainingOpponentLoadout` a un endpoint ligero (`/api/training/arena/loadout?tier=`) y resolver el cambio de tier 100% en cliente (fetch + `setState`), sin navegación de página. Es más trabajo (hay que exponer la resolución de loadout, hoy solo server-side) — dejarlo como fase 1.5 si (1)-(3) no basta.
5. Verificar que la cookie `arena_tier` se sigue escribiendo (vía Server Action o API, no `document.cookie` directo si ya usa una) antes del `router.push`, para que la validación server-side siga siendo consistente con lo que el usuario ve.

**Riesgo:** bajo (solo capa de navegación, la lógica de resolución de oponente no se toca). **Aceptación:** cambiar de nivel en el lobby de Arena no produce parpadeo de página completa ni pérdida de scroll/estado del hub; el oponente/mazo mostrado corresponde siempre al tier seleccionado y sigue clamperado si el tier está bloqueado.

---

## Fase 2 — Animaciones de efectos de pasivas V5 en combate 🟠 medio · ✅ IMPLEMENTADA

> **Hecho (real, corrige el diagnóstico de abajo).** El diagnóstico inicial se quedó corto: al rastrear el código, había **más de 4** pasivas sin VFX y una (Cortafuegos) con un bug real (aplicaba el daño al estado pero no emitía evento → sin animación). Arquitectura confirmada: el feedback de combate se **deriva del combat log** (`boardCombatFeedback.ts` lee el último evento por tipo), no de una cola `PASSIVE_TRIGGERED` nueva. Por tanto el arreglo fue **emitir los eventos que faltaban** en el punto donde el motor ya aplica el efecto (determinista, válido para multijugador), reutilizando los VFX existentes. Estado final de las **10**:
>
> | Pasiva | Animación | Cómo |
> |---|---|---|
> | Drenaje ATK | "−200" violeta en la carta | ya emitía `STAT_BUFF_APPLIED` (−) → `BuffImpactVfx` debuff |
> | Núcleo Defensivo | pulse "+1" energía | `next-phase.ts`: `amount` en el `ENERGY_GAINED` de turno solo si hay bonus mastery |
> | Carga Letal | daño directo aumentado | ya (el daño mayor se anima) |
> | Turbo Ofensivo | pulse "+1" energía | ídem Núcleo Defensivo |
> | Caja de Herramientas | robo deck→mano | `play-card.ts` marca `drewOnSummon` → `DrawCardFlowVfx` lo detecta |
> | Aprendizaje Continuo | "+100" ATK flotante | `next-phase.ts` emite `STAT_BUFF_APPLIED` sobre las entities que crecen |
> | Autoguardado | pulse "+energía" al morir | `attack-logging.ts` emite `ENERGY_GAINED` al dueño de la entity destruida |
> | Cortafuegos Reactivo | rayo de daño desde la carta al atacante | `attack-logging.ts` emite `DIRECT_DAMAGE` de efecto (source = carta) + `beam-overlay-logic` deja de suprimirlo (`reason` reflect) |
> | Regeneración | VFX de curación (+200 HP) | `next-phase.ts` emite `HEAL_APPLIED` |
> | Sobrecarga | "+300" ATK flotante en el ataque | `attack-logging.ts` emite `STAT_BUFF_APPLIED` sobre el atacante |
>
> Archivos: `attack-logging.ts`, `attack-resolution.ts`, `mastery-turn-start.ts`, `next-phase.ts`, `play-card.ts`, `DrawCardFlowVfx.tsx`, `direct-damage-beam-overlay-logic.ts`/`-readers.ts`. Tests de integración añadidos por pasiva. **Limitación conocida:** el feedback surface "el último evento de cada tipo" por recompute → si dos pasivas del mismo tipo se disparan en la misma acción (ej. Sobrecarga +300 y Drenaje −200 sobre la misma carta), solo se ve una. Raro; posible follow-up (cola de buffs). **Verificación:** por tests + typecheck + lint; NO validado visualmente en partida real.

**Diagnóstico (original, parcialmente inexacto — se conserva por contexto).** El catálogo de 10 pasivas de mastery V5 (`src/core/services/progression/mastery-passive-ids.ts`) tiene su lógica de servidor 100% correcta y determinista (importante para multijugador), pero **4 de las 10 no disparan ningún VFX** en la UI de combate:

| Pasiva | Lógica (correcta) | VFX actual |
|---|---|---|
| `passive-energy-on-death` (**Autoguardado**) | `attack-passives.ts` + `attack-player-updates.ts`: suma energía al morir la carta | **Ninguno** — el jugador no ve por qué subió su energía |
| `passive-defense-energy-plus-1` (Núcleo Defensivo) | `phases/next-phase.ts` (`resolveMasteryEnergyBonus`) | **Ninguno** |
| `passive-attack-energy-plus-1` (Turbo Ofensivo) | ídem | **Ninguno** |
| `passive-atk-drain-200` (Drenaje de ATK) | `attack-passives.ts` | **Ninguno** |

Las otras 6 ya tienen animación reutilizable: robo (`DrawCardFlowVfx`), crecimiento/daño directo/sobrecarga (`BuffImpactVfx`), reflejo de daño (beam existente) y curación por turno (`ExecutionHealVfx`, que ya renderiza un HEAL verde con anillos de humo + orbe, ver `src/components/game/board/battlefield/internal/ExecutionHealVfx.tsx` y su disparo en `ExecutionActivationVfx.tsx` cuando `action === "HEAL"`).

**Qué hacer.**
1. **No inventar 4 sistemas de VFX nuevos** — el patrón correcto es reutilizar los dos que ya existen:
   - **Energía (Autoguardado + Núcleo Defensivo + Turbo Ofensivo):** las 3 pasivas hacen lo mismo visualmente ("+1 energía"). Crear una única variante ligera reutilizando `ExecutionHealVfx` (mismo esqueleto de anillos + orbe) pero con paleta cian/azul (color de energía en el HUD, no verde de HP) y texto `+1` en vez de `HEAL`. Nombrarlo p. ej. `EnergyGainVfx` en el mismo directorio `battlefield/internal/`.
   - **Drenaje de ATK:** `BuffImpactVfx` ya soporta el caso de reducción de stat (se usa para debuffs). Solo falta emitir el evento cuando la pasiva se resuelve.
2. **El problema real es de evento, no de componente:** los handlers en `attack-passives.ts`, `attack-player-updates.ts` y `phases/next-phase.ts` son funciones puras que devuelven el nuevo estado, pero no emiten nada a la cola de feedback de combate que consume `ExecutionActivationVfx`/`BuffImpactVfx`. Hay que:
   - Extender esa cola de feedback (la misma que ya evita `reverse()` — ver memoria de rendimiento) con un tipo de evento `PASSIVE_TRIGGERED { passiveId, entityId, ownerSide, magnitude }` cuando `resolveEnergyRefundOnDeath > 0`, `resolveMasteryEnergyBonus > 0` o el drenaje de ATK aplica.
   - En la capa de UI, mapear `passiveId → componente VFX` (nuevo `PassiveActivationVfx.tsx`, análogo a `ExecutionActivationVfx.tsx`): `energy-on-death`/`defense-energy`/`attack-energy` → `EnergyGainVfx`; `atk-drain` → `BuffImpactVfx` (variante debuff).
3. **Determinismo:** el evento de VFX debe derivarse del mismo cálculo que ya hace el motor (no recalcular en cliente) para no divergir en multijugador — emitir el evento en el mismo punto donde se aplica el efecto al estado, no inferirlo después por diff.
4. **Cobertura de Autoguardado fuera de combate (decisión de alcance, NO solo animación):** existe una limitación conocida — Autoguardado solo se dispara en muerte por **ataque** (`attack-player-updates.ts`), no si la carta muere por trampa/ejecución. Decidir explícitamente si esta fase también arregla la lógica (para que la animación sea consistente en todos los caminos de destrucción) o si se deja fuera de alcance y solo se anima el camino existente. Si se amplía, cablear el mismo evento en el/los puntos de destrucción por efecto, con tests de integración deterministas.
5. Revisar rápido si algún efecto de **executions/traps** del catálogo general (`effect-catalog.ts`) tiene el mismo gap (lógica sin VFX) y anotarlo como candidato de "qué animación podríamos crear" en la documentación de la Fase 6 — el usuario pidió explícitamente identificar estos casos.

**Riesgo:** medio (toca el motor de combate y la cola de feedback compartida con multijugador determinista — cambios pequeños pero en código sensible). **Aceptación:** en combate, cuando se dispara Autoguardado, Núcleo Defensivo, Turbo Ofensivo o Drenaje de ATK, aparece un VFX claro y coherente con el resto del set visual; tests existentes de combate siguen en verde; sin regresión de determinismo (mismo replay en cliente A y B).

---

## Fase 3 — Panel de Admin en modo mobile 🟠 medio · ✅ IMPLEMENTADA (commits `b75e9da`, `4d732ce`, `0088289`)

> **Hecho.** Patrón único: en desktop (≥xl) el layout NO cambia; por debajo de `xl` los workspaces multi-columna pasan a **scroll vertical** y el inspector/detalle se abre como **diálogo** (`AdminMobileDetailDialog`, wrapper de `MobileInspectorDialogShell` — el mismo de arsenal/mercado). Paneles: Catálogo, Market (listings+packs), Starter, Story, Arena (editor de mazos; el diálogo incluye acciones Añadir/Quitar por su flujo click-based). Wrappers `xl:contents` para no alterar el grid desktop; alturas definidas en móvil para los paneles con `h-full` interno. Effects/Analytics/Live-Ops/Audit ya apilaban (`md:grid-cols`/tabla con `overflow-auto`). Fix de paso: el detalle de carta lleva `h-full` → el `ResizeObserver` del inspector mide bien y la `Card` deja de recortarse (afectaba también a desktop).
>
> **Alcance confirmado:** desktop perfecto, NO tocarlo — solo mobile/tablet.

**Diagnóstico.** El layout base ya tiene una estrategia mobile-first razonable:
- `src/app/admin-portal/[portalSlug]/layout.tsx`: contenedor con `flex-col md:flex-row`.
- `src/components/admin/AdminSidebarNav.tsx`: sidebar lateral colapsable oculta en mobile (`hidden md:flex`) + **bottom bar** con scroll horizontal (`order-last md:hidden`) — el patrón de navegación mobile ya existe y funciona.

El problema está **dentro de cada panel de contenido**, no en el shell. Ejemplo confirmado: `AdminCatalogPanel.tsx` usa `xl:grid-cols-[minmax(0,1fr)_360px]` — hasta 1280px todo se apila en una sola columna ancha, pero el editor de detalle de 360px puede desbordar en viewports pequeños (<400px) si no hay `min-w-0`/`overflow-x-hidden` correctos. Hay 9 secciones admin en total (`catalog`, `effects`, `market`, `starter-deck`, `story-decks`, `arena`, `audit`, `analytics`, `live-ops`); varias tienen grids/tablas anchas (editor visual de mazos de Arena a 4 columnas, tablas de auditoría, gráficos de analytics) que no se han verificado en mobile.

**Qué hacer.**
1. Auditar viewport 375px (iPhone SE) y 390px en cada una de las 9 secciones con devtools, listando qué se rompe (overflow horizontal, texto cortado, targets táctiles <44px, tablas ilegibles).
2. Regla general de fix: los grids con columnas fijas en `px` (`360px`, editor 4 columnas de Arena) deben colapsar a 1 columna por debajo de `md`/`lg` y usar `overflow-x-auto` con scroll táctil solo donde el contenido es intrínsecamente tabular (tablas de auditoría), nunca en el layout general.
3. Componentes de tabla densos (Audit, Analytics) → en mobile, considerar vista de "tarjetas apiladas" en vez de `<table>` con scroll horizontal forzado (mejor UX táctil), reutilizando los mismos datos/hooks, solo cambiando el componente de presentación por breakpoint.
4. El editor visual de mazos de Arena (`AdminArenaDeckEditor`, 4 columnas: oponentes / grid deck+fusión / almacén / inspector) es el caso más complejo — probablemente necesite un patrón de **pestañas o acordeón en mobile** en vez de 4 columnas simultáneas, ya que es contenido de trabajo (no solo lectura). Priorizar que sea *usable* en tablet (≥768px) primero; el uso en móvil pequeño puede quedar como "funcional pero incómodo" si el esfuerzo no compensa (el admin es una herramienta interna, no cara al jugador).
5. Ir sección por sección en commits separados (bajo riesgo de romper otra al tocar una) — no un único PR gigante.

**Riesgo:** bajo por sección, pero superficie amplia (9 páginas) — el riesgo real es de alcance/tiempo, no técnico. **Aceptación:** las 9 secciones del admin son operables (sin scroll horizontal accidental, sin overlap, targets táctiles ≥44px) en un viewport de 375px; el editor de Arena es al menos usable en tablet.

---

## Fase 4 — Dos oponentes nuevos, agnósticos Arena/Story 🟠 medio (mayormente contenido) · ✅ IMPLEMENTADA (commit `d213879`)

> **Hecho.** **Guill** = rival dedicado del **Nivel 6** (APEX); antes el N6 reusaba `training-tier-5` (el soldado quedaba duplicado en el roster). **Midutech** = rival **comodín** con 25% de aparecer en cualquier nivel (lógica pura: el azar se inyecta desde la página con `crypto`, no `Math.random`). Toca: narración (`story-opponent-narration-catalog.ts`, textos puestos; audios los graba el usuario), presets/pools de arena, catálogo de tiers (+Nivel 6), resolver (comodín), migración `086_arena_opponents_guill_midutech.sql` **aplicada a prod** (verificado: 22 cartas/variante, cero refs rotas). Alta solo en Arena (identidad lista para Story). Gotcha resuelto: `trap-gemini-counter-seal` era un id muerto (no está en CARD_BY_ID) → `trap-atk-drain`. Guard `db:validate` extendido para validar cartas de decks de migraciones (commit `ee4418e`). **Pendiente:** el usuario graba los `.m4a`.

**Diagnóstico.** El sistema es más maduro de lo que parece a primera vista: **tanto Arena como Story ya son 100% data-driven en BD**, con paneles admin propios:
- **Arena:** tablas `arena_opponents` / `arena_opponent_deck_variants` / `arena_deck_variant_cards` / `arena_tiers` (migraciones 081-084), editadas desde `/admin-portal/[slug]/arena` (`AdminArenaPanel`, con pestañas Mazos/Estructura).
- **Story:** tablas `story_opponents`/duelos (desde migración `008_phase_5_story_opponents_duels.sql`, ampliadas en 017/018/027/034-041), editadas desde `/admin-portal/[slug]/story-decks` (`AdminStoryDeckPanel`, con modos "Deck base"/"Deck duelo", clonado de configuración, escalado masivo).
- El puente entre ambos mundos es el campo `storyOpponentId` en `IArenaOpponent` — así un mismo "personaje" puede aparecer en Arena (con sus variantes de mazo que rotan) y en Story (con su duelo narrativo), pero **no comparten una única fila de identidad**: hoy se define por separado en cada sistema (nombre, avatar, intro) aunque referencien el mismo id lógico.

Hay fallback en código si la BD falla (`build-arena-opponents-from-presets.ts` para Arena), pero para contenido nuevo **NO hace falta tocar código** — solo el admin, con la salvedad de que **toda carta nueva** que se quiera usar en el mazo del oponente debe existir antes en `cards_catalog` (con su migración real, ver principios transversales).

**Qué hacer.**
1. **Diseño de personaje (fuera de código):** definir para cada oponente nuevo — nombre, "code name", lore breve, avatar + intro (assets WebP, mismo proceso de optimización que el resto de assets del proyecto), arquetipo/facción dominante de su mazo, nivel de dificultad narrativo.
2. **Verificar antes de empezar** (checklist, evita sorpresas): ¿la posición del nodo en el mapa de Story (si el oponente lleva un duelo nuevo, no solo una skin de uno existente) se edita desde admin, o sigue requiriendo tocar `src/services/story/map-definitions/act-1-map-definition.ts` en código? Si es lo segundo, ese paso puntual de posicionamiento de nodo es código (bajo riesgo, coordenadas 2D), el resto sigue siendo admin.
3. **Alta en Arena:** desde `AdminArenaPanel` → pestaña Estructura: crear el `arena_opponents` (empieza `isActive=false`, cambiar avatar/intro por defecto de GenNvim antes de activar — gotcha ya documentado). Pestaña Mazos: crear 1-2 variantes de mazo con las cartas del arquetipo elegido (el selector ya restringe a cartas válidas del catálogo). Decidir si sustituye/rota con un oponente existente en algún tier o añade uno nuevo.
4. **Alta en Story (si aplica):** desde `AdminStoryDeckPanel`: crear el deck base y, si es un duelo nuevo, el `story_duel_ai_profiles`/`story_duel_deck_overrides` (dificultad, estilo IA, agresividad, escalado por carta, slots de fusión, recompensa). Usar "Clonar desde duelo..." para partir de una configuración similar y ajustar.
5. **Cartas nuevas (si el arquetipo lo requiere):** si se quieren cartas exclusivas para dar personalidad al oponente, seguir el flujo de alta de carta ya existente en `AdminCatalogPanel` + su migración `docs/supabase/sql/0XX_*.sql` con el `INSERT` real, y correr `pnpm db:validate` antes de dar por cerrado.
6. **QA de balance:** jugar el oponente en Arena (nivel objetivo) y en Story (si aplica) para verificar que la dificultad se siente coherente con su tier/capítulo — esto es contenido, no automatizable.

**Riesgo:** bajo-medio (mayormente admin + contenido; el único código es, en el peor caso, un nodo de mapa nuevo). **Aceptación:** 2 oponentes nuevos activos, jugables en Arena y/o Story según diseño, con mazo, avatar e intro propios, sin cartas huérfanas (`pnpm db:validate` limpio).

---

## Fase 5 + 7 (FUSIONADAS) — Academy 3D: 3 pilares holográficos 🔴 alto · ⬜ SIGUIENTE

> **Decisiones tomadas (2026-07-01):** rediseñar `/hub/academy` como una **pantalla estilo selección de campaña de StarCraft II** (el usuario pasó esa referencia) con **3 pilares holográficos 3D** sobre pedestales. Enfoque **3D real con react-three-fiber** (reusar el patrón de `HubScene`/`HubSceneWorld3D`), con **fallback 2D** en gama baja/sin-WebGL. Las imágenes 2D `intro-*` se proyectan como **planos con look holográfico** (tinte cian, líneas de escaneo, flotación, glow), NO son modelos 3D.
>
> **Los 3 pilares:**
> 1. **Tutorial** → holograma de `intro-BigLog` (`/assets/story/opponents/opp-ch1-biglog/intro-BigLog.webp` o `tutorial-BigLog.webp`). CTA → `ACADEMY_TUTORIAL_MAP_ROUTE`.
> 2. **Oponentes/Arena** → grupo (roster) con los 7 `intro-<oponente>` juntos, escalonados. CTA → `ACADEMY_TRAINING_ARENA_ROUTE`.
> 3. **Documentación (Códex)** → una `Card` del juego flotando como holograma que **cicla Entity→Magic→Trap** (reusa `Card` + `CardHologram`). CTA → nueva ruta de glosario (Fase 6).
>
> **Arquitectura (espejo de `HubScene`):**
> - `AcademyScene` (2D shell, `"use client"`): gate de hidratación (`useHubHydrationGate` o equivalente), check `supportsWebGL()`, decisión `canRender3D`, skeleton, y **`dynamic(() => import AcademyWorld3D, { ssr:false })`**. Renderiza `AcademyFallback2D` cuando `!canRender3D` (reusa el look de `TrainingMode3DPanel` actual, ya existente — así el fallback NO es peor que hoy).
> - `AcademyWorld3D` (`"use client"`): `<Canvas dpr={renderProfile.dpr} gl={{antialias:false, powerPreference:"high-performance"}} frameloop={isDocumentVisible ? "always" : "never"}>` con luces (ambient + 2 directional cian como el hub), y 3 `<HologramPillar>`.
> - `HologramPillar` (r3f): pedestal (cylinder + anillo emisivo), plano holográfico con la textura (imagen intro o card), animación de flotación (`useFrame`, `position.y = base + sin(t)*amp`), líneas de escaneo (segundo plano con textura de líneas + offset animado, additive), rim/glow, y estados hover/selected. onClick → navega (soft-nav de Fase 1, `router.push`).
> - Reusar `resolveHubRenderProfile(viewportWidth, capability)` + `useHubDeviceCapability` para dpr/calidad; **gating `isPerformanceMode`/perfil desde el día 1**.
> - Para la carta-códex: opción A (recomendada, más simple) = plano con textura de la cara de carta ciclando 3 imágenes; opción B (más fiel) = `<Html transform>` de drei incrustando el componente `Card` real en el espacio 3D (cuidado con perf/occlusion de `Html`).
>
> **Orden de implementación (incremental, medir en `pnpm build && pnpm start` en móvil real entre pasos):**
> 1. `AcademyScene` shell + fallback 2D (mantiene la Academy funcionando) + `AcademyWorld3D` con SOLO el pilar Tutorial. Verificar rendimiento.
> 2. Añadir pilar Oponentes (roster) y pilar Documentación (card códex).
> 3. Pulido: cámara con parallax suave al mover ratón/orientación, entrada escalonada de pilares, títulos 2D superpuestos (HUD overlay como en el hub, no texto 3D), audio.
> 4. Fase 6 aparte: el contenido del glosario que abre el pilar Docs.
>
> **Riesgo:** alto — es la superficie de mayor impacto de rendimiento móvil (preocupación recurrente del usuario). Mitigación: fallback 2D robusto + gating + medir por pilar. **Sesión dedicada recomendada** (contexto limpio para el 3D). **Aceptación:** Academy muestra los 3 pilares holográficos sin degradar LCP/FPS en build de producción móvil, con fallback 2D correcto; los 3 CTA navegan (soft-nav) a tutorial / arena / glosario.

---

## Fase 5 (original) — Mejora de UI de Academy (Tutorial + Arena) 🟠 medio

**Diagnóstico.** Las páginas de Academy (`/hub/academy`, `/hub/academy/training/arena`, `/hub/academy/training/tutorial`, `/hub/academy/tutorial` + subrutas `arsenal`/`market`/`reward`) son hoy 2D con Tailwind + Framer Motion, sin ningún elemento 3D. El layout (`src/app/hub/academy/layout.tsx`) ya centraliza el control de audio del tutorial, así que es un buen punto de entrada estable para envolver mejoras de UI sin tocar cada página.

**Qué hacer.**
1. Definir con el usuario (mockup/wireframe antes de código, esto es UX) qué cambia concretamente en cada una de las 2 páginas: jerarquía visual, navegación entre tutorial↔arena, estados vacíos/bloqueados, feedback de progreso.
2. Aplicar el fix de la Fase 1 (soft-nav) también a cualquier navegación interna de Academy que hoy use `window.location` (memoria de rendimiento: "Framer Motion debe desmontarse, no ocultarse" — vigilar que las transiciones entre sub-páginas de Academy no dupliquen el problema de la Fase 1).
3. Reutilizar componentes existentes (`TrainingArenaLobby`, `TrainingArenaLobbyBackdrop`) en vez de reescribir desde cero donde el rediseño sea solo visual, no estructural.
4. Este es el momento de **decidir el punto de entrada de los hologramas** (Fase 7): dejar un slot/contenedor reservado en el layout de Academy para el holograma de "grupo de oponentes" y el de tutorial, aunque el 3D se implemente después — evita retrabajo de layout.

**Riesgo:** medio (UI-only, pero superficie visible para el jugador — validar visualmente con el usuario en checkpoints, no de una vez). **Aceptación:** ambas páginas de Academy con la UI acordada, sin regresión de navegación (Fase 1) ni de rendimiento (medido en `pnpm build && pnpm start`).

---

## Fase 6 — Documentación interactiva del juego (glosario para novatos) 🟠 medio-alto

**Diagnóstico.** Hoy la única "documentación de efectos" vive en el **panel admin** (`/admin-portal/[slug]/effects`, `AdminEffectsGlossaryPanel.tsx`), leyendo de `src/core/services/effects/effect-catalog.ts` (acciones de executions/traps) y `mastery-passive-display.ts` (textos de pasivas V5, ya con plantillas que interpolan la magnitud escalada por versión — reutilizable tal cual). **No existe** ninguna vista de esto orientada al jugador. El usuario quiere una página nueva, pensada para un novato, que explique: tipos de carta (Entity/Magic/Trap), qué hace cada efecto, cómo funciona la experiencia/subida de nivel, qué cambia en cada versión (V1→V5), qué son los poderes/pasivas.

**Qué hacer.**
1. **No duplicar contenido:** los textos ya existen y están centralizados (`effect-catalog.ts`, `mastery-passive-display.ts`, `compose-card-power-description.ts` para el texto de poder por versión). La página nueva de documentación debe **leer de las mismas fuentes** que ya usa el admin y el propio juego (frame de carta), para que si se rebalancea un efecto, el glosario del jugador no quede desactualizado — cero texto hardcodeado por duplicado.
2. Diseñar la IA de la información: categorías (Tipos de carta, Efectos de Magic, Efectos de Trap, Sistema de versiones V1-V5, Pasivas de maestría, Experiencia y subida de nivel), con ejemplos visuales (miniatura de carta real ilustrando el efecto que se explica) en vez de solo texto.
3. Nueva ruta, p. ej. `/hub/academy/tutorial/glossary` (o integrada como pestaña dentro de una de las 2 páginas de Academy que pide el punto 3 original) — decidir con el usuario si es una 3ª sección de Academy o una pestaña dentro de Tutorial.
4. Contenido explicativo de "qué gana un novato": este texto sí es nuevo (no existe en código) y hay que redactarlo — es contenido, no lógica; puede vivir en un catálogo de datos simple (`docs/*.ts` o JSON) separado del catálogo de efectos técnico, para no mezclar "texto de balance" con "texto pedagógico".
5. Sanitización: si el contenido pedagógico se hace editable desde admin en el futuro, aplicar la regla de seguridad de "Principios transversales" (sin HTML crudo sin sanitizar).

**Riesgo:** medio-alto (superficie de contenido grande — el riesgo no es técnico sino de alcance/tiempo de redacción). **Aceptación:** un jugador nuevo puede entender, sin salir del juego, qué hace cada tipo de carta, cada efecto que ve en pantalla, cómo sube de nivel y qué cambia en cada versión — con datos siempre sincronizados con el motor real (no un texto estático que se desactualiza).

---

## Fase 7 — Hologramas 3D (Tutorial, Oponentes, Documentación) 🔴 alto (nueva superficie de rendimiento)

**Diagnóstico.** No hay 3D en Academy hoy, pero el proyecto ya tiene la base técnica (`three` + `@react-three/fiber` + `@react-three/drei`) y un patrón de referencia probado en producción: `HubSceneWorld3D.tsx`, cargado vía `next/dynamic(..., { ssr: false })` desde `HubScene.tsx`. La memoria de rendimiento del proyecto es explícita: el hub 3D "lento" se arregló así, y el trabajo de PixiJS/3D en combate (Fases 7-8 del masterplan de rendimiento) se dejó **pendiente de decidir tras medir en producción** — es decir, el equipo ya sabe que el 3D es el punto más sensible de rendimiento del proyecto.

**Qué hacer.**
1. **Un solo componente 3D reutilizable**, no tres hologramas distintos desde cero: `HologramViewport.tsx` (o similar) que reciba un `sceneKind` (`tutorial-avatar` | `opponent-roster` | `documentation`) y el contenido a proyectar, reutilizando cámara/luces/efecto de "líneas de escaneo" holográfico como configuración, no como código repetido.
2. Seguir el patrón exacto de `HubSceneWorld3D`: `next/dynamic({ ssr: false })`, sin renderizar en servidor, con un fallback 2D estático mientras carga (evita CLS/parpadeo).
3. **Gating de rendimiento obligatorio desde el día 1** (no como parche después): el holograma solo se renderiza en 3D si `isPerformanceMode`/`combat-effects-profile` lo permite; en modo reducido, cae a una versión 2D equivalente (imagen/spritesheet) — igual que ya se gatea `CardFrameMasteryAura`.
4. Empezar por **UN** holograma (recomendado: el de "grupo de oponentes" del tutorial, es el más autocontenible — modelos/avatares ya existen como imágenes 2D, se puede empezar con planos 3D con la imagen del oponente como textura tipo "hologram card" antes de ir a geometría más compleja) y medir con `pnpm build && pnpm start` en un dispositivo de gama media antes de replicar el patrón a los otros 2.
5. El de "documentación" es el más arriesgado de justificar en esfuerzo/beneficio (un glosario se lee, no se admira) — considerar si de verdad necesita 3D o si un holograma es solo el "marco" decorativo alrededor de contenido 2D (más barato, mismo efecto visual "wow" con una fracción del coste de render).
6. Tests manuales obligatorios en gama baja/móvil real, no solo desktop — el usuario ya reportó antes que "en dev el rendimiento no es real" (medir siempre en build de producción).

**Riesgo:** alto — es la fase con más probabilidad de impactar rendimiento móvil, que es una preocupación explícita y recurrente del usuario en este proyecto. **Aceptación:** los 3 hologramas (o los que se decida hacer en 3D vs. 2D+marco) funcionan sin degradar el LCP/FPS medido en build de producción en gama media/baja, con fallback 2D correcto cuando el perfil de rendimiento lo pide.

---

## Fase 8 — Sincronización total del catálogo de cartas código↔BD (codegen) 🟠 medio

**Contexto (parte ya hecha).** Ya existe un guard barato ("Nivel 1", commit `ee4418e`): `pnpm db:validate` valida que las cartas usadas en los decks de las migraciones (arena/story/starter) existan en `cards_catalog`. Eso cubre el dolor de los decks de oponentes. Esta Fase 8 es el "Nivel 2" que se dejó aparcado a propósito.

**Diagnóstico.** Hay **dos catálogos de cartas** y no están sincronizados automáticamente:
- **BD `cards_catalog`** (fuente de verdad en prod): **121 cartas**. Lo consumen los modos reales (story, arena en prod, multijugador, colección, market) vía `loadAllActiveCards` / `loadCardsByIds`.
- **Código `CARD_BY_ID`** (`src/core/data/mock-cards/`): **~55-62 cartas**, mantenido a mano. Es un **subconjunto** y puede derivar.

`CARD_BY_ID` NO es solo un mock de tests: lo usan también (a) el *fallback* de arena si la BD falla y (b) el **tutorial de combate** ([create-tutorial-combat-loadout.ts](src/components/hub/academy/training/modes/tutorial/internal/create-tutorial-combat-loadout.ts)), que construye sus mazos desde `CARD_BY_ID` a propósito (guion fijo/reproducible). El motor del juego NO usa mocks: es agnóstico, opera sobre `ICard` venga de donde venga; lo único que cambia por modo es la **fuente** de las cartas. Riesgo latente: si alguien quita del código una carta que el tutorial referencia (`entity-chatgpt`, etc.), el tutorial lanza `Carta no disponible para tutorial` en runtime, sin aviso en CI.

**Qué hacer.**
1. **Generar `CARD_BY_ID` desde las migraciones/BD** (codegen). Como la "regla de oro" ya obliga a que toda carta tenga su `INSERT` en una migración, las migraciones son la fuente única → un script emite un TS generado (o un JSON) con las 121 cartas, y `CARD_BY_ID` se construye de ahí. Deriva imposible; cualquier carta activa queda usable en tests/fallback/tutorial.
2. **Viabilidad confirmada:** `cards_catalog` tiene todas las columnas necesarias para reconstruir `ICard` (id, name, description, type, faction, cost, attack, defense, archetype, trigger, effect jsonb, fusiones, `innate_passive_skill_id`, render/bg url). El mapeo ya existe (`mapCardCatalogRowToCard`), así que el codegen puede reutilizar esa lógica.
3. **Cuidado con lo hand-tuned:** los `mock-cards` usan helpers (`createEntity`) y campos como `renderFile`. Verificar que el generado produce `ICard` equivalentes (o mejor: unificar en el mapeo de BD) sin cambiar comportamiento. Comparar el catálogo generado vs. el actual carta a carta antes de sustituir.
4. **Regenerar en el flujo:** integrar el codegen como paso (o check) en `db:validate`/`quality:check` para que el TS generado no derive de las migraciones.
5. **Extender el guard al tutorial:** de paso, validar que las cartas que el tutorial referencia existan en el catálogo (hoy no está cubierto por el guard de Fase 8-nivel-1).

**Riesgo:** medio — toca la carga de cartas del tutorial y el fallback; el peligro es cambiar sutilmente `ICard`s existentes. Mitigación: diff carta-a-carta generado vs. actual y tests de motor verdes. **Aceptación:** `CARD_BY_ID` es espejo exacto de las cartas activas de `cards_catalog`; imposible que un modo en código (tutorial/fallback/tests) referencie una carta que no exista, y viceversa.

---

## Resumen de esfuerzo / orden sugerido

| Fase | Tema | Esfuerzo | Riesgo | Tipo | Estado |
|---|---|---|---|---|---|
| 1 | Cambio de nivel Arena sin recarga | Bajo | Bajo | Código (navegación) | ✅ hecha |
| 2 | VFX de las 10 pasivas V5 | Medio | Medio | Motor de combate + UI | ✅ hecha |
| 3 | Admin panel mobile (solo mobile; desktop perfecto) | Medio (9 páginas) | Bajo | UI/CSS | ✅ hecha |
| 4 | 2 oponentes nuevos agnósticos | Medio | Bajo-medio | Contenido/admin | ✅ hecha |
| 5+7 | Academy 3D (3 pilares holográficos) | Alto | Alto | 3D + rendimiento | ⬜ siguiente |
| 6 | Documentación interactiva (contenido del pilar Docs) | Medio-alto | Medio | Contenido + UI | ⬜ |
| 8 | Sincronización total catálogo (codegen) | Medio | Medio | Infra/build | 🅿️ aplazada |

**Orden: 1 ✅ → 2 ✅ → 4 ✅ → 3 ✅ → 5+7 (siguiente) → 6.** Las Fases 5 (UI Academy) y 7 (hologramas 3D) se **fusionan**: el rediseño de Academy ES la página de 3 pilares holográficos 3D (estilo pantalla de selección de campaña de StarCraft II). La Fase 6 (documentación) provee el contenido que abre el pilar de Documentación. La Fase 8 (codegen) queda **aplazada**: se hará solo si la deriva código↔BD vuelve a molestar; el guard de CI ya añadido cubre el dolor inmediato.

Razonamiento: las fases 1-2 son arreglos acotados en código ya existente (bajo riesgo, alto valor inmediato de "se siente pulido"). La fase 3 es ancha pero mecánica y aislable por sección. La fase 4 es sobre todo contenido y no bloquea ni depende de las demás — puede incluso avanzar en paralelo por otra persona. Las fases 5-7 son la pieza más grande y nueva (rediseño de Academy + documentación + 3D) y conviene abordarlas al final, con las bases de navegación (Fase 1) y VFX (Fase 2) ya sólidas para no rediseñar dos veces.

> **Sesión nueva por fase:** recomendable, especialmente para las fases 2 (motor de combate) y 7 (3D/rendimiento) — son las más sensibles y se benefician de una sesión con contexto dedicado en vez de una única sesión cargada con las 7 fases.
