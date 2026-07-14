# Guía — Decisión de trampas · Ayuda de rankings · Caramelos de nivel

> Rama base sugerida: `feat/traps-rankings-levelups` (desde `develop`) · Fecha: 2026-07-12
> 3 items de tamaño muy distinto. El #3 es un **diseño a plantear**, no implementación cerrada.

---

## Resumen

| # | Tema | Tipo | Capa | Riesgo | Tamaño |
|---|------|------|------|--------|--------|
| 1 | Todas las trampas deben preguntar si activarlas (Nullify se activa sola) | Bug + consistencia | motor + hooks board | **Medio-alto** | Mediano |
| 2 | Botón "?" por ranking + sección de docs de cómo puntúa cada uno | Mejora UX + docs | components + glosario | Bajo | Pequeño |
| 3 | "Caramelos" que suben de nivel cartas (eventos/story/tabernas) | Diseño/propuesta | progresión + economía | — | Grande (por fases) |

---

## 1) Decidir la activación de TODAS las trampas

### Cómo funciona hoy

Las trampas del jugador se resuelven por dos caminos distintos, y solo **uno** ofrece decisión:

**a) Turno del rival (IA)** — el jugador SÍ decide.
`runBattlePhaseStep` y `runMainPhaseStep` detectan la trampa reactiva del jugador con
`findReactiveTrap(...)` y llaman a `requestTrapActivationDecision(trap, trigger)` (promesa que
muestra el prompt "¿activar?"). Solo para dos triggers:
- `ON_OPPONENT_ATTACK_DECLARED` ([runBattlePhaseStep.ts:62-64](../../src/components/game/board/hooks/internal/opponent-turn/runBattlePhaseStep.ts))
- `ON_OPPONENT_EXECUTION_ACTIVATED` ([runMainPhaseStep.ts:34-36](../../src/components/game/board/hooks/internal/opponent-turn/runMainPhaseStep.ts))

**b) Turno del jugador** — se activa **sin preguntar**.
Cuando el jugador ataca ([handleOpponentEntityClick.ts:60](../../src/components/game/board/hooks/internal/player-actions/handleOpponentEntityClick.ts))
o activa una ejecución ([useExecutePlayAction.internal.ts:87](../../src/components/game/board/hooks/internal/player-actions/useExecutePlayAction.internal.ts)),
el motor dispara la trampa reactiva del **rival** y, si el jugador tiene un **Nullify Opponent Trap**
(`ON_OPPONENT_TRAP_ACTIVATED` + efecto `NEGATE_OPPONENT_TRAP_AND_DESTROY`), este se resuelve
**automáticamente como contra-trampa** dentro del motor
([resolve-trap-trigger.ts:12-22, 72-75](../../src/core/use-cases/game-engine/effects/resolve-trap-trigger.ts),
función `selectCounterTrap`). Ese camino **nunca pasa por el prompt** → de ahí que "se active sin avisar".

### Diagnóstico

- El Nullify es un caso especial: se auto-negocia **síncronamente** dentro de `resolveTrapTrigger`,
  no por el bus de decisión asíncrono. No hay forma actual de **saltarlo** por opción.
- Además hay asimetría: en el turno del jugador ninguna trampa propia pregunta; en el del rival, solo
  dos triggers preguntan. Otros triggers reactivos existen y tampoco preguntan:
  `ON_OPPONENT_DIRECT_ATTACK_DECLARED`, `ON_OPPONENT_ENTITY_SET_PLAYED`, `ON_OPPONENT_STAT_BUFF_APPLIED`.

### Opciones de solución

**Opción A — Targeted (arregla lo reportado).**
Hacer que el Nullify del jugador pregunte en los dos flujos del turno del jugador.
1. **Motor**: añadir opción para **saltar** la contra-trampa (p.ej. `skipCounterTrapPlayerIds: string[]`)
   propagada `executeAttack`/`resolveExecution` → `resolveReactiveTrapEvent` → `resolveTrapTrigger` →
   `selectCounterTrap`. Sin la opción, comportamiento idéntico (retro-compatible).
2. **Hooks de jugador**: pasar `requestTrapActivationDecision` a `usePlayerActions`; en
   `handleOpponentEntityClick` y `executeActivationPlay`, cuando exista `playerCounterTrap`, pedir
   decisión con trigger `ON_OPPONENT_TRAP_ACTIVATED`; si se rechaza, pasar el `skipCounterTrapPlayerIds`
   del jugador al motor.

**Opción B — Sistémica (recomendada, "todas las trampas").**
Unificar en un único gate: **cualquier** trampa reactiva del jugador (en cualquier trigger y en ambos
turnos) pasa por `requestTrapActivationDecision`. Elimina la asimetría y el caso especial del Nullify.
- Reutiliza el `useTrapDecisionManager` existente.
- Amplía el prompt a todos los triggers reactivos con trampas jugables.
- Mantiene la contra-trampa como una decisión más (con el `skip` del motor de la Opción A).
- Mayor alcance de test (integración de motor + hooks), pero deja el sistema coherente y sin deuda.

