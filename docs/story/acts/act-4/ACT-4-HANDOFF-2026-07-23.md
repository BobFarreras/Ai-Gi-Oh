<!-- docs/story/acts/act-4/ACT-4-HANDOFF-2026-07-23.md - Handoff del pulido del Acto 4: lo hecho el 2026-07-23 y los 4 pasos siguientes con detalle técnico para que otro agente los ejecute sin contexto previo. -->
# Acto 4 — Handoff 2026-07-23 (pulido)

> **Rama:** `feat/opponent-skill-abilities`. **Estado:** las partes A **y B** están implementadas, commiteadas y
> en verde. Lo único que queda del acto es **aplicar a prod las migraciones 145, 146 y 147**.
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
1. ~~Commitear~~ hecho.
2. **Aplicar a prod las migraciones 145, 146 y 147** (`docs/supabase/sql/`): sin ellas duel-6/7/8/9/10 no existen
   en BD y entrar al combate falla. Sigue pendiente desde el 2026-07-22.

---

## B. MEJORAS — ✅ TODAS HECHAS (2026-07-23, 2ª tanda)

> Las cuatro se implementaron en la rama `feat/opponent-skill-abilities`, con lint + typecheck + tests en verde.
> Debajo queda **qué se hizo realmente** (y en qué se desvió del plan) y, más abajo, el plan original como
> histórico. **Pendiente:** aplicar a prod las migraciones **145, 146 y 147**.

### ✅ B.1 — Narración de la pasarela: eliminada
`story-ch4-event-belt-locked` borrado del tilemap, del map-definition y del catálogo. La cinta en contra se
descubre pisándola.

### ✅ B.2 — Interruptor de la pasarela en la sala derecha alta
`story-ch4-belt-switch` vive ahora en el callejón del maze `rightUp` (posición derivada con `findDeadEnd`, no
hardcodeada) y sustituye a la consola placeholder `story-ch4-event-rightup`, que se borró de los tres sitios. La
sala opcional pasa a ser **obligatoria** para poder subir; no tiene guardia, así que el interruptor es siempre
alcanzable (test de reachability con sólo `duel-1` vencido).

### ✅ B.2-bis — Interruptores SIN narración y con estado visual (petición posterior del usuario)
- Se borraron las narraciones de `story-ch4-belt-switch` y `-top`: ahora **la propia palanca cuenta el estado**.
- El modelo pasó de **paridad XOR** a **palanca de dos posiciones**: nuevo campo de tilemap
  `beltToggleMode: "INVERT" | "RESTORE"` (schema + validador). El estado vive **por rect de cinta**
  (`invertedBeltRectKeys`), no por interruptor → los dos extremos **no se pueden desincronizar** y pulsar el que
  ya manda **no hace nada** (antes, pulsar dos veces el de abajo te dejaba la cinta al revés de lo que decía).
- `OverworldEngine.toggleBelt()` devuelve si cambió algo y expone `resolveActiveBeltSwitchIds()`;
  `IRenderOptions.activeBeltSwitchIds` llega al `Renderer2D`, que dibuja el interruptor **ENCENDIDO** (halo
  verde, placa iluminada, palanca arriba, piloto fijo) o **APAGADO** (gris, palanca abajo).
- **Los interruptores de LUZ del Acto 3 no se tocan**: al no tener `beltToggleRect` se dibujan en el estado
  "neutro" de siempre y conservan su narración.

### ✅ B.3 — Centinela que patrulla el laberinto 1 (`story-ch4-duel-9`)
Vive en el **nicho sin salida** que cuelga del corredor de salida del hub (derivado con `nodeX/nodeY` +
`openNeighbors`, nuevo en `carveMaze`, que **afirma** que el nicho sigue siendo callejón). Patrulla en **vertical**
con `patrolSweep`, así que su haz barre el pasillo a lo largo: cuando asoma vigila hacia la izquierda (por donde
llega el jugador) y cuando se agacha se puede cruzar.

> **Desvío del plan a propósito:** el plan pedía patrulla horizontal y `markSolid`. **No lleva `markSolid`**: su
> casilla del pasillo es ruta única y un cuerpo ahí **sellaría la salida del laberinto**. Hay un test que lo deja
> por escrito (bloquear esa casilla deja la salida inalcanzable).

### ✅ B.4 — Sala de la Fábrica de Cartas + escena de los dos villanos (`story-ch4-duel-10`)
Medio laberinto en la mitad baja de `roomTerminal` (`carveMaze`, cuerpo y16-21, nodos x22-32 / y17,19,21). La
mitad alta (y13-15) queda despejada y ahí se **reubicaron** `duel-5` (22,14), la consola E4 (26,14) y el
interruptor gemelo (30,14) — un test comprueba que ninguno quedó sepultado bajo el maze.

- **Cámara de la Fábrica:** nicho tallado a mano en la franja x20-21 (fuera de la malla), colgando del nodo
  (22,19). **La máquina son DOS casillas** (`OVERLAY_TILE.CARD_FORGE = 8`, dibujada procedural en
  `Renderer2D.drawCardForge`: chasis, ranura encendida y carta holográfica ascendente) justo **encima** de los
  villanos, que están **hombro con hombro mirando hacia ARRIBA**.
