# Ficha 8 — Guía de implementación: motor de efectos + catálogo de habilidades + ranking de dificultad

> Compañero de [`skill-tree-design.md`](./skill-tree-design.md) (arquitectura y UI). Este documento es lo que
> se lee **antes de picar código**: cómo funciona el motor de efectos, la LISTA completa de habilidades que
> crearemos, y **qué es fácil (dato) vs. qué necesita refactorización**. Estado: **DISEÑO. 0 código.**

---

## 0. Cómo leer esta guía

Tres partes:
1. **§1 El motor de efectos** — la maquinaria que hace que CUALQUIER habilidad funcione. Se pica UNA vez;
   luego cada habilidad nueva es "una fila de datos + su enganche". Es lo primero que hay que construir.
2. **§2 Catálogo completo de habilidades** — todas las que crearemos, por rama, con su `kind` de efecto, sus
   rangos y su **tier de dificultad**. Incluye tus 3 ideas (fuertes → caras y profundas) y 3 moderadas por
   sección que propongo yo.
3. **§3 Ranking de dificultad y orden de trabajo** — el mapa de "empieza por aquí" a "esto es un refactor".

**Regla de oro (de la arquitectura):** el nodo no cambia datos, da un permiso/modificador aplicado donde ya se
calcula esa cosa; si toca valor, en el SERVIDOR. El motor solo LEE el rango del jugador y multiplica.

---

## 1. El motor de efectos (lo que se pica una vez)

### 1.1 Piezas de código (data-driven, patrón de las pasivas mastery)

| Archivo (nuevo) | Rol |
|---|---|
| `src/core/services/progression/skill-tree/skill-effect-kinds.ts` | Catálogo central de `kind`s (evita strings mágicos), como `mastery-passive-ids.ts`. |
| `.../skill-effect-types.ts` | La unión `SkillEffect` discriminada por `kind` (§1.2). |
| `.../resolve-player-skill-modifiers.ts` | **Resolver puro**: recibe `[{ effect, rank }]` y devuelve `IPlayerSkillModifiers` sumando `efecto·rango`. Única fuente. |
| `.../skill-node-catalog.ts` | Espejo en código de los `kind`/gates del catálogo (la magnitud vive en BD `character_skill_nodes.effect`), como `innate-passive-map.ts`. |
| `src/core/services/progression/player-level.ts` | `resolvePlayerLevel(xp)` → nivel + puntos (curva única, §2 del design). |

### 1.2 La unión `SkillEffect` (crece una entrada por habilidad nueva)

```ts
type SkillEffect =
  // — FAMILIA A · ECONOMÍA (servidor, tubería de recompensa) —
  | { kind: "NEXUS_REWARD_MULT"; valuePerRank: number }
  | { kind: "XP_REWARD_MULT"; valuePerRank: number }
  | { kind: "LOSS_CONSOLATION_MULT"; valuePerRank: number }   // +% del Nexus base al PERDER
  | { kind: "PASSIVE_NEXUS_CAP_BONUS"; perWinPerRank?: number; dailyPerRank?: number }
  | { kind: "FIRST_WIN_DOUBLE_NEXUS" }                         // keystone
  // — FAMILIA B · COMBATE (preparación de partida; PvE en v1) —
  | { kind: "STARTING_LP_BONUS"; valuePerRank: number }
  | { kind: "MAX_ENERGY_BONUS"; valuePerRank: number }        // sube el techo de energía (10 → …)
  | { kind: "TURN1_ENERGY_BONUS"; value: number }             // keystone
  | { kind: "OPENING_HAND_BONUS"; value: number }             // keystone
  | { kind: "OPENING_MULLIGAN" }                              // keystone
  | { kind: "EDIT_OPENING_DECK"; count: number }              // keystone (elegir las N primeras)
  // — FAMILIA C · PERMISOS (leídos por UIs de feature, no por el combate) —
  | { kind: "UNLOCK_SECOND_DECK" }                            // keystone: 2º mazo + selector
  | { kind: "GRANT_RESPEC_TOKEN"; value: number };            // fichas de reasignación gratis
```

### 1.3 El resolver central y sus TRES familias de enganche

```ts
interface IPlayerSkillModifiers {
  economy:     { nexusRewardMult; xpRewardMult; lossConsolationMult; firstWinDoubleNexus;
                 passiveNexusPerWinBonus; passiveNexusDailyBonus };
  combat:      { startingLpBonus; maxEnergyBonus; turn1EnergyBonus;
                 openingHandBonus; openingMulligan; editOpeningDeckCount };
  permissions: { secondDeckSlot: boolean; respecTokens: number };
}
```

