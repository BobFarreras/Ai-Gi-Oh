# Guía del paquete v1.17

Guía previa a picar código para el nuevo batch de ideas. Igual que la guía de v1.15: cada ficha dice
**qué existe ya** (verificado en el código, no supuesto), **los pasos**, **los conceptos a tener en cuenta**,
**la superficie de seguridad** y **las decisiones que faltan**. Nada de esta guía está implementado.

- **Rama de trabajo:** `feat/paquete-v1.17` (creada desde `develop`, que ya lleva la release v1.16.0).
- **Última migración en el repo:** `130`. Las nuevas empiezan en `131`.
- **Ficha heredada:** los *ghost decks* (ficha 11 del roadmap v1.15, que quedó pendiente) se mueven aquí
  como **ficha 6**, con las reglas nuevas que has añadido (5/día, ventana de ±50 de ELO).

---

## ▶ ESTADO ACTUAL — PAQUETE A COMPLETO ✅

Hecho, commiteado y con migraciones aplicadas: **9b** (rastro de objetos, mig. 131), **2** (Borrado de
Mano, mig. 132), **1** (Sobrecarga Energética en Windows 92 con escalado V5, mig. 133), **9** (caché de
objeto en el overworld del Acto 3) y **3 completa** (motor Fase A + carta Recaudador y acreditación
server-authoritative, mig. 134).

**Paquete B en curso.** **Ficha 4** (nivel 1): motor + UI del carrusel HECHOS contra la IA (falta solo el
carrusel en MULTI, otra tanda). **Ficha 5** (IA) en curso: fases 1 (simulador, `eaf3e940`), 2 (posición al
invocar, `7f4b1bdd`) y 3 (reemplazo de zona llena) HECHAS. Pendientes fase 4 (fusiones: auditar mazos), **5
(combos por-efecto — el usuario pidió los combos TypeScript y Flutter Enjambre como primeros casos)** y 6
(criterio de trampa para la IA, que enlaza con la ficha 4).

### Ficha 3, Fase B (acreditación server-authoritative de la pasiva de Nexus)

Empezar por el **paso 1: la migración** (es el candado de seguridad y todo lo demás lo llama). Orden concreto:

1. **Migración `133`** (aplicar a prod al terminar, como la 131/132):
   - Entity nueva `entity-recaudador`: stats **flojas** a propósito (p.ej. ATK 400 / DEF 300, coste 2),
     `innate_passive_skill_id = 'passive-nexus-on-battle-win'`, render `/assets/renders/executions/recaudar_nexus.webp`
     (ya recomprimido a 151 KB, sin trackear en git — añadirlo en el commit de la Fase B), market listing.
   - Tabla `passive_nexus_daily (player_id, day, nexus_credited)` + tabla de idempotencia
     `passive_nexus_operations (operation_id, player_id, created_at)`.
   - RPC `credit_passive_nexus(p_amount int, p_operation_id uuid) returns int` `security definer`: dedupe por
     operación → si repetida devuelve 0; `least(greatest(p_amount,0), 600)` (tope por duelo); luego
     `least(·, 1200 − ya_hoy)` (tope diario); acredita en `player_wallets` (upsert `on conflict`); suma al
     diario; devuelve lo realmente acreditado. **El reloj es del servidor** (`now()` / día UTC).
2. **Cliente:** al cerrar Story y Arena, leer `state.nexusEarnedByPlayerId[miPlayerId]` y enviarlo con un
   `operationId` (uuid nuevo por cierre) en el payload de completion.
3. **Servidor:** en `process-story-duel-completion.ts` y en `/api/training/matches/complete` llamar la RPC
   (solo si el duelo terminó) y devolver lo acreditado para el HUD.
4. **Glosario/HUD** (explicar el tope y que paga al final) + **tests** (topes cortan, idempotencia, solo
   Story/Arena) + **prueba real**.

Decisiones ya cerradas: paga solo en **Story y Arena**; topes **600/duelo (3 combates) y 1200/día**.
Detalle completo abajo en la Ficha 3.

---

## 0. Principios transversales

Son los mismos siete de `docs/roadmap-v1.15-paquete-produccion.md` §0 y siguen mandando. Resumen operativo,
porque cada ficha de este paquete choca con al menos uno:

1. **Server-authoritative para todo lo que tenga valor.** Nexus, objetos, puntos de ranking, pujas y
   desbloqueos de habilidades se calculan y escriben en el servidor. Si un jugador con la consola abierta
   puede dárselo a sí mismo, está mal diseñado. (Ya nos costó las migraciones 122/124: no reabramos eso.)
2. **RLS por defecto y `auth.uid()` como identidad.** Toda tabla nueva nace con RLS y políticas explícitas.
   Nada de `playerId` en el body.
3. **Idempotencia en todo lo que otorgue o mueva valor** (pujas, recompensas de nodo, puntos de ghost,
   desbloqueo de nodos del árbol): clave de operación única contra el doble clic y el reintento de red.
4. **Determinismo del multijugador.** Cualquier estado nuevo de combate (flags de pasivas, marca de trampa
   elegida, cartas iniciales editadas) debe vivir en el `GameState` o viajar en el mazo que sirve
   `get-match-session-data.ts`, nunca en estado local del cliente.
5. **Efectos data-driven.** Cartas nuevas con efectos existentes = migración SQL, no código. Efectos nuevos =
   un `action` nuevo en `ICard.ts` + handler en el registro + VFX + glosario.
6. **Migraciones aditivas y aplicadas a mano**, canónicas en `docs/supabase/sql/`.
7. **Verificación real:** `CI=true pnpm quality:check` en verde, test que falla sin el cambio, y si toca
   combate, prueba con dos clientes reales de multi.

**Documentación de cara al jugador:** toda regla nueva acaba en el glosario de la Academia
(`glossary-content.ts` + `effect-catalog-data.ts`). Una regla que el jugador no puede consultar no existe.

---

## 1. Estado real de cada idea (verificado en el código)

| # | Idea | Estado real verificado |
|---|------|------------------------|
| 1 | Pasiva entity: destruye → +1 energía el turno siguiente | El sistema de pasivas ya existe (`mastery-passive-ids.ts`, 10 pasivas + innatas) y **ya hay pasivas de "+1 energía al inicio del turno"** (`resolveMasteryEnergyBonus` en `next-phase.ts`). Falta solo la condición "destruyó este turno" |
| 2 | Magia: quitar TODA la mano del rival (6 energía) | **Casi hecho:** `DISCARD_OPPONENT_HAND_CARD` ya existe con `count` parametrizable (descarta las más antiguas, determinista). Es prácticamente una migración |
| 3 | Magia: +600 al jugarla (4 energía) | `HEAL` (LP) ya existe → migración pura. **Pero "600 nexus" es ambiguo** (¿LP o moneda?): decisión abajo |
| 4 | Trampas: elegir cuál activar entre varias | Verificado el criterio actual: `trap-selection.ts` hace `.find()` → **se ofrece siempre la PRIMERA trampa en orden de colocación**, solo una, sin encadenar. La UI (`trapPreview.ts`) replica el mismo criterio |
| 5 | IA de oponentes mejor | Hay más de lo que crees: planificador de fusión completo (`opponent-fusion-plan.ts`), perfiles por dificultad y estilo. Los fallos que describes están localizados (ver ficha) |
| 6 | Combate asíncrono contra decks de jugadores (ghosts) | Diseño hecho en v1.15 (ficha 11), 0 código. ELO y matchmaking ya existen (`match-elo-persistence.ts`, `/api/multiplayer/match/finish`) |
| 7 | Subastas de objetos | Nada. Pero hay precedentes de todas las piezas: tienda de objetos (mig. 121/128), cierre programado con `pg_cron` (mig. 094) y aviso al entrar al hub (`WeeklyPrizeProvider`) |
| 8 | Árbol de mejora del personaje | Nada. La materia prima existe: `playerExperience` en `IPlayerProgress` y recompensas de XP de jugador por duelo |
| 9 | Nodo de story con objetos | Los tipos de nodo son un union cerrado (`StoryWorldNodeType`: `REWARD_CARD`, `REWARD_NEXUS`…) → añadir `REWARD_OBJECT`. Inventario de objetos ya existe (mig. 120/123) |
| 10 | Avatar desde selfie con IA | `player_profiles.avatar_url` existe y hay diálogo de editar nombre (`HubProfileNameDialog`). **El proyecto no usa Supabase Storage en ningún sitio hoy** — subir imágenes es infraestructura nueva. Ficha de ESTUDIO, no de implementación |
| 11 | 2v2 (parejas, multi + story/arena con IA) | Sigue lo decidido en v1.15: **release propia con ADR previo**. Tu ampliación (story/arena en parejas) lo hace aún más grande, no más pequeño |