**Recomendación**: empezar por la base de la Opción A (el `skip` del motor + prompt del Nullify, que es
lo que el usuario ve), y en el mismo PR extender al resto de triggers (Opción B) si el tiempo lo permite.

### Riesgos / consideraciones
- **Multijugador**: el prompt aplica al jugador local; verificar que la sincronización de acciones
  (`emitLocalAction`) siga siendo determinista cuando se decide NO activar (no debe divergir el estado).
- **Timings/animaciones**: los flujos ya previsualizan la trampa; encajar el prompt sin romper el
  ritmo (sleeps) ni el modo automático.
- **Tests**: hay suite de trampas (`resolve-trap-trigger`, `runBattlePhaseStep.test`, etc.). Añadir
  casos: rechazar Nullify ⇒ la trampa rival SÍ resuelve; aceptar ⇒ se niega.

### Ficheros probables
- `src/core/use-cases/game-engine/effects/resolve-trap-trigger.ts` (+ `resolve-trap-trigger` tests)
- `src/core/use-cases/game-engine/effects/internal/trap-trigger-registry.ts` (propagar opción)
- Firmas de `GameEngine.executeAttack` / `resolveExecution` (opciones de skip)
- `src/components/game/board/hooks/internal/player-actions/handleOpponentEntityClick.ts`
- `src/components/game/board/hooks/internal/player-actions/useExecutePlayAction.internal.ts`
- Cableado de `requestTrapActivationDecision` hacia `usePlayerActions`

---

## 2) Botón de ayuda "?" en cada ranking + sección de documentación

### Contexto (fuente de verdad de la puntuación)

Reglas reales (migración [094_weekly_leaderboards.sql](../../docs/supabase/sql/094_weekly_leaderboards.sql),
tabla `weekly_leaderboard_point_rules`):

- **Multijugador (ELO)** — no semanal. Sube/baja tu ELO ganando/perdiendo duelos multijugador clasificados.
- **Actividad (semanal, pts)**: duelo jugado +20 (`PLAY_DUEL`), arena +20 (`PLAY_ARENA`),
  partida MP +20 (`PLAY_MP_MATCH`), misión/evento/diaria reclamada +15 (`MISSION_CLAIM`).
- **Comercio (semanal, pts)**: comprar carta +10 (`BUY_CARD`), comprar pack +30 (`BUY_PACK`),
  evolucionar carta +20 (`EVOLVE_CARD`).
- Semanales: cierre domingo 22:00 UTC; premios top 5 (1000/600/400/250/150 Nexus).

> Estas reglas deben quedar en **un único módulo TS** (p.ej. `core/services/progression/ranking-scoring.ts`)
> para que el chip de ayuda y la sección de docs lean lo mismo y no se dupliquen valores de balance.
> El texto de ayuda describe la regla; los números viven en un solo sitio.

### Solución

**a) Botón "?" por tablero** en [`RankingHubClient.tsx`](../../src/components/hub/ranking/RankingHubClient.tsx):
- Icono `HelpCircle` (lucide) junto al selector/stats del tablero activo.
- Al pulsar abre un popover/hoja con las reglas del tablero **activo** (usa el módulo de scoring).
- Accesible (`aria-label="Cómo puntúa este ranking"`, foco, cierre con Esc/overlay).

**b) Sección de docs**: nueva entrada en el **Códex de Academy**
([glossary-content.ts](../../src/components/hub/academy/glossary/glossary-content.ts) +
[AcademyGlossary.tsx](../../src/components/hub/academy/glossary/AcademyGlossary.tsx)) titulada
"Cómo subir los rankings", con los tres tableros, cómo se puntúa cada uno, cierre semanal y premios.
El Códex es la página de documentación in-app del jugador (prosa separada de los datos de balance).

> Decisión abierta: ¿"página de documentación" = Códex de Academy (recomendado, in-app y del jugador)
> o la página `/presentacion-tfm`?

### Ficheros
- `src/core/services/progression/ranking-scoring.ts` (nuevo, fuente única) + test
- `src/components/hub/ranking/RankingHubClient.tsx` (+ posible componente popover)
- `src/components/hub/academy/glossary/glossary-content.ts` y `AcademyGlossary.tsx`

---

## 3) "Caramelos" para subir de nivel cartas (propuesta de diseño)

### Estado actual del leveleo

- Cada carta tiene **nivel** (0–30) por XP acumulada
  ([card-level-rules.ts](../../src/core/services/progression/card-level-rules.ts): `MAX_CARD_LEVEL=30`,
  XP temprana `[40,60,80,100,120]`). El nivel es distinto del **versionTier** (V0–V5, maestría).
