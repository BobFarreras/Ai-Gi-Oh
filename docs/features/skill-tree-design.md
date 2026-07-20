# Ficha 8 — Árbol de habilidades del jugador (diseño y arquitectura)

> Documento de **diseño previo a picar código** (principio: cerrar el diseño de nodos ANTES de tocar nada —
> cambiar un árbol publicado es doloroso). Rama de trabajo prevista: `feat/paquete-v1.17`.
> Última migración en el repo: `134`. Las de esta ficha empiezan en `135`.
> Estado: **DISEÑO. 0 código.**
>
> **Compañero:** [`skill-tree-implementation-guide.md`](./skill-tree-implementation-guide.md) — el motor de
> efectos concreto, el catálogo COMPLETO de habilidades (incluidas las fuertes del usuario) y el ranking de
> dificultad (fácil/dato vs. refactor). Léelo para saber por dónde empezar a picar.
>
> **Companion adicional:** [`opponent-skill-abilities-implementation-guide.md`](./opponent-skill-abilities-implementation-guide.md) —
> cómo otorgar habilidades de combate del árbol a los oponentes de Arena y Story, editables desde el admin panel.

---

## 0. Resumen ejecutivo

El jugador ya gana **XP de jugador** (`playerExperience` en `IPlayerProgress` e `IMatchReward`) en cada duelo,
pero **hoy esa XP se acumula y no compra nada** — no existe ni un "nivel de jugador" visible. Esta ficha
convierte esa XP muerta en una progresión: **XP → nivel → puntos de habilidad → nodos de un árbol**, donde
cada nodo da un **permiso o modificador** (nunca cambia datos base), aplicado en el punto del código donde ya
se calcula esa cosa.

La regla de oro (misma lección que los caramelos de v1.15 y la cartera post-122/124):

> **El nodo no cambia datos, da un permiso/modificador. El estado es "qué nodos tiene el jugador y a qué RANGO".
> El efecto se aplica donde ya se calcula esa cosa, y si toca valor, en el SERVIDOR.**

**Modelo de nodos con RANGOS (estilo RPG profesional — PoE / Diablo / talentos).** Un nodo NO es binario
(tenerlo / no tenerlo): tiene un **rango** de 1 a `maxRank`. Cada punto invertido sube el rango 1 nivel y
**escala el efecto** (p.ej. Blindaje Nv.3 = +300 LP, Nv.5 = +500). Los prerequisitos se expresan **por rango**:
"requiere Blindaje a **Nv.5**" abre la habilidad de al lado. Esto crea el ritmo clásico de "sube esta rama
hasta el fondo para desbloquear el remate". Dos tipos de nodo:
- **Nodos escalables** (`maxRank` 3-5): rellenan la rama y suben un modificador continuo (%, LP…). Baratos por
  rango (1 pt).
- **Nodos remate / keystone** (`maxRank` 1): un permiso potente y puntual (editar apertura, +1 carta, doble
  Nexus). Caros y **detrás de un gate de rango** de los escalables.

Dos familias de efectos, con arquitecturas distintas y separadas a propósito:

| Familia | Ejemplos | Dónde se aplica | Modos | Seguridad |
|---|---|---|---|---|
| **Economía / meta** | ×Nexus, ×XP, topes de Recaudación (ficha 3), cupo de ghosts (ficha 6) | **Servidor**, en la tubería de recompensa | Todos | Server-authoritative, farmeable-desde-consola = vuln |
| **Combate** | +LP iniciales, +1 carta de mano, +1 energía turno 1, editar apertura | **Preparación de partida** (`createInitialGameState` / `GameState`) | **PvE primero** (ver §7) | Debe viajar con la sesión en multi (principio 4) |

---

## 1. Materia prima verificada (en el código, no supuesta)

- **XP de jugador**: `IPlayerProgress.playerExperience: number` (`src/core/entities/player/IPlayerProgress.ts`)
  y `IMatchReward.playerExperience`. Se acredita en el cierre de duelo:
  `process-story-duel-completion.ts` (línea ~152: `playerExperience + rewardPlayerExperience`), y sus
  equivalentes de training y multi. **No hay ninguna curva de nivel ni consumidor de esa XP hoy.**
- **Recompensas por modo** (`match-reward-policy.ts`): valores actuales — training WIN `{nexus:30, xp:80}`,
  story WIN `{nexus:50·tier, xp:110·tier}` (tier 1-10), multi WIN `{nexus:90, xp:140}`. Aquí se enganchan los
  multiplicadores de economía.
