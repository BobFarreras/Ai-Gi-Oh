# Guía — Nuevas cartas mágicas y trampa + entity Antigrabity

> Rama: `feat/new-magic-trap-cards` · Fecha: 2026-07-13
> **Implementación EN CURSO.** Las decisiones abiertas del §7 están resueltas (ver §7-bis y notas).
> Objetivo: añadir 1 entity con pasiva innata nueva + ~16 cartas mágicas/trampa, muchas con
> efectos aún NO soportados por el motor, sin crear deuda técnica, vulnerabilidades ni bugs.

---

## 0. Estado de implementación (actualizado 2026-07-13)

**Hecho y verificado (`CI=true pnpm quality:check` en verde por fase):**

| ✅ | Ítem | Acción/efecto nuevo | Migración |
|----|------|---------------------|-----------|
| ✅ | Fase 0 — sistema de estados multi-turno | `IActiveStatusEffect` + `status-effects.ts` + tick en `next-phase` | — |
| ✅ | Antigrabity + pasiva innata "revivir" | `passive-revive-next-turn` + `applyScheduledRevivals` | 098 |
| ✅ | #1 figma/copilot/arch (+1000 ATK a su entity) | `BOOST_ATTACK_BY_CARD_ID` | 096 |
| ✅ | #3 Logo Naranja (daño condicional si hay avast) | `DAMAGE_IF_ALLY_ON_BOARD` | 097 |
| ✅ | #5 Firewall Fortaleza (bloqueo ataque directo 3t) | `APPLY_NO_DIRECT_ATTACKS` + VFX barrera/escudo | 099 |
| ✅ | #16 Red Neuronal Cloud (destruir entity elegida) | `DESTROY_OPPONENT_ENTITY` + selección | 100 |
| ✅ | #4 Appel (voltear entity rival a defensa) | `FLIP_OPPONENT_ENTITY_TO_DEFENSE` + selección | 101 |
| ✅ | #14 Cubo Metálico (sacrificar entity propia por energía) | `SACRIFICE_ALLY_ENTITY_FOR_ENERGY` + selección propia | 102 |
| ✅ | #10 Bandera Windows (infección -300 LP/turno) | `APPLY_DAMAGE_OVER_TIME` + reacción `ON_OPPONENT_TRAP_ACTIVATED` | 103 |
| ✅ | #11 Abrazo Hugging (regeneración +300 LP/turno) | `APPLY_HEAL_OVER_TIME` | 104 |
| ✅ | #9 Flutter Enjambre (anula ataque directo + refleja ATK) | `REFLECT_DIRECT_DAMAGE` + negación transitoria | 105 |
| ✅ | #2 Núcleo de Datos (doble invocación este turno) | `GRANT_EXTRA_SUMMON` + contador `extraSummonsThisTurn` + `canNormalSummon` | 106 |
| ✅ | Badges de estado en HUD (escudo/infección/regeneración), desktop + móvil | `HudStatusBadges` | — |

**Pendiente:**

| ⬜ | Ítem | Acción/efecto | Fase | Compl. |
|----|------|---------------|------|--------|
| ⬜ | Trampa Metasploit (bloquear ataque a entity, sin destruir) | `NEGATE_ATTACK` | — | 🟡 |
| ⬜ | Trampa OpenClaw (anular buff que el rival aplica) | `NULLIFY_OPPONENT_BUFF` | — | 🟡 |
| ⬜ | #12 Octocat (robar entity del tablero rival) | `STEAL_OPPONENT_ENTITY` + selección | 4 | 🔴 |
| ⬜ | #13 robar magia/trampa del tablero rival | `STEAL_OPPONENT_EXECUTION` + selección | 4 | 🔴 |
| ⬜ | #6 reaq m (intercambiar entities de tablero) | `SWAP_BOARD_ENTITIES` | 4 | 🔴 |
| ⬜ | #7 Terminal Córtice (intercambiar manos) | `SWAP_HANDS` | 4 | 🔴 |
| ⬜ | #8 Escudo TypeScript (escudo ligado a entity, +1000 DEF acumulable) | status ligado + stack | 4 | 🔴 |
| ⬜ | #15 Escudo Firewall (anular y destruir magia rival) | `NEGATE_OPPONENT_EXECUTION_AND_DESTROY` | 5 | 🔴 |
| ⬜ | Cierre: cartas en mazos de IA + pase de balance + renombrar imágenes restantes | — | — | — |

