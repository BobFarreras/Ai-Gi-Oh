<!-- docs/story/acts/act-4/ACT-4-FLOW.md - Guía + HANDOFF del Acto 4 (Núcleo GenNvim): estado actual del mapa/mecánicas/narraciones y los pasos que faltan (4 y 5) con detalle técnico para que otro agente los ejecute. -->
# Acto 4 — Núcleo GenNvim — Guía + Handoff

> **Rama de trabajo:** `feat/story-act-4-gennvim`. **Fichero clave del mapa:** `src/services/story/overworld/act-4-overworld-tilemap.ts`.
> **Validación rápida:** `CI=true pnpm exec vitest run src/services/story/overworld src/services/story/map-definitions`
> y `CI=true pnpm exec tsc --noEmit 2>&1 | grep -v "opponent-skills/route"`. Usar **pnpm**, no npm.

Esta guía tiene 2 partes: **(A)** cómo está el acto AHORA y **(B) HANDOFF**: los pasos 4 y 5 que faltan, con el cómo técnico.

---

## A. Estado actual (ya hecho y validado)

Mapa `act-4` (verde TERMINAL, **52×70**). Flujo vertical de abajo (entrada) a arriba (jefes). Hay **DOS laberintos reales**
(maze perfecto por backtracker determinista, semilla fija) generados con el helper `carveMaze(map, spec)`.

### Recorrido (ruta crítica)
```
Entrada (E1 intro, GenNvim vídeo) -> duel-1 (obligatorio)
  -> LABERINTO 1 (hub, y45..59): maze real
       · rincón (callejón): carta ANTIGRABITY (REWARD_CARD) -> aviso de BigLog al cogerla
       · sala izq (rama): AUMENTO ATK tras duel-2
       · sala der (rama): AUMENTO DEF tras duel-3
  -> corredor (26,43-44)
  -> LABERINTO 2 (sala módulo, y25..42): maze real
       · callejón: USB Raro (REWARD_OBJECT)
       · cámara arriba (y27): INTERRUPTOR (SWITCH belt-toggle) -> invierte la pasarela del puente PERMANENTE
       · sala izq alta (leftUp, x4-14): [PASO 4 pendiente] -> maze con carta Hydra + combate GenNvim
       · sala der alta (rightUp, x38-48): [PASO 5 pendiente] -> maze con nodo de evento
  -> puente/cinta (26,22-24) -> Terminal (consola E4) + duel-5 (abre gate-boss)
  -> GenNvim (duel-6, JEFE 1) -> E5 -> puerta post-jefe -> Midutech (duel-7, JEFE FINAL) -> E6
```

### Mecánica del puente (PASO 3, ya hecho)
- El puente que sube (cinta `BELT_DOWN` en `x=26, y=22..24`) va **en contra**: no se sube.
- Un **INTERRUPTOR** (`SWITCH` con `beltToggleRect: {x0:26,y0:22,x1:26,y1:24}`, id `story-ch4-belt-switch`, en `(22,27)`)
  lo **invierte de forma permanente** al accionarlo (se marca interactuado → persiste; anti soft-lock).
- El motor ya cablea el belt-toggle para `SWITCH`/`PLATE` con `beltToggleRect` (ver `OverworldEngine` + `OverworldDevScene` línea ~646).

### Objetos y rivales (posiciones actuales)
| Cosa | id | Tile | Nota |
|---|---|---|---|
| Interruptor puente | `story-ch4-belt-switch` (SWITCH) | (22,27) | belt-toggle |
| Carta Antigrabity | `story-ch4-card-antigrabity` (REWARD_CARD) | callejón laberinto 1 (auto) | `rewardCardId: entity-antigrabity` |
| USB Raro | `story-ch4-cache-usb` | callejón laberinto 2 (auto) | REWARD_OBJECT |
| Aumento ATK | `story-ch4-cache-atk` | (7,51) | tras duel-2 |
| Aumento DEF | `story-ch4-cache-def` | (44,51) | tras duel-3 |
| duel-1 | `story-ch4-duel-1` | (26,61) | entrada, obligatorio |
| duel-2 | `story-ch4-duel-2` | (16,51) | guardia ATK (laberinto 1 izq) |
| duel-3 | `story-ch4-duel-3` | (36,51) | guardia DEF (laberinto 1 der) |
| duel-4 | `story-ch4-duel-4` | (16,29) | guardia entrada leftUp (laberinto 2 izq) |
| duel-5 | `story-ch4-duel-5` | (30,17) | antesala terminal (abre gate-boss) |
| duel-6 | `story-ch4-duel-6` | (26,9) | GenNvim JEFE 1 |
| duel-7 | `story-ch4-duel-7` | (26,4) | Midutech JEFE FINAL |

