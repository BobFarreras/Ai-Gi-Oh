<!-- docs/story/acts/act-4/ACT-4-IMPLEMENTATION-GUIDE.md - Guía maestra de implementación del Acto 4 (GenNvim, terminal verde): mapa grande tipo laberinto, mecánicas duras, roster, objetos, eventos y contenido de BD. -->
# Guía de implementación — Acto 4: Núcleo GenNvim (terminal verde)

> Rama: `feat/story-act-4-gennvim`
> Motor: **overworld por tiles** (Canvas 2D), el mismo de los Actos 1-3. Ver `docs/story/overworld-engine-guide.md`.
> Estado: **guía de diseño** (aún sin implementar). Este documento es la fuente de verdad de lo que vamos a construir.

---

## 0. TL;DR (qué es el Acto 4)

Un acto **difícil y largo**, con estética de **terminal verde ciberpunk** (GenNvim ≈ Vim/Neovim: verde fósforo sobre negro), montado sobre el motor overworld que ya usa el Acto 3. El jugador atraviesa un **mainframe-laberinto** más grande que los actos previos, resolviendo **puzzles de cajas + pasarelas (cintas)**, **abriendo puertas al vencer a rivales fuertes**, recogiendo **objetos** (USB Raro y aumentos de atributo) escondidos en salas laterales, y descubriendo el **origen de la Entidad** antes de ganar la **llave del Core** (transición al Acto 5).

Encaja en el arco: **Act 1** (instalación, tutorial/BigLog) → **Act 2** Valle Visual (Helena) → **Act 3** Repositorio Fantasma (Jaku) → **Act 4** Núcleo GenNvim → **Act 5** Core.

---

## 1. Objetivos de diseño (lo que pediste)

1. **Blindarlo bien / difícil de pasar**: rivales duros (rango ELITE→MYTHIC), puertas que solo se abren venciendo a rivales fuertes, y puzzles obligatorios.
2. **Laberinto** con **objetos que se empujan** (cajas `BOX`) y **pasarelas de movimiento** (cintas `BELT_*`), combinados con muros para formar un mapa enrevesado.
3. **Puertas desbloqueadas por victoria** sobre oponentes fuertes (`GATE` con `gateRequiredNodeIds: [duelId]`).
4. **Objetos por habitaciones/caminos**: USB Raro (`candy-usb-raro`) y aumentos de atributo (`item-nucleo-overclock` = ATK, `item-placa-blindada` = DEF), como `REWARD_OBJECT`.
5. **Rediseño del mapa**: entorno **verde tipo terminal ciberpunk** (nuevo `ambient`), y **más grande** que el Acto 3.
6. **Temática y eventos** para meter al jugador en la historia. Los eventos pueden ser **vídeos**: en §4 dejo el **diálogo y las escenas** para que los produzcas.

---

## 2. Contexto técnico (lo que YA existe y reutilizamos)

El Acto 4 **no inventa motor**: clona el patrón del Acto 3. Referencias reales:

- **Plantilla de mapa**: `src/services/story/overworld/act-3-overworld-tilemap.ts` (copiar y adaptar).
- **Schema de tiles/objetos**: `src/services/story/overworld/tilemap-schema.ts` (`IOverworldTilemap`, `OverworldObjectKind`, `OverworldAmbient`).
- **Registro de mapas**: `src/services/story/overworld/resolve-overworld-tilemap.ts` → hay que añadir `"act-4": buildAct4OverworldTilemap`.
- **Render**: `src/components/hub/story/overworld/engine/Renderer2D.ts` (paleta, `drawDarknessPass`, tiles).
- **Tiles/overlays**: `src/services/story/overworld/overworld-tile-kinds.ts` (`GROUND_TILE`, `OVERLAY_TILE`).
- **Nodos virtuales** (para que `mark-interacted`/`claim-reward` reconozcan eventos/switches/terminales/recompensas server-side): `src/services/story/map-definitions/act-3-map-definition.ts` → crear `act-4-map-definition.ts`.
- **Diálogos**: `story-node-interaction-dialogue-catalog.ts` (entradas `story-ch4-*`) + media en `story-node-dialogue-media.ts`.
- **Submission (códigos)**: `story-node-submission-rules.ts`.
- **Contenido de BD** (oponentes/mazos/duelos/recompensas): migración tipo `docs/supabase/sql/090_story_act3_jaku_flow.sql` → crear `143_story_act4_gennvim_flow.sql`.
- **Warp de entrada ya existe**: el Acto 3 termina con `story-ch3-transition-to-act4` → `{ toMapId: "act-4", toSpawnId: "spawn-entry" }`. Es decir, **el Acto 4 debe exponer un spawn `spawn-entry`** o el portal del Acto 3 cae en vacío.

