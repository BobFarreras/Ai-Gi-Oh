<!-- docs/audits/2026-07-09-auditoria-overworld-interaccion-persistencia-y-combate-movil.md - Auditoría y guía de remediación de 4 incidencias: atributos flotantes en combate móvil, interacción por botón en overworld, animación de recogida de cartas y persistencia de eventos en BD. -->
# Auditoría y guía — Overworld (interacción/persistencia) y combate móvil

## 1. Alcance y método
- Fecha: 9 de julio de 2026.
- Rama: `fix/overworld-interaction-persistence-and-mobile-combat` (desde `develop`).
- Alcance: motor y escena del overworld (`components/hub/story/overworld/*`, `services/story/overworld/*`, `app/api/story/overworld/*`) y capa de render de cartas en tablero (`components/game/card/*`, `components/game/board/battlefield/*`).
- Método: lectura estática del motor imperativo, de la escena React que lo orquesta, de las rutas API de persistencia y del render holográfico de cartas. Sin cambios de comportamiento todavía; este documento es el plan previo a implementar.
- Reglas aplicadas (`Agents.md`): SRP y límite de 150 líneas/archivo, código en inglés / docs y UI en español, tipado estricto sin `any`, TDD, cabecera de ruta por archivo, sin parches temporales.

## 2. Resumen ejecutivo
Cuatro incidencias, dos de UX de percepción y dos de corrección funcional. La #4 (persistencia) es la de mayor impacto porque hay pérdida real de estado entre dispositivos. Orden de ataque recomendado: **#4 → #2 → #3 → #1** (persistencia y modelo de interacción primero, porque #2 y #3 dependen del mismo cambio de trigger; el pulido de combate #1 es independiente).

| # | Incidencia | Severidad | Naturaleza |
|---|------------|-----------|------------|
| 4 | Eventos del overworld se guardan solo en `localStorage` → reaparecen en otro navegador | **Alta** | Corrección (pérdida de estado) |
| 2 | Nexus/cartas/eventos se disparan al pasar/chocar (STEP_ON/BUMP); animación brusca y valor de Nexus duplicado | **Media-alta** | Corrección + UX |
| 3 | Falta animación de recogida de carta (mostrar UI de `Card` y encoger) | Media | UX |
| 1 | En móvil las cartas del tablero no muestran los atributos "flotantes" del desktop | Media | UX / rendimiento |

---

## 3. Hallazgos detallados

### 3.1 (#4) Persistencia de eventos en el navegador, no en BD — **causa raíz**
- Evidencia:
  - `src/components/hub/story/overworld/OverworldDevScene.tsx` — `seenEventsStorageKey`, `loadSeenEvents`, `persistSeenEvents`, `markEventSeen`.
  - `src/app/api/story/overworld/mark-interacted/route.ts` — endpoint que YA persiste eventos en BD (solo acepta nodos `nodeType === "EVENT"`).
  - `src/services/story/overworld/get-story-overworld-runtime.ts` — carga inicial de `interactedNodeIds` desde el repositorio.
- Diagnóstico:
  - Las **recompensas** (Nexus/carta) sí se persisten en servidor vía `claim-reward` (idempotente por `interactedNodeIds`), y las llaves y el evento-puente (`ACT2_BRIDGE_EVENT_ID`) también. Estos **no** reaparecen entre navegadores.
  - Los **eventos genéricos** (`EVENT`/`NPC`: diálogos, vídeos, cutscenes) se marcan como vistos **solo** en `localStorage` (`markEventSeen`). `localStorage` es por-navegador, así que al iniciar sesión en otro navegador `seenEventIdsRef` arranca vacío de esos ids (la carga inicial solo trae `interactedNodeIds` del servidor, que no los incluye) y **el evento se vuelve a disparar**.
  - El endpoint `mark-interacted` ya existe y hace exactamente lo que hace falta, pero el cliente solo lo invoca para `ACT2_BRIDGE_EVENT_ID` (en `closeVideo`).
