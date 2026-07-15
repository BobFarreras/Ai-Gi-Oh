# Guía del paquete de producción v1.15

Guía previa a picar código para las 12 ideas del batch. Cada ficha dice **qué existe ya** (verificado en
el código, no supuesto), **los pasos**, **los conceptos a tener en cuenta**, **la superficie de seguridad**
y **las decisiones que faltan**. Nada aquí está implementado todavía.

Rama base: `fix/mp-revived-instance-id-desync` (lleva el fix del desync de multi). Última migración en el
repo: `117`. Las nuevas empiezan en `118`.

---

## 0. Principios transversales (aplican a TODAS las fichas)

Estas siete reglas son las que evitan que el paquete se convierta en deuda o en un agujero de seguridad.
Si una ficha las incumple, la ficha está mal.

1. **Server-authoritative para todo lo que tenga valor.** Nivel, caramelos, objetos, premios de ranking y
   Nexus se calculan y se escriben **en el servidor** (route handler o función SQL `security definer` con
   identidad `auth.uid()`), nunca desde el cliente. El cliente solo pide y muestra. La regla práctica: si un
   jugador con la consola abierta puede darse a sí mismo +100 ATK, está mal diseñado.

2. **RLS por defecto y `auth.uid()` como identidad.** Nada de pasar `playerId` en el body y confiar. Toda
   tabla nueva nace con RLS activo y políticas explícitas. El patrón ya está en `094_weekly_leaderboards.sql`
   (acumulación por `auth.uid()`, premios en tabla de configuración editable desde admin): copiarlo.

3. **Idempotencia en cualquier cosa que otorgue recompensa.** Caramelo consumido, premio de ranking
   reclamado, objeto aplicado: todos necesitan una clave única que impida el doble gasto ante un doble clic o
   un reintento de red. El bug del ELO "0 → 1283" (documentado en memoria) salió justo de un camino
   idempotente mal cubierto.

4. **Determinismo del multijugador.** Ningún `instanceId` puede depender del contador del `idFactory`; solo de
   datos del estado. Y cualquier atributo nuevo que cambie una carta en combate (nivel, caramelo, objeto)
   **debe viajar en el mazo que el servidor sirve a los dos clientes**. Aquí hay una buena noticia, verificada:
   `get-match-session-data.ts` ya resuelve **los dos mazos** con `applyCardProgressionToCard` usando la
   progresión de cada propietario. Si el bonus de un objeto se aplica dentro de esa función, los dos clientes
   ven los mismos números sin tocar nada del transporte.

5. **Efectos data-driven, no cartas hardcodeadas.** Los efectos viven como JSON en `cards_catalog` y se
   parsean en `map-card-catalog-row-to-card.ts`. Una carta nueva con un efecto ya existente es una migración
   SQL, no código (ver ficha 5).

6. **Migraciones aditivas y aplicadas a mano.** `docs/supabase/sql/` es la fuente canónica; las migraciones
   **no se aplican solas** (ya nos mordió con la 045 y la 052). Aditivas siempre: nada de `drop column` en un
   paquete que va a producción con partidas vivas.

7. **Verificación real antes de commitear.** `CI=true pnpm quality:check` con exit code de verdad, y para lo
   que tenga superficie de juego, un test que **falle sin el arreglo**. Es lo que hicimos con el desync.

---

## 1. Estado real de cada idea (lo que ya hay hecho)

Antes de planificar conviene saber qué está ya medio hecho, porque cambia mucho el esfuerzo:

| # | Idea | Estado real verificado |
|---|------|------------------------|
| 1 | Compartir cartas en mensajes privados | **Casi hecho.** Falta solo el selector en el compositor del DM |
| 2 | Caramelos de nivel (+1…+5) | Solo diseño (`docs/fixes/2026-07-12-trampas-rankings-y-caramelos.md`) |
| 3 | Objetos/mejoras permanentes de ATK/DEF | Nada — pero **no es la refactorización que temes** (ver ficha) |
| 4 | Niveles hasta 100 + nueva curva | Existe hasta nivel 30, curva en dos ficheros pequeños |
| 5 | ¿Los efectos son agnósticos a valores/entidades? | **Sí, casi todos.** Respuesta detallada en la ficha |
| 6 | Diálogo de premio semanal de ranking | Backend hecho (premios y cierre), **falta todo el aviso al jugador** |
| 7 | Magia: atacar en defensa con el valor de DEF | Nada. Efecto nuevo, encaja en el motor sin refactor |
| 8 | VFX de OpenClaw "doblado" | **No es un bug del VFX** — el efecto resta el doble por diseño |
| 9 | UX de reemplazo con las 3 zonas llenas | El motor ya lo soporta; el problema es UI/UX y rendimiento móvil |
| 10 | Duelos por parejas (2v2) | Nada. Es la feature más cara del paquete |
| 11 | Ranking sin gente conectada | Nada. Problema de diseño, no de código |

---

## 2. Orden recomendado

No es el orden de tu lista: es el orden que minimiza retrabajo. Lo importante es que **las fichas 4, 2 y 3
comparten la misma tubería de progresión** y hay que hacerlas en ese orden o se pisan.

- **Paquete A — arreglos y remates baratos:** 1 (card share en DM), 8 (decisión OpenClaw), 6 (diálogo de
  ranking), 9 (UX de reemplazo). Valor inmediato, riesgo bajo, se pueden soltar ya.
- **Paquete B — la tubería de progresión (en este orden estricto):** 4 (curva a nivel 100) → 2 (caramelos) →
  3 (objetos). Cada uno se apoya en el anterior.
- **Paquete C — contenido de juego:** 5 (cartas nuevas por reconfiguración) y 7 (magia de ataque en defensa).
- **Paquete D — features grandes, decisión previa:** 11 (ranking sin rivales) y 10 (2v2). No empezar sin
  cerrar las preguntas del final.

---

## 3. Fichas

### Ficha 1 — Compartir cartas en los mensajes privados

