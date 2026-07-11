# Guía de implementación — Lote de bugs/mejoras de testers (2026-07)

> Objetivo: arreglar 8 items reportados sin romper nada. Para cada uno: **diagnóstico** (causa raíz + archivo),
> **enfoque recomendado**, **archivos a tocar**, **riesgos** y **tests**. Al final, orden de ejecución sugerido.
>
> Contexto ya verificado (no re-investigar):
> - Motor de cartas mágicas: `resolve-execution.ts` + `resolve-execution-special-actions.ts` (ya existe
>   `suspendExecutionUntilCondition` para dejar una ejecución en `SET` cuando no se cumple la condición).
> - IA: `HeuristicOpponentStrategy.ts` (`choosePlay`, `chooseAttack`, `chooseModeChange`) + `select-opponent-play.ts`.
> - Arena: `player_training_progress.tier_stats` en BD **está limpio y es correcto por-tier** (verificado por SQL,
>   ver item 7). El catálogo `arena_tiers` tiene `required_wins_in_previous_tier = 6` en todos y el roster de BD
>   tiene los 6 miembros. El progreso SÍ se resetea por nivel.

---

## Item 1 — Modo Evolución no se adapta a móvil + falta botón "Volver a Arsenal"

**Diagnóstico**
- Componente: [`HomeEvolutionOverlay.tsx`](../../src/components/hub/home/HomeEvolutionOverlay.tsx). Se monta desde
  [`HomeDeckBuilderSceneView.tsx:72`](../../src/components/hub/home/internal/view/HomeDeckBuilderSceneView.tsx) cuando
  `evolutionOverlay` no es null.
- Es un overlay cinemático `pointer-events-none absolute inset-0 ... overflow-y-auto`. En móvil la carta va con
  `scale-[0.56]` pero el layout reserva el tamaño **sin escalar** (el `scale` es solo visual): eso, sumado al bloque
  de "copias" de altura fija y al `max-h-[92dvh]`, hace que el contenido rebase el viewport → **scroll raro**.
- Al ser `pointer-events-none` no hay forma de interactuar → falta un botón explícito para cerrar/volver a Arsenal.

**Antes de tocar:** confirmar cómo se cierra hoy el overlay (buscar el timeout/limpieza de `evolutionOverlay` en
`use-home-deck-builder-state.ts` / `home-deck-builder-types.ts`). Si auto-cierra por timer, el botón será un
"cerrar ahora"; si no auto-cierra, el botón es la única salida (crítico).

**Enfoque recomendado**
1. Layout responsivo real (no depender de `scale` para caber):
   - Usar `transform-origin` + `scale` **o** mejor, un tamaño de carta responsivo con clases (`w-[...]`) para que la
     caja ocupe lo que realmente mide. Evitar `scale-[0.56]` que engaña al layout.
   - Contenedor raíz: `flex flex-col items-center justify-center` con `overflow-hidden` (no `overflow-y-auto`) y usar
     `max-h-[100dvh]`; que el contenido interior nunca supere el alto disponible en móvil (reducir tamaño de la
     animación de copias y márgenes en breakpoint móvil).
2. Botón "Volver a Arsenal":
   - Añadir un botón con `pointer-events-auto` (el overlay raíz es `pointer-events-none`, así que el botón debe
     rehabilitarlos en su subárbol) que invoque un `onClose`/`onDismiss` nuevo.
   - `HomeEvolutionOverlay` recibe una prop `onClose?: () => void`; el orquestador
     (`HomeDeckBuilderScene` → `create-home-deck-builder-view-props.ts`) la conecta a limpiar `evolutionOverlay`
     (`setEvolutionOverlay(null)`).
   - Reutilizar el patrón visual de `AcademyBackButton` para consistencia.