- **Cartera server-authoritative**: `walletRepository.creditNexus` en el cierre, tubería idempotente
  post-122/124. El árbol NO abre un camino nuevo de crédito; modula el que ya existe.
- **Preparación del combate** (`create-initial-game-state.ts`): config ya parametrizable con
  `openingHandSize` (default **3**), `maxHealthPoints` (default **8000**), `maxEnergy` (default **10**),
  `starterPlayerId`. La mano inicial se reparte con `deck.slice(0, openingHandSize)` → editar el ORDEN del
  mazo = editar la apertura. **Todos los hooks de las habilidades de combate ya existen como parámetros.**
- **Energía al inicio del turno**: `resolveMasteryEnergyBonus` (`next-phase.ts`) ya concede +1 por pasivas de
  carta. Precedente exacto para un bonus de energía por-nodo de jugador.
- **Pasivas como precedente de "efecto data-driven con id central + magnitud"**: `mastery-passive-ids.ts`,
  `mastery-passive-magnitude.ts`. El árbol replica ese patrón: catálogo de nodos en datos, magnitudes en una
  sola fuente, motor las resuelve.
- **Sesión de multi** (`get-match-session-data.ts`): sirve los dos mazos resueltos. Es el transporte por el que
  viajarían los modificadores de combate al cliente rival (principio 4) si algún día se habilita en ranked.
- **Precedentes de contadores diarios server-side** (ficha 3: `passive_nexus_daily`; ficha 6: cupo de
  ghosts): mismo patrón para los nodos con tope diario.
- **Estética** (`globals.css`): cyber/espacial, base `#070b16`, glow cian `rgba(34,211,238,.45)` e índigo
  `rgba(99,102,241,.25)`, fuente display Orbitron (`font-display`). El árbol respeta esto (§8).

---

## 2. Curva de progresión: XP → nivel → puntos (fuente única)

**Principio (paso 3 del roadmap): una sola fuente de verdad. Nada de "puntos regalados" sueltos.** Los puntos
de habilidad se DERIVAN del nivel, y el nivel se DERIVA de `playerExperience`. Puro cálculo, sin estado nuevo
que pueda desincronizarse.

- **Nivel a partir de XP** — función pura `resolvePlayerLevel(xp): { level, xpIntoLevel, xpForNext }` en
  `src/core/services/progression/player-level.ts`. Curva propuesta (creciente, tuneable — es dato):

  ```
  xpParaNivel(n) = 750 + 400·(n − 1)     // coste del nivel n→n+1
  xpAcumuladaHastaNivel(L) = Σ            // suma cerrada, O(1)
  ```

  Con esto: L2 a 750 XP, L5 ≈ 5.400, L10 ≈ 21.150, L20 ≈ 82.650. Una victoria de story tier 5 da 550 XP; un
  jugador activo llega a ~L13-15 en unas semanas. **Curva casi doble vs. diseño original** (ajustada 2026-07-20
  para mayor duración del grind). Los números se tunean con datos: subir la curva luego es indoloro, bajarla
  tras el abuso no.
- **Puntos de habilidad** = `level − 1` (1 punto por nivel a partir del 2), menos los ya gastados. Con nodos
  rankeables, **maximizar TODO el árbol v1 cuesta ~40 puntos** (§5) → cae sobre L41. Nadie lo maxea pronto; hay
  que **elegir rama y decidir hasta qué rango subir cada nodo**. Ése es justo el juego de decisión que da el
  modelo de rangos.
- **Puntos gastados** = suma de `costPerRank · rango` de cada nodo (se lee de `player_skill_ranks` ⋈ catálogo).
  `puntosDisponibles = puntosPorNivel(level) − puntosGastados`. El servidor es el árbitro de esta resta en cada
  subida de rango.

**Importante:** el nivel NO se materializa en columna (evita el bug de "columna desincronizada del XP"). Si en
el futuro se quiere mostrar el nivel en muchos sitios, se cachea derivándolo, nunca se persiste como verdad.

---

## 3. Modelo de datos (migración `135+`)

Data-driven, mismo enfoque que los efectos de carta: el catálogo es datos, no `if`s por nodo.

### 3.1 Catálogo (server + admin, no escribible por el cliente)

