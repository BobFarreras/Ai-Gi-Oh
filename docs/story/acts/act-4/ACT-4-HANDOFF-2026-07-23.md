<!-- docs/story/acts/act-4/ACT-4-HANDOFF-2026-07-23.md - Handoff del pulido del Acto 4: lo hecho el 2026-07-23 y los 4 pasos siguientes con detalle técnico para que otro agente los ejecute sin contexto previo. -->
# Acto 4 — Handoff 2026-07-23 (pulido)

> **Rama:** `feat/opponent-skill-abilities`. **Estado del árbol:** todo lo de la parte A está **implementado y en verde**
> (lint + typecheck + 1613 tests) pero **SIN COMMITEAR**. Lo primero que debe hacer quien siga: revisar `git status`
> y commitear (ver §A.6).
>
> Documentos hermanos: [ACT-4-FLOW.md](./ACT-4-FLOW.md) (mapa/ids/recorrido, **fuente de verdad**) y
> [ACT-4-IMPLEMENTATION-GUIDE.md](./ACT-4-IMPLEMENTATION-GUIDE.md) (historia + textos).

---

## A. LO QUE SE HIZO EL 2026-07-23

### A.1 Emboscada de GenNvim en el pasillo de la carta Hydra (duel-8)
**Problema:** GenNvim esperaba plantado en la casilla de acceso al callejón de la Hydra. Se le veía desde la
entrada del maze, no había sorpresa y bloqueaba el pasillo con el cuerpo.

**Ahora:** el pasillo está vacío. A **2 casillas** del acceso a la carta hay un trigger oculto que lanza una
cutscene en la que GenNvim **aparece por detrás**, corta la retirada, suelta su línea y arranca el combate.

| Pantalla | Guion |
|---|---|
| Desktop (cámara cerrada, zoom 1.85) | Se **materializa** (`SPAWN_NPC` + `effect: "TELEPORT"`) 2 casillas por detrás y avanza 1 paso. No cruza medio laberinto andando (quedaba lento y cutre). |
| Móvil (`max-width: 820px`, zoom 1.35) | Nace 5 casillas atrás, **fuera de cámara**, y entra **andando** por el pasillo. |

Cambios:
- `src/services/story/overworld/act-4-hydra-cutscene.ts` **(nuevo)** — guion por pantalla. Constantes
  `WALK_IN_DISTANCE = 5` / `TELEPORT_DISTANCE = 2`.
- `src/services/story/overworld/trace-walkable-corridor.ts` **(nuevo)** — BFS de pasillo sobre `collision`
  (1 = transitable). Sirve para "N casillas antes de X" y para sacar los puntos del recorrido de un NPC **sin
  atravesar muros** (el motor solo anda en recto: se emite un `NPC_WALK_TO` **por casilla**).
- `act-4-overworld-tilemap.ts`: `duel-8` pasa a `hidden: true`, **sin `visionRange`** (así el motor no le crea
  actor) y **sin `markSolid`** → invisible y sin bloquear. El trigger `story-ch4-event-hydra` se mueve de la boca
  del maze al pasillo, con posición **calculada** (`HYDRA_AMBUSH_TILES_BEFORE_CARD = 2`). La carta Hydra gana
  `gateRequiredNodeIds: ["story-ch4-duel-8"]` (antes el candado era el cuerpo del rival).
- Motor: `OverworldCutsceneStep` gana `PLAYER_FACE` y `SPAWN_NPC.effect: "TELEPORT"`;
  `IOverworldCutsceneNpcRender.spawnProgress`; `Renderer2D.drawTeleportBurst()` (anillo verde + glitch);
  una cutscene vacía ahora dispara `onCutsceneEnd` (antes dejaba la escena suspendida para siempre).
- `OverworldDevScene.tsx`: el caso especial de BigLog se generaliza en **`AMBUSH_BY_TRIGGER_ID`**
  `{ duelId, dialogueNodeId, buildCutscene }` → **este es el gancho a reutilizar para cualquier emboscada nueva**
  (lo necesita el paso B.4). El panel de nodo bloqueado ya no enseña el id crudo para recompensas.

### A.2 Vídeo de intro del acto
`story-ch4-event-intro` lleva `cinematicVideo` → `/assets/videos/story/act-4/genNvim.mp4`, con el **mismo overlay
de terminal** que los Actos 1 y 2 (`StoryInteractionVideoOverlay`, pliegue `scaleY` al cerrar). Se dispara al
PRIMER paso del jugador (`FIRST_STEP_INTRO_BY_MAP`), que **antes no sabía abrir vídeo** — se le añadió esa rama.
**El vídeo sustituye a la narración** (igual que en Actos 1/2); las líneas siguen en el catálogo como respaldo.