**Archivos a tocar**
- `src/components/hub/home/HomeEvolutionOverlay.tsx` (layout + botón + prop `onClose`).
- `src/components/hub/home/internal/view/HomeDeckBuilderSceneView.tsx` (pasar `onClose`).
- `src/components/hub/home/internal/view/create-home-deck-builder-view-props.ts` y/o
  `use-home-deck-builder-state.ts` (exponer el setter que limpia el overlay).
- Ojo: el overlay también se usa en el tutorial
  [`TutorialArsenalClient.tsx:121`](../../src/components/hub/academy/tutorial/nodes/arsenal/TutorialArsenalClient.tsx)
  → `onClose` debe ser **opcional** para no romper esa llamada (o conectarla también).

**Riesgos**: el tutorial de arsenal depende de este overlay (hace `forceBottomPlacement` cuando está visible). Si se
añade botón, verificar que no interfiere con el flujo guiado. Mantener `onClose` opcional.

**Tests**: `HomeEvolutionOverlay.test.tsx` (añadir caso: render con `onClose` muestra botón y lo invoca al click).
Verificación manual en viewport móvil (375px) de que no hay scroll y el botón cierra.

---

## Item 2 — Doble click en carta de entidad: alterna ATTACK ⇄ DEFENSE

**Diagnóstico**
- [`handleOwnEntityClick.ts`](../../src/components/game/board/hooks/internal/player-actions/handleOwnEntityClick.ts):
  - Línea ~112-118: si la entidad está en `DEFENSE`/`SET`, el click **solo** la selecciona (abre detalle). No hay
    doble-click para volver a `ATTACK`.
  - Línea ~119-130: si está en `ATTACK` y es el atacante activo, `event.detail >= 2` (doble click) la pasa a `DEFENSE`.
- Falta la ruta simétrica: doble click en una entidad `DEFENSE` → `ATTACK`.

**Enfoque recomendado**
- En el bloque `if (entity.mode === "DEFENSE" || entity.mode === "SET")`: distinguir `DEFENSE` de `SET`
  (a `SET` no se le aplica — es carta boca abajo de ejecución/trampa). Para `DEFENSE` de una **entidad**, si
  `event.detail >= 2`, llamar `GameEngine.changeEntityMode(..., "ATTACK")`.
- Respetar las mismas guardas que el sentido inverso: sólo en `phase === "BATTLE"`, `!hasAttackedThisTurn`, y
  respetar `modeLock` (ya lo respeta `updateEntityModes` en `change-entity-mode.ts:13` — no cambia si `modeLock`
  bloquea el nuevo modo). Añadir: no permitir si `isNewlySummoned` (coherencia con reglas de invocación) — **verificar**
  qué regla aplica hoy al pasar ATTACK→DEFENSE para replicarla exactamente y no crear una asimetría.

**Archivos a tocar**
- `src/components/game/board/hooks/internal/player-actions/handleOwnEntityClick.ts` (única lógica).

**Riesgos**: bajo. Es UI-local (no multiplayer: el cambio de modo propio es cosmético hasta atacar). No tocar el
motor. Cuidado de no romper el flujo de selección/detalle: tras el toggle, seguir seleccionando la carta.

**Tests**: no hay test unitario del handler hoy; añadir uno o cubrir con integración de tablero. Mínimo: verificación
manual (doble click DEFENSE→ATTACK y ATTACK→DEFENSE en el mismo turno).

---

## Item 3 — Scroll del grid de mercado (barra y móvil) + skeleton de carga

**Diagnóstico**
- [`MarketListingsPanel.tsx`](../../src/components/hub/market/listings/MarketListingsPanel.tsx): `<section>` con
  `overflow-y-auto` sobre un CSS grid. El comentario del archivo ya documenta que se quitó `content-visibility` por
  cajas grises en móvil. El "se corta / va mal con la barra de scroll" apunta a: el contenedor de scroll y el grid
  compiten por altura, y las imágenes `next/image` lazy provocan reflow al aparecer (salto de scroll al arrastrar).