```sql
-- character_skill_nodes: catálogo v1 del árbol (editable solo por admin/service-role).
create table character_skill_nodes (
  id            text primary key,              -- 'node-cbt-shield'
  branch        text not null,                 -- 'ECONOMY' | 'COMBAT' | 'ARSENAL'
  tier          int  not null,                 -- fila en el diagrama (0 = raíz)
  max_rank      int  not null check (max_rank >= 1),   -- 1 = keystone; 3-5 = escalable
  cost_per_rank int  not null check (cost_per_rank >= 1),
  effect        jsonb not null,                -- { kind, valuePerRank, ... } (§4)
  prerequisites jsonb not null default '[]',   -- [{ nodeId, minRank }]  (gate POR RANGO)
  display       jsonb not null,                -- { name, blurb, icon, x, y } para la UI
  is_active     boolean not null default true
);
-- RLS: SELECT para authenticated (el catálogo es público); INSERT/UPDATE/DELETE nadie (solo service-role).
```

`prerequisites` deja de ser "una lista de ids" y pasa a ser **la puerta por rango** que pediste:
`[{ "nodeId": "node-cbt-shield", "minRank": 5 }]` = "necesitas Blindaje a Nv.5 para tocar este nodo".

### 3.2 Estado del jugador (RLS, solo lectura para el cliente)

```sql
-- player_skill_ranks: a qué RANGO tiene cada jugador cada nodo (0 = no lo tiene).
-- Una fila por (jugador, nodo); el rango se sube de 1 en 1 vía RPC. El respec borra en bloque.
create table player_skill_ranks (
  player_id  uuid not null references auth.users(id),
  node_id    text not null references character_skill_nodes(id),
  rank       int  not null check (rank >= 1),
  updated_at timestamptz not null default now(),
  primary key (player_id, node_id)
);
-- RLS: SELECT solo where player_id = auth.uid(); sin INSERT/UPDATE/DELETE para authenticated.
```

> **Nada de `playerId` en el body (principio 2).** La identidad es `auth.uid()` dentro de la RPC.

### 3.3 RPC de subir rango (`security definer`, EXECUTE solo para `authenticated` o service-role)

```
rank_up_skill_node(p_node_id text, p_operation_id uuid) returns jsonb
```

Sube **UN** rango del nodo (el cliente pide "sube este nodo"; el servidor decide el rango resultante).
Transacción, con `FOR UPDATE` sobre el progreso del jugador para serializar el doble clic:

1. **Idempotencia** (principio 3): si `p_operation_id` ya se procesó → devuelve el estado actual sin re-cobrar
   (tabla `skill_rank_operations(operation_id pk, player_id, created_at)`, igual que `passive_nexus_operations`).
   > El `operationId` va por INTENTO de subida, no por nodo — así "subir a Nv.3" son 3 operaciones distintas y
   > el reintento de red de cada una es idempotente sin bloquear la siguiente.
2. Nodo existe, `is_active`, y `rango_actual < max_rank` (ya al tope → no-op).
3. **Prerequisitos por rango**: para cada `{ nodeId, minRank }`, el jugador tiene ese nodo a `rank ≥ minRank`.
4. **Puntos**: recalcula `level` desde `playerExperience` (el mismo `resolvePlayerLevel`) y comprueba
   `puntosDisponibles ≥ cost_per_rank`. **El reloj y la XP son del servidor.**
5. `insert ... on conflict (player_id, node_id) do update set rank = rank + 1`; devuelve
   `{ nodeId, rank, pointsSpent, pointsAvailable }`.

> **Regla anti-trampa del gate:** al subir un nodo NO se revalida el rango de sus dependientes. Un jugador no
> puede "bajar" un rango (no hay respec parcial), así que un dependiente ya comprado nunca queda huérfano. El
> respec es todo-o-nada.

```
respec_skill_tree(p_operation_id uuid) returns jsonb   -- (v1.1, opcional)
```

Borra todas las filas de `player_skill_ranks` del jugador en una transacción idempotente. **Decisión abierta
(§10):** gratis la primera vez / con coste en Nexus (sink) las siguientes. Nunca devuelve XP (los puntos se
recalculan solos del nivel).

**Verificación de seguridad obligatoria (Definition of Done):** intentar como `authenticated` un
`insert`/`update` en `player_skill_ranks` y un `update` del catálogo → deben ser RECHAZADOS. Solo la RPC concede.

---

## 4. Efectos: catálogo `effect` y resolvers