Cada familia tiene **un** punto de enganche, y por eso añadir habilidades luego es barato:

- **A · Economía → servidor, cierre de duelo.** `resolveMatchReward` (o justo después, antes de
  `creditNexus`/`update playerExperience` en `process-story-duel-completion.ts` y hermanos) aplica los
  multiplicadores. `FIRST_WIN_DOUBLE_NEXUS` y `LOSS_CONSOLATION` usan la rama de outcome que ya existe. Los
  topes de Recaudación se pasan a `credit_passive_nexus` (hoy fijos 600/1200). **Nunca en el cliente.**
- **B · Combate → builder de sesión PvE + `next-phase.ts`.** Una función `buildMatchConfigFromSkills(mods)`
  inyecta `openingHandSize = 3 + …`, `maxHealthPoints = 8000 + …`, `maxEnergy = 10 + …` en
  `createInitialGameState`. `TURN1_ENERGY_BONUS` se concede en el turno 1 igual que `resolveMasteryEnergyBonus`.
  `OPENING_MULLIGAN`/`EDIT_OPENING_DECK` son un paso de UI ANTES de crear el estado (producen el `deck` ya
  ordenado / rebarajado). **PvE en v1** (fairness — ver design §7).
- **C · Permisos → UIs de feature.** No tocan combate ni economía: son booleanos/contadores que una pantalla
  lee. `secondDeckSlot` lo lee el constructor de mazos (habilita el 2º slot); `respecTokens` lo lee la RPC de
  respec. Es la vía para "desbloqueos de feature" (no modificadores numéricos).

> **Por qué 3 familias y no 2:** tu idea del 2º mazo NO es un modificador de combate ni de economía — es
> desbloquear una FEATURE. Meterla en un tercer cajón ("permisos") evita ensuciar los enganches de combate con
> lógica de UI, y deja sitio a futuros desbloqueos (respec, cosmética, slots…).

### 1.4 Contrato para añadir una habilidad nueva (checklist reusable)

1. Añadir el `kind` a `skill-effect-kinds.ts` + a la unión `SkillEffect`.
2. Sumarlo en el resolver (a `economy` / `combat` / `permissions`).
3. Enganchar en el punto de su familia (una vez por `kind`; los que reusan `kind` existente = 0 código motor).
4. Fila(s) en `character_skill_nodes` (migración/seed): `max_rank`, `cost_per_rank`, `effect`, `prerequisites`.
5. Glosario (`glossary-content.ts`) + icono/blurb en `display`.
6. Test que falla sin el cambio.

---

## 2. Catálogo completo de habilidades

Leyenda de tier (detalle en §3): 🟢 **Fácil** (dato / reusa hook) · 🟡 **Media** (hook nuevo contenido) ·
🔴 **Alta** (refactor / schema / UI nueva). "★ TUYA" = una de tus tres ideas (fuertes → caras, gate profundo).

### Rama A — ECONOMÍA · "Protocolo Mercantil" (servidor, TODOS los modos)

| id | nombre | maxRank | coste/r | gate | efecto | tier |
|---|---|---|---|---|---|---|
| `econ-comision` | Comisión | 5 | 1 | core | `NEXUS_REWARD_MULT +0.02/r` → +10% | 🟢 |
| `econ-aprendizaje` | Aprendizaje | 5 | 1 | core | `XP_REWARD_MULT +0.02/r` → +10% | 🟢 |
| `econ-consuelo` | Premio de Consuelo | 3 | 1 | core | `LOSS_CONSOLATION_MULT +0.10/r` (menos castigo al perder) | 🟢 |
| `econ-recaudo` | Recaudador Mejorado | 3 | 2 | Comisión Nv.3 | `PASSIVE_NEXUS_CAP_BONUS perWin+25, daily+200` | 🟢 |
| **`econ-socio`** ★ TUYA | **Socio Mayoritario** | **4** | **3** | **Comisión Nv.5 + Recaudo Nv.3** | `NEXUS_REWARD_MULT` grande: **+0.5 / +1.0 / +1.5 / +2.0** (hasta **×3** el Nexus del duelo) | 🟢 (número fuerte, código trivial) |