- Conclusión: la corrección es persistir en BD todo evento visto (no solo el puente) y sembrar el estado inicial desde el servidor. `localStorage` puede quedar como caché optimista, nunca como fuente de verdad.

### 3.2 (#2) Trigger por pisada/choque y Nexus duplicado
- Evidencia:
  - `services/story/overworld/act-1-overworld-tilemap.ts` y `act-2-overworld-tilemap.ts` — recompensas con `trigger: "BUMP"`, eventos con `trigger: "STEP_ON"`.
  - `OverworldEngine.ts` — `tryStartStep` → `emitObjectBump` (choque); `triggerStepOnInteractable` (pisada). Los `BUMP` se excluyen de `interactables` (foco) y se resuelven al chocar.
  - `OverworldDevScene.tsx` — handler `onIntent`: `claimReward` marca `markEventSeen` **después** de que resuelva el `fetch`.
- Diagnóstico del duplicado de Nexus: al mantener la dirección contra un nodo `BUMP`, se emiten varios intents `BUMP` seguidos **antes** de que el primer `claimReward` resuelva y marque el id como visto. El guard `seenEventIdsRef.current.has(object.id)` aún no aplica → varias llamadas a `claimReward`. El servidor evita el doble abono (`alreadyClaimed`), pero el cliente reproduce varias etiquetas flotantes `+N` y SFX → "se duplica el valor de las Nexus". La animación "brusca" es el tirón de disparar al vuelo mientras el jugador sigue andando.
- Conclusión: dos cambios complementarios:
  1. Cambiar el trigger de recompensas y eventos interactivos a `ADJACENT_ACTION` (pulsar el botón), de modo que el jugador se detenga frente al nodo y decida.
  2. Añadir un **guard de "en vuelo"** (set de ids reclamándose) para blindar el duplicado aunque se pulse rápido — el trigger por botón lo reduce pero no lo elimina por sí solo.

### 3.3 (#3) Animación de recogida de carta
- Evidencia:
  - `OverworldEngine.ts` — `collectReward` + `resolveCollectEffectRender`: ya existe una animación de "encoger hacia el jugador" con etiqueta flotante, dibujada en canvas por `Renderer2D`.
  - `components/game/card/Card.tsx` — componente `Card` (UI React) que se quiere mostrar en grande antes de encoger.
- Diagnóstico: hoy la recogida es solo un sprite que se encoge en el canvas. Falta el "beat" de presentación: mostrar la UI real de `Card` (React, fuera del canvas) y luego encogerla hacia el jugador. Es aditivo; no rompe el flujo actual.
- Conclusión: introducir un overlay React de recogida para nodos `REWARD_CARD` (y opcionalmente `REWARD_NEXUS`): al confirmar la recogida se muestra la `Card` a tamaño de lectura, breve pausa, y una transición de encogido/traslado. Reutiliza `Card` y la posición del jugador ya conocida. Mantener la animación de canvas como respaldo/energía visual o sustituirla; a decidir.

### 3.4 (#1) Atributos "flotantes" ausentes en combate móvil
- Evidencia:
  - `components/game/card/internal/CardHologram.tsx` — modo `full` (desktop): render 3D grande + columna de atributos flotante (`translateZ`/`rotateX`) con bobbing infinito y blurs pesados. Modo `lite` (móvil): imagen estática + badge de stats pequeño abajo, **sin** la columna flotante.
  - `SlotCellEntity.tsx` — `hologramMode={isMobileLayout || shouldReduceCombatEffects ? "lite" : "full"}`.
  - `resolve-board-performance-profile.ts` — móvil/CPU baja degradan efectos.