### Narraciones (catálogo `src/services/story/story-node-interaction-dialogue-catalog.ts`)
Ya reescritas (SIN "la Entidad"): `story-ch4-event-intro` (E1, GenNvim vídeo → "digno de ver a Midutech"),
`story-ch4-card-antigrabity` (BigLog aviso), `story-ch4-event-belts`, `story-ch4-event-belt-locked`,
`story-ch4-belt-switch` (Flujo Invertido). **Personajes:** BigLog = mentor (bueno); GenNvim/Midutech = villanos
(ellos dicen las amenazas); Sistema = terminal. Vídeos: E1, E4, E6.

---

## B. HANDOFF — lo que falta (pasos 4 y 5)

### Helper de laberinto (ya existe, reutilízalo)
`carveMaze(map, spec)` en `act-4-overworld-tilemap.ts`. `spec = { bodyY0, bodyY1, nodeX0, nodeY0, cols, rows, seed, start:[i,j] }`.
- Tapia el rectángulo del cuerpo con servidores y talla un maze perfecto (backtracker determinista).
- Devuelve `{ nodeX(i), nodeY(j), carve(x,y), findDeadEnd(reserved:Set<"i,j">, fallback:[x,y]) }`.
- Nodos en `x = nodeX0+2i` (i:0..cols-1), `y = nodeY0+2j` (j:0..rows-1). Los `breach` (entrada/salida) se abren con `carve(x,y)`.
- **Patrón para objetos que no deben tapar el pasillo:** colócalos en un `findDeadEnd(...)` (nodo de grado 1) o en una
  sala abierta; un REWARD_* o un rival SÓLIDO en mitad de un pasillo de 1 casilla lo bloquea (el motor bloquea la celda).

> **PASO 5 necesita `wallKind`:** ahora `carveMaze` tapia siempre con `OVERLAY_TILE.SERVER_RACK` (hardcoded en el `placeStructure`
> interno). Para el atrezzo distinto del paso 5, **añade un campo opcional `wallKind` a `IMazeSpec`** y úsalo en ese `placeStructure`
> (por defecto `SERVER_RACK`). Opciones: `OVERLAY_TILE.COOLING_UNIT`, `DATA_PYLON`, `HOLO_SCREEN`.

### PASO 4 — Maze en leftUp (x4-14, y25-33) + carta Hydra + combate GenNvim (duel-8)
1. **Convertir leftUp en maze.** Llama a `carveMaze` con el cuerpo = la sala (p.ej. `bodyY0:25, bodyY1:33, nodeX0:4, nodeY0:27,
   cols:6, rows:3, seed: <nuevo>, start:[5,1]`). Nodos en x=4,6,8,10,12,14 / y=27,29,31. La **entrada** viene del laberinto 2 por
   el corredor `(15,29)-(17,29)` (guardado por **duel-4** en `(16,29)`) hasta `(14,29)`: `(14,29)` es el nodo `(i5,j1)`, ya queda
   conectado al corredor (deja/haz `carve(14,29)` si hiciera falta el breach). **Importante:** vacía primero la sala de lo que había
   (ya se quitó DEF y el log-origin en el chunk 1; leftUp está vacía).
2. **Carta Hydra al fondo (callejón):** `const [hx,hy] = leftUpMaze.findDeadEnd(new Set(["5,1"]) /*entrada*/, [4,27]);` y añade objeto
   `{ id:"story-ch4-card-hydra", kind:"REWARD_CARD", tileX:hx, tileY:hy, sprite:"card", trigger:"ADJACENT_ACTION" }` + `markSolid(map,hx,hy)`.
   Nodo virtual en `act-4-map-definition.ts`: `nodeType:"REWARD_CARD", rewardCardId:"exec-hydra-attack-down"` (la carta YA existe en
   `src/core/data/mock-cards/executions.ts`).