---

## 2. Orden recomendado

- **Paquete A — contenido barato y valor inmediato:** fichas 2, 3 y 1 (las tres cartas nuevas; dos son casi
  solo migración), ficha 9 (nodo de objetos en story) y ficha 9b (rastro visible de objetos equipados —
  nace de un reporte de usuario ya investigado: no era bug, era UX).
- **Paquete B — experiencia de combate:** ficha 4 (elegir trampa) y ficha 5 (IA). La 4 antes que la 5,
  porque la IA también tendrá que decidir "qué trampa activo" cuando haya varias.
- **Paquete C — features con economía/backend:** ficha 6 (ghosts) y ficha 7 (subastas). Independientes
  entre sí; la 6 primero porque ya está diseñada.
- **Paquete D — features grandes con decisión previa:** ficha 8 (árbol de personaje: cerrar diseño de
  nodos antes de tocar nada), ficha 10 (avatar IA: solo estudio) y ficha 11 (2v2: ADR, release propia).

---

## 3. Fichas

### Ficha 1 — Pasiva de entity: "si destruye una carta este turno, +1 energía el turno siguiente"

**Estado.** El sistema de pasivas por carta ya existe y tiene exactamente los dos mecanismos que esta
pasiva necesita, ya implementados para otras:

- **Pasivas de energía al inicio del turno:** `resolveMasteryEnergyBonus` (`next-phase.ts`) ya concede +1
  por `DEFENSE_ENERGY` / `ATTACK_ENERGY`. El punto de enganche existe.
- **Estado persistente por entity entre turnos:** `IBoardEntity.masteryAttackGrowth` es el precedente de
  "flag que sobrevive al reset de turno" (el reset vive en `resetEntitiesForNewTurn`).
- **Pasivas innatas (no mastery):** el patrón es `REVIVE_NEXT_TURN_PASSIVE_ID` (Antigrabity), que se
  mantiene fuera del catálogo de las 10 mastery a propósito. Esta pasiva nueva va por esa vía.

**Pasos.**
1. Nuevo id innato (p.ej. `passive-energy-on-destroy-next-turn`) junto a `REVIVE_NEXT_TURN_PASSIVE_ID`.
2. Flag en `IBoardEntity` (p.ej. `destroyedEntityThisTurn: boolean`), puesto donde se resuelve la
   destrucción en batalla (`attack-resolution.ts`) — decidir si también cuenta destruir con efectos.
3. Al inicio del turno del dueño: si una entity propia con la pasiva tiene el flag → +1 energía (respetando
   `maxEnergy`, hoy 10) y limpiar el flag. Mismo sitio que el bonus mastery, mismo evento de log de energía.
4. La carta portadora (coste 4, según tu spec) es una fila nueva de `cards_catalog` (migración `131+`).
5. VFX/log: reutilizar el evento de energía existente con `source` propio, para que el jugador vea por qué
   ganó energía. Glosario.

**A tener en cuenta.**
- El flag vive en `GameState` → determinismo de multi garantizado sin tocar transporte. **No** guardarlo en
  estado de React.
- Definir "destruye": ¿solo en batalla, o también si la pasiva-entity es el atacante destruido? Recomendado:
  solo cuando ELLA destruye en batalla (atacando o defendiendo), no destrucciones por efectos, que es lo que
  el jugador entiende leyendo la carta.
- Si la entity muere en el mismo turno en que destruyó: la pasiva se pierde con ella (el flag va en la
  instancia). Decidirlo y documentarlo en el glosario.

**Esfuerzo:** bajo-medio (1-2 días con tests).

**Estado (2026-07-16): MOTOR HECHO (commit `f1336075`, inerte). Falta la carta portadora (bloqueada por arte).**
Confirmado el mecanismo con el usuario: "cuando una entity gana un combate a otra entity, +1 energía al dueño
en su siguiente turno". Implementado 100% en el motor (no toca economía), reutilizando el hook de "ganar un
combate" de la ficha 3:
- `ENERGY_ON_BATTLE_WIN_PASSIVE_ID` + valor 1 + texto de glosario.
- `GameState.pendingEnergyBonusByPlayerId` (por jugador, determinista → multi correcto).
- Enganche unificado con la Recaudación en `applyBattleWinPassives` (`resolveEntityBattleState`): gana quien
  destruye y sobrevive; el intercambio no cuenta.
- Concesión + limpieza al inicio del turno del dueño en `next-phase.ts` (respeta `maxEnergy`; el HUD pulsa).
- `innate-passive-map`: `entity-condensador`. 4 tests nuevos; 66 verdes en phases+combat.

**CERRADA (2026-07-16, segunda tanda): portadora = `entity-windows92`, migración 133 APLICADA a prod.**
- **Portadora:** Windows 92 (NEUTRAL, coste 3, 1200/1300, TOOL, render propio → sin arte nuevo). La innata
  `passive-energy-on-battle-win` va en `cards_catalog.innate_passive_skill_id` + espejo en
  `innate-passive-map.ts`. El placeholder `entity-condensador` queda eliminado.
- **Escalado por versión (pedido del usuario):** +1 energía por combate ganado; **+2 al llegar a V5**. La
  magnitud vive en `mastery-passive-magnitude.ts` (`{ base: 1, v5: 2 }`) y el motor la resuelve por
  `versionTier` — el valor fijo `ENERGY_PER_BATTLE_WIN` se eliminó (una sola fuente).