> **Fases 0, 1, 2 y 3 completas.** Quedan la Fase 4 (robos/intercambios, la más grande) y la Fase 5
> (contra-magia), más las 2 trampas extra (Metasploit, OpenClaw) y el cierre.
> Migraciones 096-106 aplicadas SOLO a la BD local; ninguna a producción todavía.

---

## 1. Arquitectura actual (cómo se añade una carta y un efecto, de forma segura)

Guía oficial ya existente: [`docs/architecture/07-game-engine-effects-extension.md`](../architecture/07-game-engine-effects-extension.md).
Capas que toca **cada carta con efecto nuevo**:

| # | Capa | Fichero | Qué se hace |
|---|------|---------|-------------|
| 1 | Contrato | [`core/entities/ICard.ts`](../../src/core/entities/ICard.ts) | Nuevo `interface IXxxEffect` + añadir a la unión `ICardEffect`. |
| 2 | Parser BD | [`map-card-catalog-row-to-card.ts`](../../src/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card.ts) | Parsear el JSON `effect` de la fila de `card_catalog`. |
| 3a | Handler magia | [`execution-effect-registry.ts`](../../src/core/use-cases/game-engine/actions/internal/execution-effect-registry.ts) | Efecto síncrono sin selección. |
| 3b | Handler trampa | [`trap-effect-registry.ts`](../../src/core/use-cases/game-engine/effects/internal/trap-effect-registry.ts) | Efecto reactivo de trampa. |
| 3c | Con selección | [`resolve-execution-special-actions.ts`](../../src/core/use-cases/game-engine/actions/internal/resolve-execution-special-actions.ts) + `pending-turn-action-factory` | Efectos que piden elegir objetivo (patrón `LOCK_OPPONENT_ENTITY`). |
| 4 | Trigger nuevo | [`trap-trigger-registry.ts`](../../src/core/use-cases/game-engine/effects/internal/trap-trigger-registry.ts) | Solo si el disparador de trampa no existe (hoy hay 6). |
| 5 | VFX/animación | combat-log events + overlays del board + `EffectVfxDemo` | Reusar eventos existentes (DAMAGE, HEAL, STAT_BUFF_APPLIED, CARD_TO_GRAVEYARD…) siempre que se pueda. |
| 6 | IA rival | `HeuristicOpponentStrategy` + `resolve-opponent-selection-actions.ts` | Que la IA sepa jugar la carta y **resolver** cualquier acción pendiente nueva sin romperse. |
| 7 | Catálogo BD | migración `docs/supabase/sql/NNN_*.sql` (INSERT en `card_catalog` + listing de mercado) | Carta jugable por el jugador. |
| 8 | Catálogo código | [`core/data/mock-cards/{executions,traps,entities}.ts`](../../src/core/data/mock-cards/) | **Solo si un oponente (IA de historia/arena/tutorial) usa la carta.** |
| 9 | Códex | [`effect-catalog-data.ts`](../../src/core/services/effects/internal/effect-catalog-data.ts) + `glossary-content` | Documentar el efecto para el jugador. |
| 10 | Tests | registry test (feliz + límites + no-op) + integración del caso de uso | Obligatorio por efecto. |

### Reglas de oro (del propio repo)
- **Inmutabilidad** de `GameState`/`IPlayer`; nada de `any`; sin lógica de negocio en componentes React.
- Efecto no soportado → `null` controlado o error de dominio tipado, nunca crash.
- **Multijugador determinista**: todo campo nuevo de estado debe viajar en `GameState` y reproducir igual en ambos clientes; los efectos con selección se resuelven vía **acción pendiente** (`pendingTurnAction`) que ya se sincroniza.
- Migraciones nuevas: numeración `NNN_*.sql`, **no se aplican a prod sin tu OK**.

---

## 2. El gran hueco: NO hay sistema de efectos de estado multi-turno