**Estado.** Mucho más avanzado de lo que crees. `IDirectMessage` ya tiene `kind: "TEXT" | "CARD_SHARE"`, la
migración `095_direct_messages.sql` ya acepta ese `kind` en su `check`, `SendDirectMessageUseCase` ya lo mapea
y `DirectConversationClient` ya sabe **pintar** una carta compartida. Lo único que falta es el selector: el
componente `CommunityChatCardPicker` ya existe y está enganchado en el chat público, pero no en el DM.

**Pasos.**
1. Montar `CommunityChatCardPicker` en el compositor de `DirectConversationClient`, igual que en
   `CommunityChatClient` (botón + estado `isPickerOpen` + `handleShareCard`).
2. Comprobar que el envío pasa `kind: "CARD_SHARE"` y `metadata: { cardId }` hasta el repositorio.
3. Test del caso: enviar carta en DM y verla renderizada en la conversación del otro.

**Seguridad (lo importante de esta ficha).** El `metadata` de un mensaje **es entrada del usuario**. Dos reglas:
la **posesión de la carta se valida en el servidor** (¿el que comparte tiene realmente esa carta?), y la carta
que se pinta se **rehidrata del catálogo por `cardId`** (ya lo hace `reconstruct-shared-card.ts`), nunca se
renderizan stats o imágenes que vengan en el `metadata` del mensaje. Si no, un cliente modificado publica una
carta inventada con la imagen que quiera. Hay que revisar que `SendChatMessageUseCase`/`SendDirectMessageUseCase`
validen posesión — si el chat público hoy no lo hace, es un bug de seguridad existente y lo arreglamos aquí.

**Esfuerzo:** bajo (medio día).

---

### Ficha 2 — Caramelos de nivel (+1 a +5)

**Estado.** Diseñado, no implementado. Imagen entregada: `public/assets/story/USB_Token_Anime-removebg-preview.webp`
→ **USB Raro** (`candy-usb-raro`). Mover a `public/assets/items/` y renombrar al id.

**Decidido:** solo caramelos de +1 a +5 niveles. **Pueden llegar al nivel máximo** (de 95 a 100 con un +5). El
freno no es una regla, es la **escasez**: difíciles de encontrar y caros.

**Concepto clave.** Un caramelo **no otorga niveles: otorga XP**. Si otorga niveles directamente, tienes dos
fuentes de verdad para el nivel (XP acumulada y niveles regalados) y acabas con estados imposibles. El nivel
sale siempre de `resolveCardLevelFromTotalXp(totalXp)`. Un "caramelo +2" concede exactamente la XP que falta
para subir 2 niveles desde el nivel actual — se calcula con `getTotalXpRequiredToReachLevel`, en el servidor.

**Pasos.**
1. Migración `118`: catálogo de caramelos (`level_candies`: id, +niveles, precio, rareza) e inventario por
   jugador (`player_inventory_items`, con cantidad). RLS: cada jugador solo ve/gasta lo suyo.
2. Endpoint `POST /api/progression/candy/consume` con `{ candyId, cardId }`: valida posesión del caramelo y de
   la carta, calcula la XP objetivo, actualiza `player_card_progress` y descuenta el caramelo **en una
   transacción** (función SQL, no dos llamadas separadas desde TS).
3. Idempotencia: clave de operación (`operation_id` del cliente) para que un doble clic no gaste dos caramelos.
4. Tope: no se puede pasar del nivel máximo; el sobrante se descarta o no se permite consumir (decisión).
5. UI: en el detalle de carta del arsenal, "usar caramelo" + confirmación + animación de subida de nivel.

**Riesgo.** El clásico: cliente llama dos veces, servidor sube 4 niveles y descuenta 1 caramelo. Los pasos 2 y
3 son innegociables.

**Esfuerzo:** medio (2-3 días).

#### Hecho (2026-07-14): backend del USB Raro

**Cuánta XP concede un caramelo (la pregunta clave).** No es una cantidad fija: el caramelo se define en
NIVELES y la XP se calcula **en el momento de usarlo**, según dónde esté esa carta. Un "+2" concede la distancia
exacta entre el nivel actual y el nivel+2. Por eso el mismo USB Raro +2 cuesta **625 XP en el nivel 10 y 4.265 XP
en el nivel 80** — casi 7 veces más. Es lo que hace que el objeto valga más cuanto más alta esté la carta; con XP
fija sería inservible en el tramo alto. También conserva el progreso parcial del nivel en curso (no se tira medio
nivel) y avisa de los niveles que se desperdiciarían al pasarse del 100.

**🔴 Hallazgo grave al aplicar la 120: la base de datos tenía `CHECK (level <= 30)`.** No estaba documentado en
ningún sitio. Sin ampliarlo, la ficha 4 estaba **coja**: la primera carta que superara el nivel 30 habría
reventado al guardar, en producción y sin aviso. La 120 lo sube a 100. Lección: al cambiar una regla de dominio,
buscar también sus copias en la BD (checks, defaults, funciones), no solo en el código.

**Seguridad.** El cliente solo manda `{candyId, cardId, operationId}`; la XP la calcula el servidor con la curva
y la escritura es una función SQL transaccional que valida la posesión, descuenta el caramelo y es idempotente
(la clave de operación impide que un doble clic gaste dos). Verificado en producción: `authenticated` **no puede
insertar** en `player_inventory_items`, así que nadie se regala caramelos desde la consola del navegador.

**Sección de Objetos (2026-07-15), decisión de UX del owner:** los objetos NO van como un tipo/filtro más —no
son cartas—, sino como una **sección propia** con su botón:
- **Mercado:** conmutador Cartas / Objetos en la cabecera (iconos Layers / Package). En Objetos se ocultan los
  filtros de carta y se muestra `MarketItemsPanel` (comprar USB Raro). El USB Raro ya se compra aquí.
- **Arsenal:** mismo conmutador junto al título. En Objetos, la Scene cambia todo el workspace por
  `ArsenalObjectsView`: eliges objeto → eliges carta (solo Entity, que son las que suben ATK/DEF) → "Usar
  objeto". El nivel lo calcula el servidor y se refleja al momento en la progresión del arsenal.

Nota de implementación: el conmutador se pasa como slot `ReactNode` para no acoplar el tipo de sección por todo
el árbol del deck-builder (que tiene 3 variantes responsive de la barra de filtros).