- **La escena es OBLIGATORIA:** el trigger es la **única boca de salida** del medio laberinto (nodo (22,17), con
  el breach abierto encima). Hay test: tapiando esa casilla, la mitad alta —y con ella el jefe— es inalcanzable.
- **Guion** (`act-4-card-forge-cutscene.ts`): aparecen los dos de espaldas → **paso `EVENT`** con las tres
  líneas exactas del usuario → Midutech **se desmaterializa** con la carta (`DESPAWN_NPC` + `effect: "TELEPORT"`,
  nuevo) → GenNvim se gira (`NPC_FACE`, nuevo) y **sube por el pasillo** hasta pegarse al jugador → cierra la
  cutscene → desafío de GenNvim (`story-ch4-duel-10` en el catálogo) → combate.
- **Motor, multi-NPC:** `cutsceneNpc` pasó a `Map<string, …>`; `SPAWN_NPC`/`NPC_WALK_TO`/`DESPAWN_NPC` aceptan
  `npcId` (default `DEFAULT_CUTSCENE_NPC_ID = "main"`, así las escenas de un actor no cambian);
  `IRenderOptions.cutsceneNpcs` es una lista y `drawCutsceneNpc` se llama en bucle.
- Enganche: entrada nueva en `AMBUSH_BY_TRIGGER_ID` (`OverworldDevScene.tsx`). **Sin UI nueva.**

### Migración 147 (nueva, PENDIENTE de aplicar a prod)
`docs/supabase/sql/147_story_act4_patrol_duel.sql`: `story-ch4-duel-9` (deck propio del Soldado-Terminal) y
`story-ch4-duel-10` (reutiliza `opp-ch4-gennvim-hydra` y su deck, de la 146).

---

## B-histórico. El plan original de las 4 mejoras

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

## C. 3ª TANDA — ajustes tras probar el acto (2026-07-23, tarde)

Cuatro retoques pedidos por el usuario después de jugar lo anterior. Todos implementados, con tests en verde.

### C.1 Soundtrack del Acto 4
`resolveStoryActSoundtrackUrl` gana la entrada `4`: antes el acto caía en el fallback del Acto 1. Se enganchó
primero a la pista del Acto 2 y, acto seguido, el usuario subió una **pista propia**
(`/audio/story/soundtracks/act-4/Pulso-de-Cromo.m4a`), que es la que suena ahora.

### C.2 El interruptor de la pasarela, más escondido y con guardia
- El interruptor ya no va al primer callejón que aparece al barrer la malla, sino al **más profundo**: nuevo
  `findFarthestDeadEnd(fromTile, reserved, fallback)` en el handle de `carveMaze` (mide con
  `traceWalkableCorridor` desde la boca del maze y se queda con el callejón más lejano).
- **duel-5 pasa a guardarlo**: ocupa la única celda de acceso a ese callejón (`openApproach`) y mira hacia fuera
  para que su haz barra el pasillo. Se movió desde la mitad alta del terminal `(22,14)`, que ahora es la nave de
  la Fábrica. Sigue abriendo `story-a4-gate-boss`, así que la compuerta del jefe ya estará abierta al llegar
  arriba (sin el interruptor no se sube ⇒ duel-5 sigue siendo obligatorio). **No hace falta migración nueva.**

### C.3 La Fábrica de Cartas, fuera del laberinto y rediseñada
- La máquina y los dos villanos suben a la **mitad alta del terminal**, donde estaba la consola E4: máquina en
  `(23,13)`+`(24,13)` contra la pared, Midutech `(23,14)` y GenNvim `(24,14)` debajo mirándola. El nicho tallado
  a mano en la franja `x=20..21` desaparece (esa franja se tapia entera).
- El trigger se mueve a `(22,15)`, la casilla a la que desemboca la única salida del medio laberinto: la escena
  sigue siendo **inevitable** (hay test) y ahora se ve de frente al salir, no desde arriba de un callejón.
- **Consola E4 `story-ch4-event-revelation` eliminada** (tilemap + map-definition + catálogo): la revelación la
  cuenta la propia escena de la Fábrica.
- **Arte nuevo:** la máquina pasa de un chasis plano a **UN reactor de dos casillas**: `OVERLAY_TILE.CARD_FORGE`
  (mitad izquierda) + `CARD_FORGE_RIGHT` (derecha), que `Renderer2D.drawCardForge(..., isRightHalf)` dibuja
  encajando por la costura central — halo radial, columna de energía, tres anillos que giran, la carta suprema
  forjándose y ascendiendo (media carta por mitad, marco sin el lado de la costura), bahías de LEDs en cascada,
  conductos con pulsos hacia el centro, chispas y barrido de escáner. La animación va **solo con el reloj** (sin
  semilla por casilla) para que las dos mitades queden sincronizadas, y cada mitad **recorta a su casilla**.

