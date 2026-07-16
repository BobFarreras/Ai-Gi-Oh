# Guía del paquete v1.17

Guía previa a picar código para el nuevo batch de ideas. Igual que la guía de v1.15: cada ficha dice
**qué existe ya** (verificado en el código, no supuesto), **los pasos**, **los conceptos a tener en cuenta**,
**la superficie de seguridad** y **las decisiones que faltan**. Nada de esta guía está implementado.

- **Rama de trabajo:** `feat/paquete-v1.17` (creada desde `develop`, que ya lleva la release v1.16.0).
- **Última migración en el repo:** `130`. Las nuevas empiezan en `131`.
- **Ficha heredada:** los *ghost decks* (ficha 11 del roadmap v1.15, que quedó pendiente) se mueven aquí
  como **ficha 6**, con las reglas nuevas que has añadido (5/día, ventana de ±50 de ELO).

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

### Ficha 3 — Magia: "al tirarla ganas 600 Nexus" (coste 4)

**DECIDIDO (2026-07-16): son 600 Nexus de MONEDA, acreditados en `player_wallets`.** No es una cura: es
economía dentro del combate, y se diseña con esa mentalidad.

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
1. **Simulador primero.** Un harness IA-vs-IA (motor puro, sin UI, ya es determinista) que juegue N duelos
   entre perfiles y saque win-rate y métricas (fusiones hechas, reemplazos, LP perdidos por mala posición).
   Sin esto no se puede afirmar que un cambio "mejora" la IA — es el test de regresión del balance.
2. **Posición al invocar** para todos los perfiles (comparar contra el tablero rival; mantener las
   excepciones estratégicas ya existentes: presión agresiva, buffs propios, efectos que piden ataque).
3. **Reemplazo de zona llena** en la selección normal de jugadas.
4. **Fusión:** tras la auditoría de mazos, subir la prioridad del plan de fusión en perfiles altos y dar
   mazos con fusión a rivales concretos ("expertos en fusión" — es dato de mazo, no código).
5. **Combos por-efecto:** tabla data-driven de sinergias (efecto ↔ condición de uso óptimo) que la
   heurística consulte, en vez de `if`s por carta. Empezar con 4-5 combos reales del catálogo.
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

**Esfuerzo:** bajo-medio (1-2 días).

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

### Ficha 9b (mini) — Rastro visible de los objetos equipados

**Origen:** reporte de usuario (2026-07-16): "compré el objeto del evento y no me sale en el arsenal".
Investigado en producción: **no era un bug** — el canje del evento entrega bien (verificadas RPC, inventario,
RLS y catálogo). El jugador había **equipado él mismo** el objeto 33 segundos después de canjearlo (su carta
tiene el +200 ATK), y al ver luego el almacén vacío creyó haber perdido la compra. El objeto se consume al
aplicarse y no deja rastro visible *como objeto*: este ticket se va a repetir.

**Pasos (baratos, solo UI):**
1. En el detalle de la carta, junto a las stats ya sumadas, listar las mejoras aplicadas
   ("Mejoras: 2× Núcleo Overclock · +200 ATK"). El dato ya existe (`player_card_upgrades` guarda el bonus
   agregado por carta; si se quiere el desglose por objeto haría falta ampliar la tabla — empezar por el
   agregado, que no toca BD).
2. Al canjear un objeto en la tienda del evento, aviso claro de destino: "Añadido a tus Objetos del
   arsenal", con enlace a la sección.

**Esfuerzo:** bajo (medio día).

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

**Pendientes:**

1. **Ficha 2:** ¿"toda la mano" de verdad, o tope ("hasta 3")? (Se puede lanzar con todo y bajar luego,
   pero mejor decidirlo con el simulador de la ficha 5.)
2. **Ficha 4:** ¿nivel 1 solo (elegir cuál activar) o también cadenas de varias trampas? (Recomendado:
   nivel 1 primero, cadenas en otra release.)
3. **Ficha 3/6 (números):** el tope diario de la carta de Nexus y los K exactos de los ghosts se validan
   con datos, pero hacen falta valores iniciales antes de implementar.
4. **Ficha 7:** ¿subastas solo del sistema (recomendado) o también entre jugadores?
5. **Ficha 8:** lista v1 de nodos/habilidades del árbol y si "editar las 5 primeras cartas" entra en ranked
   o solo PvE (recomendado: PvE primero).
6. **Ficha 10:** ¿ruta A, B o C para el avatar? (Recomendado: C ya, B después.)

## 5. Definition of done común

La misma de v1.15: tests que fallan sin el cambio; `CI=true pnpm quality:check` en verde con exit code real;
migraciones en `docs/supabase/sql/` **y aplicadas** con constancia; RLS verificado en toda tabla nueva
(intentar la escritura como `authenticated` y ver el rechazo); glosario actualizado; y si toca combate,
prueba de multijugador con dos clientes reales.