3. **duel-8 (GenNvim) guardando la carta + evento previo:** coloca `story-ch4-duel-8` (kind DUEL, `imageSrc: GENNVIM`,
   `duelHref:"/hub/story/chapter/4/duel/8"`, `facing`+`visionRect` cubriendo la aproximación) en el **único nodo vecino** del callejón
   de la carta (para que sea obligatorio pasarlo). Para hallar ese vecino, o bien expón un `openNeighbors(i,j)` desde `carveMaze`, o
   coloca duel-8 en un nodo fijo cercano y **verifica con un dump** (crea un test temporal que vuelca la grilla; ver los que se usaron en
   el historial). Justo antes, un **evento STEP_ON oculto** `story-ch4-event-hydra` con la narración de GenNvim
   (*"No puede ser que hayas llegado hasta aquí… esa carta es para mi señor."*) — se pisa y salta; el paso siguiente entra en la visión
   de duel-8 → combate. (Alternativa más integrada: mecanismo `pendingNarrationBattleRef` en `OverworldDevScene` = "narra y luego combate".)
4. **BD (obligatorio para que el combate exista):** nueva migración `docs/supabase/sql/146_story_act4_hydra_duel.sql` siguiendo el
   patrón de `145_story_act4_gennvim_flow.sql`: `story_opponents` (opp-ch4-gennvim-hydra, reutiliza avatar GenNvim), `story_deck_lists`
   (+cards), `story_duels` (chapter 4, duel 8, `opponent_id`), `story_duel_ai_profiles`. Recompensa del duelo: nexus/XP (la carta Hydra
   se coge aparte como REWARD_CARD). **Aplicar a prod** (Supabase MCP `apply_migration` o el usuario) — sin esto, entrar a duel-8 falla.
5. **Tests:** actualiza `coloca los 7 rivales…` → 8 (duel-8 es DUEL, no BOSS). Añade un test de reachability: la carta Hydra queda
   detrás de duel-8. Corre la suite.

### PASO 5 — Maze en rightUp (x38-48, y25-33) con atrezzo distinto + nodo de evento
1. Añade `wallKind` a `carveMaze` (ver arriba) y genera el maze de rightUp con `wallKind: OVERLAY_TILE.COOLING_UNIT` (o DATA_PYLON).
   Cuerpo = la sala; entrada desde el laberinto 2 por el corredor `(35,29)-(37,29)` → `(38,29)`. (duel-3 ya NO guarda rightUp: se movió al
   laberinto 1; rightUp queda como sala opcional.)
2. **Nodo de evento al fondo (callejón):** `findDeadEnd` → objeto `{ id:"story-ch4-event-rightup", kind:"EVENT", trigger:"ADJACENT_ACTION",
   sprite:"console", ... }` + `markSolid`. Nodo virtual `EVENT` en el map-definition. Narración **placeholder** en el catálogo (el usuario
   la reescribirá): algo neutro tipo Sistema/consola. NO metas nada de "la Entidad".

### Cosas abiertas / avisos
- **E4/E5/E6** (`story-ch4-event-revelation`, `-pre-midutech`, `-core-key`) **todavía mencionan "la Entidad"** — el usuario rehará esa
  parte de la historia; NO son definitivas. Neutralízalas solo cuando él lo indique.
- **Nombre del jugador** en las narraciones: no hay inyección dinámica; se usa "Operador".
- **Habilidades de combate** de `opp-ch4-*` (y ahora duel-8): asignar en admin (esto conecta con la rama `feat/opponent-skill-abilities`).
- **Salas opcionales:** rightUp pasa a tener el evento del paso 5; la sala der del laberinto 1 ya tiene el DEF.

### Ficheros que se tocan
- `src/services/story/overworld/act-4-overworld-tilemap.ts` (mapa/mazes/objetos).
- `src/services/story/map-definitions/act-4-map-definition.ts` (nodos virtuales: REWARD_CARD/EVENT).
- `src/services/story/story-node-interaction-dialogue-catalog.ts` (narraciones).
- `src/services/story/overworld/act-4-overworld-tilemap.test.ts` (tests).
- `docs/supabase/sql/146_story_act4_hydra_duel.sql` (BD, nuevo).
- (Opcional) `src/components/hub/story/overworld/OverworldDevScene.tsx` si usas `pendingNarrationBattleRef` para narración→combate.