- Contenedor padre móvil: [`MarketMobileStack.tsx:88`](../../src/components/hub/market/layout/MarketMobileStack.tsx)
  (`min-h-0 flex-1 overflow-hidden` → el panel interno hace el scroll). Verificar también el equivalente desktop
  (`MarketDesktopGrid.tsx`).

**Enfoque recomendado**
1. Estabilizar el scroll:
   - Asegurar cadena `min-h-0` correcta desde el contenedor flex padre hasta el `<section>` scrollable (si algún
     ancestro no propaga `min-h-0`, el scroll "salta").
   - Reservar espacio de imagen para evitar reflow: las celdas ya tienen `aspect-[5/7]` y la miniatura
     `aspect-[13/19]` — confirmar que la imagen tiene dimensiones/`sizes` correctos para que no cause layout shift al
     cargar (principal causa del "salto" al arrastrar la barra).
   - `scrollbar-gutter: stable` en el `<section>` para que la barra no reajuste el ancho del grid.
2. Skeleton / loading dentro de las celdas (petición explícita del usuario):
   - En vez de celda vacía esperando la imagen, mostrar un **skeleton** de fondo (placeholder shimmer) **detrás** de
     `CardThumbnail`, que desaparece cuando la imagen carga. Opción simple: `next/image` con
     `placeholder="blur"`/`blurDataURL` o un fondo de skeleton por CSS en la celda que la imagen tapa al pintarse.
   - Así el usuario ve "contenedores con loading" en lugar de huecos, y el reflow desaparece porque la celda ya
     ocupa su tamaño final.

**Archivos a tocar**
- `src/components/hub/market/listings/MarketListingsPanel.tsx` (skeleton + `scrollbar-gutter`).
- `src/components/game/card/CardThumbnail.tsx` (revisar cómo carga la imagen; posible sitio del skeleton/blur).
- Revisar `MarketMobileStack.tsx` / `MarketDesktopGrid.tsx` sólo si la cadena `min-h-0` está rota.

**Riesgos**: **rendimiento** — hay historial de problemas (ver el comentario del archivo y memoria
`perf-work-context`). No reintroducir `content-visibility` ni animaciones pesadas por celda. El skeleton debe ser CSS
puro (sin JS por celda) para no degradar el scroll con ~100 cartas. Probar en móvil real / throttling.

**Tests**: `MarketListingsPanel.test.tsx` (ajustar si cambia el DOM). Verificación manual de scroll con barra + drag
rápido en móvil.

---

## Item 4 — Market: filtro de tipo "Fusiones" + orden por ATK y por DEF

**Diagnóstico (¡la lógica ya existe!)**
- [`market-filters.ts`](../../src/components/hub/market/market-filters.ts): `MarketOrderField` ya incluye `ATTACK` y
  `DEFENSE`. `MarketTypeFilter = "ALL" | CardType` y `CardType` ya incluye `FUSION`.
- [`market-listing-view.ts`](../../src/components/hub/market/market-listing-view.ts): ya ordena por `ATTACK`/`DEFENSE`
  y filtra por tipo genéricamente. **No hay que tocar la lógica.**
- Sólo faltan las **opciones en los selects**:
  [`market-filter-options.ts`](../../src/components/hub/market/layout/market-filter-options.ts) — `MARKET_TYPE_OPTIONS`
  no tiene "Fusión" y `MARKET_ORDER_OPTIONS` no tiene "Ataque"/"Defensa".

**Enfoque recomendado**
- Añadir a `MARKET_TYPE_OPTIONS`: `{ value: "FUSION", label: "Fusiones" }` (y valorar `ENVIRONMENT` si se vende).
- Añadir a `MARKET_ORDER_OPTIONS`: `{ value: "ATTACK", label: "Ataque" }`, `{ value: "DEFENSE", label: "Defensa" }`.
- Copiar el mismo set de labels que ya usa Arsenal ([`home-action-options.ts`](../../src/components/hub/home/home-action-options.ts))
  para consistencia.