- Diagnóstico: en móvil se perdió la lectura "flotante" de atributos por rendimiento. Lo caro del modo `full` no son los números, sino: animación `repeat: Infinity`, `blur-[60px]`/`blur-xl`, imagen de 420px y sombras. La columna de atributos en sí es barata (un `AnimatedStatNumber` que cuenta una vez).
- Conclusión: crear una lectura de atributos flotante **económica** para móvil: la columna de stats con la inclinación 3D (`translateZ`/`rotateX`) como el desktop, pero **sin** bobbing infinito ni blurs de filtro (glow con gradiente radial, como ya hace el `lite` actual). Mantener la imagen estática del `lite`. Así se recupera la sensación del desktop sin volver al coste que se quería evitar.

---

## 4. Plan de remediación por fases (TDD, SRP, ≤150 líneas)

### Fase A — Persistencia de eventos en BD (#4)  ·  *máxima prioridad*
1. Extraer un pequeño cliente de persistencia de overworld (`services/story/overworld/*` lado cliente o hook) que envuelva `mark-interacted` y encapsule "marcar evento visto en servidor" (SRP; hoy está inline en la escena).
2. En `OverworldDevScene`, al marcar un evento como visto llamar a ese cliente (además del caché local). Excepción explícita: `ACT2_BIGLOG_TRIGGER_ID` (se re-dispara hasta vencer su duelo; no se persiste).
3. Sembrar `seenEventIdsRef` **solo** desde `interactedNodeIds` del servidor + el caché local como aceleración (nunca al revés).
4. Verificar en `mark-interacted` que todos los ids de evento a persistir están registrados como `nodeType === "EVENT"` en el registry (si alguno es `NPC` u otro tipo, ampliar el contrato del endpoint de forma controlada).
5. Tests: unidad del cliente (mock fetch, idempotencia, error de red no rompe UX) y del sembrado inicial.

### Fase B — Interacción por botón + anti-duplicado (#2)
1. Cambiar `trigger` de recompensas (`REWARD_NEXUS`/`REWARD_CARD`) y eventos interactivos visibles de `BUMP`/`STEP_ON` a `ADJACENT_ACTION` en los tilemaps de Acto 1 y Acto 2. Revisar `collision`/celda del nodo para que el jugador se detenga adyacente (los nodos de acción viven en celda no transitable). Mantener triggers ocultos (`hidden: true`) que deban seguir siendo automáticos si son de guionizado (a decidir caso por caso).
2. En `OverworldEngine`, confirmar que los nodos `ADJACENT_ACTION` entran en `interactables` (foco + prompt) y que ya no se bloquean como `BUMP`. Ajustar `bumpBlockedKeys` para los que dejen de ser `BUMP`.
3. Añadir guard de "reclamación en vuelo" en la escena (`Set<string>` de ids en curso) para impedir dobles `claimReward`/etiquetas `+N`.
4. Tests: reglas de foco/activación para los nuevos `ADJACENT_ACTION`, y test del guard anti-duplicado.

### Fase C — Animación de recogida de carta (#3)
1. Nuevo subcomponente React (`components/hub/story/overworld/hud/OverworldCardPickup*.tsx`) que muestre la `Card` a tamaño de lectura y anime el encogido/traslado. SRP, ≤150 líneas, subhooks para la fase de animación.
2. Enganchar en el flujo de `claimReward` para `REWARD_CARD`: mostrar overlay → al terminar, continuar (encoger en canvas o sustituir por la transición React).
3. Resolver la carta a mostrar desde la definición del nodo (`rewardCardId`) vía catálogo, no desde el cliente ciego.
4. Tests: render del overlay con una carta mock y callback `onDone`.

### Fase D — Atributos flotantes económicos en móvil (#1)
1. Añadir una variante en `CardHologram` (p. ej. `mode: "lite-floating"`) o un flag que renderice la columna de atributos inclinada del desktop **sin** bobbing infinito ni blurs de filtro.
2. En `SlotCellEntity`, elegir esa variante cuando `isMobileLayout`/`shouldReduceCombatEffects` en lugar del `lite` plano actual.
3. Validar coste con el baseline de rendimiento existente (`pnpm perf:baseline:mobile`) antes/después.
4. Tests: `CardHologram` renderiza los atributos en la variante móvil (no debe montar la animación infinita).