**Ejes de estado (no se inventan):** `visited_node_ids` (pisado), `player_story_duel_progress` (duelo ganado), `interacted_node_ids` (evento/switch/terminal/recompensa). Todo objeto del Acto 4 escribe en estos ejes por su `id`.

---

## 3. Narrativa y tema

### 3.1 Premisa
GenNvim es la **fundición** donde la Entidad fue **compilada** por primera vez. No es un enemigo "persona" como Helena o Jaku: es un **sistema** —un kernel corporativo de seguridad— que se defiende con **daemons** (procesos-centinela). El jugador entra buscando la **llave del Core** y, por el camino, **descubre el origen de la Entidad**: no nació, la **construyeron** aquí (giro narrativo del acto).

Tono visual: **terminal verde fósforo** sobre negro, scanlines, texto tipo log, rejilla neón verde. Todo "respira" como una consola viva.

### 3.2 Personajes
- **BigLog** (mentor/narrador): aparece por voz/registro guiando y, al final, confesando su parte en el origen (tensión emocional).
- **GenNvim** (antagonista-sistema): el kernel de la fundición. **Primer boss** del acto + evento de revelación. Voz fría, en segunda persona, estilo mensajes de compilador.
- **Midutech** (antagonista-corporación): el **arquitecto humano** detrás de GenNvim (guiño a midudev; su primo de arena es **Mouretech** = mouredev, ya existente en `086_arena_opponents_guill_mouretech.sql`). Es el **boss final** del acto y guarda la llave del Core.
- **Soldado-Terminal** (nuevo, `opp-ch4-soldado-terminal`): el centinela-proceso del acto (duelos regulares), equivalente al Soldado-Laptop del Acto 3.

> **Dos bosses** (tu decisión): GenNvim (sistema, con evento) y Midutech (corp, final). La llave del Core cae al vencer a Midutech.

### 3.3 Arco del acto (principio → fin)
1. **Entrada / ultimátum**: GenNvim detecta la intrusión y "monta" el laberinto para expulsar al jugador (E1, vídeo).
2. **Ascenso por el mainframe**: puzzles + 5 duelos del Soldado-Terminal escalados; se van revelando **logs del origen** (E2, E3).
3. **Revelación + Boss 1**: el registro-madre expone que la Entidad se compiló aquí (E4, vídeo) → **boss GenNvim**.
4. **Boss final**: aparece **Midutech**, el humano tras el sistema (E5) → **boss Midutech**.
5. **Cierre**: se obtiene la **llave del Core** (E6, vídeo) → warp al Acto 5 (sellado, "próximamente").

---

## 4. Guion de eventos / cinemáticas (para producir en vídeo)

> Estos son los eventos `EVENT`/`NPC` del mapa. **Tu decisión: 3 vídeos + 3 diálogos.** Reparto propuesto: **VÍDEO** en E1 (intro), E4 (revelación GenNvim) y E6 (cierre/llave del Core); **DIÁLOGO** en E2, E3 y E5. Te dejo escena + diálogo de los 6; produce los 3 vídeos y me pasas los archivos, y los 3 diálogos ya quedan cableados con retrato.

### E1 — Intro del acto (`story-ch4-event-intro`) — **[VÍDEO]** — se dispara al primer paso
- **Escena**: plano del jugador entrando a una sala-consola. Todo negro; de golpe **arranca** una rejilla verde que se dibuja sola (boot de terminal). Líneas de log cayendo.
- **Diálogo**:
  - GenNvim: `> intruso.detectado. reubicando geometría. suerte encontrando la salida.`
  - BigLog: "Esto es GenNvim. Aquí se forjó… todo. No confíes en las paredes: se mueven."