**Verificar**: que el mercado realmente lista cartas `FUSION` (`market_card_listings` / catálogo). Si las fusiones no
se venden, el filtro mostrará vacío — decidir si se incluye igualmente o se omite. (`cards_catalog` tiene 120 filas;
comprobar cuántas son FUSION antes de prometer resultados.)

**Archivos a tocar**: `src/components/hub/market/layout/market-filter-options.ts` (1 archivo).

**Riesgos**: mínimo. **Tests**: `market-listing-view.test.ts` ya cubre el orden; añadir caso FUSION si aplica.

---

## Item 5 — Arsenal: orden por Nivel y por Versión

**Diagnóstico**
- [`home-filters.ts`](../../src/components/hub/home/home-filters.ts): `HomeCollectionOrderField = "NAME" | "ATTACK" | "DEFENSE" | "ENERGY"`.
- [`home-collection-view.ts`](../../src/components/hub/home/home-collection-view.ts): ordena por esos campos; **no**
  contempla `level` ni `versionTier`.
- [`home-action-options.ts`](../../src/components/hub/home/home-action-options.ts): `HOME_ORDER_OPTIONS` sin nivel/versión.
- `ICard` ya tiene `level` y `versionTier` opcionales ([`ICard.ts:202-203`](../../src/core/entities/ICard.ts)).
  **Verificar** que las cartas de la colección (`ICollectionCard`) llevan `level`/`versionTier` hidratados (deberían,
  ya que el arsenal muestra versión/nivel). Confirmar en `ICollectionCard` / el builder de la colección.

**Enfoque recomendado**
1. Ampliar el tipo: `HomeCollectionOrderField = ... | "LEVEL" | "VERSION"`.
2. En `buildHomeCollectionView`, añadir ramas: `LEVEL` → `card.level ?? 1`; `VERSION` → `card.versionTier ?? 1`.
   Mantener el desempate por nombre (ya presente). Reutilizar el patrón numérico existente.
3. Añadir opciones a `HOME_ORDER_OPTIONS`: `{ value: "LEVEL", label: "Nivel" }`, `{ value: "VERSION", label: "Versión" }`.

**Archivos a tocar**: `home-filters.ts`, `home-collection-view.ts`, `home-action-options.ts`. Revisar que
`HomeDeckActionBar`/`HomeDeckFilterControls` pasan `orderField` sin whitelists que excluyan los nuevos valores.

**Riesgos**: bajo. **Tests**: `home-collection-view.test.ts` — añadir casos de orden por LEVEL y VERSION (asc/desc y
desempate).

---

## Item 6 — IA: mantener en DEFENSE cartas de alta defensa (no dejarlas en ATTACK)

**Diagnóstico**
- Decisión de modo al **jugar** una entidad:
  [`select-opponent-play.ts` `resolveEntityMode`](../../src/core/services/opponent/select-opponent-play.ts) (línea ~16).
  Hoy: fuerza ATTACK si hay presión; DEFENSE sólo si `defense > attack && defense >= rivalBestAttack`; si no,
  `attack >= defense ? ATTACK : DEFENSE`. Una carta tanque (alta defensa) con `attack >= defense` acaba en ATTACK.
- Cambio de modo **en batalla**:
  [`HeuristicOpponentStrategy.chooseModeChange`](../../src/core/services/opponent/HeuristicOpponentStrategy.ts) (línea ~99).
  **Sólo** contempla `DEFENSE → ATTACK`. **No existe** ninguna ruta `ATTACK → DEFENSE`: una entidad que quedó en
  ATTACK y ahora es vulnerable nunca se repliega. **Esta es la causa principal del reporte.**

**Enfoque recomendado** (dos frentes, incrementales)
1. `chooseModeChange`: añadir lógica `ATTACK → DEFENSE` cuando:
   - La entidad **no** puede ganar ningún trade atacando (su `attack` < mejor defensa/vida alcanzable), y
   - Su `defense` la haría sobrevivir a la mejor amenaza rival (`defense >= rivalBestAttack`), y
   - No es necesaria para presión letal (el rival no está a rango de daño directo que convenga rematar).
   - Respetar `modeLock`, `isNewlySummoned`, `hasAttackedThisTurn` (una entidad que ya atacó no debería replegarse ese
     turno — coherencia con la regla existente).
   - Sesgar por estilo: perfiles `control`/baja `aggression` se repliegan más; `aggressive` menos.