Hoy el estado por turnos se limita a `IBoardEntity.lockedTurnsRemaining` y `modeLock`. **No existe**
un contenedor de "efectos activos" a nivel de jugador ni de entidad para cosas como:
- "sin ataques directos durante 3 turnos" (#5)
- daño/curación por turno (DoT/HoT) (#10, #11)
- escudo persistente ligado a una entity hasta que muera (#8)
- revivir una entity el siguiente turno (pasiva de Antigrabity)

**Decisión de diseño (fundacional):** crear un sistema mínimo de **efectos de estado** antes de las
cartas que lo necesitan. Propuesta:

```ts
// Nuevo, en core/entities: efectos de estado activos, con contador de turnos y dueño.
interface IActiveStatusEffect {
  id: string;                 // uuid determinista
  kind: "NO_DIRECT_ATTACKS" | "DAMAGE_OVER_TIME" | "HEAL_OVER_TIME" | ...;
  ownerPlayerId: string;      // a quién afecta / a quién beneficia
  remainingTurns: number | null; // null = hasta condición (p.ej. entity ligada destruida)
  magnitude?: number;         // p.ej. 300 LP/turno
  linkedEntityInstanceId?: string; // para escudos ligados (#8)
}
```
- Vive en `GameState.activeStatusEffects: IActiveStatusEffect[]` (serializa en MP).
- **Hook de inicio de turno** en [`next-phase.ts`](../../src/core/use-cases/game-engine/phases/next-phase.ts):
  aplicar DoT/HoT, decrementar `remainingTurns`, purgar los expirados o cuya entity ligada ya no está.
  (Mismo punto donde ya se aplican las pasivas mastery: `applyMasteryTurnStart`.)
- **Hook de validación de ataque** en `attack-validation.ts`: si hay `NO_DIRECT_ATTACKS` activo contra
  el atacante, bloquear el ataque directo.
- Cada tick emite su **combat-log event** para el VFX (reusar `DIRECT_DAMAGE`/`HEAL_APPLIED`).

Construir esto **bien y testeado** primero es lo que evita deuda técnica en 4-5 de las cartas.

---

## 3. Antigrabity (entity + pasiva innata "revivir")

**Carta:** `entity-antigrabity`, NEUTRAL, 3 energía, 1200 ATK / 1200 DEF, render ya en
`public/assets/renders/antigrabity.webp`.
- **Paso 1 (trivial):** INSERT en `card_catalog` (migración) + entrada en `mock-cards/entities.ts` si
  algún oponente la usa. Sin efecto especial todavía.
- **Paso 2 (pasiva innata "revivir"):** es una pasiva NUEVA (no está en las 10 mastery actuales).
  - Se registra como pasiva innata (ver [[v5-mastery-passives]] / `innate-passive-map`) con su handler.
  - Mecánica: al ir al cementerio, **marcar** para revivir; en el **inicio del siguiente turno de su
    dueño** (hook de `next-phase`), reinvocarla al tablero. Si ya hay 3 entities → **acción pendiente**
    de "elige una entity propia para destruir" (patrón selección) antes de colocarla.
  - Encaja mejor como un `IActiveStatusEffect { kind: "REVIVE_NEXT_TURN", linkedEntityInstanceId }` o
    como marca en el cementerio. Requiere el sistema del §2.
  - **Riesgo/decisión:** ¿revive siempre? ¿una sola vez? ¿si muere en el turno del rival revive en el
    tuyo siguiente? Definir para no crear bucles infinitos ni desync.

---

## 4. Catálogo de efectos pedidos: clasificación por complejidad

Leyenda complejidad: 🟢 bajo (patrón existente) · 🟡 medio (acción nueva + selección) · 🔴 alto (infra nueva §2).

| # | Carta (propuesta id) | Tipo | Efecto | Acción nueva | Compl. |
|---|----------------------|------|--------|--------------|--------|
| 1 | figma/copilot/arch (`exec-*-boost`) | Magia | +1000 ATK a una entity concreta | `BOOST_ATTACK_BY_CARD_ID` (espejo del de DEF que ya existe) | 🟢 |
| 2 | Núcleo de Datos (`exec-data-core-double-summon`) | Magia | permite 2 invocaciones este turno | contador `extraSummonsThisTurn` + regla de invocación | 🟡 |
| 3 | Logo Naranja (`exec-orange-avast-strike`) | Magia | si hay `entity-avast` en campo, 2000 daño al rival | `DAMAGE_IF_ALLY_ON_BOARD` (daño condicional) | 🟢 |
| 4 | Appel (`exec-apple-flip-defense`) | Magia | voltear 1 entity rival a defensa | `FLIP_OPPONENT_ENTITY_TO_DEFENSE` + selección | 🟡 |
| 5 | Firewall Fortaleza (`exec-firewall-fortress`) | Magia | nadie hace ataques directos 3 turnos | status `NO_DIRECT_ATTACKS` (§2) | 🔴 |
| 6 | reaq m (`exec-reaq-board-swap`) | Magia | intercambia entities de tablero con el rival | `SWAP_BOARD_ENTITIES` (mover propiedad/slots) | 🔴 |
| 7 | Terminal Córtice (`exec-terminal-hand-swap`) | Magia | intercambia manos con el rival | `SWAP_HANDS` (runtimeId/propiedad) | 🔴 |
| 8 | Escudo TypeScript (`trap-typescript-shield`) | Trampa | ligada a `entity-typescript`; al atacarla +1000 DEF (acumulable) hasta que muera | trigger "mi entity atacada" + status ligado + stack | 🔴 |
| 9 | Flutter Enjambre (`trap-flutter-reflect`) | Trampa | si te atacan directo, refleja el daño a los LP del rival | `REFLECT_DIRECT_DAMAGE` (trigger `ON_OPPONENT_DIRECT_ATTACK_DECLARED` ya existe) | 🟡 |
| 10 | Bandera Windows (`trap-windows-flag-infect`) | Trampa | al activar el rival una trampa, -300 LP rival por turno | status `DAMAGE_OVER_TIME` (§2), trigger existe | 🔴 |
| 11 | Abrazo Hugging (`trap-hugging-heal`) | Trampa | al activar el rival una trampa, +300 LP tuyos por turno | status `HEAL_OVER_TIME` (§2), trigger existe | 🔴 |
| 12 | Octocat (`exec-octocat-steal-entity`) | Magia | roba una entity del tablero rival a tu campo | `STEAL_OPPONENT_ENTITY` + selección | 🔴 |
| 13 | (Escudo) robo magia/trampa (`exec-steal-opponent-execution`) | Magia | roba una magia/trampa del tablero rival | `STEAL_OPPONENT_EXECUTION` + selección | 🔴 |
| 14 | Cubo Metálico (`exec-metal-cube-sacrifice`) | Magia | destruye una carta propia del tablero y ganas su energía | `SACRIFICE_ALLY_FOR_ENERGY` + selección | 🟡 |
| 15 | Escudo Firewall (`trap-firewall-counter-magic`) | Trampa | al activar el rival una magia, la bloquea y destruye | `NEGATE_OPPONENT_EXECUTION_AND_DESTROY` (timing: interceptar antes de aplicar el efecto) | 🔴 |
| 16 | Red Neuronal Cloud (`exec-neural-cloud-destroy`) | Magia | destruye una entity rival elegida | `DESTROY_OPPONENT_ENTITY` + selección (patrón `LOCK`) | 🟡 |

> Los efectos 🟡/🔴 con selección se resuelven con **acción pendiente** (como `LOCK_OPPONENT_ENTITY`),
> lo que además los hace deterministas en multijugador y resolubles por la IA.

---

## 5. Plan por fases (orden seguro, cada fase entra verificada y en su commit)

- **✅ Fase 0 — Fundaciones (sin cartas):**
  sistema de `IActiveStatusEffect` (§2) + hooks en `next-phase` y `attack-validation` + helper genérico
  de "seleccionar entity/carta del tablero (propia o rival)". Todo con tests unitarios. Es la base de
  #5, #8, #10, #11 y la pasiva de Antigrabity.
- **✅ Fase 1 — Antigrabity + efectos 🟢:** entity Antigrabity (sin pasiva), #1, #3. Riesgo mínimo.
- **✅ Fase 2 — Selección 🟡:** #4 ✅, #14 ✅, #16 ✅, #2 ✅ (doble invocación). Patrón `LOCK` + IA que resuelve.
- **✅ Fase 3 — Pasiva Antigrabity + status multi-turno 🔴:** revivir ✅, #5 ✅, #9 ✅, #10 ✅, #11 ✅ sobre la infra §2.
- **⬜ Fase 4 — Robos/intercambios 🔴:** #12, #13, #6, #7, #8 (escudo ligado). Los de mayor riesgo de
  balance y edge-cases (propiedad de cartas, slots llenos, runtimeId).
- **⬜ Fase 5 — Contra-magia 🔴:** #15 (interceptar la resolución de una magia rival y anularla).
- **⬜ Extra (trampas nuevas 🟡):** Metasploit (`NEGATE_ATTACK`) y OpenClaw (`NULLIFY_OPPONENT_BUFF`).
- **⬜ Cierre:** cartas en mazos de IA + Códex + VFX pulidos + pase de balance + `CI=true pnpm quality:check`.

Cada carta, en su fase: contrato → parser → handler → (trigger) → VFX → IA → migración → (mock-cards) →
Códex → tests. Nada se mergea sin lint+typecheck+test+build en verde.

---

## 6. Riesgos transversales a vigilar

1. **IA rival:** cada acción pendiente nueva necesita rama de resolución en la IA
   (`resolve-opponent-selection-actions.ts`) o la partida se atasca. Alternativa inicial: marcar las
   cartas más complejas como **solo del jugador** (no en mazos de IA) hasta darles comportamiento.
2. **Multijugador:** nuevos campos de `GameState` (statusEffects, marcas de revive) deben serializar y
   reproducirse; las acciones con selección viajan como `pendingTurnAction` (ya sincronizado). Ojo con
   robos/intercambios de cartas: el `runtimeId`/propiedad debe quedar coherente en ambos clientes.
3. **Balance:** daños de golpe (2000), robos e intercambios de tablero pueden ser rompedores. Definir
   coste de energía y condiciones. Pase de balance antes de meterlas en mazos reales.
4. **VFX/diseño:** reusar eventos de combat-log existentes siempre que se pueda; los genuinamente nuevos
   (robo, intercambio, escudo persistente) necesitan overlay nuevo + entrada en `EffectVfxDemo`.
5. **Timing de la contra-magia (#15):** hoy la trampa reactiva se resuelve *después* de que la magia
   dispara el evento; anular su efecto requiere reordenar (interceptar antes de aplicar). Es el más
   delicado del motor.
6. **Renombrado de imágenes:** los ficheros actuales tienen nombres sucios (`figma-acci_2_11zon.webp`,
   `N_cleo de Datos - Carta Tech_11zon.webp`, `reaq m_1_11zon.webp`…). Hay que renombrarlos a los `id`
   canónicos (`exec-*`, `trap-*`) y **mover a `traps/` los que sean trampa**. Propuesta en §4; a validar.

---

## 7-bis. Aclaraciones resueltas (2026-07-13)

- **#1**: cada magia sube +1000 ATK a SU entity (figma→figma, copilot→copilot, arch→antigrabity).
  Acción `BOOST_ATTACK_BY_CARD_ID` (espejo del de DEF). 🟢
- **#5 Firewall Fortaleza**: es **MAGIA**; bloquea los **ataques directos del rival** durante 3 turnos
  (puede seguir atacando entities). Status `NO_DIRECT_ATTACKS` sobre el rival, 3 turnos. Renombrar imagen.
- **#8 Escudo TypeScript**: +1000 DEF **acumulable** por cada ataque recibido; la trampa persiste hasta
  que la `entity-typescript` vinculada sea destruida.
- **#10/#11 DoT/HoT**: **cada turno hasta el final del duelo** (`remainingTurns: null`). Más adelante,
  cartas que curen el estado.
- **#12 Octocat / #13 robo magia-trampa**: son **MAGIAS** (renombrar imágenes, quitar prefijo "Trampa_").
- **#15 Escudo Firewall**: anula **cualquier** magia que active el rival (trigger EXECUTION_ACTIVATED).
- **Nuevas (antes sin efecto):**
  - `Trampa_ Escudo Metasploit` → **TRAMPA**: al declarar el rival un ataque a una entity, **bloquea el
    ataque** (sin efecto), sin destruir al atacante. Acción `NEGATE_ATTACK` (bloqueo simple). 🟡
  - `Trampa_ OpenClaw Bug Trap` → **TRAMPA**: cuando el rival activa una magia que **buffea** a sus
    entities, esta trampa **resta ese mismo valor** del atributo. Trigger `ON_OPPONENT_STAT_BUFF_APPLIED`
    (ya existe) + acción `NULLIFY_OPPONENT_BUFF` (usa el contexto del buff). 🟡

### Antigrabity revive → REUTILIZA la lógica y VFX de "volver del cementerio al campo"
`applyReturnGraveyardCardToField` ([`execution-return-effects.ts`](../../src/core/use-cases/game-engine/actions/internal/execution-return-effects.ts))
ya: mueve la carta del cementerio al campo, **gestiona el caso de 3 entities** (destruye una y emite
`CARD_TO_DESTROYED` para el VFX) y usa `createRevivedInstanceId` (¡el motor ya preveía revivir!).
- El revive de Antigrabity = marcar al morir + en el **inicio del siguiente turno de su dueño** llamar a
  esa función. Reutilizamos colocación + animación; solo es nuevo el **disparador** (marca de revive) y,
  si se quiere, dejar **elegir** qué entity sacrificar en vez del auto-sacrificio de la más antigua
  (por defecto reutilizamos el auto; el "elegir" sería un extra con acción pendiente).
- Esto hace que Antigrabity **no dependa** del sistema de status §2: se puede entregar antes con una marca
  simple `reviveScheduledEntityIds` + hook de `next-phase`.

## 7. Decisiones abiertas (a cerrar antes de picar código)

**Ambigüedades de efectos:**
- #1: ¿cada carta (figma/copilot/arch) sube +1000 ATK a UNA entity concreta, o las tres suben a las tres?
- #5 "Firewall Fortaleza": el fichero dice "Carta Trampa" pero el efecto lo describes como magia. ¿Magia o trampa? ¿"nadie" ataca directo o solo el rival?
- #8 escudo TypeScript: ¿el +1000 DEF es por cada ataque recibido (acumulable sin límite)? ¿desaparece exactamente cuando muere la typescript?
- #10/#11 DoT/HoT: ¿cuántos turnos duran? ("cada turno" ¿indefinido hasta fin de duelo, o N turnos?)
- #12 Octocat y #13 (robo magia): los marcas como "Trampa_…" en el nombre pero como efecto de magia. ¿Son magias?
- #15 contra-magia: ¿anula cualquier magia rival, o solo las que te apuntan?
- Ficheros sin efecto asignado en la lista: `Trampa_ Escudo Metasploit`, `Trampa_ OpenClaw Bug Trap`. ¿Qué hacen? ¿entran en este lote?

**Alcance/uso:**
- ¿Estas cartas las usa también la **IA** (mazos de historia/arena) o de momento **solo el jugador** (más seguro para empezar)?
- ¿Van al **mercado** (comprables) desde ya, o primero solo para pruebas?
- ¿Aplico las migraciones a **producción** yo, o me limito a dejarlas listas y tú las aplicas?

## Decisiones tomadas (2026-07-13)
1. **La IA también usará estas cartas** → cada carta necesita comportamiento de IA (elección de objetivo
   y resolución de acciones pendientes) desde su fase. Se añade a cada bloque el trabajo de IA y sus tests.
2. **Fase 0 primero** → se construye el sistema de efectos de estado multi-turno (§2) antes de las cartas
   que lo usan.
3. **Migraciones**: las dejo escritas (`NNN_*.sql`); las aplicas tú a producción.

## 8. Checklist de calidad (memoria del repo)
- **pnpm** (no npm). Antes de commitear cada fase: `CI=true pnpm quality:check` con exit code real.
- Tests co-localizados por efecto (registry + integración). Migraciones sin aplicar a prod sin tu OK.
- Actualizar `docs/architecture/*` si cambia comportamiento del motor (p.ej. el sistema de status §2).