> **Tu idea de economía** = `econ-socio`. Es el MISMO enganche que Comisión (🟢 trivial de codificar), solo que
> con números fuertes → lo hago **keystone caro y al fondo de la rama** (gate: Comisión al máximo).
> **CONFIRMADO (usuario): multiplicador %** — "+0,5 / 1 / 1,5 / 2" acumulable (rango 4 = +200% ⇒ **×3** el Nexus
> del duelo, además de lo que aporte Comisión). Usa el `kind` `NEXUS_REWARD_MULT` con `valuePerRank` grande.

### Rama B — COMBATE · "Protocolo de Duelo" (preparación de partida, **PvE en v1**)

| id | nombre | maxRank | coste/r | gate | efecto | tier |
|---|---|---|---|---|---|---|
| `cbt-blindaje` | Blindaje Reforzado | 5 | 1 | core | `STARTING_LP_BONUS +100/r` → +500 LP | 🟢 |
| `cbt-arranque` | Arranque en Frío | 1 | 2 | Blindaje Nv.3 | `TURN1_ENERGY_BONUS +1` (solo turno 1) | 🟡 |
| `cbt-rebarajar` | Rebarajar | 1 | 2 | Blindaje Nv.5 | `OPENING_MULLIGAN` (rehacer la mano 1 vez) | 🟡 |
| **`cbt-nucleo`** ★ TUYA | **Núcleo Sobrecargado** | **2** | **3** | **Arranque Nv.1** | `MAX_ENERGY_BONUS +1/r` → **techo 10 → 12** | 🟢 (param) — pero fuerte |
| **`cbt-apertura`** ★ TUYA | **Apertura Programada** | **1** | **4** | **Núcleo Nv.2 + Rebarajar Nv.1** | `EDIT_OPENING_DECK 5` (eliges SIN random tus 5 primeras cartas) | 🔴 |

> **Tus dos ideas de combate** = `cbt-nucleo` (empezar con 12 energía) y `cbt-apertura` (elegir las 5 primeras).
> - **12 de energía** — **CONFIRMADO (usuario): tope 12, o sea +2 como mucho** (`MAX_ENERGY_BONUS +1/r`,
>   `maxRank 2`). Código trivial (subir el `maxEnergy` del builder), pero **fuerte de balance** (sube el techo
>   TODA la partida) → gate profundo para que llegar a 12 cueste. Solo PvE.
> - **Elegir las 5 primeras**: 🔴 la más cara de picar (necesita **pantalla pre-duelo** para ordenar la cima
>   del mazo y pasar ese orden al builder). Es la habilidad estrella → keystone al fondo del todo.

### Rama C — ARSENAL · "Protocolo de Red" (meta/utilidad, TODOS los modos)

| id | nombre | maxRank | coste/r | gate | efecto | tier |
|---|---|---|---|---|---|---|
| `ars-veterano` | Veterano | 5 | 1 | core | `XP_REWARD_MULT +0.02/r` (acumula con Aprendizaje) | 🟢 |
| `ars-reasignar` | Reasignación | 1 | 1 | core | `GRANT_RESPEC_TOKEN 1` (un respec gratis) | 🟡 |
| `ars-cazador` | Cazador de Redes | 3 | 1 | Veterano Nv.3 | `GHOST_DAILY_LIMIT_BONUS +1/r` → +3 ghosts/día | 🟡 (depende de ficha 6) |
| **`ars-doble-mazo`** ★ TUYA | **Doble Arsenal** | **1** | **5** | **Veterano Nv.5 + Cazador Nv.1** | `UNLOCK_SECOND_DECK` (2º mazo + selector de principal) | 🔴🔴 |

> **Tu idea de arsenal** = `ars-doble-mazo`: un 2º mazo en el arsenal y un selector rápido de cuál es el
> "principal" (el que entra a los combates). Es la habilidad de **mayor refactorización de todo el árbol**
> (§3.4) → la más cara (5 pts) y con el gate más profundo. **La haría en su propia sub-tanda**, no en la v1 del
> árbol, para no bloquear el resto.

**Resumen:** 14 nodos, 3 ramas, ~55 pts para maxear todo (nadie lo hará). Tus 4 ideas quedan como los remates
caros y profundos; las 10 moderadas rellenan el camino y son casi todas 🟢/🟡.

---

## 3. Ranking de dificultad y orden de trabajo

### 3.1 🟢 TIER FÁCIL — dato o reusa un hook existente (empieza por aquí)

**Qué son:** habilidades cuyo efecto cae en un punto que YA calcula esa cosa. Cero refactor; el trabajo es la
fila de datos + una línea en el resolver/enganche de su familia.