2. `resolveEntityMode` (opcional, refuerzo): para cartas claramente tanque (`defense` alto y `defense > rivalBestAttack`)
   preferir DEFENSE aunque `attack >= defense`, salvo que `shouldForcePressure`.

**Archivos a tocar**
- `src/core/services/opponent/HeuristicOpponentStrategy.ts` (`chooseModeChange`).
- Opcional: `src/core/services/opponent/select-opponent-play.ts` (`resolveEntityMode`).
- El runner `runBattlePhaseStep.ts` **ya** invoca `chooseModeChange` cuando no hay ataque → no tocar el runner.

**Riesgos**: **equilibrio y bucles**. Un mal criterio puede (a) volver la IA pasiva, o (b) generar oscilación
ATTACK⇄DEFENSE. Mitigar: la decisión sólo se ejecuta **cuando no hay ataque disponible** (ver `runBattlePhaseStep`),
y sólo una vez por entidad por turno (marcar/derivar del estado). Cubrir con tests deterministas.

**Tests**: hay una batería extensa (`HeuristicOpponentStrategy.*.test.ts`, `attackEvaluator.test.ts`). Añadir
`HeuristicOpponentStrategy` casos: tanque vulnerable en ATTACK sin trade → se repliega a DEFENSE; entidad que puede
ganar trade → se queda/ataca; respeta `modeLock`/`hasAttackedThisTurn`. **No** debe romper los tests de flujo de
batalla existentes.

---

## Item 7 — Arena: al subir de nivel los 6 oponentes deben reajustarse (empieza en 0/6)

**Diagnóstico (verificado contra BD de producción)**
- Modelo: `player_training_progress.tier_stats` = `[{tier, wins, matches}]` **por nivel**. `ladderWins` y el rival al
  que te enfrentas se derivan de `tierStats[tierActual].wins`
  ([`arena/page.tsx:35,47`](../../src/app/hub/academy/training/arena/page.tsx)).
- **La BD está limpia**: p.ej. un jugador con `tier1:6/6, tier2:6/6, tier3:1/1`. Un nivel recién desbloqueado **sí**
  empieza en `wins:0` → 0/6 completados. El reseteo por nivel **ya funciona** en datos actuales.
- **Bug real detectable en el código** (no en datos): el ladder del lobby usa `ladderWins` **crudo** (sin normalizar):
  - [`TrainingArenaLobby.tsx:132`](../../src/components/hub/academy/training/modes/arena/internal/TrainingArenaLobby.tsx):
    `isBeaten = index < props.ladderWins`.
  - Pero el rival se elige con `ladderIndex = tierWins % roster.length`
    ([`resolve-training-opponent-loadout.ts:111`](../../src/services/training/resolve-training-opponent-loadout.ts)).
  - Si un tier se **rejuega** más de 6 veces (existe en BD: un jugador con `tier1: 14 wins`), el ladder muestra los
    **6 en verde** mientras te enfrentas al rival `14 % 6 = 2`. **Desincronización** entre "monedas" y rival real.
    Esto es lo más parecido a "empiezas con oponentes ya completados".

**Enfoque recomendado**
1. Normalizar la progresión del ladder al bucle actual: pasar a la UI
   `ladderWins = tierWins % rosterSize` (y no el crudo), de modo que las "monedas" **siempre** coincidan con el rival
   que toca y se reinicien visualmente cada vuelta.
   - Cuidado: cuando `tierWins` es múltiplo exacto de `rosterSize` y > 0 (nivel completado), `wins % size == 0`
     mostraría 0/6. Definir semántica de producto: (a) mostrar 0/6 "vuelta nueva", o (b) badge "✓ Nivel completado".
     Recomendado: mostrar la vuelta actual (0/6) **más** un indicador de "completado" si `tierWins >= rosterSize`.