El `effect` de cada nodo es un `jsonb` discriminado por `kind`, con la magnitud expresada **por rango**
(`valuePerRank`). **Cada `kind` define su punto de enganche una sola vez**, igual que las pasivas mastery. El
motor/servidor NUNCA leen "node-cbt-shield" a mano — leen el `kind` y multiplican por el rango del jugador.

```ts
type SkillEffect =
  // — Economía (servidor, tubería de recompensa). Escalables → valuePerRank —
  | { kind: "NEXUS_REWARD_MULT"; valuePerRank: number }  // +% Nexus de duelo (0.02 = +2%/rango)
  | { kind: "XP_REWARD_MULT"; valuePerRank: number }     // +% XP de jugador por rango
  | { kind: "PASSIVE_NEXUS_CAP_BONUS"; perWinPerRank?: number; dailyPerRank?: number } // sube topes ficha 3
  | { kind: "FIRST_WIN_DOUBLE_NEXUS" }                   // keystone (maxRank 1): 1ª victoria/día ×2
  // — Utilidad / meta —
  | { kind: "GHOST_DAILY_LIMIT_BONUS"; valuePerRank: number } // +N combates de ghost/día (ficha 6)
  // — Combate (preparación de partida; PvE en v1) —
  | { kind: "STARTING_LP_BONUS"; valuePerRank: number }  // +LP al maxHealthPoints inicial (escalable)
  | { kind: "OPENING_HAND_BONUS"; value: number }        // keystone: +N a openingHandSize
  | { kind: "TURN1_ENERGY_BONUS"; value: number }        // keystone: +N energía al empezar el turno 1
  | { kind: "OPENING_MULLIGAN" }                          // keystone: rebarajar la mano inicial 1 vez
  | { kind: "EDIT_OPENING_DECK"; count: number };        // keystone: reordenar/elegir las 5 primeras
```

Regla: los **escalables** llevan `valuePerRank` y el resolver hace `valuePerRank · rango`; los **keystone**
(`maxRank 1`) llevan valor fijo y solo aportan si el jugador tiene el nodo (rango 1). Un nodo escalable de LP a
Nv.3 = `100 · 3 = +300 LP`. Toda la magnitud vive en el catálogo (una sola fuente), como
`mastery-passive-magnitude.ts`.

**Un único resolver central** — `resolvePlayerSkillModifiers(playerRanks): IPlayerSkillModifiers` (función pura;
recibe `[{ node, rank }]` y suma `efecto · rango`). Devuelve un struct tipado que separa las dos familias:

```ts
interface IPlayerSkillModifiers {
  economy: { nexusRewardMult: number; xpRewardMult: number; firstWinDoubleNexus: boolean;
             passiveNexusPerWinBonus: number; passiveNexusDailyBonus: number; ghostDailyLimitBonus: number };
  combat:  { startingLpBonus: number; openingHandBonus: number; turn1EnergyBonus: number;
             openingMulligan: number; editOpeningDeckCount: number };
}
```