### A.3 Narración de la emboscada
`story-ch4-event-hydra` se queda **solo con la línea de GenNvim**: al cerrarla arranca el combate directamente,
sin réplica de BigLog (cortaba el ritmo).

### A.4 Reset de progreso del Acto 4 (ya ejecutado en prod)
Jugador `3f2e43ec-9a77-4c33-8284-aa67150d7450`. Se borró **solo Acto 4**: las 4 filas de
`player_story_duel_progress` con `duel_id like 'story-ch4-%'` (duel-1/2/4 ganados + duel-8 perdido), los ids
`story-ch4-*` / `story-a4-*` de `visited_node_ids` e `interacted_node_ids`, `current_node_id → null` y
`overworld_position → null` (arranca en el spawn). Actos 1-3 intactos. **No existe `player_story_history_events`
en prod** (la migración 013 no llegó entera): no hay nada que limpiar ahí.

> ⚠️ El juego cachea los eventos vistos en `localStorage`. Tras un reset hay que limpiar también
> `overworld-seen-events-<playerId>-act-4` o la intro y las emboscadas no vuelven a saltar.

### A.5 Ficheros tocados
```
nuevos:      src/services/story/overworld/act-4-hydra-cutscene.ts (+ .test.ts)
             src/services/story/overworld/trace-walkable-corridor.ts (+ .test.ts)
             public/assets/videos/story/act-4/genNvim.mp4  (asset, 5 MB)
modificados: src/services/story/overworld/act-4-overworld-tilemap.ts (+ .test.ts)
             src/services/story/story-node-interaction-dialogue-catalog.ts
             src/components/hub/story/overworld/OverworldDevScene.tsx
             src/components/hub/story/overworld/engine/{engine-types,OverworldEngine,Renderer2D}.ts
             docs/story/acts/act-4/ACT-4-FLOW.md
```

### A.6 Pendiente inmediato
1. **Commitear** (nada de lo anterior está en git). Antes: `CI=true pnpm quality:check` completo.
2. **Aplicar a prod las migraciones 145 y 146** (`docs/supabase/sql/`) si no se ha hecho: sin ellas duel-6/7/8 no
   existen en BD y entrar al combate falla. Sigue pendiente desde el 2026-07-22.

---

## B. FUTURAS MEJORAS (en orden de ejecución sugerido)

> Los cuatro pasos son independientes salvo que B.2 depende de B.1 (misma zona narrativa).
> Regla del acto: **nada de coordenadas a mano si se pueden derivar** — usa `traceWalkableCorridor`,
> `findDeadEnd` y `openApproach` como en A.1.

### B.1 — Eliminar la narración de la pasarela *(fácil, ~15 min)*
Quitar el aviso que salta al acercarse al puente/cinta. Es el mismo patrón con el que ya se borró
`story-ch4-event-belts`.

Borrar `story-ch4-event-belt-locked` de los **tres** sitios:
1. `act-4-overworld-tilemap.ts` → el objeto `{ id: "story-ch4-event-belt-locked", ... tileX: 26, tileY: 25 }`.
2. `src/services/story/map-definitions/act-4-map-definition.ts` → su `v({ ... duelIndex: 406 ... })`.
3. `story-node-interaction-dialogue-catalog.ts` → su entrada (`title: "Pasarela en Contra"`).

Comprobar que ningún test lo referencia (`rg story-ch4-event-belt-locked`). Los jugadores que ya lo tengan en
`interacted_node_ids` no rompen nada (id huérfano, se ignora).

### B.2 — Mover el interruptor de la pasarela a la sala derecha *(fácil, ~30 min)*
Hoy el interruptor de abajo (`story-ch4-belt-switch`) está en la cámara del laberinto 2, en `(22,27)`, y la sala
derecha alta (**maze `rightUp`**, x38-48 / y25-33) acaba en una consola de evento **que no hace nada**
(`story-ch4-event-rightup`, narración placeholder). Se cambia una cosa por la otra: la sala opcional pasa a tener
un motivo real para visitarse.

1. En `act-4-overworld-tilemap.ts`:
   - Borra el objeto `story-ch4-event-rightup` y su `markSolid(map, rightUpTileX, rightUpTileY)`.
   - Mueve el objeto `story-ch4-belt-switch` a `tileX: rightUpTileX, tileY: rightUpTileY` (mantiene
     `kind: "SWITCH"` y **el mismo** `beltToggleRect: { x0: 26, y0: 22, x1: 26, y1: 24 }`) y su `markSolid`.
   - Quita el `markSolid(map, 22, 27)` viejo (y el comentario del INTERRUPTOR de la cámara).