2. Confirmar (ya verificado) que el escalado de mazos por nivel sube versión/nivel: **ya ocurre** vía
   `defaultScaling` del tier (`training-card-scaling.ts` + `arena_tiers.default_*`). No requiere cambio.
3. **Antes de codificar**: pedir al tester el `player_id`/nivel exacto donde vio "3-4 completados en un nivel nuevo".
   Con la BD actual no se reproduce en un nivel recién desbloqueado; el candidato firme es el punto (1). Si el tester
   confirma que fue tras rejugar, (1) lo resuelve.

**Archivos a tocar**
- `src/app/hub/academy/training/arena/page.tsx` (normalizar `ladderWins` que se pasa al cliente) **o**
  `TrainingArenaLobby.tsx` (normalizar en el render). Preferible en `page.tsx` para mantener la UI tonta.
- Posible ajuste del texto "Combate X de N".

**Riesgos**: cambio de UX de progreso; no toca persistencia ni desbloqueos (seguro). Verificar que no rompe el caso
normal 0..5. **Tests**: añadir a la suite de `resolve-training-opponent-loadout`/lobby un caso `wins=7` → ladder
muestra vuelta (1 beaten) coherente con rival `7 % 6 = 1`.

---

## Item 8 — Cartas mágicas: si no se pudieron activar, reactivar en un turno posterior

**Diagnóstico**
- Ya existe el mecanismo correcto para **acciones especiales**:
  [`resolve-execution-special-actions.ts` `suspendExecutionUntilCondition`](../../src/core/use-cases/game-engine/actions/internal/resolve-execution-special-actions.ts)
  deja la ejecución en `SET` (reactivable) cuando falta condición: fusión sin materiales, revelar sin objetivo, lock
  sin objetivo. **Fusiones ya cubiertas.**
- **Falta la ruta estándar**: en [`resolve-execution.ts:82-87`](../../src/core/use-cases/game-engine/actions/resolve-execution.ts),
  los efectos del **registry** (`applyExecutionEffect`) **siempre** consumen la carta al cementerio, aunque no hubiera
  objetivo válido. Ej. del usuario: `BOOST_ATTACK_ALLIED_ENTITY` (+ATK) sin entidades aliadas → no hace nada y **se
  desperdicia**. Debe suspenderse en `SET` para reactivar luego.
- Los handlers del registry ya devuelven info suficiente para saber si "acertaron":
  [`execution-effect-registry.ts`](../../src/core/use-cases/game-engine/actions/internal/execution-effect-registry.ts)
  — `buff.entityIds` vacío = ningún aliado afectado; `REDUCE_OPPONENT_ATTACK` `targetIds` vacío; `DESTROY_ALL_TRAPS`
  `destroyedCardIds` vacío; `DISCARD_OPPONENT_HAND_CARD` `discardedCardIds` vacío.

**Enfoque recomendado**
1. Definir qué efectos **requieren objetivo** y cuáles **siempre resuelven** (aunque el resultado sea 0):
   - Siempre resuelven: `DAMAGE`, `HEAL`, `DRAW_CARD`, `RESTORE_ENERGY`, `DRAIN_OPPONENT_ENERGY`, `SET_CARD_DUEL_PROGRESS`.
   - Requieren objetivo (suspender si no hay): `BOOST_ATTACK_ALLIED_ENTITY`, `BOOST_*_BY_ARCHETYPE`,
     `SET_DEFENSE_BY_CARD_ID`, `BOOST_DEFENSE_BY_CARD_ID`, `REDUCE_OPPONENT_ATTACK/DEFENSE`, `DESTROY_ALL_TRAPS`,
     `DISCARD_OPPONENT_HAND_CARD`.
   - **Reutilizar la fuente de verdad que ya existe**: `canActivateExecutionNow` en `select-opponent-play.ts:50`
     **ya** codifica exactamente "¿este efecto tiene objetivo válido ahora?" para cada acción. Extraerla/compartirla
     para no duplicar la tabla de condiciones.