### E2 — Primer log del origen (`story-ch4-event-log-origin-1`) — **[DIÁLOGO]** — consola en sala lateral
- **Escena**: consola parpadeante; el jugador lee un fragmento de compilación antiguo.
- **Diálogo**:
  - Log: `> build.entidad v0.1 — semilla: [REDACTADO] — patrocinador: B.L.`
  - BigLog (incómodo): "…No leas eso todavía. Sigue."

### E3 — Sala de las pasarelas (`story-ch4-event-belts`) — **[DIÁLOGO]** — tutorial diegético del laberinto
- **Escena**: se revela la sala de cintas y cajas. GenNvim se burla.
- **Diálogo**:
  - GenNvim: `> flujo.forzado. cada cinta va en un sentido. las cajas pesan. piensa antes de pisar.`

### E4 — Revelación del origen (`story-ch4-event-revelation`) — **[VÍDEO]** — evento de GenNvim (antes del boss GenNvim)
- **Escena**: registro-madre. Se despliega el árbol de compilación de la Entidad; BigLog aparece en holograma; GenNvim toma forma para el primer boss.
- **Diálogo**:
  - Registro: `> autor(es): GenNvim + Midutech. patrocinador: B.L. objetivo: contención. resultado: fuga.`
  - BigLog: "La construimos para **contener**, no para liberar. Cuando escapó… te empecé a entrenar a ti. Eras el plan B."
  - GenNvim: `> plan B: obsoleto. compilando defensa.` → **duelo boss GenNvim**.

### E5 — Antes de Midutech (`story-ch4-event-pre-midutech`) — **[DIÁLOGO]** — ultimátum final
- **Escena**: tras caer GenNvim, la sala del núcleo se abre y aparece **Midutech** (el humano detrás del sistema), sereno.
- **Diálogo**:
  - Midutech: "GenNvim solo era código. Yo lo escribí. Si quieres la llave del Core, tendrás que quitármela."
  - BigLog: "Ten cuidado. Él sabe cómo piensas… porque ayudó a diseñarte."

### E6 — Cierre / llave del Core (`story-ch4-event-core-key`) — **[VÍDEO]** — tras vencer a Midutech
- **Escena**: Midutech se retira; el núcleo se estabiliza en verde; cae una **llave** de datos. El warp al Acto 5 queda "sellado / próximamente".
- **Diálogo**:
  - Midutech: "Buen jugador. Quizá el plan B no era tan malo."
  - BigLog: "Ya tienes la llave del Core. Lo que viene ahora… no puedo prepararte para ello."

> **Formato de entrega de vídeos** (si los haces): el catálogo Story ya soporta media por nodo (`story-node-dialogue-media.ts`). Pásame los `.mp4/.webm` y los cableo a los `story-ch4-event-*`. Si un evento no lleva vídeo, se muestra como diálogo con retrato + líneas.

---

## 5. Diseño del mapa

### 5.1 Dimensiones y ambiente
- **Tamaño**: **más grande que el Acto 3** (40×44). Propuesta: **56×60** celdas (≈ 1.9×). Ajustable.
- **Ambiente nuevo**: `ambient: "TERMINAL"` (verde). Requiere ampliar el motor (ver §9).
- **Estética**: suelo de rejilla verde tenue, muros = "racks" verticales de consola, decoración = pantallas holográficas verdes (`HOLO_SCREEN` con tinte), scanlines sutiles.

### 5.2 Topología (laberinto con reconvergencia)
Diseño en **3 franjas verticales** que ascienden (planta baja → núcleo), con caminos paralelos que se reencuentran (como el Acto 2/3, nada de pasillo único):

```
                 [ SALA DEL NÚCLEO — BOSS GenNvim ]         (arriba)
                          ▲ gate(boss)
        ┌─────────────────┴──────────────────┐
   [ Registro-madre E4 ]   [ Terminal código ]   [ Caché aumentos ]
        │  (rama izq)         (rama centro)          (rama der)
        │                     ▲ belts+boxes            │
   [ Laberinto de cintas y cajas — sala grande central ]
        ▲ gate(duel fuerte)                            ▲ gate(duel fuerte)
   [ Rama izquierda: daemons ]   [ HUB ]   [ Rama derecha: daemons ]
                                   ▲
                            [ ENTRADA / E1 / servicios ]        (abajo)
```