2. `act-4-map-definition.ts`: borra el nodo virtual `story-ch4-event-rightup` (el de `story-ch4-belt-switch` ya
   existe y no cambia).
3. Catálogo: borra la entrada `story-ch4-event-rightup`. La de `story-ch4-belt-switch` ("Flujo Invertido") se
   queda; **reescribe su texto** si menciona el laberinto ("cerca del pasillo del guardia de la izquierda").
4. Tests (`act-4-overworld-tilemap.test.ts`, test `belt-toggle REVERSIBLE`): la aserción
   `bottom.tileY >= 25` sigue valiendo (rightUp es y25-33), pero **actualiza el comentario** y añade que el
   interruptor de abajo está **dentro del maze rightUp** (`tileX >= 38`).
5. **Verificación anti soft-lock (importante):** rightUp no tiene guardia, así que el interruptor es alcanzable
   siempre. Añade/ajusta un test de reachability: desde el spawn con `duel-1` vencido se llega a la casilla
   contigua del interruptor. El gemelo de arriba (`story-ch4-belt-switch-top`, terminal) **no se toca**: es el que
   evita quedarse atrapado arriba.

### B.3 — Rival que patrulla el laberinto grande del centro *(medio, ~1-2 h + BD)*
Un centinela móvil en el maze central para que el laberinto no sea "estático".

> **Decidir primero:** "el laberinto grande del centro" son dos candidatos: **LABERINTO 1** (hub, y45-59, el
> primero que se cruza) o **LABERINTO 2** (sala del módulo, y25-42). Por recorrido, el hub es el más "central" y
> el que más se transita → **recomendado el hub**; confirmar con el usuario si hay dudas.

1. **Objeto en el tilemap** (`DUEL`, id `story-ch4-duel-9`):
   ```ts
   { id: "story-ch4-duel-9", kind: "DUEL", tileX: …, tileY: …, sprite: "soldado-terminal",
     trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/9", imageSrc: SOLDADO,
     facing: "LEFT", visionRange: 3, patrolAxis: "H", patrolLength: 4, patrolSweep: true }
   ```
   `patrolSweep` alterna la orientación de vigilancia al rebotar (huecos móviles más divertidos).
2. **⚠️ Trampa mortal:** un rival **sólido** patrullando un pasillo de 1 casilla puede **sellar el laberinto** y
   dejar la salida inalcanzable. Dos salvaguardas: (a) elige un tramo que NO sea el único camino a la salida ni a
   un callejón con objeto (el maze es determinista: imprime la rejilla y míralo), y (b) **añade un test** de
   reachability desde el spawn a la salida del maze **con el rival vivo**, en las dos posiciones extremas de su
   patrulla. `advancePatrol` ya rebota si no puede entrar, así que el riesgo real es el bloqueo, no el atasco.
3. **BD obligatoria** (si no, entrar al duelo revienta): nueva migración `docs/supabase/sql/147_…sql` calcada de
   `146_story_act4_hydra_duel.sql`: `story_opponents` + `story_deck_lists` (+ `story_deck_list_cards`) +
   `story_duels` (chapter 4, `duel_index: 9`, `unlock_requirement_duel_id: 'story-ch4-duel-1'`) +
   `story_duel_ai_profiles`. Reutiliza el avatar del Soldado-Terminal.
4. Test: actualizar `coloca los 8 rivales del capítulo 4…` → 9.

### B.4 — Sala de la Fábrica de Cartas + emboscada de GenNvim *(grande, ~1 día; toca el motor)*
La escena que pidió el usuario, en la **segunda sala empezando por arriba** = **`roomTerminal`**
(`{x0:20, y0:13, x1:32, y1:21}`; la primera desde arriba es la sala del jefe, y3-11).

**Qué se ve:** medio laberinto en esa sala; al final de un **pasillo sin salida** hay una **máquina extraña que
fabrica cartas** con **GenNvim y Midutech** observando. Salta la narración entre ellos; al acabar, **Midutech se
va hacia la sala de arriba**, **GenNvim se gira** y, como el jugador está en un callejón, **le pilla** → combate.

**Textos exactos (los dio el usuario):**
| Quién | Línea |
|---|---|
| GenNvim | "Hemos podido crear la carta suprema." |
| Midutech | "Con esto la Entidad podrá controlar todo el ciberespacio." |
| Midutech | "Voy a llevármela." |

Reutiliza la **UI/estilo de narración de eventos** ya existente (`StoryNodeInteractionDialog`, `presentationMode:
"TERMINAL"`, `portraitUrl` de cada villano: hay constantes `GENNVIM_PORTRAIT` / `MIDUTECH_PORTRAIT` en el
catálogo). Nada de UI nueva.

**Plan técnico**