2. En `resolveExecution` (ruta estándar): **antes** de aplicar y consumir, si el efecto requiere objetivo y no lo hay,
   suspender en `SET` (mismo patrón que `suspendExecutionUntilCondition`, que hoy vive en special-actions — extraer a
   un helper compartido de estado). No mover a cementerio, no aplicar el efecto.
3. UX: al reactivar, el jugador hace click y vuelve a intentar (el flujo de `useExecutionActivation` ya reactiva un
   `SET`). Verificar que `canActivateSelectedExecution` permite reintentar (sí: exige `mode === "SET"`).

**Punto crítico de seguridad (IA)**: la IA en `runMainPhaseStep.ts:78` activa un `SET` sólo si
`canActivateExecutionNow(...)` es true. Como suspenderíamos **exactamente** cuando esa función es false, **la IA no
entra en bucle** (no reintentará activar algo sin objetivo). Mantener ambas rutas usando la MISMA función es lo que
garantiza que no haya bucle infinito ni en jugador ni en IA.

**Archivos a tocar**
- `src/core/use-cases/game-engine/actions/resolve-execution.ts` (rama estándar: comprobar objetivo → suspender o resolver).
- Extraer helper compartido de "suspender en SET" (hoy privado en `resolve-execution-special-actions.ts`) a
  `.../state/` o un internal común, y una función `executionHasValidTarget(effect, player, opponent)` derivada de
  `canActivateExecutionNow` (mover la parte reutilizable a `core/services/...` o `core/use-cases/...` sin dependencia
  circular — `select-opponent-play` es de `services/opponent`, así que conviene mover la tabla de condiciones a un
  módulo neutral de `core` e importarla desde ambos lados).
- `execution-effect-registry.ts` / helpers: no debería requerir cambio si decidimos por-acción arriba en `resolveExecution`.

**Riesgos**: **alto** — es motor de reglas con mucha cobertura. Riesgos: (a) suspender efectos que sí deberían gastarse
(p.ej. `HEAL` a vida llena → **debe** resolver, no suspender); (b) bucle IA (mitigado compartiendo `canActivateExecutionNow`);
(c) romper tests de `resolve-execution*.integration.test.ts`. Hacerlo **por lista explícita** de acciones que requieren
objetivo, no por heurística de "resultado vacío" (evita suspender un `HEAL` de 0). Sincronización multiplayer: la
suspensión debe ser determinista (lo es: depende sólo del estado) — el `emitLocalAction({type:"RESOLVE_EXECUTION"})`
seguirá replicando el mismo cálculo en el rival.

**Tests**: nuevos en `resolve-execution.*`: `BOOST_ATTACK_ALLIED_ENTITY` sin aliados → queda `SET` y reactivable;
con aliados → resuelve y va a cementerio; `HEAL` a vida llena → resuelve (no suspende); `DESTROY_ALL_TRAPS` sin
trampas → `SET`. Test de no-regresión IA: `runMainPhaseStep`/`canActivateExecutionNow` siguen coherentes.

---

## Orden de ejecución sugerido (de menor a mayor riesgo)

1. **Item 4** (market: opciones de filtro/orden) — 1 archivo, trivial.
2. **Item 5** (arsenal: orden nivel/versión) — 3 archivos, aislado.
3. **Item 2** (doble click DEFENSE→ATTACK) — 1 archivo, UI-local.
4. **Item 1** (evolución móvil + botón volver) — UI + wiring de `onClose`.
5. **Item 3** (scroll market + skeleton) — UI + cuidado de rendimiento.
6. **Item 6** (IA repliega tanques) — motor de IA, requiere tests.
7. **Item 8** (reactivación de mágicas ruta estándar) — motor de reglas, mayor riesgo, requiere refactor de helper
   compartido + tests.