- La XP hoy se gana **en combate** (entidades). Progreso por carta en `player_card_progress`
  (`IPlayerCardProgress`: level, xp, versionTier, masteryPassiveSkillId).
- Ya existe **tienda de eventos** con canje (`RedeemEventShopItemUseCase`,
  `/api/progression/events/redeem`) y acción `EVOLVE_CARD`. Hay bus de progresión y wallets de Nexus.

### Propuesta (caramelo = ítem consumible que otorga niveles/XP a una carta)

Diseño alineado con lo existente, por fases y sin deuda:

**Modelo de datos** (nueva migración):
- Tabla `player_level_item_inventory` (o genérica `player_consumables`): `player_id`, `item_id`,
  `quantity`. Un `item_id` por "tamaño" de caramelo: `LEVEL_CANDY_1`, `_2`, `_3`, `_4`, `_5`
  (otorgan N niveles / su XP equivalente). Catálogo de ítems en TS (fuente de verdad de magnitudes),
  filas de inventario en BD.
- Otorgar caramelos = insertar en inventario; canjear/usar = transacción atómica (RPC) que descuenta
  1 ítem y suma XP a `player_card_progress` de la carta elegida (respetando `MAX_CARD_LEVEL`).

**Obtención** (reutiliza mecanismos existentes):
- Recompensas de **eventos** (event shop / misiones de evento) y **story** (recompensas de nodo).
- Futuro: "tabernas" u otras fuentes → solo añaden un origen que llama al mismo "grant".

**Aplicación (UI)**:
- Desde el **Arsenal** (detalle de carta): botón "Usar caramelo" → elige tamaño disponible → confirma →
  la carta sube de nivel con animación de XP (ya hay VFX de XP en combate reutilizable).

**Reglas/decisiones a cerrar**:
- ¿El caramelo otorga **niveles fijos** (subir exactamente N) o **XP equivalente** (puede quedar a medio
  nivel)? Recomendado: XP equivalente al coste de esos niveles desde el nivel actual (simple y justo).
- ¿Aplica solo a **Entities** (las únicas que suben de nivel hoy) o a todas? Recomendado: solo Entities.
- ¿Tope por carta / por día? ¿Interacción con el balance de niveles ya existente?
- Servidor-autoritativo: el canje debe validarse y persistirse en servidor (nunca cliente).

**Fases sugeridas**:
1. Diseño + migración de inventario y catálogo TS + "grant" y "use" server-side (con tests).
2. UI de inventario y "usar caramelo" en Arsenal.
3. Integrar como recompensa en eventos y story.
4. (Futuro) tabernas u otras fuentes.

> Este punto se entrega primero como **documento de diseño**; la implementación arranca cuando se
> confirmen las decisiones anteriores.

---

## Orden sugerido y decisiones

**Orden**: #2 (rápido, alto valor y bajo riesgo) → #1 (bug de motor, requiere cuidado y tests) →
#3 (diseño y luego fases).

**Decisiones tomadas (2026-07-12)**:
1. #1: **Opción B (sistémica)** — todas las trampas reactivas del jugador preguntan antes de activarse.
2. #2: Docs en el **Códex de Academy** (`/hub/academy/glossary`).
3. #3: **Solo el diseño** por ahora (esta guía); la implementación se agenda tras cerrar decisiones.

## Estado de implementación (2026-07-12)

- **#2 → HECHO.** Chip de ayuda "?" por tablero + sección "Cómo subir los rankings" en el Códex,
  con la puntuación en un módulo único (`services/ranking/ranking-scoring`).
- **#1 → Nullify HECHO** (fase 1 de la Opción B). El contra-trampa (Nullify) ahora es **skippable**
  en el motor (`skipCounterTrapPlayerIds`, propagado por `executeAttack`/`resolveExecution` →
  `resolveReactiveTrapEvent` → `resolveTrapTrigger`/`selectCounterTrap`) y el jugador **decide**
  activarlo en sus dos flujos de turno (ataque y ejecución). La decisión viaja en el payload MP
  (`declineCounterTrap`) para replay determinista. Verificado: typecheck · lint · 1251 tests · build.
  - **Pendiente (fase 2):** extender el prompt a los 3 triggers reactivos raros
    (`DIRECT_ATTACK_DECLARED`, `ENTITY_SET_PLAYED`, `STAT_BUFF_APPLIED`) en el turno del rival,
    idealmente validado con playtest. Requiere interceptar acciones de la IA a mitad de turno.
- **#3 → diseño entregado** (sección de arriba). Implementación por fases pendiente de tus decisiones.

## Checklist de calidad (memoria del repo)
- **pnpm** (no npm). Antes de commitear: `CI=true pnpm quality:check` con exit code real.
- #1 y #3 tocan motor/BD: tests de integración obligatorios; migraciones nuevas siguen la numeración
  `docs/supabase/sql/NNN_*.sql` y no se aplican a prod sin tu OK.