---

### Ficha 3 — Objetos/mejoras permanentes (+100 ATK, etc.)

**Tu intuición era que esto es "toda una refactorización del motor". Buena noticia: no lo es.**

Verificado: existe un único punto por el que pasan todas las cartas antes de entrar en combate,
`applyCardProgressionToCard` (`src/services/game/apply-card-progression-to-card.ts`), que ya coge la fila de
progresión del jugador y devuelve la carta con el ATK/DEF/coste ajustados. Lo usan story, arena, tutorial y —
lo más importante — `get-match-session-data.ts` lo aplica a **los dos mazos** del multijugador con la
progresión de cada propietario. El motor de combate nunca sabe de dónde salen los números: recibe la carta ya
resuelta. **Un objeto es una fuente más de bonus dentro de esa función.** El motor no se toca.

**Imágenes entregadas (2026-07-14).** Mover a `public/assets/items/` y renombrar al id:
- `Placa_Base_Anime-removebg-preview.webp` → **Placa Blindada** (`item-placa-blindada`), objeto de **DEFENSA**.
- `megustav-removebg-preview.webp` (chip con rayo) → **Núcleo Overclock** (`item-nucleo-overclock`), objeto de
  **ATAQUE**.

**Pasos.**
1. Migración: catálogo de objetos (`card_upgrade_items`: id, stat `ATTACK|DEFENSE`, valor, precio,
   límite) y objetos aplicados por carta (`player_card_upgrades`: playerId + cardId + itemId + cantidad).
2. Extender `IPlayerCardProgress` con los bonus agregados (`upgradeAttackBonus`, `upgradeDefenseBonus`) y que
   el repositorio los traiga ya sumados. **Sumados en la lectura, no recalculados en cada capa.**
3. Sumar esos bonus en `applyCardProgressionToCard`, junto a los de nivel. Ahí acaba el trabajo de motor.
4. Endpoint transaccional de aplicación del objeto (mismas reglas de idempotencia y posesión que la ficha 2).
5. **Tope por carta** — ver el modelo de abajo. Es la pieza que decide si el multijugador sobrevive al paquete.
6. Mostrar en la UI el desglose (base + nivel + objetos + cuánto margen queda), para que el jugador entienda de
   dónde sale el número y qué le falta para el tope.

#### El modelo de topes (esto es lo que hay que decidir bien)

Tu propuesta era un tope absoluto por coste (3→2000, 4→2200, 5→2400, 6→2400). **Con los datos reales del
catálogo, ese tope se come los niveles altos**, que es justo lo que temías:

| Coste | ATK base máx. hoy | + niveles (+750) | Tu tope | Resultado |
|---|---|---|---|---|
| 3 | 1250 | 2000 | 2000 | justo, sin margen para objetos |
| 4 | 1600 | **2350** | 2200 | **se pasa solo con niveles** |
| 5 | 1900 | **2650** | 2400 | **se pasa solo con niveles** |
| 6 | 2000 | **2750** | 2400 | **se pasa solo con niveles** |

Una carta de coste 4 con 1600 de ATK llegaría al tope hacia el nivel 60 y **los 40 niveles siguientes no darían
nada**. Eso es exactamente lo que los juegos evitan: *el progreso ganado jugando nunca se recorta*.

**Cómo lo hacen los juegos profesionales:** el tope no limita la progresión ganada, limita la **comprada**. El
nivel es una recompensa por jugar y siempre paga; los objetos son poder de pago/economía y **rellenan el margen
que queda hasta el techo**. La fórmula:

```
techo(carta, stat) = base + 750 (niveles, garantizado) + presupuesto_objetos(coste_base)
margen_objetos_disponible = techo − (base + bonus_de_nivel_actual)
```

Con un presupuesto de objetos **decreciente por coste**:

| Coste base | Presupuesto de objetos (por stat) |
|---|---|
| 2 | +600 |
| 3 | +500 |
| 4 | +400 |
| 5 | +300 |
| 6 | +200 |

**Esto te da exactamente lo que buscabas**, y de forma que se equilibra sola: la carta barata es la que más se
puede mejorar, así que "cartas con poca energía y valores altos" se convierte en una estrategia real y no en un
accidente. Una entity de coste 2 (800 ATK hoy) puede acabar en 800+750+600 = **2150 ATK por 2 de energía** — muy
fuerte, pero con un techo conocido y con un coste de grindeo enorme. Una de coste 6 casi no gana nada por
objetos, porque ya nace fuerte.

Además: el presupuesto de objetos se calcula sobre el **coste base** (por la trampa del -1 de energía a nivel 50,
ficha 4), y el tope se aplica **al guardar la mejora**, en el servidor, no al pintar la carta. Si el tope solo
existe en la UI, un cliente modificado lo salta.

**Sobre el *power creep*:** aun con topes, un veterano con cartas a nivel 100 y objetos aplasta a un novato. Las
dos mitigaciones estándar que hay que meter en el diseño desde el principio: **coste creciente** de cada mejora
sucesiva (la 5ª cuesta mucho más que la 1ª) y **emparejamiento por poder** en multi/ranking, no solo por ELO.

**Esfuerzo:** medio-alto (4-5 días) — casi todo economía, UI y balance; el motor es una línea.

#### Hecho (2026-07-15)

Confirmado que la intuición del owner era correcta: **el motor no se tocó**. Los bonus de objetos se suman en
`applyCardProgressionToCard` junto a los de nivel, y ya está. Piezas:
- **Regla del tope refinada:** los objetos aportan **hasta `presupuesto(coste)` por stat, de forma plana**
  (600/500/400/300/200 de coste 2 a 6), no "el margen que deja el nivel". Es más intuitivo y respeta el mismo
  techo absoluto `base + 750 + presupuesto`. Vive en `card-upgrade-rules.ts` y, espejada, en la función SQL
  `card_upgrade_budget` (mantener en sync).