- **HUB** con servicios (`MARKET`, `ARSENAL`, `TELEPORT`) y el warp de retorno al Acto 3.
- **Laberinto central** (§6.2): la pieza estrella —cintas + cajas + muros.
- **Tres ramas** que exigen vencer a un daemon fuerte (puerta `GATE`) para abrirse.
- **Sala del núcleo** sellada tras: terminal hackeado + eco derrotado + puzzle resuelto.

### 5.3 Spawn y warps
- `spawns: [{ id: "spawn-entry", tileX, tileY, facing: "UP" }]`, `defaultSpawnId: "spawn-entry"` (el portal del Acto 3 entra aquí).
- Warp de retorno: `story-ch4-transition-to-act3` (`STEP_ON`, `direction: "backward"`).
- Warp de avance: `story-ch4-transition-to-act5` (`STEP_ON`, gated por el boss Midutech, `direction: "forward"`). **Decisión: NO se crea el Acto 5 ahora.** El nodo final muestra la **llave del Core + "Acto 5: próximamente"** (sellado). Cuando exista `act-5`, se activa el warp. Nos centramos en el Acto 4.

---

## 6. Mecánicas y dificultad

### 6.1 Puertas por victoria (obligatorio, tu pedido)
Cada rama y el núcleo van detrás de un `GATE`:
```ts
{ id: "story-a4-gate-left", kind: "GATE", tileX, tileY, sprite: "gate",
  trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-duel-2"] }
```
El núcleo exige varios: `gateRequiredNodeIds: ["story-ch4-firewall-terminal", "story-ch4-duel-echo", "story-a4-plate-core"]`.

### 6.2 Laberinto: cajas empujables + pasarelas (tu pedido)
- **Cintas** (`GROUND_TILE.BELT_UP/DOWN/LEFT/RIGHT`): arrastran en un sentido y **no se recorren en contra** (`resolveStepDirection` ignora el input opuesto; se sale por el lateral perpendicular). **Regla de diseño**: siempre dejar una ruta de retorno para no atrapar al jugador.
- **Cajas** (`BOX`) + **placas** (`PLATE`) + **botón de rescate** (`BOX_RESET`, anti soft-lock): empujar cajas sobre placas abre `GATE`s en vivo.
- **El laberinto combina las tres**: pasillos de cinta que fuerzan rodeos, cajas que hay que llevar contra la lógica de las cintas hasta placas, y muros de "rack" que cierran la vista. Objetivo: que **pensar la ruta** cueste tanto como ganar los duelos.
- **Anti-frustración**: cada sub-puzzle con su `BOX_RESET`, y un camino de retorno por sala. Sin dead-ends absolutos.

### 6.3 Rivales duros (tu pedido "blindarlo bien")
- **Visión estilo Pokémon** (`facing` + `visionRange`) y **aggro de sala** (`visionRect`) para jefes/ecos: entrar = combate garantizado.
- **Patrullas barredoras** (`patrolAxis`/`patrolLength`/`patrolSweep`) en los corredores del laberinto: esquivar mientras empujas cajas.
- **Rivales en corredor = barrera física** (`markSolid`): no pasas sin ganar.
- **Dificultad de BD** (rango): mayoría **ELITE**, eco **ELITE alto**, boss **MYTHIC** (tope de balance vigente). El suelo del acto ≥ cierre del Acto 3.

### 6.4 Objetos por salas/caminos (tu pedido)
`REWARD_OBJECT` escondidos detrás de puzzles/daemons. **Ids reales confirmados** (catálogo de objetos, migraciones 120/123) — así se declara cada nodo en `act-4-map-definition.ts`:

| Objeto | `rewardObjectType` | `rewardObjectId` | Efecto | Ubicación |
|---|---|---|---|---|
| USB Raro | `LEVEL_CANDY` | `candy-usb-raro-1` | +1 nivel de carta | Sala del laberinto |
| Núcleo Overclock | `CARD_UPGRADE` | `item-nucleo-overclock` | +100 ATK a una carta | Rama derecha, tras daemon |
| Placa Blindada | `CARD_UPGRADE` | `item-placa-blindada` | +100 DEF a una carta | Rama izquierda, tras puzzle |

