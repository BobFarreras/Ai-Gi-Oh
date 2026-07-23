<!-- docs/story/acts/act-4/ACT-4-FLOW.md - Guía + HANDOFF del Acto 4 (Núcleo GenNvim): estado actual del mapa/mecánicas/narraciones y los pasos que faltan (4 y 5) con detalle técnico para que otro agente los ejecute. -->
# Acto 4 — Núcleo GenNvim — Guía + Handoff

> **Rama de trabajo:** `feat/story-act-4-gennvim`. **Fichero clave del mapa:** `src/services/story/overworld/act-4-overworld-tilemap.ts`.
> **Validación rápida:** `CI=true pnpm exec vitest run src/services/story/overworld src/services/story/map-definitions`
> y `CI=true pnpm exec tsc --noEmit 2>&1 | grep -v "opponent-skills/route"`. Usar **pnpm**, no npm.

Esta guía tiene 2 partes: **(A)** cómo está el acto AHORA y **(B) HANDOFF**: los pasos 4 y 5 que faltan, con el cómo técnico.

> **▶ Pulido posterior y trabajo pendiente:** [ACT-4-HANDOFF-2026-07-23.md](./ACT-4-HANDOFF-2026-07-23.md) —
> emboscada de la Hydra + vídeo de intro (hechos) y las 4 mejoras siguientes (narración de la pasarela,
> interruptor a la sala derecha, rival patrullando y sala de la Fábrica de Cartas).

---

## A. Estado actual (ya hecho y validado)

Mapa `act-4` (verde TERMINAL, **52×70**). Flujo vertical de abajo (entrada) a arriba (jefes). Hay **SEIS laberintos
reales** (maze perfecto por backtracker determinista, semilla fija) generados con `carveMaze(map, spec)`: hub,
laberinto 2 (módulo), leftLow (ATK), rightLow (DEF), leftUp (Hydra) y rightUp (evento). Las salas NO-laberinto son
entrada/servicios, terminal y sala de jefes.

### Recorrido (ruta crítica)
```
Entrada (E1 intro, GenNvim habla con SU avatar) -> duel-1 (obligatorio)
  -> LABERINTO 1 (hub, y45..59): maze real
       · rincón (callejón): carta ANTIGRABITY (REWARD_CARD, muestra el arte) -> aviso de BigLog al cogerla
       · rama izq baja = LABERINTO leftLow (x4-15): AUMENTO ATK en callejón, tras duel-2
       · rama der baja = LABERINTO rightLow (x37-48): AUMENTO DEF en callejón, tras duel-3
  -> corredor (26,43-44)
  -> LABERINTO 2 (sala módulo, y25..42): maze real
       · callejón: USB Raro (REWARD_OBJECT)
       · cámara arriba (y27): INTERRUPTOR de cinta (belt-toggle, REVERSIBLE)
       · sala izq alta = LABERINTO leftUp (x4-14): carta HYDRA en callejón; a 2 casillas de ella, EMBOSCADA de
         GenNvim (duel-8): aparece por detrás (teletransporte en desktop / andando en móvil) -> narra -> combate
       · sala der alta = LABERINTO rightUp (x38-48, atrezzo COOLING_UNIT): nodo de evento (opcional)
  -> puente/cinta (26,22-24) -> Terminal (consola E4 + 2º interruptor de cinta) + duel-5 (abre gate-boss)
  -> GenNvim (duel-6, JEFE 1) -> E5 -> puerta post-jefe -> Midutech (duel-7, JEFE FINAL) -> E6
```

### Mecánica del puente (PASO 3, ya hecho) — ahora REVERSIBLE
- El puente que sube (cinta `BELT_DOWN` en `x=26, y=22..24`) va **en contra**: no se sube.
- **DOS interruptores** controlan el MISMO `beltToggleRect: {x0:26,y0:22,x1:26,y1:24}`: `story-ch4-belt-switch` (abajo,
  cámara del laberinto 2, `(22,27)`) y `story-ch4-belt-switch-top` (arriba, terminal, `(28,20)`). Cada pulsación
  **invierte** la cinta (toggle en runtime, paridad XOR): subes con el de abajo y **vuelves a bajar** con el de arriba.
  No persiste (resetea a base al recargar); sin soft-lock porque siempre alcanzas un interruptor. Motor:
  `OverworldEngine.toggleBelt()` + `applyBeltToggles` (XOR sobre `activeBeltToggleIds`); escena: rama SWITCH con
  `beltToggleRect` en `OverworldDevScene` (re-disparable, narración solo la 1ª vez).