- **Toda la economía** (`NEXUS_REWARD_MULT`, `XP_REWARD_MULT`, `LOSS_CONSOLATION_MULT`,
  `PASSIVE_NEXUS_CAP_BONUS`, `Socio Mayoritario`): se aplican en `resolveMatchReward` / cierre de duelo. Es un
  multiplicador sobre un número que el servidor ya produce. **El número fuerte de `Socio` no lo hace más
  difícil** — misma línea de código.
- **`STARTING_LP_BONUS`**: `maxHealthPoints` ya es parámetro de `createInitialGameState`. Una suma.
- **`MAX_ENERGY_BONUS` (12 energía)**: `maxEnergy` ya es parámetro. Una suma. (Fuerte de balance, trivial de
  código.)
- **`FIRST_WIN_DOUBLE_NEXUS`**: rama de outcome que ya existe + un contador diario (patrón `passive_nexus_daily`
  de ficha 3, ya en prod).

**Coste:** el grueso está en construir el motor (§1) y las tablas UNA vez; después estas salen casi gratis.

### 3.2 🟡 TIER MEDIO — hook nuevo pero contenido (sin schema ni UI nueva grande)

- **`TURN1_ENERGY_BONUS`**: nueva concesión al entrar el turno 1, calcada de `resolveMasteryEnergyBonus`
  (`next-phase.ts`). Contenido, con test de "solo turno 1, respeta el techo".
- **`OPENING_MULLIGAN`**: paso de UI antes de crear el estado (mostrar mano → "rebarajar 1 vez" → nuevo seed).
  Contenido en PvE; en multi necesitaría seed servidor (otra razón de PvE v1).
- **`GHOST_DAILY_LIMIT_BONUS`**: leer el bonus al comprobar el cupo diario de ghosts. **Bloqueado por ficha 6**
  (los ghosts aún no existen) — la habilidad se diseña ya, se activa cuando llegue la 6.
- **`GRANT_RESPEC_TOKEN`**: la RPC de respec (design §3.3, ya prevista) consume tokens. Contenido.

### 3.3 🔴 TIER ALTO — pantalla nueva o plumbing de partida

- **`EDIT_OPENING_DECK` (elegir las 5 primeras)**: aunque `openingHandSize` sale de `deck.slice(0, N)`, dejar
  que el jugador ELIJA esas cartas necesita: (a) una **pantalla pre-duelo** que muestre el mazo y deje fijar la
  cima; (b) pasar ese orden al builder (el `deck` ya ordenado); (c) para multi, viajar en la sesión
  (`get-match-session-data`) — en PvE se resuelve local. Es una feature de UI, no un `if`. **Medio-alto.**

### 3.4 🔴🔴 TIER REFACTOR — toca el modelo de datos y sus consumidores

- **`UNLOCK_SECOND_DECK` (Doble Arsenal)** — el más grande, **verificado en el código**:
  - **Hoy el mazo es ÚNICO por jugador.** `player_deck_slots` está keyed por `(player_id, slot_index)` (20
    filas = un deck); `player_fusion_deck_slots` igual. `IDeck` tiene `playerId` como identidad. Todo el juego
    llama `getDeck(playerId)` y recibe ESE deck (`getPlayerBoardDeck`/`getPlayerBoardLoadout`, el builder, la
    IA de simulación, etc.).
  - **Lo que hay que tocar:**
    1. **Schema (migración):** añadir dimensión `deck_slot` (1|2) a `player_deck_slots` y
       `player_fusion_deck_slots` → PK `(player_id, deck_slot, slot_index)`; + puntero de **mazo activo**
       (columna en `player_profiles` o tabla `player_active_deck`). Backfill: filas actuales → `deck_slot=1`.
    2. **Dominio:** `IDeck` gana identidad de slot; `IDeckRepository` gana `listDecks` / `getActiveDeck` /
       `setActiveDeck` (y `getDeck` pasa a significar "el activo").
    3. **Carga de combate:** `getPlayerBoardDeck`/`getPlayerBoardLoadout` cargan el **activo**.
    4. **UI del arsenal:** pestañas/switcher de mazo, botón "Marcar como principal", editar el mazo 2. Habilitado
       solo si `permissions.secondDeckSlot` (el nodo del árbol).
    5. **Guardas:** el 2º slot NO existe hasta desbloquear el nodo (si se hace respec y se pierde, decidir qué
       pasa con el mazo 2 — recomendado: se conserva pero se ignora hasta re-desbloquear).
  - **Enfoque recomendado (rebaja el tier a 🔴 simple — evita tocar los consumidores):** en vez de dar
    identidad de slot a `player_deck_slots` y cambiar `getDeck` en todas partes, mantener
    **`player_deck_slots` = SIEMPRE el mazo activo** (combate, IA y builder quedan INTACTOS) y guardar el/los
    mazo(s) inactivos en una tabla nueva **`player_deck_bank(player_id, bank_slot, slot_index, card_id)`** (+
    su espejo de fusión). "Marcar el mazo 2 como principal" = una **RPC transaccional `swap_active_deck`
    (`security definer`, idempotente por `operation_id`)** que intercambia `activo ↔ banco` en UNA sola
    transacción atómica.
    - **Por qué es lo profesional (no la corrupción del volcado desde cliente):** la RPC es todo-o-nada; un
      fallo o doble clic no deja mazos a medias. El cliente **nunca** escribe mazos directamente — solo llama
      la RPC (mismo candado que cartera/colección: escritura solo por service-role/RPC). Guardar contra swap
      mientras se edita (bloqueo optimista o `FOR UPDATE`).
    - **Cambios reales:** tabla `player_deck_bank` + RPC `swap_active_deck` + RPC `save_bank_deck` (editar el
      mazo 2 sin activarlo) + UI de arsenal (segundo mazo + botón "Hacer principal"). **Cero cambios en la
      ruta caliente de combate.** El nodo del árbol solo habilita la UI (`permissions.secondDeckSlot`).
  - **Recomendación:** aun con el enfoque ligero, sacarla de la v1 del árbol y hacerla en **su propia
    sub-tanda** (sigue siendo media feature: tabla + 2 RPC + UI). El resto del árbol no la necesita.