## 5. Verificación / Quality gates
- Por fase: `pnpm lint`, `pnpm typecheck`, `pnpm test` (unidad co-localizada).
- Global antes de PR: `pnpm quality:check` y, para #1, comparación con `pnpm perf:baseline:mobile`.
- Sin `any`, sin warnings nuevos, cabecera de ruta en cada archivo nuevo/modificado, docs en español.

## 5.bis Estado de implementación

- **Fase A (#4) — COMPLETADA.** Nuevo cliente `services/story/overworld/overworld-persistence-client.ts` (`markOverworldEventInteracted`) con tests. La escena persiste en BD cada evento visto (rama EVENT/NPC), además del caché local. El sembrado inicial ya leía `interactedNodeIds` del servidor, así que el evento no reaparece en otro navegador. Excepción intacta: el trigger de BigLog (`story-a2-biglog-trigger`) se re-dispara hasta vencer su duelo. Verificado: test del cliente + `tsc` + `eslint`.
- **Fase B (#2) — COMPLETADA.** Recompensas (Acto 1 y 2) y el evento visible `story-a1-event-special-card-signal` pasan a `ADJACENT_ACTION`. El motor generaliza el bloqueo de celda a recompensas de acción (se paran enfrente y se liberan al recogerse); el auto-cobro por choque queda solo para `BUMP` (ya sin uso en producción). El evento visible se marca sólido en el tilemap. Guard anti-duplicado (`claimingRewardIdsRef`) en `claimReward` → se acabó el `+N` repetido. Tests de tilemap actualizados. Verificado: 94 tests de overworld + `tsc` + `eslint`.
- **Fase D (#1) — COMPLETADA.** Nuevo componente `components/game/card/internal/CardHologramLiteStats.tsx`: columna de atributos flotante (coste/ATK/DEF con inclinación 3D) para el holograma `lite` (móvil), sin `blur` de GPU ni animación en bucle. Reutiliza `AnimatedStatNumber` (solo consume rAF cuando cambia el valor). Sustituye el badge plano inferior del `lite`. El modo `full` (desktop) queda intacto. Con tests. Verificado: 2 tests + `tsc` + `eslint`. **Nota:** las medidas están afinadas "a ojo" para 260×380; conviene un ajuste fino en dispositivo real y comparar con `pnpm perf:baseline:mobile`.
- **Fase C (#3) — PENDIENTE (bloqueada por decisión de datos).** Para mostrar el componente `Card` real hace falta la `ICard` completa en cliente (nombre/ATK/DEF), que hoy no existe: `resolveStoryRewardCardVisual` solo da la imagen del render. Opciones: (a) que `claim-reward` devuelva los datos de la carta otorgada (server ya tiene acceso a la colección); (b) endpoint/lookup de catálogo por id; (c) versión ligera: overlay de "revelado" usando solo el render (`imageSrc` del nodo) sin stats. Requiere decisión del propietario + su criterio visual.

## 6. Riesgos y decisiones abiertas (requieren confirmación del propietario)
- **#2 alcance**: ¿convertimos a `ADJACENT_ACTION` *todas* las recompensas/eventos, o dejamos algunos triggers ambientales/ocultos automáticos (p. ej. cutscenes guionizadas de BigLog/Echo que deben saltar al pisar)?
- **#3 alcance**: ¿el overlay de `Card` aplica solo a `REWARD_CARD` o también queremos un "beat" para Nexus?
- **#1 rendimiento**: aceptamos recuperar la columna flotante en móvil con la versión económica; si el baseline se degrada, se revierte a `lite` plano.
- **#4 migración**: los jugadores actuales tienen eventos "vistos" solo en `localStorage`; al pasar a BD, un evento ya visto podría re-dispararse una vez en el primer login si no está en `interactedNodeIds`. Aceptable (una sola vez) o migramos el caché local al servidor al montar.