- **`economy`** lo consume el **servidor** en el cierre de duelo: `resolveMatchReward` recibe estos multiplicadores
  (o se aplican justo después, antes de `creditNexus`/`update playerExperience`). El doble Nexus de la 1ª
  victoria del día usa un contador server-side (patrón `passive_nexus_daily`). Los topes de Recaudación se pasan
  a `credit_passive_nexus` como parámetros (hoy fijos 600/1200; el roadmap ya previó que "el árbol podrá subir
  el rango"). **Nunca se multiplica en el cliente.**
- **`combat`** lo consume el **builder de la sesión de partida** (PvE: el que arranca Story/Arena/Training):
  inyecta `openingHandSize = 3 + openingHandBonus`, `maxHealthPoints = 8000 + startingLpBonus`, etc. en
  `createInitialGameState`. El turno-1-energía se concede en `next-phase.ts` (mismo sitio que el bonus mastery,
  con un `source` propio para el HUD/log). Mulligan y editar-apertura son un paso de UI ANTES de crear el estado.

> **Por qué se separan:** economía es valor (server-authoritative, seguro en todos los modos); combate es
> ventaja competitiva (fairness — ver §7). Mezclarlas obligaría a decidir por-efecto en cada sitio; separarlas
> deja dos enganches limpios y auditables.

---

## 5. Catálogo de nodos v1 (propuesta cerrada, ~40 puntos para maxear)

Estructura: **1 nodo raíz** (enciende el árbol) + **3 ramas** de estilo. Cada rama es una **cadena con gates de
rango**: un escalable barato al principio que hay que subir hasta cierto Nv. para abrir el keystone del final —
justo el ritmo "profesional" que pediste ("sube esta hasta Nv.5 para desbloquear la siguiente").

```
                       ┌─ [Núcleo del Operador]  (Nv. 1/1, 1 pt) ─┐
                       │        +300 LP iniciales                 │
        ┌──────────────┼──────────────────────┬──────────────────┼───────────────┐
     ECONOMÍA        COMBATE                ARSENAL
   (Mercantil)     (Duelo, PvE)            (Utilidad)
```

Notación: **Nv. X/Y** = rango actual sugerido / `maxRank`; **coste** = `cost_per_rank` (puntos por rango);
**gate** = prerequisito por rango.

> **Estado de implementación (2026-07-20):** ✅ = implementado y activo en DB, ❌ = pendiente (feature no construida).

### Raíz — `node-core` · Nv. 1/1 · 1 pt ✅ IMPLEMENTADO
- **Núcleo del Operador** — keystone barato. `STARTING_LP_BONUS value 300`. Gate de todo el árbol.

### Rama A — ECONOMÍA · "Protocolo Mercantil" (servidor, todos los modos)
| id | nombre | maxRank | coste/rango | gate | efecto (por rango) | Estado |
|---|---|---|---|---|---|---|
| `node-econ-comision` | Comisión | **5** | 1 | core Nv.1 | `NEXUS_REWARD_MULT +0.02` → **Nv.5 = +10%** | ✅ |
| `node-econ-aprendizaje` | Aprendizaje | **5** | 1 | core Nv.1 | `XP_REWARD_MULT +0.02` → Nv.5 = +10% | ✅ |
| `node-econ-consuelo` | Premio de Consuelo | **3** | 1 | core Nv.1 | `LOSS_CONSOLATION_MULT +0.10/r` | ✅ |
| `node-econ-recaudo` | Recaudador Mejorado | **3** | 2 | Comisión Nv.3 | `PASSIVE_NEXUS_CAP_BONUS perWin+25, daily+200` | ✅ |
| `node-econ-socio` | Socio Mayoritario | **4** | 3 | Comisión Nv.5 + Recaudo Nv.3 | `NEXUS_REWARD_MULT +0.5` → **×3 al máximo** | ✅ |

### Rama B — COMBATE · "Protocolo de Duelo" (preparación de partida, **PvE en v1**)
| id | nombre | maxRank | coste/rango | gate | efecto (por rango) | Estado |
|---|---|---|---|---|---|---|
| `node-cbt-blindaje` | Blindaje Reforzado | **5** | 1 | core Nv.1 | `STARTING_LP_BONUS +100` → **Nv.5 = +500 LP** | ✅ |
| `node-cbt-arranque` | Arranque en Frío | 1 | 2 | Blindaje Nv.3 | `TURN1_ENERGY_BONUS +1` | ✅ |
| `node-cbt-nucleo` | Núcleo Sobrecargado | **2** | 3 | Arranque Nv.1 | `MAX_ENERGY_BONUS +1` → **techo 10 → 12** | ✅ |
| `node-cbt-rebarajar` | Rebarajar | 1 | 2 | Blindaje Nv.5 | `OPENING_MULLIGAN` (rehacer la mano 1 vez) | ✅ (mig. 139) |
| `node-cbt-apertura` | Apertura Programada | 1 | 4 | Núcleo Nv.2 + Rebarajar Nv.1 | `EDIT_OPENING_DECK 5` | ❌ F6 |

### Rama C — ARSENAL · "Protocolo de Red" (meta, todos los modos)
| id | nombre | maxRank | coste/rango | gate | efecto (por rango) | Estado |
|---|---|---|---|---|---|---|
| `node-ars-veterano` | Veterano | **5** | 1 | core Nv.1 | `XP_REWARD_MULT +0.02` (acumula con Aprendizaje) | ✅ |
| `node-ars-doble-mazo` | Doble Arsenal | **1** | 2 | Veterano Nv.1 | `UNLOCK_SECOND_DECK` (2º mazo + selector) | ❌ F7 |
| `node-ars-reasignar` | Reasignación | 1 | 1 | core Nv.1 | `GRANT_RESPEC_TOKEN 1` — desbloquea el respec (reset total del árbol) | ✅ |
| `node-ars-cazador` | Cazador de Redes | **3** | 1 | Veterano Nv.3 | `GHOST_DAILY_LIMIT_BONUS +1` → +3 (ficha 6) | ❌ F8 |

> **Cambio de jerarquía Arsenal (2026-07-20):** Doble Arsenal pasa de tier 3 (remate) a **tier 2** (segundo nodo
> desbloqueable), con gate reducido a Veterano Nv.1 (antes era Veterano Nv.5 + Cazador Nv.1). Coste reducido
> de 5 a **2 puntos**. Razón: hacer el2º mazo accesible antes para que más jugadores lo experimenten.

Coste de MAXEAR todo: raíz 1 + Economía (5+5+3+6+12=31) + Combate (5+2+6+2+4=19) + Arsenal (5+2+1+3=11) = **~62 puntos** →
nivel ~63. **Nadie maxea el árbol; hay que elegir hasta qué rango subir cada nodo y qué keystone perseguir.**
Ése es el juego de decisión del modelo de rangos.

---

## 6. Las habilidades de COMBATE en detalle (lo que pediste)

Cada una con su enganche real en el motor y su decisión de diseño:

1. **+LP iniciales** (`STARTING_LP_BONUS`) — `maxHealthPoints` en `createInitialGameState`. Trivial y seguro.
   `healthPoints` arranca en `maxHealthPoints`, así que el bonus se ve desde el segundo 0.
2. **+1 energía turno 1** (`TURN1_ENERGY_BONUS`) — NO tocar `maxEnergy` (rompería el techo de 10 toda la
   partida). Se concede como bonus puntual al entrar en el turno 1 del jugador, en `next-phase.ts`, respetando
   `maxEnergy`, con evento de log propio (por qué ganó energía). Ventaja de tempo, no de recursos infinitos.
3. **+1 carta de mano** (`OPENING_HAND_BONUS`) — `openingHandSize = 3 + bonus`. Fuerte: más opciones de salida.
   En multi sería asimétrico → **PvE only** (ver §7). Determinista: `deck.slice(0, 4)`.
4. **Mulligan** (`OPENING_MULLIGAN`) — paso de UI antes de crear el estado: se muestra la mano inicial y se
   ofrece "rebarajar 1 vez". Con el motor actual = rebarajar el mazo (nuevo `randomSource`/seed) y volver a
   repartir. En multi habría que fijar el seed en servidor y que ambos lo vean → otra razón para PvE v1.
5. **Editar apertura** (`EDIT_OPENING_DECK 5`, el capstone de la rama — la "habilidad estrella" del roadmap) —
   como `openingHandSize` sale de `deck.slice(0, N)`, "editar las 5 primeras" = **elegir el orden de la cima del
   mazo** antes del duelo. Paso de UI que produce un `deck` reordenado que se pasa al builder. Es la ventaja más
   fuerte del árbol y por eso es capstone caro. **Solo PvE en v1**; entrar en ranked requiere ADR (fairness +
   transporte determinista en `get-match-session-data`).

**Regla de multi (principio 4):** cualquier modificador de combate que algún día entre en ranked DEBE viajar en
la sesión que sirve el servidor (`get-match-session-data.ts`), aplicarse igual en ambos clientes y ser visible
para el rival (como las pasivas). Mientras sea PvE, vive en el builder local de Story/Arena/Training y no hay
problema de sincronización.

---

## 7. Modos: por qué combate = PvE en v1

- **Economía** (×Nexus, ×XP, topes, ghosts): se aplica en el servidor sobre recompensas. Seguro en TODOS los
  modos — es "ganas un poco más", no altera el duelo.
- **Combate** (+LP, +mano, +energía, editar apertura): es ventaja DENTRO del duelo. En ranked, un jugador de L20
  entraría con +cartas y +LP contra uno de L3 → pay-to-progress que rompe el matchmaking por ELO. **Recomendación
  (y decisión pedida en el roadmap): empezar por PvE (Story/Arena/Training).** Habilitarlo en ranked/ghosts es
  una decisión posterior con ADR, y arrastra el trabajo de transporte determinista.

Esto encaja con "candidato a partirse: backend + 2 habilidades primero" — la partición natural es
**economía (todos los modos) primero, combate (PvE) después**, no "backend feo / diagrama bonito".

---

## 8. La página del árbol (diseño futurista, respetando la estética)

**Constelación de nodos** sobre el fondo cyber/espacial del juego. Empezar SIMPLE (paso 5 del roadmap):
**SVG/HTML con posiciones en datos (`display.x/display.y`), nada de motor gráfico.**

### Lenguaje visual (tokens ya existentes en `globals.css`)
- Fondo: `--board-bg-base #070b16` con los radiales cian/índigo del `body`; capa de "estrellas" tenue con
  `spaceDrift`/`hubScan` (ya definidas) para la sensación de mapa estelar vivo.
- **Nodos con RANGO**: círculo con **anillo segmentado** = el rango. El anillo se divide en `maxRank` arcos; los
  arcos ya comprados van encendidos (cian sólido) y los pendientes apagados — se lee el "3/5" de un vistazo, como
  en PoE/Diablo. Bajo el nombre, un contador `Nv. 3/5`. Estados visuales:
  - **Al tope** (`rango == maxRank`) — anillo entero encendido, glow `--board-glow-cyan`, pulso `cyberPulse`.
  - **Parcial** (`0 < rango < maxRank`) — arcos comprados encendidos, resto apagado; si hay puntos, un arco
    "siguiente" parpadea invitando a subirlo.
  - **Disponible** (`rango 0`, gate cumplido + puntos) — anillo cian animado, centro hueco (`nodeScan`). Ojo aquí.
  - **Bloqueado por gate** — apagado (`--board-text-muted` al 30%), sin glow, y **etiqueta del gate** en la
    arista ("Blindaje Nv.5") para que se vea QUÉ hay que subir para abrirlo.
- **Aristas con gate de rango**: líneas finas `--board-line`. Una arista se "carga" con gradiente cian
  (`flowSweep`/`beamPulse`) **solo cuando el nodo origen alcanza el `minRank` del gate** — visualiza literalmente
  "he subido esto hasta Nv.5 → se ha abierto el camino al siguiente". Mientras no llega, la arista va punteada y
  apagada con el "Nv.X" requerido escrito encima.
- **Ramas por color de acento** (mismo criterio que el Códex, que ya usa `accent` por tipo): Economía = ámbar/oro
  (`text-amber-300`, coherente con el coste de carta), Combate = cian/sky, Arsenal = índigo/violeta. El acento
  tiñe el anillo y el icono, no el fondo.
- **Tipografía**: `font-display` (Orbitron) para nivel, nombres de rama y coste; sans para el blurb.

### Layout
- **Cabecera HUD**: "OPERADOR · NIVEL {L}", barra de XP al siguiente nivel (`xpIntoLevel / xpForNext`, la misma
  curva del §2), y **"Puntos disponibles: N"** en grande (oro), que es el recurso que gasta el jugador.
- **Lienzo del árbol**: raíz abajo-centro, ramas abriéndose hacia arriba (metáfora de "crecer"). Scroll/zoom
  suave en móvil; en desktop cabe entero. Responsivo: en móvil, el árbol scrollea vertical dentro de un
  contenedor `overflow` propio (nunca scroll horizontal de la página).
- **Panel de nodo** (al tocar/hover): tarjeta lateral (desktop) o hoja inferior (móvil) con icono, nombre,
  `Nv. actual/max`, y **el efecto en el rango actual → el del siguiente** ("+300 LP → +400 LP") para que se vea
  qué compra el punto. Coste del siguiente rango, gates que falten, y botón **"Subir a Nv.{rango+1} ({coste}
  pts)"** — deshabilitado con motivo si no llega ("Necesitas nivel X" / "Requiere Blindaje Nv.5" / "Al tope").