### 3.5 Orden de trabajo recomendado

| Fase | Contenido | Por qué aquí |
|---|---|---|
| **F1** | Motor (§1) + curva de nivel + migración `135` (tablas + RPC) | Todo lo demás lo necesita. |
| **F2** | Economía completa (🟢) — incluida tu `Socio Mayoritario` | Máximo valor / mínimo esfuerzo; todos los modos; sin riesgo de combate. La XP muerta empieza a comprar. |
| **F3** | Combate 🟢 — `Blindaje`, `Núcleo Sobrecargado` (12 energía) | Params triviales; ya se nota en PvE. |
| **F4** | Combate 🟡 — `Arranque en Frío`, `Rebarajar` | Hooks contenidos en `next-phase`/pre-duelo. |
| **F5** | Página del árbol (constelación) + glosario | La capa bonita; el sistema ya funciona por API para QA. |
| **F6** | 🔴 `Apertura Programada` (elegir 5) | Pantalla pre-duelo; feature propia. |
| **F7** | 🔴🔴 `Doble Arsenal` (2º mazo) | Refactor de mazos; sub-tanda aparte. Cerrar antes las decisiones de §3.4. |
| **(F8)** | `Cazador de Redes` | Se activa cuando exista la ficha 6 (ghosts). |

**Regla:** F1→F2 ya es un entregable con valor (economía en todos los modos). Combate PvE (F3-F4) es la
siguiente tanda. Las dos 🔴 (F6, F7) son features propias y NO deben bloquear la salida del árbol.

---

## 4. Decisiones

**Cerradas (usuario, 2026-07-18):**
1. **`Socio Mayoritario`** = **multiplicador %** ("+0,5/1/1,5/2" acumulable, ×3 al máximo). `kind`
   `NEXUS_REWARD_MULT`.
2. **`MAX_ENERGY_BONUS`** = **tope 12** (`maxRank 2`, +1/rango). Probar en duelos internos antes de publicar.
3. **Arrancar por la F1** (motor), sin esperar a cerrar las decisiones de abajo — son de fases lejanas o
   tuneables, y la F1 es agnóstica a ellas.

**Abiertas (NO bloquean la F1 — decidir al llegar a su fase):**
4. **`Doble Arsenal` en v1 o sub-tanda propia**: recomiendo sub-tanda (§3.4). Se decide antes de la F7.
5. **`EDIT_OPENING_DECK`: ¿5 cartas fijas o hasta 5?** Y si algún día entra en ranked (hoy PvE) — ADR. F6.
6. **Respec + tokens**: ¿`GRANT_RESPEC_TOKEN` como nodo, o respec con coste en Nexus? **No va en la migración
   `135`** — es aditivo, se añade en F4+. (Se solapa con el design §10.1.)
7. **Curva XP→nivel**: fijar la constante en la F1 **tras mirar la distribución real de `playerExperience` en
   prod** (para no dejar a nadie ya en nivel 40 el día 1). Es un dato, no un debate.