Ejemplo de nodo (como el `story-ch3-cache-object` del Acto 3):
```ts
v({ id: "story-ch4-cache-atk", duelIndex: 4NN, nodeType: "REWARD_OBJECT", title: "Núcleo Overclock",
    rewardObjectType: "CARD_UPGRADE", rewardObjectId: "item-nucleo-overclock", rewardObjectQuantity: 1,
    unlockRequirementNodeId: null, position: { x, y } })
```
Y en el tilemap, un `REWARD_OBJECT` con `imageSrc: "/assets/items/item-nucleo-overclock.webp"`.

---

## 7. Roster y balance (contenido de BD)

Se define en la migración `143_story_act4_gennvim_flow.sql` (tablas `story_opponents`, `story_deck_lists`, `story_deck_list_cards`, `story_duels`, `story_duel_reward_cards`, y opcional `story_duel_ai_profiles`/`story_duel_deck_overrides` para escalado por aparición).

**7 duelos** (tu decisión: 5 soldado + GenNvim + Midutech):

| # | Duelo (nodeId) | Rival | Rol | Dificultad |
|---|---|---|---|---|
| 1 | `story-ch4-duel-1` | Soldado-Terminal | Centinela de entrada | ELITE |
| 2 | `story-ch4-duel-2` | Soldado-Terminal | Puerta rama izquierda | ELITE |
| 3 | `story-ch4-duel-3` | Soldado-Terminal | Puerta rama derecha | ELITE |
| 4 | `story-ch4-duel-4` | Soldado-Terminal | Guardián del laberinto | ELITE alto |
| 5 | `story-ch4-duel-5` | Soldado-Terminal | Antesala del núcleo | ELITE alto |
| 6 | `story-ch4-duel-gennvim` | **GenNvim** | BOSS 1 (tras evento E4, aggro de sala) | MYTHIC |
| 7 | `story-ch4-duel-midutech` | **Midutech** | BOSS 2 / final — da la llave del Core | MYTHIC (tope) |

- **Soldado-Terminal** (nuevo, `opp-ch4-soldado-terminal`): cubre los 5 duelos regulares con escalado (visión/patrulla más agresiva conforme subes). Avatar nuevo (lo creas tú) en `/assets/story/opponents/opp-ch4-soldado-terminal/`.
- **GenNvim** (`opp-ch4-gennvim`): boss del núcleo, precedido por el evento-vídeo E4. `kind: "BOSS"`, `visionRect` = su sala.
- **Midutech** (`opp-ch4-midutech`): boss final. Al vencerlo se concede la llave del Core (E6) y se abre el warp (placeholder al Acto 5).
- **Mazos**: suelo de dificultad alto (varias entidades > 1800 ATK, como Jaku en Act 3); los dos bosses en el tope de balance vigente.
- **Decisión tuya**: avatares de los 3 rivales nuevos (assets `opp-ch4-*`), y el diseño de mazo de cada uno (puedo proponer listas cuando lleguemos a la migración 143).

---

## 8. Cambios en el motor (nuevos)

La mayoría del Acto 4 es **contenido**, pero el **ambiente verde** requiere tocar el engine:

1. **Schema** (`tilemap-schema.ts`): ampliar `OverworldAmbient` a `"NORMAL" | "DARK" | "TERMINAL"`. Campo opcional → no rompe mapas existentes.
2. **Renderer** (`Renderer2D.ts`): añadir **paleta TERMINAL** (verdes fósforo, fondo casi negro, rejilla neón verde) y un **pase visual** ligero (scanlines / glow verde) análogo a `drawDarknessPass` pero barato (respetar el perfil de rendimiento: sin coste en gama baja; gating por `resolveStoryPerformanceProfile`).
3. **Tiles** (`overworld-tile-kinds.ts`): si hace falta, variantes de suelo/rack en verde (o reusar los actuales con tinte por paleta — preferible, menos assets).
4. **Validación** (`validate-tilemap.ts`): aceptar el nuevo `ambient` (si valida el enum).
5. **Tests**: `act-4-overworld-tilemap.test.ts` (validez del mapa, reachability con gates, mecánicas) + tests puros si se añade lógica nueva.