### Objetos y rivales (posiciones actuales)
Las posiciones marcadas `(auto)` las calcula `findDeadEnd` del maze correspondiente (no son fijas: dependen de la
semilla). Los aumentos ATK/DEF y las cartas van SIEMPRE en un callejón del maze de su sala.

| Cosa | id | Tile | Nota |
|---|---|---|---|
| Interruptor puente (abajo) | `story-ch4-belt-switch` (SWITCH) | (22,27) | belt-toggle reversible |
| Interruptor puente (arriba) | `story-ch4-belt-switch-top` (SWITCH) | (28,20) | gemelo, revierte la cinta para bajar |
| Carta Antigrabity | `story-ch4-card-antigrabity` (REWARD_CARD) | callejón hub (auto) | `entity-antigrabity`; `imageSrc` = arte |
| Carta Hydra | `story-ch4-card-hydra` (REWARD_CARD) | callejón leftUp (auto) | `exec-hydra-attack-down`; `gateRequiredNodeIds: [duel-8]` |
| USB Raro | `story-ch4-cache-usb` (REWARD_OBJECT) | callejón laberinto 2 (auto) | LEVEL_CANDY |
| Aumento ATK | `story-ch4-cache-atk` (REWARD_OBJECT) | callejón leftLow (auto) | tras duel-2 |
| Aumento DEF | `story-ch4-cache-def` (REWARD_OBJECT) | callejón rightLow (auto) | tras duel-3 |
| duel-1 | `story-ch4-duel-1` | (26,61) | entrada, obligatorio |
| duel-2 | `story-ch4-duel-2` | (16,51) | guardia entrada leftLow (ATK) |
| duel-3 | `story-ch4-duel-3` | (36,51) | guardia entrada rightLow (DEF) |
| duel-4 | `story-ch4-duel-4` | (16,29) | guardia entrada leftUp (Hydra) |
| duel-5 | `story-ch4-duel-5` | (30,17) | antesala terminal (abre gate-boss) |
| duel-6 | `story-ch4-duel-6` (BOSS) | (26,9) | GenNvim JEFE 1 |
| duel-7 | `story-ch4-duel-7` (BOSS) | (26,4) | Midutech JEFE FINAL |
| duel-8 | `story-ch4-duel-8` | acceso callejón leftUp (auto) | GenNvim (DUEL) — **emboscada**: `hidden`, sin `visionRange`, NO ocupa casilla |

### Emboscada de la Hydra (duel-8) — cutscene por pantalla
El pasillo de la carta Hydra está **vacío** (GenNvim ya no espera plantado: se le veía venir desde la entrada del
maze). A **2 casillas** de poder coger la carta hay un trigger oculto `story-ch4-event-hydra` (`STEP_ON`, `hidden`)
cuya posición **se calcula** trazando el pasillo con `traceWalkableCorridor` (nada hardcodeado). Al pisarlo:

1. `OverworldDevScene` mira `AMBUSH_BY_TRIGGER_ID` (mismo mecanismo que BigLog en el Acto 2) y, si duel-8 no está
   vencido, suspende el control y lanza `buildAct4HydraAmbushCutscene(tilemap, { isCompactViewport })`.
2. **Desktop** (cámara cerrada, se ve media sala): GenNvim se **materializa** (`SPAWN_NPC` con `effect: "TELEPORT"`
   → anillo verde + glitch en `Renderer2D.drawTeleportBurst`) a 2 casillas por detrás y avanza 1 paso.
   **Móvil** (viewport estrecho): nace 5 casillas atrás, **fuera de cámara**, y entra **andando** por el pasillo.
   En ambos casos acaba **pegado al jugador, cortándole la retirada**, y el jugador se gira (`PLAYER_FACE`).
3. Al terminar la cutscene se narra `story-ch4-event-hydra` y, al cerrarla, arranca duel-8.
4. Se **re-dispara** mientras no venzas (se gatea por `completed`, no por "evento visto"). Como el rival ya no
   tapa físicamente el callejón, la carta lleva `gateRequiredNodeIds: ["story-ch4-duel-8"]`.