- **Migración 123 (aplicada):** catálogo `card_upgrade_items` (Núcleo Overclock +100 ATK / Placa Blindada +100
  DEF, 2000 Nx), tabla `player_card_upgrades` (bonus agregado por carta) y RPC `buy_card_upgrade_item` /
  `apply_card_upgrade`, transaccionales e idempotentes. **El tope se valida en la RPC** (server-authoritative);
  verificado en prod que el jugador no puede escribir la tabla.
- **Mercado:** la sección Objetos ahora tiene dos grupos — Caramelos y Mejoras de atributos.
- **Arsenal:** la sección Objetos aplica ambos: eliges objeto → carta → "Usar". Muestra el margen restante y las
  stats ya con nivel+mejora en la miniatura.
- **Multijugador:** `get-match-session-data` resuelve los DOS mazos con progresión **y mejoras**, así que ambos
  clientes ven idénticos los stats mejorados. Sin esto, un objeto habría desincronizado el combate.

**Pendiente de diseño (no bloquea):** coste creciente por mejora sucesiva y emparejamiento por poder. Hoy cada
mejora cuesta lo mismo (2000 Nx) hasta el tope. Es fácil de subir cuando decidas la curva de precio.

#### Rediseño de UX de objetos (2026-07-15)

A petición del owner, el flujo de usar objetos cambió para ser más claro:
- **Almacén de objetos = SOLO objetos** (con su imagen), no cartas. Entrar por el conmutador muestra el
  inventario; para usar un objeto hay que venir desde una carta.
- **Botón "Equipar objeto"** en el detalle de la carta (`HomeCardInspector`, solo Entity). Lleva a la sección
  Objetos con esa carta como objetivo.
- Al elegir el objeto se aplica y salta una **cinemática** (`ArsenalObjectApplyOverlay`, misma familia que la
  evolución): la carta con glow y el cambio resaltado ("Nivel 12 → 14" / "+100 ATAQUE"), con su sonido.
- **Comprar objetos** reutiliza el flotante "-N NX" (`MarketNexusSpendFloat`) y el sonido `BUY_CARD`, igual que
  las cartas. Mercado y almacén muestran la imagen de cada objeto.

Plumbing: `onEquipSelectedCard` viaja por las props del workspace (como `onEvolveSelectedCard`); el conmutador de
sección sigue siendo una función de render. El objetivo se limpia al volver a Cartas.

---

### Ficha 4 — Niveles hasta 100 y nueva curva de bonus

**Estado.** `card-level-rules.ts` tiene `MAX_CARD_LEVEL = 30` y la curva de XP por tramos.
`card-level-bonus-rules.ts` tiene los bonus actuales (nivel 5: +100 ATK; 10: +100 DEF; 20: +200/+200; 30: -1
energía). Los dos son pequeños y puros, con tests. La subida a 100 es **cambiar dos ficheros**, y el resto del
sistema (barra de progreso, glosario, escalado de rivales de entrenamiento) lo consume ya.

**La curva acordada y su aritmética.** Hitos cada 5 niveles, ciclo `+50 ATK → +100 ATK → +50 DEF → +100 DEF`.
En 100 niveles son **20 hitos = 5 ciclos**, es decir **+750 ATK y +750 DEF acumulados** al llegar a 100. Más
**-1 de energía en el nivel 50** e **imagen alternativa en el 100**.

**Pasos.**
1. Reescribir la tabla de bonus como **datos** (lista de hitos `{ nivel, atk, def, energia }`), no como cadena
   de `if`. Con 20 hitos, los `if` actuales son inmantenibles; una tabla se lee de un vistazo y se testea sola.
2. Extender la curva de XP hasta 100 y comprobar que `getMaxTotalXpForCardLeveling` da un número alcanzable
   jugando (si no, el nivel 100 es decorativo). Conviene fijar el objetivo al revés: decidir cuántas horas debe
   costar llegar a 100 y derivar la XP de ahí.
3. **Compatibilidad:** la nueva curva **solo extiende**, dejando intactos los tramos 0-30. Nadie pierde ni gana
   nivel de golpe. (Nota: los bonus de los primeros hitos cambian respecto a los actuales —hoy el 5 da +100 ATK y
   pasará a dar +50—, así que algunas cartas de los testers **bajarán de estadísticas**. Hay que asumirlo y
   comunicarlo, o respetar los bonus viejos hasta el 30 y aplicar la curva nueva del 30 en adelante.)
4. **La energía a nivel 50 tiene una trampa:** si una carta de coste 4 pasa a costar 3, y los topes son por
   coste, su tope cambiaría al subir de nivel. **El tope se calcula siempre sobre el coste BASE de la carta**,
   nunca sobre el coste efectivo. Es el tipo de detalle que, si se olvida, se descubre en producción.
5. Imagen de nivel 100: columna nueva en `cards_catalog` (p.ej. `render_file_max_level`) con **fallback** a la
   imagen normal cuando esté vacía. Así queda configurado hoy y se suben las imágenes cuando existan.
6. Revisar `training-card-scaling.ts`: los rivales de entrenamiento escalan por nivel, así que subir el techo a
   100 les cambia la dificultad sin querer.

**Esfuerzo:** bajo-medio (2 días).

#### Hecho (2026-07-14) — con dos consecuencias que hay que mirar

La curva vive ahora como **tabla de datos** (`CARD_LEVEL_MILESTONES`), no como cadena de `if`, y el Códex lee
esa misma tabla, así que no puede quedarse mintiendo si se retoca. Migración 119 (`render_url_max_level`)
aplicada: el arte de nivel 100 se intercambia en `applyCardProgressionToCard` y **cae al render normal mientras
no haya imagen**, así que el sistema está listo aunque las imágenes no existan.

**Lo que cuesta de verdad llegar** (para una carta que se usa a fondo, ~90 XP por combate):

| Nivel | XP total | Combates aprox. |
|---|---|---|
| 30 (tope viejo) | 17.050 | ~190 |
| 50 (−1 energía) | 47.950 | ~530 |
| 100 (arte nuevo) | 149.800 | ~1.660 |

Los tramos hasta el 30 son los originales (nadie pierde progreso), y del 30 en adelante la curva se aplana a
propósito: con el ritmo anterior el nivel 100 habría costado cientos de miles de XP y habría sido decorativo.
Son constantes en una tabla: si te parece mucho grind, se tocan en un minuto.