1. **Mapa** (`act-4-overworld-tilemap.ts`): tallar **medio maze** en la mitad baja de `roomTerminal` (p. ej.
   `bodyY0: 17, bodyY1: 21`, nodos en `x=20..32`, `y=17..21`) con `carveMaze`, dejando:
   - entrada por abajo en **x=26** (por donde llega la cinta, `(26,21)`),
   - **salida centrada en x=26** hacia la mitad alta → corredor a `(26,12)` (compuerta `story-a4-gate-boss`).
   - Ojo con lo que ya vive en esa sala: `duel-5` `(30,17)`, consola `story-ch4-event-revelation` `(24,18)` y el
     interruptor gemelo `story-ch4-belt-switch-top` `(28,20)`. **Reubícalos a casillas transitables del nuevo
     trazado** (no los borres: duel-5 abre la compuerta al jefe y el interruptor evita el soft-lock de la cinta).
   - La **máquina** va en un `findDeadEnd(...)` del medio-maze; el trigger de la escena, 2 casillas antes, con
     `traceWalkableCorridor` (mismo patrón exacto que A.1).
2. **Arte de la máquina** — dos opciones, la (a) es la barata:
   (a) nuevo `OVERLAY_TILE.CARD_FORGE = 8` en `overworld-tile-kinds.ts` + método `drawCardForge()` en
   `Renderer2D` añadido a la cadena `if` de overlays (~línea 1147) — todo procedural, sin assets; el validador no
   restringe índices de overlay. (b) objeto `EVENT` con `imageSrc` a un `.webp` nuevo (requiere arte).
3. **⚠️ Hueco del motor: la cutscene solo soporta UN NPC.** `OverworldEngine.cutsceneNpc` es un único objeto.
   Para GenNvim **y** Midutech a la vez hay que:
   - dar `npcId?: string` (default `"main"`) a `SPAWN_NPC` / `NPC_WALK_TO` / `DESPAWN_NPC`,
   - convertir `cutsceneNpc` en `Map<string, …>` y `resolveCutsceneNpcRender` en una lista
     (`IRenderOptions.cutsceneNpc` → `cutsceneNpcs[]`, `drawCutsceneNpc` en bucle),
   - añadir un paso **`NPC_FACE`** (GenNvim se gira; hermano de `PLAYER_FACE`, que ya existe).
   Los pasos se ejecutan **en secuencia** (un `NPC_WALK_TO` bloquea hasta llegar): para "Midutech se va **mientras**
   GenNvim se gira" o se acepta el orden secuencial (Midutech sale → GenNvim se gira → combate; **suficiente y es
   lo más simple**) o se añade un flag `parallel`. Recomendado: secuencial.
4. **Enganche en la escena:** ya está hecho el trabajo — añade una entrada a **`AMBUSH_BY_TRIGGER_ID`** en
   `OverworldDevScene.tsx` con `{ duelId: "story-ch4-duel-10", dialogueNodeId: "story-ch4-event-card-forge",
   buildCutscene: buildAct4CardForgeCutscene }`. El flujo cutscene → narración → combate y el re-disparo mientras
   no venzas ya funcionan solos. Guion nuevo en `src/services/story/overworld/act-4-card-forge-cutscene.ts`
   (copia la estructura de `act-4-hydra-cutscene.ts`).
5. **Narración:** entrada `story-ch4-event-card-forge` en el catálogo con las 3 líneas de arriba + nodo virtual
   `EVENT` en `act-4-map-definition.ts`.
6. **BD:** duelo `story-ch4-duel-10` en la migración 147 (mismo patrón que B.3). Oponente = GenNvim (reutiliza
   `opp-ch4-gennvim-hydra` o crea uno nuevo si quieres otro deck).
7. **Tests:** el trazado del maze no sella la salida al jefe; el trigger está a 2 casillas de la máquina; la
   cutscene no atraviesa muros (hay un test así en `act-4-hydra-cutscene.test.ts`, cópialo).

---

## C. Avisos que siguen abiertos (heredados)
- **E4/E6** (`story-ch4-event-revelation`, `story-ch4-event-core-key`) mencionan "la Entidad" con textos **no
  definitivos**: el usuario rehará esa parte. La escena B.4 sí usa "la Entidad" **a propósito** (texto suyo).
- **E4/E6 serán vídeo** algún día (E1 ya lo es).
- **Habilidades de combate** de los `opp-ch4-*` sin asignar en admin (conecta con la rama
  `feat/opponent-skill-abilities`).
- El claim de recompensas (`/api/story/overworld/claim-reward`) **no valida gates en servidor**: el candado de la
  carta Hydra es de cliente. Es el comportamiento histórico de todas las recompensas, no una regresión de A.1.