### Narraciones (catálogo `src/services/story/story-node-interaction-dialogue-catalog.ts`)
Sin "la Entidad": `story-ch4-event-intro` (E1), `story-ch4-card-antigrabity` (aviso BigLog), `story-ch4-event-hydra`
(GenNvim antes de duel-8), `story-ch4-event-belt-locked`, `story-ch4-belt-switch` / `-top` (Flujo Invertido/Redirigido),
`story-ch4-event-rightup` (placeholder), E4/E5/E6. **Avatares:** las líneas de GenNvim/Midutech llevan `portraitUrl`
(su cara, no la de BigLog por defecto). **Personajes:** BigLog = mentor; GenNvim/Midutech = villanos; Sistema = terminal.
**Vídeo:** E1 (`story-ch4-event-intro`, al PRIMER paso) ya lleva `cinematicVideo`
(`/assets/videos/story/act-4/genNvim.mp4`) y se abre con el overlay de terminal de los Actos 1/2; **el vídeo
sustituye a la narración** (las líneas quedan de respaldo para el mapa Story clásico). E4/E6 aún pendientes de
vídeo. La emboscada de la Hydra solo tiene **la línea de GenNvim**: al cerrarla arranca el combate, sin réplica
de BigLog. **Timing:** `DEFAULT_AUTO_ADVANCE_MS = 10s` en
`StoryNodeInteractionDialog`. **Eliminado:** `story-ch4-event-belts` (ya no existe).

---

## B. HANDOFF — pasos 4 y 5 (✅ HECHOS 2026-07-22)

> **Estado:** PASO 4 (maze leftUp + carta Hydra `story-ch4-card-hydra` + `story-ch4-duel-8` GenNvim + evento
> `story-ch4-event-hydra`) y PASO 5 (maze rightUp con `wallKind: COOLING_UNIT` + evento `story-ch4-event-rightup`,
> narración placeholder) implementados y con tests verdes. `carveMaze` gana `wallKind` y `openApproach`. Migración
> `146_story_act4_hydra_duel.sql` **creada** (opp-ch4-gennvim-hydra + deck + duel-8, unlock `story-ch4-duel-4`).
> **PENDIENTE: aplicar 146 a prod** (junto con 145, en el release del acto). El detalle técnico original queda abajo.
>
> **Ajustes posteriores (2026-07-22, 2ª tanda):** (1) mazes también en `leftLow` (aumento ATK) y `rightLow`
> (aumento DEF): TODAS las salas de rama son laberinto (entrada/terminal/jefe no). Las salas bajas son de ancho
> par → se tapia la franja sobrante del borde para que la entrada sea 1 celda. (2) Nodos `REWARD_CARD` de
> Antigrabity/Hydra llevan `imageSrc` con el arte de la carta (el nodo muestra la carta; al cogerla se revela la
> Card real y luego salta la narración). (3) Líneas de GenNvim/Midutech con `portraitUrl` → muestran SU avatar.
> (4) Evento `story-ch4-event-belts` ELIMINADO (tilemap + map-def + catálogo). (5) Narración más lenta:
> `DEFAULT_AUTO_ADVANCE_MS` 7s→10s + líneas "Sistema" del acto a 5-6s.
>
> **Ajuste 2026-07-23 — EMBOSCADA de duel-8:** GenNvim ya NO espera plantado en el pasillo de la Hydra (se le
> veía llegar desde la entrada del maze y quitaba tensión). Ahora el pasillo está vacío y salta una **cutscene de
> emboscada** 2 casillas antes de la carta (ver "Emboscada de la Hydra" en la sección A). Cambios: `duel-8` pasa a
> `hidden` sin `visionRange` y **sin `markSolid`**; el trigger `story-ch4-event-hydra` se mueve de la boca del maze
> al pasillo (posición calculada con el nuevo `trace-walkable-corridor.ts`); la carta lleva `gateRequiredNodeIds`;
> nuevo guion `act-4-hydra-cutscene.ts`; el motor gana los pasos `PLAYER_FACE` y `SPAWN_NPC` con
> `effect: "TELEPORT"`; `OverworldDevScene` generaliza el caso BigLog en `AMBUSH_BY_TRIGGER_ID`. **Sin cambios de BD.**

### (histórico) Lo que faltaba (pasos 4 y 5)

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