**⚠️ Efecto colateral en los rivales de story/arena (decisión tuya).** Los rivales escalan con las MISMAS reglas
que el jugador y tienen niveles fijos (EASY 0, NORMAL 2, HARD 10, BOSS 20, MASTER/MYTHIC 30). Con la curva nueva:
- pierden defensa (un rival a nivel 20 tenía +300 DEF y ahora tiene +150),
- y **pierden el descuento de energía** (estaba en el nivel 30, ahora está en el 50), así que sus cartas cuestan
  1 más.

O sea que **story y arena se han vuelto un poco más fáciles**. No lo he tocado porque es balance, no un bug: si
quieres dejarlo como estaba, basta subir los niveles de la tabla `TRAINING_SCALE_BY_DIFFICULTY`
(`training-card-scaling.ts`) — con nivel 40 se recuperan los +300/+300 de antes.

---

### Ficha 5 — ¿Son los efectos agnósticos a valores y entidades? (respuesta)

**Sí, casi todos. Concretamente:**

Los efectos se guardan como JSON en `cards_catalog.effect` y se parsean en `map-card-catalog-row-to-card.ts`.
Los handlers del motor (`trap-effect-registry.ts`, `execution-effect-registry.ts`) leen `effect.value`,
`effect.turns`, `effect.target`… de ese JSON. Es decir: **bajar el Escudo TypeScript de su valor actual a 500 es
una migración SQL de una línea, cero código.**

Y sobre "hacer otra carta igual pero para otra entity": el Escudo TypeScript usa
`REINFORCE_LINKED_ENTITY_ON_ATTACK`, cuyo efecto lleva `linkedCardId` — la entidad ligada es **un parámetro**, no
está hardcodeada. Otra carta que refuerce a otra entity distinta es, otra vez, solo una fila nueva en el catálogo.

**Las dos excepciones a tener en cuenta:**
- `DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN` tiene el "10" en el nombre y en el código: ese sí está
  hardcodeado. Si alguna vez quieres una versión con otro número, hay que parametrizarlo.
- Los VFX y los textos se eligen por **`action`**, no por valor: una carta nueva con un `action` existente hereda
  el VFX automáticamente (bien), pero una carta con un `action` nuevo necesita su VFX (trabajo de front).

**Recomendación:** aprovechar esto para el contenido nuevo. Las cartas que son "lo mismo con otro número u otra
entity ligada" no deberían costar más que una migración y su entrada en el glosario.

---

### Ficha 6 — Diálogo del premio semanal de ranking

**Estado.** El backend está: `094_weekly_leaderboards.sql` tiene reglas de puntos, tabla de premios por puesto
(1º 1000 Nexus, 2º 600, …), cierre semanal por `pg_cron` los domingos a las 22:00 UTC e historial con
`awarded_nexus`. Lo que **no existe** es que el jugador se entere: no hay ningún consumidor de
`weekly_leaderboard_history` en el cliente. Hoy ganas el ranking, se te acreditan los Nexus y nadie te lo dice.

**Pasos.**
1. Endpoint `GET /api/progression/weekly-prize/pending`: devuelve el premio de la última semana cerrada que el
   jugador aún no ha visto (puesto, tablero, Nexus).
2. Añadir a `weekly_leaderboard_history` una marca de "visto" (`seen_at`), y un `POST .../ack` para marcarla.
   Es lo que evita que el diálogo salga en bucle cada vez que entra al hub.