> **Rendimiento es requisito duro** (móvil / PC viejos): el pase TERMINAL debe ser un overlay cacheado/estático, no un efecto por-frame costoso. Medir con CPU throttling 6×.

---

## 9. Contenido de BD (migración 143)

Espejo de la 090 del Acto 3. Debe incluir:
- `story_opponents` (los daemons + GenNvim), con avatar y narración.
- `story_deck_lists` + `story_deck_list_cards` (mazos duros, suelo ELITE/MYTHIC).
- `story_duels` (ch4 duel 1..6) con `chapter=4`, dificultad y `unlockRequirementDuelId` **alineado al orden físico del mapa** (para que nunca salga "Duelo bloqueado" incoherente).
- `story_duel_reward_cards` (cartas de preparación final).
- (Opcional) `story_duel_ai_profiles` / `story_duel_deck_overrides` para escalar por aparición.

**Orden de despliegue**: migración **idempotente**; se aplica **al hacer release del Acto 4** (después de desplegar el código que la consume, como en Act 3). Documentar en el CHANGELOG.

---

## 10. Puntos de integración (checklist de cableado)

- [ ] `src/services/story/overworld/act-4-overworld-tilemap.ts` (`buildAct4OverworldTilemap`, `ambient: "TERMINAL"`, `id: "act-4"`, `spawn-entry`).
- [ ] Registrar en `resolve-overworld-tilemap.ts` (`"act-4": buildAct4OverworldTilemap`).
- [ ] `src/services/story/map-definitions/act-4-map-definition.ts` (nodos virtuales: eventos, switches si hay, terminal, recompensas, objetos).
- [ ] Diálogos `story-ch4-*` en `story-node-interaction-dialogue-catalog.ts` (+ media en `story-node-dialogue-media.ts` si hay vídeos).
- [ ] Código(s) de `SUBMISSION` en `story-node-submission-rules.ts` (p. ej. clave del cortafuegos del núcleo).
- [ ] Migración `docs/supabase/sql/143_story_act4_gennvim_flow.sql` (oponentes/mazos/duelos/recompensas).
- [ ] Motor: `ambient: "TERMINAL"` en schema + Renderer2D + validate-tilemap.
- [ ] Warp de avance al Acto 5 (o placeholder "próximamente" hasta que exista `act-5`).
- [ ] Tests: `act-4-overworld-tilemap.test.ts` + los puros que toque.
- [ ] Assets: avatares `opp-ch4-*` (los proporcionas tú) y confirmación de `itemId` de los aumentos.

---

## 11. Plan por fases (mergeable e incremental)

1. **Fase 0 — Motor: ambiente TERMINAL.** Schema + Renderer2D + validación + test. Sin contenido aún; se prueba con un mapa dummy verde. *(Verificable solo, no toca Actos 1-3.)*
2. **Fase 1 — Esqueleto del mapa.** `act-4-overworld-tilemap.ts` con salas, corredores, spawn y warps; registrado. Caminable de entrada a salida SIN puzzles ni rivales. Test de reachability.
3. **Fase 2 — Laberinto (cintas + cajas + placas).** La sala central jugable, con `BOX_RESET` y rutas de retorno. Test de que no hay soft-lock.
4. **Fase 3 — Rivales + puertas.** Daemons con visión/patrulla, `GATE`s por victoria, nodos virtuales, y la migración 143 (oponentes/mazos/duelos). Balance duro.
5. **Fase 4 — Objetos + recompensas.** `REWARD_OBJECT` (USB/aumentos) + cartas/nexus, cableados a `claim-reward`.
6. **Fase 5 — Narrativa.** Eventos `story-ch4-*` + diálogos (+ vídeos cuando los entregues). Intro, revelación, cierre y llave del Core.
7. **Fase 6 — Cierre y QA.** Warp al Acto 5, transición de acto, QA multi-dispositivo (60 fps gama media / 30 fps estable gama baja), regresión de progreso, `CI=true pnpm quality:check`.

Cada fase: rama viva, tests en verde, y validación visual tuya antes de avanzar.

