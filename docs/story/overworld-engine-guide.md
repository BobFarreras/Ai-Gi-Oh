# Guía de reinvención del modo Story: motor de mundo semi-abierto (overworld)

> Rama: `feat/story-overworld-engine`
> Objetivo: pasar del mapa de nodos actual (point-and-click sobre un grafo) a un **mundo semi-abierto estilo Pokémon**, donde el jugador **camina** un personaje por un circuito y **choca/interactúa** con objetos (oponentes, eventos, recompensas, especiales, puertas, NPCs).
> Requisito duro: **rendir bien en todos los dispositivos**, incluyendo **móviles y ordenadores viejos**.

---

## 1. Diagnóstico del sistema actual

### 1.1 Qué tenemos hoy (y qué funciona bien)

El modo Story ya está bastante maduro. Antes de tirar nada, hay que separar **lo que hay que reinventar** de **lo que hay que conservar**.

**Motor de movimiento actual (a reinventar):**
- `StoryScene.tsx` orquesta todo: store zustand, selección de nodo, "smart action", animación de avatar, diálogos, SFX, banda sonora, transiciones de acto.
- `StoryCircuitMap` → `StoryCircuitCanvas`: un `motion.div` gigante (lienzo ~4200×2600 px) que se **arrastra** con Framer Motion y se escala con zoom. Los nodos son `div`s posicionados en absoluto, los caminos son `<line>` SVG con dasharray, el avatar es un `motion.div` con `next/image`.
- **Modelo de interacción actual = tablero de mesa**: seleccionas un nodo → se resuelve una "smart action" (mover / entrar a duelo / coger recompensa / activar evento) → el avatar se desliza *al lado* del nodo (stance `SIDE`). No hay locomoción libre; es teletransporte animado entre nodos conectados.
- El "grafo" no es tal: las aristas se derivan de una **cadena lineal** `unlockRequirementNodeId` (árbol de un solo padre, casi lineal con alguna bifurcación).
- Móvil: layout distinto que **rota el mapa 90°** (`rotateStoryPositionMapForMobile`) para un flujo vertical.

**Contenido del mapa (hoy hardcodeado en TypeScript):**
- `src/services/story/map-definitions/act-1-map-definition.ts` y `act-2-...`: listas de `virtualNodes` (MOVE/EVENT/REWARD/…) y `platforms` con **coordenadas x/y absolutas escritas a mano**. Esto es frágil, no escala a más actos y no es editable sin tocar código.

**Persistencia (Supabase) — bien diseñada, se conserva:**
- Catálogo: `story_opponents`, `story_deck_lists`, `story_deck_list_cards`, `story_duels`, `story_duel_reward_cards`. La estructura de duelos, mazos, oponentes y recompensas vive en la BD con RLS.
- Progreso: `player_story_duel_progress` (wins/losses/best_result por duelo).
- Estado de mundo: `player_story_world_state` → **estado compacto**: `current_node_id`, `visited_node_ids[]`, `interacted_node_ids[]`.
- Casos de uso ya existentes: `MoveToStoryNodeUseCase`, `ResolveStoryNodeUseCase`, `CommitStoryProgressUseCase`, `GetStoryWorldStateUseCase`.

**Sistemas reutilizables (NO reinventar — es donde está la inversión grande):**
- Todo el **flujo de duelo**: ruta `/hub/story/chapter/[chapter]/duel/[duelIndex]`, coin toss, `StoryDuelClient`, sync de resultado, `/api/story/duels/complete`, transición post-duelo.
- **Diálogos/cinemáticas**, animaciones de recompensa (`StoryRewardCollectEffect`, floating text), **SFX** y **banda sonora** por acto.
- Resolución de recompensas (`resolve-story-reward-cards`), briefing de capítulo, narración de oponentes.
- Panel admin de mazos Story.

### 1.2 Por qué el enfoque actual no da el salto que quieres

| Problema | Causa raíz |
|---|---|
| No se siente "mundo abierto" | Es selección de nodos, no locomoción de personaje |
| Frágil para crecer (más actos/mapas) | Coordenadas x/y a mano en `.ts` |
| Riesgo de rendimiento en móvil/PC viejo si añadimos movimiento continuo | Movimiento continuo con muchos `div` + Framer Motion re-renderiza React cada frame |
| Layout móvil "rotado" es un parche | El mapa no está diseñado como mundo navegable, sino como línea de nodos |