- **Sin doble poder (patrón 079):** Windows 92 sale de `card_mastery_passive_map` (adiós "Caja de
  Herramientas" a V5 para esta carta); su innata es su identidad a todas las versiones. Progreso existente
  sincronizado (0 filas afectadas: nadie la tenía con progresión).
- Migración `133_windows92_energy_passive.sql` también registra ambas pasivas de "ganar combate" en
  `card_passive_skills` (la FK del progreso lo exige; la de Recaudación queda lista para su Fase B).
- Tests: caso V5 → +2 añadido (10/10 verdes con los de la ficha 3).

**Nota para la ficha 3 Fase B:** si se quiere el mismo escalado a V5 para la Recaudación (¿200→400 Nexus?),
decidirlo ANTES de la Fase B — afecta a los topes (600/duelo serían 1,5 combates a V5).

---

### Ficha 2 — Magia: descartar toda la mano del rival (coste 6)

**Estado.** `DISCARD_OPPONENT_HAND_CARD` ya existe con `count` opcional: descarta las N más antiguas,
determinista (verificado en `execution-effect-registry` y su test). El motor, el VFX y la IA ya conocen el
`action`.

**Pasos.**
1. Decidir la semántica de "toda la mano": la opción limpia es ampliar el efecto con `count: "ALL"` o un
   flag `all: true` (cambio pequeño en `ICard.ts` + handler + `map-card-catalog-row-to-card.ts`). La opción
   sucia (poner `count: 10`) funciona pero miente en los datos; mejor la limpia.
2. Verificar que el handler tolera `count > hand.length` (el test actual solo cubre `count: 1`).
3. Migración con la carta (coste 6) + imagen con la convención `/assets/renders/executions/{card-id}.webp`,
   **recomprimida a ~1000 px de alto** (lección de la ficha 7 de v1.15: nada de renders de 745 KB).
4. Glosario + entrada en `effect-catalog-data.ts`.

**Balance (la parte importante).** Descartar la mano entera por 6 es un efecto de los que rompen metas:
contra quien guarda 5 cartas es devastador, y en el turno 3-4 ya es jugable. Recomendación: probarla en
duelos internos antes de publicarla y tener decidido el plan B (p.ej. "descarta hasta 3" o "ambos descartan
la mano") — cambiarla luego es una migración de una línea, pero la primera impresión no se cambia.

**Esfuerzo:** bajo (medio día-1 día).

---

### Ficha 3 — Nexus dentro del combate

**REDISEÑADA (2026-07-16): NO es una carta, es una pasiva innata de una entity.** En vez de una magia de
+600 Nexus, una **entity floja** con la pasiva "Recaudación": cada vez que gana un combate a una entity
rival (la destruye y sobrevive), su dueño gana **200 Nexus**. La entity es floja a propósito para que
farmearlo cueste. Sigue siendo economía server-authoritative, con la misma mentalidad de la cartera.

**Decisiones cerradas (2026-07-16):** paga solo en **Story y Arena** (nunca training ni multi/ranked);
topes **600/duelo (máx. 3 combates) y 1200/día**.

**Estado de implementación: COMPLETA (2026-07-16, segunda tanda).**
- **Fase A — motor (commit `397c8b43`):** `NEXUS_ON_BATTLE_WIN_PASSIVE_ID` + valor 200,
  `GameState.nexusEarnedByPlayerId` (contador por jugador, determinista), enganche en
  `resolveEntityBattleState` (gana quien destruye y sobrevive; el intercambio no cuenta), 5 tests.
- **Fase B — carta + acreditación (migración 134 APLICADA a prod):**
  - **Carta:** `entity-recaudador` (NEUTRAL, coste 2, 400/300, TOOL), innata desde V0, fuera del mapa V5
    (patrón 079), render `recaudador.webp` (movido de executions/ a renders/: es una entity), listing EPIC
    1500. Diseño: floja a propósito — invertir en ella (niveles/objetos, +600 de presupuesto por coste 2)
    es la estrategia para que el "impresor de Nexus" funcione.
  - **RPC `credit_passive_nexus(p_player_id, p_amount, p_operation_id)`:** idempotente por operación,
    topes `least(amount, 600)`/duelo y `least(·, 1200 − hoy)` diario (día UTC, `FOR UPDATE` contra cierres
    simultáneos), acredita vía `wallet_credit_nexus` (tubería post-122/124). **EXECUTE solo service_role**
    (verificado en prod: `authenticated` no puede ejecutarla ni tocar `passive_nexus_daily`/`_operations`).
  - **Decisión:** topes fijos sin escalado V5; el árbol de habilidades (ficha 8) podrá subir el rango.
  - **Cliente:** el board añade `passiveNexusEarned` (del GameState) al resultado del duelo; Story y Arena
    lo envían con un `operationId` estable por duelo (uuid en ref: los reintentos reutilizan la clave).
  - **Servidor:** Story acredita en WON/LOST y NUNCA en ABANDONED (rendirse no paga); Arena en sus cierres
    (WIN/LOSE/DRAW, siempre terminados). La acreditación es no-fatal (si falla, el cierre del duelo sigue)
    y lo acreditado vuelve como `passiveNexusCredited` (se suma al Nexus mostrado en el resumen).
  - Tests: 14 en server (validador de forma, WON/LOST pagan, ABANDONED no, arena con mock) + los 5 del motor.
  - **Multi/ranked NO paga:** su cierre (`/api/multiplayer/match/finish`) simplemente no llama la RPC.

**Antiguo diseño (descartado):** era una magia coste 4 de +600 Nexus con `EARN_WALLET_NEXUS` y tope de
activaciones/día. Se sustituye por la pasiva de entity. El resto de esta ficha se conserva como referencia
del modelo de seguridad (idéntico: el cliente cuenta, el servidor acredita con topes).

---

#### Referencia del modelo de seguridad (del diseño antiguo, sigue aplicando)

**Cómo tiene que funcionar (innegociable, es la cartera otra vez):**
1. **El motor del cliente NO toca la cartera.** Al activarse la carta, el motor solo registra el hecho en
   el estado/log del duelo (p.ej. contador `nexusEarnedInDuel` o eventos en el combat log). El HUD puede
   enseñar "+600 Nexus (al final del duelo)" como feedback.
2. **El servidor acredita al cerrar el duelo**, junto al resto de recompensas, por la tubería idempotente
   post-122/124 (service-role, `wallet_credit_nexus` con `p_player_id` de la sesión). Es el mismo camino
   que ya usan las recompensas de story/arena: el crédito de esta carta es una línea más de ese cálculo,
   validada contra el registro de la partida — nunca "el cliente dice que activó la carta 5 veces".
3. **Anti-farmeo (obligatorio):** la carta imprime moneda, así que sin frenos es una granja (entrenamiento,
   amistosos, rendirse y repetir). Reglas mínimas: solo acredita en **modos con recompensa** (story/arena/
   ranked, NO entrenamiento ni amistosos), solo si el duelo **termina** (rendirse antes de acabar = no
   cobra), y **tope diario** de Nexus ganado por esta vía (p.ej. 3 activaciones/día; contador en servidor).
   Los números son tuyos, pero el tope tiene que existir desde el día 1: subirlo luego es fácil, bajarlo
   tras el abuso no.
4. En multi, la activación es visible para ambos clientes (es un efecto de ejecución normal); la
   acreditación sigue siendo solo del servidor al validar el resultado.

**Pasos.** Nuevo `action` (p.ej. `EARN_WALLET_NEXUS { value }`, agnóstico al valor — principio 5) + handler
que solo registra el evento + suma en el cierre de duelo del servidor con tope diario + migración de la
carta (coste 4) + VFX/HUD + glosario (explicar el tope y cuándo paga, o parecerá un bug).

**Esfuerzo:** medio (2-3 días). Casi todo está en el cierre de duelo del servidor y sus tests (incluido
"rendirse no paga" y "el tope corta").

---

### Ficha 4 — Trampas: elegir cuál activar cuando hay varias (y ¿cadenas?)

**Cómo funciona HOY (verificado, respuesta a tu pregunta).** Cuando una acción del rival dispara un
trigger, `selectTriggeredTrap` (`trap-selection.ts`) recorre `activeExecutions` con `.find()` y devuelve
**la primera trampa puesta que casa con el trigger, en el orden en que se colocaron en el tablero**. Ese es
el criterio, y no es elegible: la UI de confirmación (`trapPreview.ts` → el "¿activar sí/no?") usa el mismo
`.find()`, así que siempre te enseña esa primera. Si dices "no", la acción sigue y las demás trampas ni se
consideran para ese disparo. Además `resolveTrapTrigger` resuelve **exactamente una** trampa por trigger:
hoy no pueden reaccionar dos a la vez. (Excepción ya existente: la contra-trampa `NEGATE_OPPONENT_TRAP_AND_DESTROY`
del actor sí se encadena automáticamente sobre tu trampa.)

**Lo que propones, en dos niveles (recomiendo hacerlos por separado):**

**Nivel 1 — elegir cuál activar (tu flecha de "seguir pasando").** No cambia reglas de juego, solo quién
decide. Es lo que hay que hacer primero.
1. `trap-selection.ts`: nueva función que devuelva **todas** las trampas elegibles para el trigger
   (`filter`), no solo la primera.
2. UI: el diálogo de confirmación pasa a ser un carrusel — la trampa actual en grande, flechas ‹ › si hay
   más de una elegible, "Activar" / "Pasar". "Pasar todas" = la acción continúa sin trampa.
3. El motor recibe el `instanceId` de la trampa elegida (hoy `resolveTrapTrigger` la elige él): añadir un
   parámetro opcional `chosenTrapInstanceId` que salte la selección automática.
4. **IA:** el rival también tiene trampas múltiples. Hoy hereda el criterio "la primera"; con el cambio hay
   que darle un criterio explícito (mínimo: mantener "la primera elegible"; mejor: puntuar por contexto, ver
   ficha 5).
5. **Multi:** la decisión del jugador reactivo ya viaja como acción (el flujo sí/no existe); verificar que
   el `instanceId` elegido va en esa acción y que ambos clientes resuelven la misma trampa. Prueba con 2
   clientes obligatoria.

**Nivel 2 — que reaccionen VARIAS trampas al mismo disparo (tu ejemplo: una destruye + otra buffea).** Esto
sí cambia reglas y abre preguntas de diseño clásicas de los juegos de cartas: ¿en qué orden se resuelven?,
¿qué pasa si la primera destruye la entity que la segunda iba a buffear?, ¿puede el rival contra-trampear
cada una? El motor actual resuelve una y corta. Recomendación profesional: **no meterse hasta tener el
nivel 1 asentado**, y si se hace, definirlo como "cadena" explícita: se resuelven en el orden en que el
jugador las activa, una a una, re-evaluando elegibilidad tras cada resolución (una trampa puede quedarse sin
objetivo y entonces no es activable). Cada resolución pasa por el mismo `resolveTrapTrigger` para que la
contra-trampa y los logs sigan funcionando.

**Seguridad/robustez.** El `chosenTrapInstanceId` que llega del cliente es entrada de usuario: el servidor
(o el motor, en multi) revalida que esa trampa existe, es del jugador reactivo, está en `SET`, casa con el
trigger y cumple `trapActivationConditionMet`. Si no, se rechaza (cliente modificado eligiendo trampas que
no tocan).

**Esfuerzo:** nivel 1 medio (2-3 días con multi). Nivel 2 medio-alto y con diseño previo.

**DECIDIDO (2026-07-16): solo NIVEL 1.** Las cadenas (nivel 2) quedan para otra release.

**Estado: HECHA contra la IA (motor `194a3c53` + UI). Carrusel en MULTI pendiente (otra tanda).**
- **Motor (retrocompatible):** `findTriggeredTraps` (todas las elegibles) + `selectTriggeredTrap` acepta
  `chosenTrapInstanceId` REVALIDADO (id que no casa → no activa ninguna). Hilado por todo el motor. Sin
  elección = "la primera" → la IA no cambia. 10 tests.
- **UI (hecha) — carrusel ‹ › donde el HUMANO reacciona a la IA (story/arena/training):**
  - `requestTrapActivationDecision` recibe la LISTA de elegibles y resuelve `{ activate, chosenTrapInstanceId }`;
    `ITrapActivationPrompt` lleva `eligibleTraps` + `currentIndex`; `cyclePendingTrap(±1)` navega y sincroniza
    la carta previsualizada (para que el efecto de "desatención" no cancele).
  - Flechas ‹ › + contador "N/M" en `SidePanels.tsx` (desktop) y `BoardMobilePanelsDialog.tsx` (móvil), solo
    si hay >1 elegible; "Activar" coge la mostrada, "Cancelar" = pasar.
  - `runBattlePhaseStep`/`runMainPhaseStep` usan `findReactiveTraps` (plural) y pasan `chosenTrapInstanceId`.
    Las contra-trampas (Nullify) pasan una lista de 1 (sin carrusel). Tests: manager del carrusel + 157 del
    tablero/trampas en verde.
- **PENDIENTE — carrusel en MULTIJUGADOR (otra tanda, con prueba de 2 clientes):** hoy en multi la trampa
  reactiva del defensor se **auto-resuelve por el motor (primera elegible, determinista)** vía
  `apply-match-action` (`ATTACK`/`RESOLVE_EXECUTION` no llevan `chosenTrapInstanceId`) — SIN regresión, pero
  sin carrusel. Para dárselo: cuando el rival ataca, el cliente del defensor debe **preguntarle** (mismo
  `requestTrapActivationDecision`) y su elección viajar en la acción (`chosenTrapInstanceId` en el payload de
  `IMatchAction` + `apply-match-action` pasándolo al motor), con ambos clientes resolviendo la misma. Es un
  flujo de decisión que hoy no existe en multi (el `declineCounterTrap` viaja, pero no una elección de trampa).

---

### Ficha 5 — Mejorar la "IA" de los oponentes

**Estado real (más avanzado de lo que crees, pero con los agujeros exactos que describes):**

- **Posición al invocar** (`resolveEntityMode` en `select-opponent-play.ts`): la regla final es
  `attack >= defense → ATTACK`. Solo MASTER/MYTHIC comparan contra el mejor ATK rival antes de decidir
  defensa. **Confirmado tu bug:** un rival NORMAL/HARD invoca en ataque una entity más débil que las tuyas
  aunque le convenga defensa. El arreglo es extender la comparación `rivalBestAttack` (con umbrales por
  dificultad) a todos los perfiles, no solo a los dos altos.
- **Fusiones:** existe un planificador completo (`opponent-fusion-plan.ts` + `opponent-fusion-execution.ts`):
  sabe setear la magia de fusión, invocar materiales que faltan (por id y por arquetipo), proteger
  materiales de la receta e incluso reemplazar entities/ejecuciones para hacer hueco. **Si nunca has visto
  a un rival fusionar, la causa más probable no es el motor: es que sus mazos no llevan cartas FUSION o que
  las condiciones del plan casi nunca se dan.** Paso 0 obligatorio: auditar los mazos de story/arena
  (¿cuántos rivales tienen FUSION + materiales?) y simular antes de tocar heurísticas.
- **Zona llena (3 magias/trampas o 3 entities):** `runOpponentStep` sabe **ejecutar** reemplazos
  (`playCardWithZoneReplacement` / `playCardWithEntityReplacement`), pero fuera del plan de fusión la
  selección de jugadas **nunca los propone**. Confirmado tu diagnóstico: con la zona llena y sin fusión en
  curso, la IA no sabe rotar cartas. Arreglo localizado: que `select-opponent-play` genere decisiones de
  reemplazo cuando la jugada nueva puntúe claramente mejor que la peor carta puesta.
- **Magias/trampas estratégicas:** hay heurísticas de "activar solo con objetivo válido" y "setear si aún
  no conviene", pero no hay conocimiento por-efecto del estilo de tu ejemplo (TypeScript en defensa +
  Escudo TypeScript + Firewall Ofensivo como combo).

**Plan por fases (cada una medible, no "hacer la IA lista" de golpe):**
1. **Simulador primero. HECHO.** Harness IA-vs-IA en `src/core/services/opponent/simulation/`:
   `simulateAiMatch` (duelo completo dirigiendo AMBOS lados con `runOpponentStep`, guard de "no atacar en el
   turno 1"), `runAiSimulationBatch` (N duelos, win-rate/empates/turnos/métricas: invocaciones ATK/DEF,
   fusiones, ataques, LP final), `buildSimulationDeck`/`reshuffleDeck` (mazos deterministas del catálogo mock,
   barajados por partida para que NO sea espejo). Determinista por seed → comparable antes/después.
   - **Fix de robustez encontrado y aplicado:** el picker del core `pickPendingSelectionId` no resolvía
     LOCK/DESTROY/FLIP/SACRIFICE/STEAL-entity/execution (la UI sí, con otro picker) → la IA se colgaba con
     esas cartas. Completado (mirror del picker de la UI). Ahora `stuck=0` en todos los perfiles.
   - **BASELINE medido (antes de mejorar):** con los mazos mock, los perfiles altos **rinden peor**:
     MASTER pierde a EASY ~35/65, HARD pierde a EASY ~45/55. Justo el objetivo de las fases 2+. La IA invoca
     casi siempre en ATAQUE (~4-5/partida) y casi nunca en DEFENSA (~1) → señal directa para la fase 2.
2. **Posición al invocar para todos los perfiles. HECHO.** `resolveEntityMode` ahora, para TODOS los
   perfiles (antes solo MASTER/MYTHIC), invoca en DEFENSA una recién invocada que NO gana el intercambio
   contra el mejor atacante rival EN ATAQUE (`rivalAttackThreat`). Fundamento en las reglas de combate
   (`CombatService`): la recién invocada no ataca ese turno; en ATAQUE, si la matan reparte "trample" (daño
   directo) — en DEFENSA no hay daño penetrante y su DEF puede rebotar. Se mantienen las excepciones
   (presión agresiva/combo, objetivo SET con ATK≥1700). La amenaza en DEFENSA/SET no fuerza defensa (no
   golpea). `shouldHoldFragileFrontline` extendido a modo DEFENSA (prepara la trampa protectora antes de
   comprometer un frágil, también cuando iría en defensa). Medido con el simulador: la IA pasa de ~1.1 a
   ~2.0 invocaciones en defensa/partida (deja de alimentar entities). Tests nuevos: los 4 perfiles invocan
   en defensa el caso que perderían; la amenaza en defensa no encoge. 57 tests de IA en verde.
   - Nota: en espejo (ambos lados con la mejora) el win-rate no cambia; el beneficio es contra el HUMANO (que
     no recibe el cambio) y como base para las fases siguientes.
3. **Reemplazo de zona llena. HECHO.** Nuevo `opponent-zone-replacement.ts`: con 3 entities o 3
   magias/trampas, `choosePlay` ya no descarta la carta nueva —propone SUSTITUIR a la peor puesta si la nueva
   la supera por un margen (600 entities / 500 ejecuciones, para no rotar por nimiedades). Reusa las
   decisiones `replaceEntityInstanceId`/`replaceExecutionInstanceId` que el motor y la UI ya ejecutaban (solo
   las proponía el plan de fusión). Nunca toca una magia en modo ACTIVATE (resolviéndose). Requiere
   `canNormalSummon` para las entities. Tests: helper (peor carta, margen, ACTIVATE intocable) + integración
   en `choosePlay` (rota con mejora clara, no rota sin ella). 63 tests de IA en verde.
4. **Fusión:** tras la auditoría de mazos, subir la prioridad del plan de fusión en perfiles altos y dar
   mazos con fusión a rivales concretos ("expertos en fusión" — es dato de mazo, no código).
5. **Combos por-efecto (petición del usuario, 2026-07-16):** tabla data-driven de sinergias que la heurística
   consulte, en vez de `if`s por carta. Empezar con 4-5 combos reales, **el primero el del usuario**:
   TypeScript en DEFENSA + Escudo TypeScript (`REINFORCE_LINKED_ENTITY_ON_ATTACK`, linked a `entity-typescript`)
   + magia de atacar en defensa (`ALLOW_DEFENSE_MODE_ATTACK`).
   - **Estado real hoy (verificado):** la IA tiene sinergia por-carta PARCIAL —no juega buffs "a la carta X"
     ni "por arquetipo" sin el compañero en mesa (`canActivateExecutionNow`)— y el planificador de fusión ya
     es un combo multi-carta real (precedente de que "planear" es factible). PERO: `scoreTrap` puntúa la
     trampa **solo por coste** (setearía el Escudo TypeScript sin tener la entity → trampa muerta), y
     `ALLOW_DEFENSE_MODE_ATTACK` / `REINFORCE_LINKED_ENTITY_ON_ATTACK` **no están en la lógica de la IA** (no
     los conoce → la magia acabaría boca abajo sin usarse). No planifica proactivamente conservar/montar piezas.
   - **Enfoque (NO look-ahead global, caro y frágil):** (a) **gating de piezas** —una trampa/magia solo
     puntúa alto si sus compañeros están o van a estar en mesa (`scoreTrap` debe mirar `linkedCardId` y si
     tienes esa entity); (b) **prioridad de conjunto** —con 2 de 3 piezas, subir prioridad de jugar/guardar
     la 3ª, reutilizando el patrón del planificador de fusión; (c) tabla de combos como DATOS
     (`{ core, pieces[], plan }`), no `if`s. Validar con el simulador (fase 1) que no desbalancea.
   - **Segundo caso del usuario (2026-07-16):** *no invocar* una entity aún porque tienes una trampa reactiva
     (p.ej. **Flutter Enjambre**) y prefieres que salte PRIMERO con el ataque rival, y ya invocarás el turno
     siguiente. Es "sinergia negativa/tempo": la IA debe reconocer que retrasar el desarrollo maximiza la
     trampa. Ojo: enlaza con `shouldSkipPlayForEnergy`/`shouldHoldFragileFrontline` (ya existe la idea de
     "esperar"), pero aquí la condición es "tengo trampa reactiva armada + el rival va a atacar".
   - **Esfuerzo:** medio; lo caro es diseñar bien qué combos merecen la pena.
6. Las trampas múltiples de la ficha 4 nivel 1: darle a la IA el criterio de "cuál activo".

**A tener en cuenta.** Los perfiles (`difficultyProfiles.ts`, `story-ai-profile.ts`) son datos: gran parte
de la mejora es tuning de números + mazos, no código nuevo. Y cualquier mejora sube la dificultad real de
story/arena/ghosts a la vez — otra razón para el simulador (medir antes/después).

**Esfuerzo:** medio-alto, pero troceable (el simulador + fases 2-3 son ~3-4 días y ya se nota muchísimo).

---

### Ficha 6 — Combate asíncrono contra decks de otros jugadores (ghosts) — heredada de v1.15

**Diseño ya acordado en v1.15 (sigue válido):** tú atacas, la IA pilota el mazo real del defensor ausente
con su progresión; el servidor elige el rival; ganar a un ghost da menos que ganar a un humano; los puntos
los otorga el servidor al validar el resultado; el mazo del defensor se sirve resuelto desde el servidor y
solo la parte pública (nick/avatar, nada de inventario).

**Tus reglas nuevas de esta tanda (se incorporan):**
- **Límite: 5 combates de ghost al día** que puntúan (contador por jugador y día UTC, en el servidor).
- **Emparejamiento por ventana de ELO ±50:** el servidor busca candidatos dentro de `[miELO−50, miELO+50]`
  y elige él (el jugador no escoge víctima — anti-farmeo). Decidir el fallback si no hay nadie en la
  ventana: ampliar a ±100 o no ofrecer combate (recomendado: ampliar con menos puntos).
- **Puntuación reducida en ambos lados — DECIDIDO (2026-07-16):** ganar da pocos puntos y **el defensor
  ausente también pierde pocos**. (Esto sustituye formalmente la decisión de v1.15 de que "el dueño del
  ghost no gana ni pierde nada".) Números de partida: K/4 para el atacante y K/8 para el defensor (sobre el
  K de un duelo vivo), a revisar tras una semana de datos. Un jugador que duerme no debe poder ser
  "granjeado" hasta el suelo del ranking: con el límite de que **cada deck solo puede ser atacado N veces
  al día** (p.ej. 3) se cierra ese agujero — este freno es necesario justo porque el defensor pierde puntos.

**Piezas verificadas sobre las que se monta:** ELO y cierre de partida (`match-elo-persistence.ts`,
`/api/multiplayer/match/finish`), resolución de mazos ajenos con progresión y objetos
(`get-match-session-data.ts`, ya resuelve los dos mazos), motor de IA con perfiles (ficha 5 lo mejora antes
o en paralelo — cuanto mejor la IA, más justo el modo).

**Pasos.**
1. Migración `131+`: tabla de "defensas" (deck publicado por jugador — o reutilizar el deck activo),
   contadores diarios (ataques hechos, veces defendido) y registro de resultados idempotente.
2. Endpoint de matchmaking fantasma: valida límite diario, busca en la ventana ±50, devuelve la sesión con
   el mazo del defensor ya resuelto (misma tubería que multi).
3. El combate corre en el cliente con la IA local, **pero el resultado lo valida y puntúa el servidor**
   (mismo candado que el multi actual: nunca "el cliente dice que ganó" sin registro de partida).
4. UI: entrada en el nodo multijugador ("Combates de red: 3/5 hoy"), y al defensor, un resumen al volver
   ("te atacaron 2 veces: 1V/1D, −4 pts") — patrón `WeeklyPrizeProvider`.
5. Perfil de IA del ghost: perfil alto (HARD+) y, si hace falta compensar, ventaja **visible** (los +LP se
   muestran en el HUD).

**Esfuerzo:** medio-alto (4-6 días), como se estimó en v1.15.

---

### Ficha 7 — Subastas de objetos (pujas con fecha de cierre)

**Estado.** Nada de subastas, pero cada pieza tiene precedente en el repo: catálogo/inventario de objetos
(mig. 120/121/123/128), trabajos programados con `pg_cron` (mig. 094, cierre semanal de rankings) y aviso
al jugador al entrar al hub (patrón `DailyLoginProvider`/`WeeklyPrizeProvider`).

**El modelo (decisiones de diseño primero):**
- **¿Qué se subasta y quién lo lista?** Recomendado para empezar: subastas **del sistema** (admin/liveops
  lista un objeto raro con fecha de cierre), no jugador-a-jugador. El P2P añade fraude, colusión y lavado
  de Nexus entre cuentas; es otra release.
- **Retención de la puja (escrow).** La regla profesional: **al pujar, el Nexus se retiene**; si te superan,
  se devuelve automáticamente. La alternativa ("solo paga el ganador al cierre") permite pujar sin tener el
  dinero y reventar subastas. El escrow evita la puja fantasma. Ambas operaciones son movimientos de cartera
  → pasan por la tubería post-122/124 (service-role, idempotente).
- **Incremento mínimo** (p.ej. +5% o +50 Nx) y **anti-sniping**: si entra una puja en los últimos 2 minutos,
  el cierre se extiende 2 minutos. Sin esto, todas las subastas se deciden en el último segundo.

**Pasos.**
1. Migración: `auctions` (objeto, precio salida, incremento mínimo, cierre, estado) + `auction_bids`
   (subasta, jugador, cantidad, `operation_id` único). RLS: las pujas se leen (la puja máxima es pública),
   pero **solo se escriben por RPC** `security definer` que valida en una transacción: subasta abierta,
   puja > máxima + incremento, retener Nexus, devolver al superado.
2. Cierre por `pg_cron` (patrón 094): marca ganador, entrega el objeto al inventario (`player_inventory_items`
   / `player_card_upgrades` según tipo) y liquida retenciones. Idempotente: correr dos veces no entrega dos.
3. UI en el Mercado: tercera pestaña o grupo en la sección Objetos (el conmutador Cartas/Objetos ya existe),
   con cuenta atrás, puja máxima actual y tu estado (ganando/superado).
4. Aviso "has ganado la subasta" con el patrón del premio semanal (columna `seen_at` + ack).
5. Tests: concurrencia de dos pujas simultáneas (la RPC transaccional decide), doble clic (idempotencia),
   cierre con y sin pujas.

**Superficie de seguridad (la mayor del paquete junto a la 6).** Dinero en movimiento + tiempo real +
concurrencia. Todo lo que decida quién gana o cuánto se paga vive en SQL transaccional; el cliente solo
pinta. Y el reloj es el del servidor (`now()` en la RPC), jamás el del cliente.

**Esfuerzo:** medio-alto (4-5 días).

---

### Ficha 8 — Árbol de mejora del personaje (nodos con XP, habilidades por estilo)

**Estado.** No existe nada del árbol. Materia prima verificada: el jugador ya gana **XP de jugador**
(`playerExperience` en `IPlayerProgress` y en `IMatchReward`) — hoy esa XP se acumula pero no compra nada.

**Concepto clave (misma lección que los caramelos de v1.15):** los nodos del árbol **no cambian datos, dan
permisos/modificadores**. El estado es "qué nodos tiene desbloqueados el jugador"; los efectos se aplican
en el punto del código donde ya se calcula esa cosa. Ejemplos con tus dos habilidades:
- **"Doble Nexus al ganar":** se aplica en el cálculo de recompensa **en el servidor** (donde ya se
  acreditan las recompensas de duelo). Jamás multiplicando en el cliente.
- **"Editar las 5 primeras cartas del combate":** esto toca el **reparto inicial de mano** del motor, y en
  multi las dos partes deben verlo igual → la configuración viaja con el mazo que sirve
  `get-match-session-data.ts` (principio 4). Además es una ventaja competitiva fuerte: decidir si aplica en
  ranked o solo en PvE (recomendado empezar por PvE).

**Pasos.**
1. **Diseño primero (bloqueante):** lista cerrada de nodos v1 (sugerencia: 10-15 nodos, 2-3 ramas de
   estilo — economía / combate / colección), coste en puntos, prerequisitos (aristas), y si hay **respec**
   (reasignar). Sin esta tabla no se empieza: cambiar un árbol publicado es doloroso.
2. Migración: `character_skill_nodes` (catálogo data-driven: id, rama, coste, prerequisitos, efecto como
   JSON — mismo enfoque que los efectos de cartas) + `player_skill_unlocks` (RLS, solo lectura para el
   cliente) + RPC `security definer` de desbloqueo: valida puntos disponibles, prerequisito y duplicado, en
   transacción idempotente.
3. Puntos de habilidad derivados del nivel de jugador (que sale de `playerExperience` con una curva, igual
   que las cartas): **una sola fuente de verdad**, nada de "puntos regalados" sueltos.
4. Aplicación de efectos: un resolver de bonus de personaje consultado por los puntos ya existentes
   (recompensas de servidor; preparación de partida para efectos de combate). Cada efecto nuevo del árbol
   define su punto de enganche igual que las pasivas mastery.
5. UI: pantalla de diagrama (constelación de nodos). Empezar simple: SVG/HTML con posiciones en datos —
   nada de motor gráfico.
6. Glosario + comunicación (es sistema de progresión nuevo).

**Seguridad.** El desbloqueo es valor (poder permanente): RPC transaccional con `auth.uid()`, catálogo solo
editable desde admin. Y los **efectos** se aplican en el servidor siempre que toquen valor (el doble Nexus
farmeable desde consola sería la vuln de la cartera otra vez).

**Esfuerzo:** alto (una semana larga con diseño incluido). Candidato a partirse: backend+2 habilidades
primero, diagrama bonito después.

---

### Ficha 9 — Nodo de story que da objetos (USB Raro, mejoras de atributos)

**Estado.** `StoryWorldNodeType` es un union cerrado con `REWARD_CARD` y `REWARD_NEXUS`
(`story-world-types.ts`) — el patrón a seguir es exactamente el de esos dos. Los objetos y su inventario ya
existen (mig. 120 `player_inventory_items`, 123 `player_card_upgrades`), y la 128/129 ya integran objetos en
eventos y arena, así que "entregar un objeto a un jugador" tiene tubería server-side probada.

**Pasos.**
1. Añadir `REWARD_OBJECT` al union + campo de configuración del nodo (qué objeto y cantidad; en la misma
   tabla/seed donde los nodos definen `rewardNexus`).
2. Reclamo **en el servidor**, idempotente por `(playerId, nodeId)` — mismo candado que el resto de
   recompensas de story (un nodo no se cobra dos veces por doble clic ni re-entrando).
3. UI del mapa: icono propio del nodo (el arte de los objetos ya existe en `/assets/items/`), y el flotante
   de recompensa (`floatingReward` hoy solo acepta tono `NEXUS | CARD` → añadir `OBJECT`).
4. Admin: que el editor de story permita configurar el objeto del nodo (el admin ya edita nodos/mazos).
5. Test: reclamar nodo → aparece en el inventario del arsenal; reclamado dos veces → una sola entrega.

**Verificado en el código (2026-07-16, antes de empezar):**
- Los nodos de recompensa del overworld **están definidos en CÓDIGO**, no en BD: `findStoryVirtualNodeDefinition`
  (`story-map-definition-registry`) resuelve el nodo, y el reclamo vive en
  `/api/story/overworld/claim-reward/route.ts`. → **NO hay migración de nodo** y **el "admin editor" (paso 4)
  NO aplica** a estos nodos (se edita el código de `act-N-map-definition.ts`).
- **Idempotencia ya resuelta:** el candado es `interactedNodeIds` del estado compacto del jugador (check antes
  de otorgar, guardar después) — mismo patrón que REWARD_NEXUS/REWARD_CARD. Reutilizar tal cual.
- **Falta una vía de "entregar objeto al inventario":** el canje de eventos hace el `insert into
  player_inventory_items ... on conflict quantity+1` **inline** dentro de `redeem_event_shop_item` (mig. 128);
  no hay función reutilizable. → hace falta una **RPC nueva `grant_inventory_item(p_item_type, p_item_id,
  p_quantity)` `security definer`** (migración) que el route llame, porque `player_inventory_items` no es
  escribible por el cliente (solo RPC/service-role).
- **Ripple del tipo:** `StoryWorldNodeType` se usa en ~33 sitios; añadir `REWARD_OBJECT` hará saltar los
  `switch` exhaustivos en typecheck (bueno: los localiza). Añadir `rewardObjectType/rewardObjectId/quantity`
  a `IStoryMapVirtualNodeDefinition`.

**Pasos reales (actualizados):** (1) `REWARD_OBJECT` al union + campos en la definición; (2) RPC
`grant_inventory_item` (migración) + repositorio; (3) el route reparte por tipo (Nexus/Card/**Object**);
(4) un nodo REWARD_OBJECT en un `act-N-map-definition.ts`; (5) UI: `floatingReward` tono OBJECT + icono;
(6) test reclamar→inventario / doble→una entrega.

**Estado (2026-07-16, segunda tanda): IMPLEMENTADA (v1 en el overworld, SIN migración).**
- **Tipos:** `REWARD_OBJECT` en `StoryWorldNodeType` y `OverworldObjectKind` (+ `VALID_KINDS` del validador);
  `rewardObjectType/Id/Quantity` en `IStoryMapVirtualNodeDefinition`. El typecheck localizó los switch
  exhaustivos (solo `resolve-story-node-interaction`).
- **Entrega SIN migración ni RPC:** `SupabasePlayerInventoryRepository.grantItem` escribe
  `player_inventory_items` con **service-role** (patrón cartera post-122) validando el catálogo. Se descartó
  la RPC `grant_inventory_item`: ejecutable por `authenticated` sería un grifo de objetos desde la consola.
- **Ruta:** `claim-reward` usa el resolutor puro `resolveClaimRewardPlan` (testeado) y devuelve
  `rewardObject {name, imageUrl, quantity}` para la etiqueta flotante. Idempotencia por `interactedNodeIds`
  (mismo candado que Nexus/carta).
- **Contenido v1:** caché `story-ch3-cache-object` (USB Raro +1) en la sala del puzzle del Acto 3,
  tile (7,19), arte `/assets/items/candy-usb-raro.webp`.
- **UI overworld:** gates de interacción (engine + DevScene), presentación del intent, labels/acentos de
  Renderer2D y minimapa. La etiqueta flotante muestra `+{nombre del objeto}`.
- **Fuera de la v1:** el mapa clásico de circuito (actos 1-2, vía `/world/interact`) no tiene nodos de
  objeto; si algún día los lleva, añadir el tono OBJECT al `floatingReward` del circuito. El paso 4 (admin)
  no aplica: estos nodos viven en código.
- Tests: 88 verdes en story/overworld (resolutor nuevo + validación del tilemap con la caché colocada).

---

### Ficha 10 — Avatar desde selfie con IA (ficha de ESTUDIO — así lo has pedido)

**Estado verificado.** `player_profiles.avatar_url` existe (string), hay diálogo de editar nombre
(`HubProfileNameDialog`, "Configurar Operador") donde encajaría el flujo. **El proyecto no usa Supabase
Storage en ningún sitio** — no hay ni bucket ni código de subida de imágenes. Todo lo de imágenes hoy son
assets estáticos del repo.

**Las dos rutas que planteas, con su coste real:**

**Ruta A — pipeline automático en la app (selfie → API de IA → avatar).**
- **Privacidad (lo más serio):** un selfie es **dato biométrico** (GDPR). Aunque no se guarde la original
  (bien pensado por tu parte), la imagen VIAJA a un tercero (la API de generación): hay que poder decírselo
  al usuario (consentimiento explícito) y elegir un proveedor con política de no-retención. Esto no es un
  detalle técnico, es lo que decide si la feature es viable.
- **Moderación:** la gente subirá cualquier cosa. Hace falta moderación del resultado (y de la entrada)
  antes de que el avatar sea visible para otros (chat, rankings, DMs). Un avatar ofensivo generado es
  contenido público tuyo.
- **Coste:** las APIs de imagen "gratuitas" tienen cuotas ridículas para producción. Con jugadores reales
  esto es un coste recurrente por generación (y regeneraciones: "no me gusta, otra").
- **Infraestructura nueva:** bucket de Storage con RLS (cada jugador escribe solo su avatar, tamaño máximo,
  solo el resultado — la selfie ni toca el bucket: va del cliente al endpoint del servidor, que la manda a
  la API y la descarta), endpoint con rate limit (N generaciones/día), y validación de que `avatar_url`
  solo apunta a NUESTRO bucket — **nunca URL externa arbitraria** (misma vuln que cerró CARD_SHARE en v1.15:
  pixel de rastreo servido a todo el que vea tu perfil).
- Esfuerzo real: una semana, más el coste mensual de la API.

**Ruta B — guía de prompt para REVE (el jugador genera fuera y el resultado entra al juego).**
- La app da una guía con el prompt exacto del estilo del juego ("retrato anime tech, paleta cian/negro…");
  el jugador la usa en REVE con su selfie y sube **el resultado** (no el selfie).
- Se mantiene casi toda la infraestructura de la ruta A (bucket, moderación, rate limit) **menos** la API de
  pago y el manejo del selfie (el dato biométrico nunca pasa por nuestros servidores — gran diferencia legal).
- Contra: fricción (el jugador sale de la app) y menos consistencia de estilo.

**Ruta C (la barata, para tener algo YA):** galería de avatares prediseñados con el estilo del juego
(assets estáticos, selector en el diálogo de perfil). Cero riesgo, cero coste, y deja montada la UI donde
luego enchufar A o B.

**Recomendación:** C ahora (un día), B después si la demanda existe, A solo con presupuesto y política de
privacidad escrita. **Decisión tuya antes de mover nada.**

---

### Ficha 9b — Rastro visible de los objetos equipados

**Origen:** reporte de usuario (2026-07-16): "compré el objeto del evento y no me sale en el arsenal".
Investigado en producción: **no era un bug** — el canje del evento entrega bien (verificadas RPC, inventario,
RLS y catálogo). El jugador había **equipado él mismo** el objeto 33 segundos después de canjearlo (su carta
tiene el +200 ATK), y al ver luego el almacén vacío creyó haber perdido la compra. Verificado luego en el
código (2026-07-16): el flujo B de equipar (objeto → "Equipar" → sección Cartas) deja el objeto "armado"
de forma invisible mientras se navega, y el botón del detalle pasa a "Activar {objeto}" — un toque lo
consume. La cinemática de aplicar ya existe y se mantiene como confirmación visual; lo que falta es RASTRO
posterior. Diseño cerrado con las dos mejoras de abajo (decisión 2026-07-16).

**Diseño (decidido):**

1. **Badges de mejora en la cara de la carta** (`Card.tsx` → `CardFrameArtAndProgress`): en el contenedor
   de la imagen, icono pequeño arriba-izquierda con `×N` de mejoras de ATK aplicadas y arriba-derecha lo
   mismo para DEF. Solo si N > 0. Props opcionales (mismo patrón que `level`/`versionTier`): quien tenga el
   dato lo pasa (arsenal); el tablero de combate no los pasa y no cambia. Ojo perf: `Card` está memoizada y
   se usa en el tablero — los badges son estáticos, sin animación.
2. **Historial de equipamientos**: botón junto al conmutador Cartas/Objetos (`ArsenalSectionSwitch`, icono
   reloj/scroll) que abre el historial: objeto (imagen+nombre), carta destino, `+valor stat` y fecha.
3. Al canjear un objeto en la tienda del evento, aviso claro de destino: "Añadido a tus Objetos del
   arsenal", con enlace a la sección.

**El dato que falta (migración `131+`).** `player_card_upgrades` solo guarda el **bonus agregado** por
carta/stat, no las veces ni cuándo; y no hay tabla de historial. Derivar `×N` como `bonus / 100` es frágil
(`card_upgrade_items.value` es editable por admin). Solución única para 1 y 2:
- Tabla `player_card_upgrade_log` (append-only): player, item_id, card_id, stat, value, applied_at.
  **Escrita solo desde las RPC** `apply_card_upgrade` (y la de caramelos, para que el historial cubra ambos
  tipos de objeto); RLS de solo-lectura del propio jugador, sin write para `authenticated` (mismo patrón 123).
- `×N` por stat y el historial salen los dos de esta tabla.
- Backfill de lo ya aplicado: generar filas sintéticas desde `player_card_upgrades` (hoy es exacto porque
  ambos objetos valen 100; fecha = desconocida, usar la de la migración y marcarlo).

**Esfuerzo:** bajo-medio (1 día: migración + badges + panel de historial).

**Estado (2026-07-16): IMPLEMENTADA y migración APLICADA a prod** en `feat/paquete-v1.17`.

- Migración `131_card_upgrade_log.sql` aplicada (backfill de contadores hecho: p.ej. `entity-unreal-engine`
  quedó 3×ATK/2×DEF). Historial de caramelos empieza desde hoy; el de mejoras ATK/DEF viene completo.
- **Fuente única de los badges:** los contadores viven en `player_card_upgrades` (counts) y se adjuntan a la
  carta en `applyCardProgressionToCard` como `ICard.upgradeCounts` — el ÚNICO punto que hidrata cartas para
  tablero, arsenal, mercado y ambos clientes de multi. Por eso el badge sale en **combate (mano), detalle,
  deck y almacén** sin plumbing por pantalla: `Card` lo resuelve `prop ?? card.upgradeCounts`, y
  `CardThumbnail` (deck/almacén) lo lee de la carta. El tipo `ICardUpgradeCounts` tiene una única definición
  en `card-upgrade-rules.ts`. (Nota: en tablero, la carta EN JUEGO muestra el holograma 3D encima; el badge
  se ve nítido en mano y en todo el arsenal.)
- **Badge en la animación al 1er objeto:** el overlay pinta la carta ya hidratada con el nuevo count, así que
  al aplicar el primer objeto el icono aparece en la carta de la cinemática.
- **Diseño de los sellos (`CardUpgradeBadges`, fuente visual única):** estética del sello de coste (fondo
  negro, borde y texto oro, esquina biselada externa) para que se integre en el marco. Dos variantes:
  `detail` = icono + ×N (carta grande, detalle/combate); `compact` = SOLO icono (miniaturas de deck/almacén,
  donde el ×N tapaba el arte). ATK a la izquierda, DEF a la derecha en ambas.
- **Overlay más robusto:** el fogonazo radial era `absolute` sin `pointer-events-none` y tapaba el botón
  "Continuar" (de ahí que "a veces no hiciera nada"); arreglado. Además autocierre ~2s tras la animación.
- Historial en la sección Objetos (`ArsenalObjectHistoryDialog` + `GET /api/progression/upgrade/history`) y
  aviso de destino en el canje del evento con deep-link `/hub/arsenal?seccion=objetos`.

---

### Ficha 11 — 2v2 (parejas): multi, y story/arena con IA

**Se mantiene la decisión de v1.15: fuera del paquete, release propia con ADR previo** (`docs/adr/`), y tu
ampliación (parejas también en story y arena contra IA) la refuerza: ahora además de los 4 asientos en
`GameState`, el transporte Realtime para 4 clientes y la redefinición de "oponente" para TODOS los efectos,
harían falta **dos pilotos de IA coordinados** (la IA de la ficha 5 razona sobre un rival singular).

Lo único que SÍ conviene hacer en este paquete: **no aumentar la deuda**. Cada ficha nueva que toque el
motor (1, 4, 5) debe evitar cablear más fuerte la suposición "dos jugadores" donde sea gratis evitarlo
(p.ej. iterar sobre una lista de oponentes en código nuevo en vez de `state.playerB`). No es refactorizar
nada: es no empeorarlo.

El ADR, cuando toque, decide: modelo de asientos (2 equipos × 2), reglas de turnos, objetivos de efectos
("el rival" → ¿cuál?), LP compartidos o por jugador, y transporte. Con eso decidido se estima de verdad.

---

## 4. Decisiones

**Cerradas (2026-07-16):**

1. **Ficha 3:** los 600 son **Nexus de moneda**, acreditados en `player_wallets` por el servidor al cerrar
   el duelo, con tope diario y solo en modos con recompensa (detalle en la ficha).
2. **Ficha 6:** el defensor ausente **sí pierde puntos** (pocos). Sustituye la decisión de v1.15. Números
   de partida: K/4 atacante, K/8 defensor, ~3 defensas/día por deck.

**Cerradas (2026-07-16, segunda tanda):**

3. **Ficha 2:** descarta **hasta 3** (`count:3`), no la mano entera. Implementada (commit `9a1679cc`,
   migración 132 aplicada).
4. **Ficha 3:** rediseñada a **pasiva de entity floja** (+200 Nexus por combate ganado); paga solo en
   Story/Arena; topes 600/duelo y 1200/día. Fase A del motor hecha (commit `397c8b43`); Fase B pendiente.

**Pendientes:**

2. **Ficha 4:** ¿nivel 1 solo (elegir cuál activar) o también cadenas de varias trampas? (Recomendado:
   nivel 1 primero, cadenas en otra release.)
5. **Ficha 6 (números):** los K exactos de los ghosts se validan con datos, pero hacen falta valores
   iniciales antes de implementar.
4. **Ficha 7:** ¿subastas solo del sistema (recomendado) o también entre jugadores?
5. **Ficha 8:** lista v1 de nodos/habilidades del árbol y si "editar las 5 primeras cartas" entra en ranked
   o solo PvE (recomendado: PvE primero).
6. **Ficha 10:** ¿ruta A, B o C para el avatar? (Recomendado: C ya, B después.)

## 5. Definition of done común

La misma de v1.15: tests que fallan sin el cambio; `CI=true pnpm quality:check` en verde con exit code real;
migraciones en `docs/supabase/sql/` **y aplicadas** con constancia; RLS verificado en toda tabla nueva
(intentar la escritura como `authenticated` y ver el rechazo); glosario actualizado; y si toca combate,
prueba de multijugador con dos clientes reales.