- **Feedback de subida**: al confirmar, se enciende el arco nuevo del anillo + si alcanza un `minRank` de gate,
  se "carga" la arista al nodo dependiente (`flowSweep`) + toast. Optimista pero **el estado real lo confirma la
  RPC** (si falla, revertir el pintado).

### Dónde vive en el hub
- Entrada nueva en el hub del Operador (junto a "Configurar Operador" / perfil, `HubProfileNameDialog` es el
  vecino natural: nivel y árbol son "quién eres"). Ruta tipo `/hub/operador/arbol` o pestaña en el perfil.
- Badge de aviso "tienes puntos sin gastar" (patrón de aviso ya usado por `WeeklyPrizeProvider`/login streak):
  un punto oro sobre el icono cuando `puntosDisponibles > 0`.

### Accesibilidad y perf
- Estados de nodo por forma + texto además de color (daltonismo): candado en bloqueado, check en desbloqueado.
- `prefers-reduced-motion`: los pulsos/flows caen a estáticos (ya hay precedente en `globals.css`).
- El lienzo se pinta una vez; los nodos son estáticos salvo el pulso CSS. Sin re-render por hover (estado local
  del panel, no del lienzo).

---

## 9. Glosario y comunicación (una regla que no se puede consultar no existe)

- Entrada en el Códex de la Academia (`glossary-content.ts` + `effect-catalog-data.ts`): qué es el nivel de
  Operador, cómo se ganan puntos, qué hace cada rama, y **explícito que las habilidades de combate son PvE**
  (o parecerá un bug al no notarse en multi).