---

## 12. Decisiones (cerradas 2026-07-21) y lo que aún necesito de ti

**Cerradas:**
1. **Vídeos**: 3 vídeos (E1 intro, E4 revelación GenNvim, E6 cierre/llave) + 3 diálogos (E2, E3, E5). ✔
2. **Bosses/roster**: 2 bosses = **GenNvim** (evento + boss) y **Midutech** (boss final; guiño a midudev, primo del Mouretech de arena) + **nuevo soldado del acto** (`Soldado-Terminal`) para los 5 duelos regulares. ✔
3. **Tamaño**: 56×60 de momento (lo revisas). ✔
4. **Acto 5**: no se crea ahora; warp final = "próximamente". ✔
5. **Objetos**: ids confirmados (§6.4). ✔
6. **Nº de duelos**: 7 (5 soldado + GenNvim + Midutech). ✔

**Aún necesito de ti (assets/contenido, cuando toque cada fase):**
- **Avatares** de los 3 rivales nuevos: `opp-ch4-soldado-terminal`, `opp-ch4-gennvim`, `opp-ch4-midutech` (en `/assets/story/opponents/opp-ch4-*/`).
- **3 vídeos** de E1, E4, E6 (con el diálogo de §4; ajusto el tono si quieres).
- **Mazos** de los 3 rivales (puedo proponerlos yo en la Fase 3 y tú los validas).
- (Opcional) **soundtrack** del Acto 4 (como `act-2/Chromed Horizon.mp3`).

---

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Laberinto frustrante / soft-lock | `BOX_RESET` por puzzle, rutas de retorno, sin dead-ends; QA de "no atrapado" |
| Pase visual verde castiga el rendimiento | Overlay estático/cacheado, gating por perfil, medir con throttling 6× |
| "Duelo bloqueado" incoherente | `unlockRequirementDuelId` alineado al orden físico del mapa |
| Dificultad injusta vs. difícil | Suelo ELITE con curva; permitir farmear Nexus/objetos en ramas antes del boss |
| Migración 143 antes de tiempo | Idempotente y aplicada en el release del acto (tras desplegar el código) |
| Warp a un Acto 5 inexistente | Placeholder controlado hasta que exista `act-5` |

---

## 14. Referencias
- Motor y decisiones: `docs/story/overworld-engine-guide.md`.
- Plantilla directa: `src/services/story/overworld/act-3-overworld-tilemap.ts` + `docs/story/acts/act-3/README.md`.
- Flujo de diseño de actos: `docs/story/acts/ACT-BUILD-GUIDE.md`.
- Schema: `src/services/story/overworld/tilemap-schema.ts`.
- SQL de referencia: `docs/supabase/sql/090_story_act3_jaku_flow.sql`.

---

## 15. Diseño detallado del recorrido y puzzles (acordado 2026-07-21)

Refinamiento del layout sobre el esqueleto (Fases 1-2 ya implementadas: ambiente verde + laberinto de
caja/placa). El objetivo es **forzar el recorrido y los combates** con puzzles encadenados y pasillos.

### 15.1 Estado ya implementado
- Fase 1: mapa `act-4` (52×56), verde TERMINAL, salas + corredores + spawn + servicios + retorno.
- Fase 2: **1er puzzle** = caja empujable → placa → compuerta `story-a4-gate-lab` (obligatorio: sin la placa el
  jefe es inalcanzable) + una cinta de ascenso + botón de reinicio. 2 atrezzo nuevos (refrigeración, pilón).

### 15.2 Mecánica NUEVA a implementar: interruptor que invierte una cinta (belt-toggle)
Pedido: el **puente de subida** a la sala de arriba lleva una **cinta en sentido contrario** (te empuja hacia
abajo, no puedes subir); un **botón en OTRA sala** invierte su sentido para poder pasar.
- **Schema**: `SWITCH` gana un campo `beltToggleRect?` (o `beltGroupId`) que referencia las casillas-cinta que
  controla. (Alternativa más simple si no queremos motor nuevo: el botón es un `SWITCH` que abre un `GATE` en
  el puente — se pasa por una compuerta, no por inversión de cinta. **Decisión del usuario**: quiere inversión.)