### C.4 Retratos en las conversaciones entre villanos
En `StoryNodeInteractionDialog` el hueco de abajo era **siempre** del jugador, así que en la charla GenNvim ↔
Midutech salía el avatar del Operador, que ni está en la escena. Ahora: si habla alguien que **no** es el jugador
y su línea trae `counterpartPortraitUrl`, ese hueco muestra **al otro personaje**. Sin `counterpartPortraitUrl`
no cambia nada, así que el resto de diálogos del juego siguen igual.

**Y las posiciones NO se intercambian** (2ª pasada): al principio el hablante saltaba siempre al hueco de arriba,
así que los dos villanos cambiaban de sitio en cada línea. Ahora, en una conversación villano↔villano, **cada uno
se queda fijo en su hueco** según el `side` de su línea (`LEFT` = abajo, `RIGHT` = arriba) y lo único que cambia
es de quién sale la burbuja: GenNvim abajo, Midutech arriba. El prop del bocadillo pasó de `isPlayerSpeaker` a
`isSpeakerOnBottom`. Hay test que reproduce las dos líneas seguidas y comprueba que los retratos no se mueven.

### C.5 Los villanos, visibles ANTES de la escena
Antes solo existían como NPCs de cutscene: aparecían de golpe al pisar el trigger. Ahora hay **atrezzo fijo** —dos
objetos `NPC` (`story-ch4-npc-forge-gennvim` / `-midutech`) plantados ante la máquina, no sólidos— que se ven en
cuanto asomas a la sala. Al arrancar la cutscene se ocultan con `engine.markObjectCollected(...)` y toman el
relevo los NPCs guionizados (que sí se mueven); y si el duelo ya está vencido, no se dibujan de entrada porque
`resolveResolvedSceneryIds()` los mete en `collectedNodeIds` al construir el motor. El enganche es genérico:
`IOverworldAmbush.sceneryNodeIds`, así que cualquier emboscada futura puede tener su atrezzo.

**Ojo con esto:** el validador de tilemap **prohíbe dos objetos en la misma celda**, así que el nodo fantasma
`story-ch4-duel-10` se movió a `(22,14)` — la casilla donde GenNvim **acaba** la cutscene, no donde empieza.

---

## D. 4ª TANDA — cierre del acto (2026-07-23, noche)

### D.1 GenNvim deja de ser jefe: Midutech es el jefe final único
Se le vence en la escena de la Fábrica (duel-10), así que **`story-ch4-duel-6` se borra del mapa** (objeto +
`markSolid`): la mitad baja de la sala del jefe queda como antesala vacía. La puerta post-jefe
(`story-a4-gate-postboss`) pasa a exigir **duel-10** en vez de duel-6 — como duel-10 es obligatorio, al llegar
ya está abierta y sólo hace de marco. **La fila `story-ch4-duel-6` sigue en la BD** (inactiva de facto, nadie la
referencia): no se borró por si se quiere recuperar; si molesta, `is_active = false`.

### D.2 Narración previa a Midutech: "Llegas Tarde"
`story-ch4-event-pre-midutech` (STEP_ON en `(26,7)`, antes de la puerta) se reescribe: Midutech cuenta que **la
carta suprema ya está entregada** a la Entidad mientras el jugador peleaba en la forja, que GenNvim solo era su
código y que la llave del Core no la suelta; BigLog remata con "llegamos tarde a la carta, pero no a él".

### D.3 Portal al Acto 5 "próximamente"
Nuevo objeto `story-ch4-transition-to-act5` (`WARP`, `STEP_ON`, `(28,3)`, `gateRequiredNodeIds: [duel-7]`), junto
al trigger de la llave del Core. **Es un WARP SIN destino a propósito**: se admitió en el validador
(`kind === "WARP"` con `warp` opcional) como "acto anunciado pero no construido", y en `OverworldDevScene` la
rama WARP comprueba `object.warp`: si no lo hay, en vez de saltar de mapa abre la narración
`story-ch4-transition-to-act5` ("ruta detectada, destino NO COMPILADO…"). No se marca como visto, así que se
puede releer cada vez que se pisa. Para el Acto 5 real, basta con añadirle el `warp` de destino.

---

## E. Avisos que siguen abiertos (heredados)
- ~~Aplicar 145 + 146 + 147 a prod~~ **HECHO**: 145 y 146 ya estaban; la **147 se aplicó el 2026-07-23**
  (`apply_migration`, verificado: `story-ch4-duel-9` ELITE y `story-ch4-duel-10` MYTHIC con sus mazos). Era la
  causa del "No disponible" al entrar al duelo de la Fábrica.
- **E6** (`story-ch4-event-core-key`) menciona "la Entidad" con texto **no definitivo**: el usuario rehará esa
  parte. La escena de la Fábrica sí usa "la Entidad" **a propósito** (texto suyo). E4 ya no existe (ver C.3).
- **E6 será vídeo** algún día (E1 ya lo es).
- **Habilidades de combate** de los `opp-ch4-*` sin asignar en admin (conecta con la rama
  `feat/opponent-skill-abilities`).
- El claim de recompensas (`/api/story/overworld/claim-reward`) **no valida gates en servidor**: el candado de la
  carta Hydra es de cliente. Es el comportamiento histórico de todas las recompensas, no una regresión de A.1.