3. Reutilizar el patrón de `DailyLoginProvider` + `DailyLoginModal` (ya existe y ya resuelve el "mostrar una vez
   al entrar al hub"): un `WeeklyPrizeProvider` gemelo. No inventar un mecanismo nuevo.
4. Copy claro: tablero (Actividad / Comercial), puesto y premio.

**Ojo:** el premio ya está acreditado por el job; el diálogo **solo informa**. No debe otorgar nada — si el
diálogo pagara, un jugador podría cobrarlo N veces recargando.

**Esfuerzo:** bajo (1 día).

---

### Ficha 7 — Magia: que una entity en defensa ataque con su DEF

**Estado.** No existe. Es un efecto nuevo, y encaja limpio en el motor actual.

**Pasos.**
1. Nuevo `action` de ejecución, p.ej. `ALLOW_DEFENSE_MODE_ATTACK`, con selección de objetivo propio (ya hay
   `pendingTurnAction` de selección de entity propia: `createOwnEntityToSacrificeSelectionPendingAction` es el
   patrón a copiar).
2. Marca **efímera** en la entidad (`canAttackFromDefenseThisTurn: true`), que se limpia al terminar el turno
   junto al resto de flags (`resetEntitiesForNewTurn`).
3. Tocar dos sitios del combate, y solo dos: `validateAttackerEntity` (hoy exige `mode === "ATTACK"`) y el
   cálculo de daño, para que use `card.defense` como estadística ofensiva cuando la marca esté puesta.
4. Reglas a decidir: ¿la entidad sigue defendiendo con DEF si la atacan ese turno (sí, recomendado)? ¿Puede
   atacar directamente? ¿Se marca visualmente en el tablero (obligatorio, si no el jugador no entiende nada)?
5. Tests: ataque desde defensa contra entity y directo; que la marca no sobrevive al turno; que el rival lo ve
   igual en multi.

**Esfuerzo:** medio (2 días). Es la carta más "nueva" del paquete a nivel de reglas.

**Imagen ya entregada (2026-07-14):** `public/assets/renders/executions/Escudo-Firewall-Ofensivo-Carta-Tech.webp`.
Dos cosas antes de usarla:
- **Nombre:** la convención es `/assets/renders/executions/{card-id}.webp` (el render se resuelve por el id de
  la carta). Habrá que renombrarla al id que le demos, p. ej. `exec-escudo-firewall-ofensivo.webp`.
- **Peso y dimensiones:** 745 KB y **4864×3328 px**, apaisada. La mediana de los renders de ejecución es
  ~145 KB, y una carta no necesita más de ~1000 px de alto. Reescalar y recomprimir antes de subirla (el
  proyecto ya arrastra renders de hasta 12 MB; no añadamos otro).

---

### Ficha 8 — El VFX de OpenClaw [DECIDIDO: es un bug de presentación]

**Decisión (2026-07-14): el efecto se queda como está; se arregla lo que se muestra.**

La intención del efecto es "bloquea el aumento y además le resta ese mismo valor", así que restar el doble de la
estadística es correcto. Lo que está mal es el número que se enseña: con un buff de +400 debe salir **-400**
(el aumento bloqueado), no -800.

**Cómo se arregla, sin tocar el balance.** Hoy `NULLIFY_OPPONENT_BUFF` mete en el resultado
`buffAmount: -penalty` (el delta bruto de la estadística, -800) y `trap-logging` lo copia tal cual al evento
`STAT_BUFF_APPLIED`, que es lo que leen el VFX y el registro de combate. La corrección es **separar el valor
aplicado del valor mostrado**: el motor sigue restando `2 * buffAmount`, pero el evento de log lleva
`-context.buffAmount` (-400).

Comprobado que esto es seguro: `STAT_BUFF_APPLIED` **solo se consume para pintar** (`banner-and-delta.ts`,
`boardCombatFeedback.ts`, `effect-targeted-overlay-logic.ts`, `format-combat-log-event.ts`). Ningún cálculo del
motor lee ese evento para derivar estadísticas, así que cambiar el número mostrado no puede desviar la partida
ni romper el determinismo de multi. Aun así, hay que dejarlo **comentado en el código**, porque un campo que
dice "amount" y no coincide con el delta real es justo el tipo de trampa en la que cae el siguiente que lo lea.

Test: con un buff de +400, la entidad rival acaba 400 por debajo de su base **y** el evento de log dice -400.

---

### Ficha 9 — UX de reemplazo con las 3 zonas de magia/trampa llenas

**Estado.** El motor ya lo soporta (`playCardWithZoneReplacement`, acción `PLAY_CARD_REPLACE_ZONE`). El problema
es de interacción y de rendimiento en móvil, como bien dices.

**Lo que estaba realmente mal (hecho 2026-07-14).** Al abrir el código, el problema no era el que parecía. El
motor y el resaltado ya funcionaban; lo que fallaba era esto:

1. **No se podía cancelar.** El modo reemplazo se anunciaba con el banner de "acción obligatoria", que **se
   autooculta a los 3,5 segundos y no tiene botones**. Si el jugador se lo pensaba, se quedaba con tres cartas
   brillando, sin instrucción a la vista y sin salida: la única forma de abortar era elegir una carta y decir
   "No" en la confirmación. De ahí la sensación de que "cuesta". Ahora tiene barra propia
   (`ZoneReplacementBar`), persistente mientras dure el modo y con **botón de cancelar**.
2. **El tirón de móvil tenía nombre:** el resaltado usaba `animate-pulse` **en la misma capa que la carta**, que
   contiene el holograma y el arte. Cada frame del latido repintaba la carta entera, y con tres resaltadas a la
   vez el coste se multiplicaba. Ahora el aro es estático y el latido vive en una **capa vacía aparte** que solo
   anima opacidad (se compone en GPU, sin repintar nada). En modo rendimiento no late. Mismo arreglo aplicado al
   resaltado rojo del atacante, que tenía el mismo defecto.
3. **`backdrop-blur` a pantalla completa** en la confirmación: de lo más caro que se le puede pedir a un móvil, y
   solo aportaba 1,5 px de desenfoque. Sustituido por un velo opaco, que da el mismo contraste gratis.
4. Confirmación rediseñada: botones de 48 px apilados a ancho completo en móvil (es una acción destructiva:
   fallar el toque significa descartar la carta equivocada) y copy explícito ("No se puede deshacer").

**Pendiente de validar:** la mejora de rendimiento es por construcción (menos repintado, sin filtro de
desenfoque), pero **no está medida en un móvil real**. Hay que abrir el tablero en un dispositivo, llenar la
zona y comprobar que el tirón desapareció.

---

### Ficha 10 — Duelos por parejas (2v2)

**Es, con diferencia, la feature más cara del paquete, y quiero ser claro: no es "simplemente saltar turnos".**

Lo que hoy da por sentado el código: `GameState` tiene exactamente `playerA` y `playerB`; cada cliente se sienta a
sí mismo en `playerA`; `getPlayerPair` devuelve *el* jugador y *el* oponente; todos los efectos razonan sobre "mi
oponente" en singular; y `animate-remote-action` asume un único rival (`state.playerB.id`). Un 2v2 rompe esa
suposición **en todo el motor**, no en un módulo.

Las dos opciones que planteas, con su coste real:
- **(a) Mismo tablero, turnos alternos entre 4 jugadores.** Más barato, pero sigue requiriendo pasar de 2 a 4
  asientos en `GameState`, redefinir "oponente" (¿a quién ataco?, ¿a quién afecta un efecto que "daña al rival"?)
  y reescribir el transporte de Realtime para 4 clientes. Semanas, no días.
- **(b) Tablero especial con 4 ranuras.** Aún más caro: además de lo anterior, cambia la UI del tablero entera y
  el balance de todas las cartas de área.

**DECIDIDO (2026-07-14): el 2v2 sale de este paquete y tendrá su propia release.** No se toca nada de 2v2 en
v1.15. Cuando llegue su momento, el paso 0 es un **ADR** (`docs/adr/`) que decida el modelo de asientos
(2 vs 4 en `GameState`) antes de escribir una sola línea, porque esa decisión condiciona todo lo demás.

---

### Ficha 11 — Subir de ranking sin gente conectada

**Cómo lo resuelven los juegos profesionales.** Tu instinto es correcto, y la técnica tiene nombre: **"ghost
decks" / defensa asíncrona**. Es exactamente lo que hacen Clash Royale (modo entrenamiento con mazos reales),
Hearthstone (Battlegrounds usa bots con mazos de jugadores), y sobre todo los *arena* de Supercell y los
*asynchronous PvP* de los juegos de cartas móviles: **tú atacas, la IA pilota el mazo del defensor, y el defensor
no está conectado**.

Y tu propia objeción también es correcta: **la IA juega peor que un humano, así que atacar es más fácil que
defender**. Los juegos profesionales lo resuelven así, y esto es lo que hay que copiar:

**Reglas de puntuación acordadas (2026-07-14):**

1. **Asimetría a favor del riesgo.** Ganar a un ghost da **menos** puntos que ganar a un humano vivo (la IA juega
   peor: pagar lo mismo sería regalar ranking). **Perder contra un ghost SÍ resta puntos**, y resta lo mismo que
   perder contra un humano. Así el ghost no es dinero gratis: es una apuesta con ventaja, y el jugador se lo
   piensa.
2. **El dueño del ghost no gana ni pierde nada.** No está jugando, así que no puntúa; y tampoco baja de ranking
   mientras duerme. Su mazo solo sirve de rival.
3. **Anti-farmeo (imprescindible, y es lo que se olvida siempre).** Como ganar da puntos y el rival es una IA, sin
   frenos esto es una máquina de farmear ranking. Tres frenos, los tres estándar: **el servidor elige el rival**
   (el jugador no escoge a quién atacar, o buscaría siempre al más débil), **límite diario** de combates contra
   ghosts que puntúan, y **rendimientos decrecientes** a partir de cierto número.
4. **Tope de ranking por ghosts** (opcional pero recomendado): a partir de cierta liga, solo puntúan los humanos.
   Así el top del ranking sigue significando algo.
5. **Compensar la torpeza de la IA** subiendo el perfil heurístico del ghost (ya tienes perfiles parametrizados en
   `difficultyProfiles.ts`) y/o dándole una ventaja pequeña y **visible** (más LP iniciales). Visible es la
   palabra: las ventajas ocultas destruyen la confianza del jugador.

**Superficie de seguridad.** El mazo del defensor es dato de otro jugador: se sirve **desde el servidor**, ya
resuelto, y solo la parte pública (cartas del mazo). No exponer su inventario, su progresión completa ni su
identidad más allá del nick/avatar. Y los puntos de ranking los otorga el servidor al cerrar el combate, con el
resultado validado — nunca el cliente diciendo "he ganado".

**Esfuerzo:** medio-alto (4-6 días). La mayor parte es diseño de puntuación, no código: el motor de IA y los
perfiles de dificultad ya existen y `get-match-session-data.ts` ya sabe resolver el mazo de otro jugador.

---

## 4. Decisiones

**Cerradas (2026-07-14):**

1. **OpenClaw:** el efecto (restar el doble) es correcto; se arregla **solo el número mostrado** → -400, no -800.
2. **Objetos:** hay tope. Modelo = `base + 750 (niveles, siempre se pagan) + presupuesto de objetos por coste
   base` (600/500/400/300/200 de coste 2 a 6). Los niveles nunca se recortan; los objetos rellenan el margen.
3. **Niveles:** hasta 100, hitos cada 5 con el ciclo +50 ATK / +100 ATK / +50 DEF / +100 DEF (total +750/+750),
   -1 energía a nivel 50, imagen alternativa a nivel 100 (configurada, con fallback).
4. **2v2:** fuera del paquete, release propia.
5. **Ghosts:** modelo asimétrico. Ganar al ghost da menos que ganar a un humano; **perder contra el ghost sí
   resta**; el dueño ausente no gana ni pierde nada.

6. **Curva nueva y testers:** se asume la bajada de estadísticas de las cartas ya subidas. La curva nueva es
   **la única** curva (no se respeta la vieja hasta el 30). Hay que **comunicarlo a los jugadores** y explicarlo
   en el glosario.
7. **Caramelos:** solo de +1 a +5 niveles. **Pueden llegar al nivel máximo** (un jugador a nivel 95 puede usar
   un +5 y ponerse a 100). El freno no es una regla: es la **escasez** — difíciles de encontrar y caros.

## 5. Estado de implementación

| Fase | Ficha | Estado |
|---|---|---|
| A | 8 · OpenClaw muestra -400 | ✅ hecho |
| A | 1 · Compartir carta en DM | ✅ hecho (+ **agujero de seguridad de CARD_SHARE cerrado**, ver abajo) |
| A | 6 · Diálogo de premio semanal | ✅ hecho · migración 118 **aplicada a producción** (2026-07-14) |
| A | 9 · UX de reemplazo de zona | ✅ hecho · ⚠️ el rendimiento en móvil hay que confirmarlo en un dispositivo real |
| B | 4 · Niveles a 100 | ✅ hecho · migración 119 **aplicada** (2026-07-14) · ⚠️ ver "rivales" abajo |
| B | 2 · Caramelos (USB Raro) | ✅ **hecho de punta a punta**: backend, sección Objetos en Mercado (comprar) y en Arsenal (usar sobre una carta). Migraciones 120/121 aplicadas |
| — | 🔒 Tablas de valor escribibles por el cliente | ✅ **CERRADO** (migración 122 aplicada + service-role) |
| B | 3 · Objetos ATK/DEF | ✅ hecho: backend + tope server-side + compra (Mercado) + aplicar (Arsenal) + combate MP. Migración 123 **aplicada** |
| C | 5 · Cartas por reconfiguración | ⏳ pendiente |
| C | 7 · Magia de ataque en defensa | ⏳ pendiente |
| D | 11 · Ghost decks | ⏳ pendiente |
| — | 10 · 2v2 | ❌ fuera del paquete (release propia) |

**Documentación de cara al jugador:** toda regla nueva de juego (curva de niveles, caramelos, objetos, topes,
carta de ataque en defensa) tiene que acabar en el glosario de la Academia
(`src/components/hub/academy/glossary/glossary-content.ts`, y las descripciones técnicas en
`effect-catalog-data.ts`). Una regla que el jugador no puede consultar no existe.

### Migración 118 aplicada a producción (2026-07-14)

`118_weekly_prize_seen.sql` (columna `seen_at` + índice + función `ack_weekly_prizes`) está **aplicada**.
Verificado tras aplicarla: columna e índice creados, la función es `security definer` y `authenticated` puede
ejecutarla (filtra por `auth.uid()`, así que nadie puede marcar premios ajenos).

**Decisión tomada: NO se marcó como visto lo antiguo.** La semana `2026-W28` ya estaba cerrada con **10 premios
repartidos** que ningún jugador llegó a ver. Se dejan pendientes de avisar a propósito: son Nexus reales que ya
están en sus carteras y merecen enterarse. El coste es cosmético (el aviso menciona una semana pasada).

**Cómo validarlo sin esperar al domingo:** la cuenta del owner tiene premio pendiente en ese archivo (3.º de
Actividad, 575 pts, +350 Nexus). Basta entrar a `/hub` y el diálogo salta. Para repetir la prueba:
`update public.weekly_leaderboard_history set seen_at = null where player_id = '<id>';`

### 🔒 CERRADA (2026-07-15): el jugador podía escribir sus tablas de valor

Encontrada al verificar los permisos de la tienda de objetos. **Preexistente, no la introdujimos nosotros.**
Alcance real (más ancho que la cartera): con un `PATCH`/RPC directo a Supabase desde la consola, un jugador
podía darse **Nexus infinitos** (`player_wallets`), **regalarse cualquier carta** (`player_collection_cards`) y
**ponerse todo a nivel 100 / V5** (`player_card_progress`). Además, las RPC `wallet_credit_nexus` /
`wallet_debit_nexus` no eran `security definer` y estaban al alcance de `authenticated`, así que la puerta seguía
abierta aunque se cerrara la policy.

**Arreglo aplicado:**
- Los tres repositorios (cartera, colección, progresión) **escriben con service-role** vía
  `resolve-privileged-write-client.ts` (leen con la sesión). El `playerId` sigue saliendo siempre de la sesión.
- Migración 122: `drop` de las policies de INSERT/UPDATE + `revoke` de esos permisos a `authenticated`, y
  `revoke execute` de las RPC de cartera (solo `service_role`). Al jugador le queda el `select` de sus filas.
- Verificado en producción tras aplicar: `authenticated` ya no puede escribir ninguna de las tres ni ejecutar
  las RPC; la lectura sigue OK.
- Test de regresión (`privileged-writes.test.ts`) que falla si alguien vuelve a escribir con el cliente de
  sesión — comprobado que caza el revert.

Las tablas de arena/multijugador que tienen permisos pero **ninguna policy de escritura** están de hecho
protegidas (RLS activo deniega por defecto); se revisaron y no requieren cambios.

<details><summary>Detalle histórico del hallazgo</summary>

`player_wallets` tiene RLS con esta policy:

```
player_wallets_update_own | UPDATE | using (auth.uid() = player_id) with check (auth.uid() = player_id)
```

y `authenticated` tiene el `GRANT UPDATE`. Es decir: **un jugador logueado puede hacer un `PATCH` directo a la
API REST de Supabase sobre su propia fila y ponerse los Nexus que quiera**, desde la consola del navegador. Con
eso se compra el catálogo entero, packs y caramelos incluidos. La economía del juego no existe.

**Por qué no se puede arreglar borrando la policy (todavía).** El servidor cobra y paga usando el **cliente de
sesión del jugador** (`createPlayerRouteRepositories` / `createPlayerRuntimeRepositories` construyen
`SupabaseWalletRepository` con el cliente de la sesión), así que **depende de esa policy** para poder escribir.
Si se revoca sin más, dejan de funcionar la compra de cartas, los packs, las recompensas de historia, el ELO de
multijugador y las misiones.

**Plan de arreglo (una tarea propia, antes de publicar el paquete):**
1. Que TODA escritura de cartera pase por el cliente de **service-role** (servidor) o por funciones SQL
   `security definer` — como ya hace la compra de objetos (`buy_level_candy`), que no depende de la policy.
2. Entonces sí: `drop policy player_wallets_update_own` (y la de INSERT) y `revoke insert, update on
   player_wallets from authenticated`. Dejar solo `select` de la propia fila.
3. Repasar el resto de tablas con dinero/valor por el mismo patrón: `player_collection`, `player_card_progress`,
   `training_progress`… Si `authenticated` puede escribirlas directamente, el problema es el mismo (una carta
   regalada vale tanto como el Nexus que cuesta).
4. Test de regresión: intentar el `PATCH` directo con una sesión de jugador y comprobar que la BD lo rechaza.

</details>

### Vulnerabilidad encontrada y cerrada al hacer la ficha 1 (CARD_SHARE)

Al ir a enchufar el selector de cartas en el DM se descubrió que **el chat de comunidad ya tenía un agujero en
producción**, y montar el DM encima lo habría extendido a los privados:

- `reconstructSharedCard` pintaba la carta compartida **entera desde la metadata del mensaje** (nombre, ATK,
  DEF y, lo grave, `renderUrl` y `bgUrl`), y las rutas guardaban esa metadata **sin validar nada**
  (`input.metadata ?? {}`).
- Impacto: un cliente modificado podía publicar una carta inventada con las estadísticas que quisiera y, sobre
  todo, **apuntar la imagen a una URL externa arbitraria** que se cargaría en el navegador de todo el que
  abriera el chat (pixel de rastreo con las IPs de los jugadores, o imagen ofensiva).
- Además, `validateChatMessageInput` aceptaba `kind: "SYSTEM"` **del cliente**: cualquiera podía publicar
  mensajes que se pintan como avisos oficiales del sistema.

**Arreglo:** del cliente solo se acepta el `cardId`. La instantánea de la carta la construye el servidor
(`src/services/chat/build-card-share-metadata.ts`) desde la colección y la progresión reales del jugador, lo
que además **valida la posesión** (no puedes compartir una carta que no tienes). Y las rutas solo admiten
`TEXT` o `CARD_SHARE`. Cubierto con tests.

## 6. Definition of done común

Ninguna ficha se da por cerrada sin: tests que fallan sin el cambio; `CI=true pnpm quality:check` en verde;
migración escrita en `docs/supabase/sql/` **y aplicada** a producción con constancia; RLS verificado en las tablas
nuevas; y, si toca combate, prueba en multijugador con dos clientes reales — que es donde se esconden los bugs que
no salen en los tests.