- El nivel y la XP pasan a ser visibles por primera vez (hoy no lo son) → mención en novedades/patch notes: es
  un sistema de progresión nuevo, no un ajuste silencioso.

---

## 10. Decisiones abiertas (cerrar ANTES de picar)

**Cerradas:**
1. **Respec**: `GRANT_RESPEC_TOKEN` como nodo (F4+). RPC de respec consume tokens. Coste Nexus a partir de 2ª vez.
2. **Combate en ranked**: confirmado PvE-only en v1.
3. **Curva de XP y costes**: Doblada (750/400) el 2026-07-20. Primer nivel = 750 XP (~9 wins training Tier 1). Nivel 51 = 530.000 XP.
4. **Rama Arsenal**: entra en v1 con 4 nodos (Veterano, Doble Arsenal, Reasignación, Cazador).
5. **`FIRST_WIN_DOUBLE_NEXUS`**: eliminado del catálogo v1 (no hay nodo con este efecto).
6. **`LOSS_CONSOLATION_MULT`**: eliminado del catálogo v1. Economy branch simplificada a: Comisión, Aprendizaje, Recaudador, Socio Mayoritario.
7. **Doble Arsenal**: nodo de tier 2 en Arsenal (segundo desbloqueable), gate Veterano Nv.1, coste 2 pts.
8. **Oponentes con habilidades**: Sistema de `opponent_skill_ranks` reutilizando catálogo de combate. Ver `opponent-skill-abilities-implementation-guide.md`.