**Conclusión:** el objetivo (Pokémon-like) requiere un **motor de overworld imperativo** separado de React, con **movimiento por celdas (tiles)** y **render en Canvas 2D**. Eso es lo que rinde igual en un móvil gama baja que en un PC de 2013.

---

## 2. Decisiones de arquitectura (opinionadas)

Estas son las decisiones que tomaría yo, con su justificación. Son la columna vertebral de la guía.

### 2.1 Render: **Canvas 2D imperativo**, no DOM ni WebGL

- **DOM + Framer Motion (actual):** perfecto para un tablero estático, pero mover un personaje 60 fps con decenas de objetos hace re-render/reflow de React y castiga a dispositivos viejos. Descartado para el mundo.
- **WebGL / PixiJS:** máximo rendimiento, pero **riesgo real en "ordenadores viejos"**: GPUs integradas antiguas, drivers en blacklist → fallback a software lento o pantalla negra. Dependencia pesada. Descartado como base.
- ✅ **Canvas 2D:** soportado en todos los navegadores desde hace más de una década, predecible, sin GPU exótica, control total. Con las técnicas correctas (culling, capas cacheadas, atlas de sprites) va sobrado a 60 fps en gama baja y **degrada con gracia** a 30 fps.

**Regla de oro:** el **mundo** (tiles, objetos, personaje) se dibuja en un `<canvas>` con un game loop propio (`requestAnimationFrame`), **fuera del ciclo de render de React**. React solo posee el **chrome de UI**: HUD, diálogos, paneles, botones. Comunicación mediante un **store/puente de eventos** fino.

### 2.2 Movimiento: **rejilla lógica (tiles) con interpolación suave**

Es exactamente lo que hace Pokémon: la lógica es por celdas (el jugador ocupa una celda entera), pero el sprite **interpola en píxeles** entre celda origen y destino para que el paso se vea fluido.

Ventajas frente a movimiento libre en píxeles:
- **Colisión trivial** (mapa de colisión = matriz booleana por celda).
- **Guardado trivial** (posición = `{mapId, tileX, tileY}`), determinista.
- **Pathfinding sencillo** (A* sobre la rejilla) para tap-to-move.
- **Gating físico** (una puerta = celda no caminable hasta cumplir requisito).

**Entrada multi-dispositivo (crítico para tu requisito):**
- Teclado: flechas / WASD (PC).
- Móvil: **D-pad on-screen** + **tap-to-move** (A* hasta la celda tocada). El tap es lo más natural en móvil y accesible.
- Acción/interacción: botón A (móvil) / Espacio-Enter (PC), o "auto-trigger" al pisar ciertas celdas.
- `prefers-reduced-motion` y un toggle de bajo consumo → sin partículas ni parallax.

### 2.3 Contenido del mapa: **tilemaps en JSON**, no coordenadas en `.ts`

El *layout* del mundo es **contenido**, no datos de usuario ni lógica. Debe ser:
- **Editable** sin recompilar (idealmente con un editor visual).
- **Versionado** en el repo y **servido como asset estático** (cacheable, sin ida a BD, funciona bien en móvil).