8. **Item 7** (arena ladder normalizado) — confirmar repro con el tester antes; cambio de UI seguro.

**Regla del proyecto**: usar `pnpm` (no npm). Antes de commitear cada bloque, correr el check completo con exit code
real: `CI=true pnpm quality:check`. Trabajar en la rama actual `features/mission-sort-and-news-dismiss` o crear ramas
por bloque según convenga.

---

## Estado de implementación (2026-07-11)

Items 1-6 y 8 implementados. **Item 7 apartado** por decisión del usuario: al probar de nuevo iba bien; el caso
observado era progreso antiguo persistido en BD de un tester, no un bug de código (la BD está limpia y el reseteo por
nivel funciona). No se detectó vulnerabilidad. Se deja documentado el fix opcional de `ladderWins % rosterSize` por si
reaparece al rejugar.

Desviaciones/notas respecto al plan inicial:

- **Item 5**: nivel/versión NO viven en `card` (que es la carta base del catálogo) sino en `cardProgressById`
  (progreso por jugador). Se pasó ese mapa a `buildHomeCollectionView` y se ordena con él (`resolveCardLevel` /
  `resolveCardVersion`), con la carta base como fallback determinista. Tests añadidos.
- **Item 1**: `Card` es de tamaño fijo (`h-[380px] w-[260px]`); el "scroll raro" venía de escalar con `scale` sin
  reducir la caja de layout. Fix: caja contenedora dimensionada al tamaño ya escalado (`CARD_*_PX * cardScale`),
  `transform-origin: top-left`, root `overflow-hidden`, y botón "Volver a Arsenal" (`onClose` opcional, cableado por la
  cadena de props; el tutorial no lo pasa y sigue funcionando).
- **Item 3**: el reflow no era de layout (las celdas ya fijan proporción); el problema es el arte lazy (`next/image`)
  que llega en negro al hacer scroll rápido. Fix: skeleton (pulse) en la zona de arte de `CardThumbnail` activable por
  prop `showArtSkeleton` (solo el mercado lo usa; se retira al primer `onLoad`), + `scrollbar-gutter: stable`. Se
  convirtió `CardThumbnail` a client (usa `useState` para el estado de carga). **Pendiente**: verificación visual en
  dispositivo/móvil real del scroll con barra.
- **Item 6**: `chooseModeChange` refactorizado en `chooseDefenderToAttack` (existente) + `chooseAttackerToDefend`
  (nuevo repliegue). Guard anti-oscilación: sólo se replega un tanque que NO puede ganar ningún intercambio atacando,
  de modo que la promoción no lo re-sube (terminación monótona). Tests añadidos.
- **Item 8**: se extrajo `suspendExecutionInSet` a un helper compartido (`internal/suspend-execution.ts`) y se añadió
  `executionStandardEffectHasUnmetTarget` (`internal/execution-target-guards.ts`) alineado con `canActivateExecutionNow`
  de la IA → la IA nunca activa algo que aquí se suspendería (sin bucle). El guard actúa DESPUÉS de la resolución de
  trampa reactiva (consistente con la fusión sin materiales existente). La ruta estándar suspende en SET en vez de
  lanzar error/consumir. UI: nuevo estado `NO_TARGET` con banner "Magia · Sin objetivo válido". El test que esperaba
  que `BOOST_ATTACK_ALLIED_ENTITY` sin aliados lanzara error se actualizó al nuevo comportamiento (era exactamente el
  bug reportado: la carta se quedaba en ACTIVATE y bloqueaba el turno).

Verificación ejecutada: `pnpm typecheck` ✅, `pnpm lint` ✅, tests de las áreas tocadas (motor/oponente/multijugador
193 ✅, UI board/home/market 139 ✅). **Pendiente antes de release**: verificación visual en móvil de Items 1 y 3, y
`pnpm quality:check` completo (incluye build + coverage + db:validate).