**Abiertas:**
9. **`EDIT_OPENING_DECK`**: ¿5 cartas fijas o hasta 5? Y si algún día entra en ranked — ADR. F6.
10. **Respec coste exacto**: ¿gratis 1ª vez + Nexus después? ¿O siempre Nexus? Decidir al llegar a F4+.

---

## 11. Fases de implementación (troceado)

- **F0 — Diseño (este doc).** Cerrar §10. Bloqueante.
- **F1 — Backend de progresión + economía (todos los modos):** `resolvePlayerLevel` + curva (con test),
  migración `135` (catálogo con `max_rank`/`cost_per_rank` + `player_skill_ranks` + operaciones + RPC
  `rank_up_skill_node` con RLS y verificación de rechazo), resolver `resolvePlayerSkillModifiers` (suma
  `efecto·rango`), y enganche de los 4 efectos de economía en el cierre de duelo del servidor. Nodos de
  economía subibles end-to-end. Tests: **gate por rango** (no sube el keystone sin el prereq a Nv.N), tope de
  `max_rank`, idempotencia por operación, puntos insuficientes.
- **F2 — Habilidades de combate (PvE):** enganche de `STARTING_LP_BONUS`, `OPENING_HAND_BONUS`,
  `TURN1_ENERGY_BONUS` en el builder de Story/Arena/Training + `next-phase.ts`. Mulligan y editar-apertura
  como paso de UI. Nodos de combate jugables. Tests de motor (mano de 4, +LP, energía turno 1).
- **F3 — Página del árbol (constelación):** el diagrama SVG/HTML, panel de nodo, cabecera de nivel/puntos,
  aviso de "puntos sin gastar", glosario. Es la capa bonita; el sistema ya funciona sin ella (se podría
  desbloquear por API antes de tener el diagrama, útil para QA).
- **F4 (opcional) — Respec** + posible entrada de combate en ranked (con ADR).

**Esfuerzo:** alto (semana larga con diseño). F1 sola ya entrega valor (la XP muerta empieza a comprar).

## 12. Definition of Done (la común de v1.15/§5 del roadmap)

Tests que fallan sin el cambio; `CI=true pnpm quality:check` en verde con exit code real; migración `135` en
`docs/supabase/sql/` **y aplicada** con constancia; **RLS verificado** (intentar `insert`/`update` en
`player_skill_ranks` y `update` del catálogo como `authenticated` → rechazo); glosario actualizado; y para las
habilidades de combate, prueba real en un duelo PvE (mano de 4, +LP, energía turno 1 visibles).