Recomendación: **editar los mapas con [Tiled](https://www.mapeditor.org/)** (editor open-source estándar de la industria) exportando **JSON**, o un **esquema JSON propio** si no queréis la dependencia de herramienta. Estructura por capas:

- `ground` — tiles decorativos (suelo, agua, ruinas, neón…).
- `decoration` — capa superior no colisionable (encima del jugador para profundidad).
- `collision` — matriz booleana de celdas caminables.
- `objects` — lista de objetos interactivos con `kind` + `payload` (ver §4).
- `spawns` / `warps` — puntos de entrada y portales entre mapas (transiciones de acto).

**Reparto claro de responsabilidades:**

| Dato | Dónde vive | Por qué |
|---|---|---|
| Layout del mundo (tiles, colisión, objetos, warps) | **JSON estático** (repo/CDN) | Contenido cacheable, no cambia por jugador |
| Catálogo de duelos/oponentes/mazos/recompensas | **Supabase** (ya está) | Editable por admin, con RLS |
| Progreso y estado del jugador | **Supabase** (`player_story_*`) | Por usuario, server-authoritative |

### 2.4 Estado del jugador: extender lo compacto

`player_story_world_state` ya guarda `current_node_id`, `visited_node_ids[]`, `interacted_node_ids[]`. Para overworld añadir:
- `current_map_id text` (qué acto/mapa).
- `position jsonb` → `{ tileX, tileY, facing }` (para reaparecer donde lo dejaste).

`interacted_node_ids` se reutiliza tal cual para "objetos ya consumidos" (cofres abiertos, eventos vistos). Los desbloqueos siguen derivándose de `player_story_duel_progress` (best_result = WON). **La compatibilidad de IDs es clave**: si los objetos del tilemap reutilizan los `id` de nodo actuales (`story-ch1-duel-1`, `story-a1-reward-...`), el progreso existente migra sin fricción.

---

## 3. Arquitectura del motor (capas)

Respetando la arquitectura limpia del repo (`core` / `services` / `infrastructure` / `components`):

```
components/hub/story/overworld/           ← capa de presentación (nuevo)
├─ OverworldScene.tsx                      React: monta canvas + HUD, puente store↔engine
├─ engine/
│  ├─ OverworldEngine.ts                   game loop (rAF), orquesta sistemas
│  ├─ Renderer.ts                          Canvas 2D: capas, culling, cámara
│  ├─ Camera.ts                            follow del jugador, clamp a límites del mapa
│  ├─ input/
│  │  ├─ KeyboardInput.ts
│  │  ├─ TouchDpadInput.ts
│  │  └─ TapToMoveInput.ts  (A*)
│  ├─ systems/
│  │  ├─ MovementSystem.ts                 tile-lock + interpolación
│  │  ├─ CollisionSystem.ts                matriz de colisión + gates
│  │  ├─ InteractionSystem.ts              detecta objeto adyacente/pisado → emite intent
│  │  └─ AnimationSystem.ts                sprites del personaje (walk cycles)
│  ├─ assets/
│  │  ├─ TileAtlas.ts                       carga y trocea el atlas
│  │  └─ SpriteLoader.ts
│  └─ types.ts
├─ hud/                                     React puro: D-pad, botón A, minimapa, diálogos
└─ bridge/OverworldBridge.ts               events engine→React (open dialog, enter duel…)

services/story/overworld/                  ← contenido y contratos
├─ tilemap-schema.ts                        tipos del JSON de mapa
├─ load-tilemap.ts                          fetch + validación (zod) del JSON
├─ object-catalog.ts                        kinds de objeto y payloads
└─ resolve-object-interaction.ts            puro: objeto → acción (reusa lógica actual)

core/services/story/overworld/             ← reglas puras testeables
├─ movement-rules.ts                        canWalk(tile), gates
├─ pathfinding.ts                           A* sobre grid
└─ interaction-rules.ts                     qué requiere batalla / qué está gated

core/use-cases/story/                       ← extender lo existente
├─ SavePlayerWorldPositionUseCase.ts        (nuevo) guarda {mapId, pos}
└─ (reusar) CommitStoryProgressUseCase, GetStoryWorldStateUseCase
```

**Principio:** la lógica pura (movimiento, colisión, pathfinding, gating) vive en `core` y se testea sin DOM ni canvas. El engine es "tonto": aplica reglas puras y pinta. React nunca toca el canvas; el engine nunca toca la BD (lo hace vía use-cases a través del puente).

### 3.1 El puente engine ↔ React (clave para reusar todo lo bueno)

El engine no sabe de duelos ni diálogos. Cuando el `InteractionSystem` detecta que el jugador activa un objeto, emite un **intent** por el puente:

```ts
type OverworldIntent =
  | { kind: "ENTER_DUEL"; href: string; nodeId: string }
  | { kind: "OPEN_DIALOGUE"; nodeId: string }
  | { kind: "CLAIM_REWARD"; nodeId: string; reward: RewardPayload }
  | { kind: "SUBMISSION"; nodeId: string }
  | { kind: "WARP"; toMapId: string; toSpawnId: string };
```

React escucha estos intents y **reutiliza los sistemas ya construidos**: el mismo `router.push(href)` para duelos, los mismos diálogos/cinemáticas, las mismas animaciones de recompensa y SFX. Así el rework es del **mundo y el movimiento**, no del contenido narrativo ni del combate. Mientras un intent está activo (diálogo/duelo abierto), el engine **pausa** el loop.

---

## 4. Modelo de objetos interactivos

Unifica lo que hoy son "virtual nodes". Cada objeto en el tilemap:

```ts
interface OverworldObject {
  id: string;              // reutiliza ids de nodo actuales para migrar progreso
  tileX: number;
  tileY: number;
  kind: OverworldObjectKind;
  sprite: string;          // clave en el atlas
  trigger: "ADJACENT_ACTION" | "STEP_ON";
  payload: ObjectPayload;  // según kind
  gate?: { requires: string[] };  // ids que deben estar completados
}

type OverworldObjectKind =
  | "DUEL" | "BOSS"        // → ENTER_DUEL (reusa flujo de duelo)
  | "REWARD_CARD" | "REWARD_NEXUS"  // → CLAIM_REWARD
  | "EVENT" | "NPC"        // → OPEN_DIALOGUE (cinemática/diálogo)
  | "SUBMISSION"           // → puzzle de código (ya existe)
  | "WARP"                 // → cambio de mapa/acto
  | "GATE";                // barrera física que se abre al cumplir `requires`
```

Un **GATE** es la evolución natural de `unlockRequirementNodeId`: en vez de "no puedes seleccionar el nodo", es una **puerta física** en el mundo que colisiona hasta que completas el requisito (más legible y "de videojuego"). El `CollisionSystem` consulta `interaction-rules` para saber si un gate está abierto según el progreso.

### 4.1 Lecciones del Acto 2 (mecánicas obligatorias desde el día 1)

Revisando `act-2-map-definition.ts` y su lógica de traversal, el Acto 2 ya tiene mecánicas que el motor nuevo **debe** soportar de entrada. No son "nice to have": si el motor no las modela, el Acto 2 no migra.

**1. Dos tipos de arista distintos (ya existen, hay que preservarlos).**
El sistema actual (`resolve-story-world-traversal-path.ts`) ya distingue:
- `unlockRequirementNodeId` → **dependencia/gating** ("esto se abre cuando completas aquello").
- `pathLinkFromNodeIds` → **adyacencia física** ("estas dos casillas están conectadas para caminar", sin implicar dependencia).

Ejemplo real: `story-ch2-boss-bridge` tiene `unlockRequirementNodeId: "story-ch2-bridge-submission"` **y** `pathLinkFromNodeIds: ["story-ch2-branch-lower-down-b"]`. Es decir: físicamente conecta con la ruta inferior, pero **no se abre** hasta resolver la submission de otra subruta.

→ En el overworld esto se traduce limpio: **la adyacencia la da la capa de colisión** (casillas caminables contiguas = `pathLink`), y **la dependencia la da el `gate.requires`** de la casilla-puerta. Son dos cosas separadas y el motor las trata por separado. Esto **valida** la decisión de §2.3 (colisión ≠ desbloqueo).

**2. Topología de grafo real, no lineal.**
El Acto 2 tiene **triple bifurcación** (rutas superior / centro / inferior) que reconvergen antes del boss, con recompensas y eventos por rama. El diseño del tilemap debe soportar **caminos paralelos que se reencuentran** (nada de pasillo único). El A* del `pathfinding` ya asume grafo general, así que encaja.

**3. Estado en tres ejes (reutilizar tal cual, es la fuente de verdad).**
La "completitud" de un nodo depende de su tipo, y ya está resuelto así:
| Tipo | Se considera resuelto cuando… | Campo |
|---|---|---|
| MOVE | lo has pisado | `visited_node_ids` |
| DUEL / BOSS | lo has ganado | `player_story_duel_progress` (WON) |
| EVENT / NPC / REWARD | has interactuado | `interacted_node_ids` |

→ El overworld **no inventa** un modelo de estado nuevo: escribe en estos mismos tres ejes. Un objeto pisado marca `visited`, un evento consumido marca `interacted`, un duelo ganado ya está cubierto por el progreso. Compatibilidad total con save actual.

**4. Puzzle multi-rama con "llaves" + submission (mecánica de primera clase).**
`story-ch2-bridge-submission` ("Sincronizar Pasarelas") exige:
- haber **interactuado con dos eventos-llave de ramas distintas** (`story-ch2-branch-lower-up-event`, `story-ch2-link-recovered-event`), y
- introducir un **código** (`BRG-7719-9924`) validado en `story-node-submission-rules.ts`.
Solo entonces se abre el `story-ch2-boss-bridge` hacia el boss.

→ Es el patrón "recoge llaves en ramas separadas → resuelve un puzzle → se abre una puerta lejana". El motor lo modela con:
- objeto `kind: "SUBMISSION"` cuyo `gate.requires` referencia los ids-llave (bloqueo de entrada al puzzle si faltan), y
- un intent `SUBMISSION` que **reutiliza el diálogo/validación existente** (`resolveStoryNodeSubmissionPrompt` + `assertStoryNodeSubmissionValid`). No se reescribe la lógica del puzzle, solo se dispara desde el mundo.
- El `story-ch2-boss-bridge` es un `GATE` cuyo `requires` es el id de la submission.

**5. Warps de acto bidireccionales con dirección narrativa.**
Existe `story-ch2-transition-to-act1` ("Retorno de Acto"): se puede **volver** al Acto 1. Los warps van en ambos sentidos y llevan una **dirección narrativa** (`forward` = derecha, `backward` = izquierda) con una **secuencia de teletransporte concreta** documentada en `ACT-BUILD-GUIDE.md` (el avatar se reduce hasta desaparecer, reaparece a escala mínima en el acto destino, recupera escala y avanza un nodo). El objeto `kind: "WARP"` debe llevar `direction` y respetar esa coreografía (reutilizar `use-story-act-entry-sequence` / `use-story-act-transition-navigation` como referencia).

**6. Catálogos y tablas adicionales a reutilizar (no descubiertos en la primera pasada).**
- `story-node-interaction-dialogue-catalog.ts` + `story-node-dialogue-media.ts` → narrativa, retratos y audio por nodo/evento. El overworld los consume vía el intent `OPEN_DIALOGUE`.
- `resolve-story-act-transition-target.ts` → destino canónico de cada warp de acto.
- Tablas Supabase `story_duel_ai_profiles` y `story_duel_deck_overrides` → dificultad y mazo **por aparición** del duelo (escalado). El overworld no las toca: siguen alimentando el flujo de duelo tal cual.

**Implicación para el modelo de objeto (§4):** ampliar el contrato con dos campos que el Acto 2 exige:
```ts
interface OverworldObject {
  // …campos previos…
  pathLinks?: string[];          // adyacencia física explícita (= pathLinkFromNodeIds)
  gate?: { requires: string[] }; // dependencia (= unlockRequirementNodeId + llaves de submission)
  warp?: { toMapId: string; toSpawnId: string; direction: "forward" | "backward" };
}
```

**Nota de contenido:** ya existe `docs/story/acts/ACT-BUILD-GUIDE.md` (flujo de diseño de actos: narrativa → mapa → SQL → QA). La migración a tilemaps **debe actualizar esa guía** para que "dibujar el acto" pase de escribir coordenadas en `.ts` a editar un tilemap, manteniendo el resto del checklist (transiciones, gating de puentes, QA).

---

## 5. Rendimiento en dispositivos viejos y móvil (el requisito duro)

Esto no es opcional; es la razón de elegir Canvas 2D. Técnicas concretas:

1. **Capa estática cacheada.** El suelo + decoración de un mapa se rinde **una vez** a un `OffscreenCanvas` (o canvas fuera de pantalla) del tamaño del viewport y se hace `drawImage` como blit por frame. Solo la **capa dinámica** (jugador, NPCs, objetos animados) se redibuja cada frame.
2. **Tile culling.** Dibuja únicamente los tiles dentro del viewport (+1 de margen). Un mapa de 100×100 no cuesta nada si solo pintas ~20×15 celdas visibles.
3. **Atlas de sprites (una sola textura).** Todos los tiles y sprites en un PNG/WebP. Menos decodificaciones, menos `Image`, menos memoria. WebP/AVIF con fallback PNG.
4. **DPR limitado.** `Math.min(devicePixelRatio, 2)`. En móviles con DPR 3–4 renderizar a nativo mata el fill-rate; a 2 se ve nítido y va rápido.
5. **Timestep fijo, render desacoplado.** Lógica a paso fijo (ej. 60 Hz acumulado), movimiento independiente del framerate → en un PC viejo a 30 fps el personaje va a la misma velocidad, solo con menos frames.
6. **Pausa agresiva.** Loop parado cuando: pestaña oculta (`visibilitychange`), diálogo/duelo abierto, o sin input y sin animaciones (mundo quieto = no repintar).
7. **Perfil de bajo consumo.** Reusar/extender `resolveStoryPerformanceProfile`: en gama baja o `prefers-reduced-motion`, desactivar partículas, parallax, luces animadas; reducir el ratio de animación de sprites.
8. **Carga perezosa por mapa.** Solo carga el tilemap + atlas del acto actual; precarga el adyacente al acercarse a un warp.
9. **Sin garbage por frame.** Reutilizar objetos vector/rect; nada de crear arrays/objetos en el hot loop.
10. **Presupuesto de frame.** Objetivo 16.6 ms (60 fps) en gama media, con degradación estable a 33 ms (30 fps) en gama baja. Medir con un contador de fps oculto en dev.

**Presupuesto de assets:** atlas ≤ ~1–2 MB por acto, tilemap JSON ≤ ~100 KB. Todo con `Cache-Control` largo (contenido inmutable versionado por hash).

---

## 6. Plan de implementación por fases (incremental y sin romper)

Trabajar **detrás de un feature flag** (`STORY_OVERWORLD_ENABLED`), manteniendo `StoryScene` actual como fallback hasta paridad. Cada fase es mergeable y verificable de forma aislada.

**Fase 0 — Fundaciones (esqueleto).**
- Crear estructura de carpetas §3, tipos del tilemap (`tilemap-schema.ts` con validación zod), y un `OverworldEngine` que solo pinta un mapa de prueba y mueve un cuadrado por rejilla con teclado. Sin React aún salvo el `<canvas>`.
- Test: reglas puras de movimiento/colisión/A* en `core` (sin canvas).

**Fase 1 — Motor jugable en un mapa dummy.**
- Renderer con capas + culling + cámara follow, atlas de sprites, walk cycle del personaje, D-pad + tap-to-move + teclado. Perfil de rendimiento y pausa.
- Verificación: 60 fps en desktop, fluido en móvil real y en throttling 6× CPU (DevTools).

**Fase 2 — Objetos e interacción.**
- `InteractionSystem` + puente de intents. Conectar a los sistemas existentes: al chocar con un `DUEL`, `router.push` a la ruta de duelo actual; `EVENT`/`NPC` → diálogos existentes; `REWARD_*` → animación de recompensa existente; `GATE` → colisión condicionada al progreso.
- Reusar SFX/soundtrack.

**Fase 3 — Migrar los 2 actos existentes.**
- **Script de migración** que transforma `act-1/act-2-map-definition.ts` (coordenadas actuales) en tilemaps JSON del nuevo formato, **reutilizando los `id` de nodo** para conservar progreso. Diseñar el trazado como circuito caminable (Pokémon-like) alrededor de las posiciones actuales.
- Extender `player_story_world_state` con `current_map_id` + `position` (migración SQL) y el repositorio/use-case de guardado.
- Paridad funcional: todo lo que hoy se puede hacer en Story se puede hacer en overworld.

**Fase 4 — Pulido y activación.**
- Minimapa, indicadores de objetivo, transiciones de acto vía warps, cámara cinemática en bosses (reusar).
- QA multi-dispositivo (ver §7). Activar flag por defecto y retirar el layout móvil rotado y el `StoryCircuitMap` antiguo cuando haya confianza.

**Fase 5 — (Opcional) Autoría.**
- Documentar el flujo Tiled → JSON, o un mini-editor admin. Esto convierte "añadir un acto" en trabajo de contenido, no de código.

---

## 7. Testing y verificación

- **Unit (Vitest):** reglas puras — `movement-rules`, `pathfinding` (A*), `collision`, `interaction-rules`, validación del schema de tilemap. Sin DOM.
- **Componente:** el puente de intents (engine emite → React reacciona) con mocks del engine.
- **E2E (Playwright, reusar `e2e/story/`):** recorrido — caminar, chocar con duelo, ganar, ver desbloqueo de gate, coger recompensa, cruzar warp de acto, recargar y aparecer en la posición guardada.
- **Rendimiento:** perfilar con CPU throttling 6× y un móvil real de gama baja; validar 30+ fps estables y ausencia de long tasks en el hot loop.
- **Regresión de progreso:** un jugador con progreso actual debe entrar al overworld con sus duelos ya desbloqueados (por eso se reutilizan los ids).
- Antes de push: `CI=true pnpm quality:check` completo con exit code real.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Canvas imperativo se desincroniza con estado React | Puente unidireccional estricto (engine emite intents; React nunca muta el mundo directamente) |
| Regresión de progreso al migrar mapas | Reutilizar ids de nodo; test de regresión de desbloqueos |
| Rendimiento en gama muy baja | Perfil low-power, degradación a 30 fps, pausa agresiva, culling — todo medido, no asumido |
| Assets pesados en móvil | Atlas comprimido, lazy-load por acto, caché inmutable |
| Alcance grande | Feature flag + fases mergeables; el fallback actual sigue vivo hasta paridad |
| Autoría de mapas a mano sigue siendo dolorosa | Adoptar Tiled o un editor admin (Fase 5) |

---

## 9. Qué se conserva vs. qué se reinventa (resumen ejecutivo)

**Se REINVENTA:**
- Render del mundo → **Canvas 2D** con game loop imperativo.
- Movimiento → **locomoción por rejilla con interpolación** (control directo del personaje), no selección de nodos.
- Contenido del mapa → **tilemaps JSON** (con colisión, capas, objetos), no coordenadas en `.ts`.
- Interacción → **física** (chocar/pisar/puertas), no "smart action" sobre nodo seleccionado.

**Se CONSERVA (y se reutiliza vía el puente):**
- Todo el flujo de duelo y la ruta `/hub/story/chapter/[chapter]/duel/[duelIndex]`.
- Diálogos, cinemáticas, animaciones de recompensa, SFX y banda sonora.
- Catálogo en Supabase (oponentes/duelos/mazos/recompensas) y su admin.
- Progreso del jugador y desbloqueos derivados de `player_story_duel_progress`.
- Los `id` de nodo actuales (para migración de progreso sin fricción).

---

## 10. Primer paso concreto recomendado

Empezar por la **Fase 0**: definir `tilemap-schema.ts`, las **reglas puras** en `core` (movimiento/colisión/A*) con sus tests, y un `OverworldEngine` mínimo que pinte un mapa dummy y mueva un tile con teclado. Es el cimiento verificable sobre el que todo lo demás encaja, y no toca nada del Story actual (que sigue funcionando tras el feature flag).

---

## 11. Estado de implementación (actualizado 2026-07-07)

Esta sección documenta lo que **ya está construido** en la rama `feat/story-overworld-engine`, más allá del plan original. Sirve de mapa para retomar el trabajo.

### 11.1 Arquitectura por capas (real)

**`core/services/story/overworld/` — reglas puras (testeadas, sin DOM):**
- `overworld-types.ts` — rejilla, direcciones, estado de progreso (tres ejes), puertas.
- `movement-rules.ts` — límites, colisión y puertas con contexto precomputado (O(1) por celda).
- `pathfinding.ts` — A* determinista con presupuesto de expansión.
- `interaction-rules.ts` / `interaction-focus.ts` — requisitos, puertas y foco adyacente/pisado.
- `sightline.ts` — detección de reto por línea de visión (muros la cortan).
- `resolve-patrol.ts` — pacing de patrulla con rebote (extremos y muros).

**`services/story/overworld/` — contenido y adaptadores:**
- `tilemap-schema.ts` + `validate-tilemap.ts` — contrato versionado + validación estricta (límites anti-abuso, solo assets internos, coordenadas de objetos/spawns coherentes). Campos de objeto: `kind`, `trigger` (`ADJACENT_ACTION`/`STEP_ON`), `gateRequiredNodeIds`, `warp`, `duelHref`, `imageSrc`, `facing`/`visionRange` (DUEL/BOSS), `patrolAxis`/`patrolLength`.
- `overworld-tile-kinds.ts` — índices semánticos de tile (suelo/estructuras).
- `tilemap-runtime.ts` — tilemap → rejilla de colisión + puertas del core.
- `act-1-overworld-tilemap.ts` — Acto 1 como **facility** (salas de servidores + corredores), nodos reales, oponentes con visión/patrulla, gate del jefe. Con test de reachability.
- `act-1-intro-cutscene.ts` — guion de la cutscene de intro.
- `get-story-overworld-runtime.ts` — progreso real (duelos ganados) + posición guardada.
- `resolve-overworld-event-dialogue.ts` — reutiliza el catálogo Story para diálogos de evento.
- `dev-fixture-tilemap.ts` — mapa de pruebas (solo tests).

**`components/hub/story/overworld/` — presentación (canvas + HUD):**
- `engine/OverworldEngine.ts` — game loop imperativo (timestep fijo 60 Hz, DPR clamp, culling, pausa por visibilidad). Orquesta movimiento, interacción, sightline, actores y cutscenes.
- `engine/Renderer2D.ts` — render cibernético: rejilla neón, suelos de sala + bordes de muro, corredores, estructuras (racks/pantallas/cajas), oponentes (actores), NPC de cutscene, haces de visión, player; zoom por `ctx.scale`.
- `engine/OpponentActorManager.ts` — oponentes como entidades dinámicas (IDLE/PATROL/APPROACH); patrulla sentry; al pillarte, se **acercan** a tu lado antes de emitir el combate.
- `engine/SpriteCache.ts` — carga asíncrona de imágenes.
- `engine/camera-math.ts` — follow + clamp + culling (puro, testeado).
- `hud/` — `OverworldTouchControls` (D-pad + A), `OverworldMinimap`, `OverworldBattleTransition` (parpadeos/turbulencia), `OverworldEventDialog` (vídeo + líneas), `resolve-intent-presentation`.
- `OverworldDevScene.tsx` — contenedor React: monta el engine, HUD, y orquesta paneles/diálogos/combate.

**Persistencia / API / duelo:**
- Migración `089_overworld_player_state.sql` — `overworld_map_id` + `overworld_position` (aditiva; **pendiente aplicar a prod**).
- `IPlayerStoryWorldRepository` + `SupabasePlayerStoryWorldRepository` — get/save overworld state.
- `POST /api/story/overworld/state` — valida unlock antes de fijar `current_node_id`; guarda posición.
- Duelo: `page.tsx` lee `?from=overworld` → `StoryDuelClient`/`use-story-duel-result-sync` vuelven a `/hub/story/overworld` (cambio aditivo; el flujo clásico intacto sin el param).

### 11.2 Mecánicas implementadas

- **Locomoción** por tiles con interpolación; teclado + D-pad táctil.
- **Interacción**: pickups STEP_ON (nexus/cartas/eventos centrados), puertas gate físicas.
- **Visión estilo Pokémon**: rivales con haz; al cruzarlo, el rival se acerca y salta la animación de encuentro + combate real.
- **Patrulla sentry**: rivales que pasean vigilando el corredor.
- **Bucle de combate cerrado**: ganar un duelo (progreso real en BD) abre puertas; vuelves al overworld cerca del nodo. Al lanzar el duelo se guarda una **casilla fuera del radar** para no re-activar el combate al perder/salir.
- **Jefe obligatorio**: el portal al Acto 2 está sellado tras una puerta que exige vencer al boss.
- **Cámara con zoom** + **minimapa**.
- **Cutscene de intro** (secuenciador de pasos) + **eventos con vídeo/diálogo** reutilizando el catálogo Story.

### 11.3 Pendiente / próximos pasos

- Alinear la cadena de desbloqueo de la BD (`unlockRequirementDuelId`) con el orden físico del mapa para que "Duelo bloqueado" nunca aparezca de forma incoherente.
- Migrar el **Acto 2** (llaves + submission + puente) al formato tilemap.
- Aplicar la migración 089 a **producción** al hacer release.
- Persistir "intro ya vista" para no repetirla.
- Rutas especiales cerradas (subrutas difíciles) con trigger de corredor + narración estilo Story.