- **Core** (regla pura, testeable, tipo `lighting.ts`/`push-rules.ts`): `resolveBeltDirection` considera si el
  grupo está invertido según `interactedNodeIds` (el botón, al accionarse, marca `interacted` y persiste).
- **Renderer**: dibuja los chevrones de la cinta en su **sentido vigente** (invertido o no).
- **Movimiento**: el arrastre respeta el sentido vigente; con la cinta en contra no se sube (hay que activar el
  botón primero). Siempre debe existir un camino de retorno (no atrapar).

### 15.3 Recorrido encadenado (fuerza el orden)
1. **Entrada** — evento **E1** (intro, será vídeo → de momento EVENT con narración).
2. **Hub** → pasillos de atrezzo hacia las ramas. **Chokepoint**: rival sólido en el corredor de subida (combate obligatorio).
3. **Laberinto central** — puzzle caja→placa (hecho) abre la compuerta hacia las ramas altas.
4. **Puente al terminal** — lleva la **cinta EN CONTRA** (belt-toggle). No se sube todavía.
5. **Rama alta** (p.ej. derecha) — contiene el **botón** que invierte la cinta del puente. Para llegar, otro **chokepoint** con rival. Evento **E2** (log del origen) en una consola de esta rama.
6. Cinta invertida → se **sube al terminal** — evento **E4** (revelación, será vídeo) → **puerta del jefe**.
7. **GenNvim (boss 1)** en su sala (`visionRect`). Evento **E5** al caer.
8. **Puerta post-GenNvim** (`GATE` con `gateRequiredNodeIds:[duelo GenNvim]`): **solo abre tras vencer a GenNvim**. Da acceso a **Midutech (boss final)** y a la cámara de recompensas.
9. **Midutech** → llave del Core, evento **E6** → warp "Acto 5: próximamente".

### 15.4 Pasillos de atrezzo + chokepoints de rivales
- Estrechar salas con **muros de atrezzo** (racks / refrigeración / pilones = colisión) para crear **pasillos de
  1 casilla**. En cada pasillo clave, un **rival sólido** (`markSolid` + `DUEL`): no se pasa sin vencerlo, como
  en el Acto 3. Posiciones: subida del hub, entrada a cada rama, antesala del terminal, sala del jefe.
- Los rivales llevan `facing`/`visionRange` (haz) y algunos `patrolAxis`/`patrolSweep` (patrulla) para esquiva.

### 15.5 Eventos y narraciones (placeholders de vídeo)
Los **vídeo** (E1, E4, E6) se implementan **ya como EVENT con narración** (texto en §4); se cambiarán por el
vídeo cuando lo entregues. Los diálogo (E2, E3, E5) igual, con retrato. Todos como nodos `story-ch4-event-*`
registrados en `act-4-map-definition.ts` (nodeType EVENT) + entradas en el catálogo de diálogos. Eventos de
puzzle nuevos:
- `story-ch4-event-belt-locked`: al pisar el puente con la cinta en contra → GenNvim se burla ("el flujo va donde yo digo").
- `story-ch4-event-belt-toggled`: al invertir la cinta con el botón → confirmación ("flujo redirigido").

### 15.6 Puertas por victoria del jefe
- `story-a4-gate-postboss` con `gateRequiredNodeIds: [<duelo GenNvim>]`: sella Midutech + recompensas hasta
  vencer a GenNvim (pedido explícito del usuario).

### 15.7 Nota de numeración de migración
La migración de contenido del Acto 4 pasa a ser la **144** (la 143 la ocupó `opponent_skill_ranks`).

### 15.8 Orden de implementación propuesto (siguientes fases)
- **Fase 2.5** (motor): mecánica belt-toggle (schema + core + renderer + movimiento) con tests. *Requiere OK.*
- **Fase 3** (contenido): pasillos de atrezzo + chokepoints + rivales + puertas por victoria + eventos con
  narración + migración 144 (Soldado-Terminal, GenNvim, Midutech). Aquí se les asignan habilidades de combate.
- **Fase 4**: objetos/recompensas (USB/aumentos) en salas laterales.
- **Fase 5-6**: pulido, cierre (llave del Core), QA.
