# Auditoría de economía, atributos y valor de mercado

> Fecha: 2026-06-28 · Fuente: catálogo en vivo de Supabase (`fbnfveukgjnirjsmrbny`) + código de dominio (`src/core/...`).
> Objetivo del estudio: decidir si el juego es **escalable** y **justo**, si los precios deben subir o bajar, si conviene **estandarizar los atributos** por energía, y dar un veredicto sobre mágicas/trampas/fusiones.

---

## 0. Veredicto rápido (TL;DR)

| Pregunta tuya | Respuesta corta |
|---|---|
| ¿Los precios deberían estar más altos o más bajos? | **El promedio está bien; el problema es la incoherencia.** No subas todo: arregla la **curva** y elimina los "chollos". El techo (legendarias/fusiones) debería subir; las commons de entrada pueden quedarse baratas. |
| ¿Se puede montar un deck casi invencible desde el principio? | **Sí, demasiado rápido.** Las **fusiones se compran directas** (GemGPT 3200 ATK por 1.200) y hay cartas mal tasadas (Flutter 1570 ATK por **118**). Un jugador espabilado tiene deck fuerte en **2-3 días**. |
| ¿Mejor parámetros fijos de stats por energía? | **Sí, recomendado.** Ya existe una curva implícita (~+300/energía); hay que **formalizarla** y quitar el ruido (1200/1205/1210...). |
| ¿Cómo van las monedas (Nexus) y a cuántos días tienes un buen colchón? | Economía **generosa y front-loaded**: ~**1.700 Nexus el día 1** antes de combatir; ~**1.000/día** para un jugador activo. |
| Mágicas / trampas / fusiones | Bien diseñadas en efecto, pero **rareza y precio están descorrelacionados** del poder real. Hay que recatalogar. |

**Diagnóstico de fondo:** el juego no está "barato" ni "caro" — está **inconsistente**. La rareza (`COMMON/RARE/EPIC/LEGENDARY`) hoy no significa casi nada: no predice ni stats, ni precio, ni dificultad de obtención. Eso es lo que rompe la escalabilidad y la justicia percibida.

---

## 0.bis Correcciones tras tu feedback (v2)

Tres aclaraciones tuyas que cambian o matizan el análisis original:

1. 🟢 **Fusiones NO son una bomba instantánea.** Para invocar una fusión hace falta la cadena completa: **2 materiales + carta `exec-fusion-*` (Compilador) + la carta FUSION** en uno de los 2 slots del deck de fusión, y además invocar los materiales a mesa y jugar el Compilador. Comprar solo la fusión no sirve. El gateo que pedía en §7.3 **ya existe por diseño** → preocupación nº3 rebajada (queda solo el tema de rareza/etiqueta, no de mecánica).

2. 🔴 **HALLAZGO NUEVO — gate de fallback del mercado.** El juego solo sirve el mercado de la DB si `market_card_listings` **Y** `market_pack_definitions` **Y** `market_pack_pool_entries` tienen filas ([can-use-supabase-market-catalog.ts](src/services/player-persistence/internal/can-use-supabase-market-catalog.ts)). Las dos tablas de packs están **a 0 filas**, así que **todo el mercado cae al mock de código** ([InMemoryMarketRepository.ts](src/infrastructure/repositories/InMemoryMarketRepository.ts)):
   - Precios de carta = `coste × 25` (NO los 50-1.400 de `market_card_listings`).
   - 2 sobres reales: **Core Alpha** (220 Nexus, 5 cartas) y **Fusion Lab: Pytgress** (480 Nexus, 5 cartas).
   - **Consecuencia:** mientras las tablas de packs estén vacías, **editar precios/rarezas en la DB no tiene efecto**. Toda la §3 describe `market_card_listings`, que ahora mismo puede no estar sirviéndose. **Decisión previa obligatoria:** ¿el mercado vive en DB (editable sin deploy) o en código? Hay que elegir UNA fuente de verdad.

3. 🟢 **Sí hay sobres y sí hay tienda de eventos.** "Sumidero" = sitio por donde el dinero **sale** de la economía (lo contrario de "grifo"/ingreso). No dije que no existieran sobres; dije que el desagüe puede ser insuficiente frente al ingreso (de ahí wallets de 21.000). Ver §2.6 (corregida) y §2.7 (tienda de Fragmentos).

---

## 1. Cómo lo he estudiado

Datos cruzados de tres sitios:

1. **Catálogo en vivo** (`cards_catalog`, 120 cartas) — stats reales, no el `cards_catalog.json` del repo (que está **desactualizado**, solo tiene 80 cartas y precios viejos).
2. **Mercado en vivo** (`market_card_listings`, 120 listings) — precios Nexus + rareza + disponibilidad.
3. **Reglas de dominio en código** — recompensas de combate (`match-reward-policy.ts`), misiones/login (DB `mission_definitions`, `login_reward_calendar`), progresión de nivel/versión (`card-level-rules.ts`, `card-version-rules.ts`).

> ⚠️ Nota: las transacciones históricas (`market_transactions`) muestran fusiones compradas por ~100 Nexus cuando hoy valen 1.200-1.400. Es decir, **ya has reajustado precios al alza con el tiempo** — buena señal, pero el reajuste fue parcial e inconsistente.

---

## 2. Economía de Nexus — ¿de dónde sale el dinero?

### 2.1 Saldo inicial y arranque
- **Saldo inicial:** `1000` Nexus (`002_phase_3_market_home_persistence.sql`, trigger de creación de wallet).
- **Tutorial final:** `600` Nexus (`resolve-tutorial-final-reward.ts`, env override `TUTORIAL_FINAL_REWARD_NEXUS`).
- **Tutorial de combate:** regala la carta `exec-fusion-gemgpt` (el Compilador de Fusión) **gratis**.

### 2.2 Login diario (calendario de 7 días)
| Día | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Nexus | 100 | 150 | 200 | 250 | 300 | 400 | 600 + carta (ChatGPT) |

**Total semana = 2.000 Nexus + 1 ChatGPT (valor 655).** El día 7 da, de golpe, una EPIC de 1.850 ATK.

### 2.3 Misiones (DB `mission_definitions`)
**Diarias** (reset diario):
| Objetivo | Meta | Nexus |
|---|---|---|
| Entra en combate (PLAY_DUEL) | 2 | 120 |
| Victoria del día (WIN_DUEL) | 1 | 100 |
| Visita el mercado (BUY_CARD) | 1 | 80 |
| Gran comprador (SPEND_NEXUS) | 1000 | 200 |

→ **Hasta 500 Nexus/día** solo en diarias (220 jugando, +280 si interactúas con el mercado).

**Semanales:** Duelista (12 duelos) 500 · Rival temible (3 MP) 450 · Mejora arsenal (1 evolución) 350 · Dominio arena (3 arena) 400 → **1.700 Nexus/semana**.

### 2.4 Recompensas por combate (`match-reward-policy.ts`)
| Modo | WIN | DRAW | LOSE | Notas |
|---|---|---|---|---|
| **Tutorial** | 0 | 0 | 0 | Solo cartas |
| **Training** | 30 | 16 | 8 | ×multiplicador de tier (1.0 → **2.1** en tier 5) |
| **Story** | 50×tier | 28×tier | 12×tier | tier 1-10 |
| **Multijugador** | 90 | 45 | 18 | + ELO |

- Training tier 5 WIN = `30 × 2.1 = 63` Nexus.
- Story: además **recompensa única de primer clear** por duelo, definida por duelo (rango ~**120-900** según migraciones `019/020`). El Acto 1 completo ≈ **1.740 Nexus** de one-time.

### 2.5 Simulación "días para tener músculo"

**Día 1 (jugador que empuja):**
`1000 (inicial) + 600 (tutorial) + 100 (login) + ~500 (diarias) + ~1.740 (first-clears Acto 1)` ≈ **~3.900 Nexus el primer día**.

**Ritmo sostenido (jugador activo):** login ~286/día + diarias ~500/día + ~6 combates ~300/día ≈ **~1.000-1.100 Nexus/día**.

**Coste de un deck competitivo (singles a precio actual):** ~**8.000-10.000 Nexus** comprando meta a precio "correcto".

> **Conclusión (corregida):** deck top en ~**1 semana** jugando bien; optimizando chollos (ver §3.3) baja a **2-3 días**. La fusión de 3.200 ATK **no** es una bomba del día 1 (necesita la cadena material+compilador+fusión + setup de mesa, ver §0.bis y §3.4). El riesgo real de "deck fuerte demasiado rápido" viene de los **chollos** y de la **economía front-loaded**, no de las fusiones.

### 2.6 Sumideros (sinks): existen, pero la fuente del mercado está rota
Recordatorio: **sumidero** = por donde sale el dinero (compras). Los sobres SÍ existen, pero hoy se sirven desde **código**, no desde la DB (ver §0.bis):
- **2 sobres activos (mock):** Core Alpha (220 Nexus) y Fusion Lab (480 Nexus). Son sumideros válidos y con azar.
- `market_pack_definitions` / `market_pack_pool_entries` en DB: **0 filas** → el gate de fallback fuerza el mock y, de paso, **ignora los precios de `market_card_listings`**.
- Aun con sobres, el ingreso (~1.000/día) supera el desagüe una vez montado el deck: hay wallets con **21.000** y **13.700** Nexus sin destino. Falta un sumidero recurrente *post-deck* (rotación de sobres, evolución por copias, tienda que rote).

### 2.7 Tienda de eventos (Fragmentos) — canal y sumidero alternativos
- Moneda separada **Fragmentos** (`events.currency_name`), no Nexus.
- Se ganan por reglas de evento (`event_point_rules`): `BUY_PACK` = 20 pts, `WIN_FLAWLESS_STORY` = 100 pts.
- Tienda `event_shop_items` (3 items hoy, con límite por jugador) → cartas exclusivas de evento.
- ⚠️ Datos actuales parecen de prueba: los `id` dicen `python/flutter/avast` pero `card_id` apunta a Python/Perplexity/GitHub con stats placeholder 1200/1100. Revisar antes de un evento real.

---

## 3. Mercado — precios y rareza

### 3.1 Precio medio por rareza (en vivo)
| Rareza | nº | Precio mín | medio | máx |
|---|---|---|---|---|
| COMMON | 53 | 50 | **328** | 1.200 |
| RARE | 45 | 110 | **369** | 650 |
| EPIC | 18 | 180 | **519** | 800 |
| LEGENDARY | 4 | 855 | **1.164** | 1.400 |

El promedio sube con la rareza (bien), **pero los solapes son enormes**: una COMMON llega a 1.200 y una EPIC baja a 180. La rareza no es fiable.

### 3.2 Rareza descorrelacionada del poder (ejemplos rotos)
| Carta | Tipo | Stats | Rareza | Precio | Problema |
|---|---|---|---|---|---|
| AWS | ENTITY c5 | 1800/1200 | **COMMON** | 800 | COMMON al precio de EPIC |
| Qwen | ENTITY c5 | 1800/1200 | **COMMON** | 800 | idem |
| KuberLinnet / CursHost / RustyFox / Super-C | **FUSION** c7 | 3000/2000 | **COMMON** | 1.200 | Fusiones de 3.000 ATK marcadas COMMON |
| Firebase | ENTITY c4 | 1200/2000 | COMMON | 200 | Muro brutal por 200 |
| Mistral / MiniMax | ENTITY c4 | 1500/1300 | COMMON | 400 | Stats de RARE, etiqueta COMMON |
| GemGPT | FUSION c7 | 3200/2600 | LEGENDARY | 1.200 | Bien etiquetada, pero **igual de cara que las "COMMON" 3000** |

### 3.3 "Chollos" que rompen el balance (precio ≪ poder)
| Carta | Coste | ATK | Precio | ATK por Nexus |
|---|---|---|---|---|
| **Flutter** | 4 | 1570 | **118** | 13,3 🚩 |
| **DigitalOcean** | 3 | 1240 | **75** | 16,5 🚩 |
| **Windows 92** | 3 | 1180 | **110** | muro 1320 DEF |
| Hydra | 4 | 1580 | 395 | mejor ATK c4, precio medio |
| Kotlin | 4 | 1560 | 416 | — |

Compara: **React** (1500 ATK, c4) cuesta **400**, pero **Flutter** (1570 ATK, c4) cuesta **118**. Un jugador que conoce el meta llena el deck de Flutter/Hydra/Kotlin/Windows92 por <500 Nexus total y tiene stats de gama alta casi gratis. Esto es exactamente lo que querías evitar.

### 3.4 Fusiones (corregido — NO son un atajo)
Comprar la carta de fusión **no basta**: para invocarla necesitas **2 materiales + carta `exec-fusion-*` (Compilador) + la FUSION** en uno de los 2 slots del deck de fusión, e invocar los materiales a mesa y jugar el Compilador. Es un combo de 4 cartas con setup. Coste total real de GemGPT ≈ ChatGPT 655 + Gemini 655 + Compilador 300 + GemGPT 1.200 ≈ **2.810 Nexus** + ejecución en partida.
→ La mecánica está bien gateada. **Lo único a arreglar es la rareza** (4 fusiones marcadas `COMMON`) y, opcionalmente, alinear el precio de la carta de fusión suelta con su rareza real.

---

## 4. Atributos de cartas — ¿estandarizar por energía?

### 4.1 La curva implícita actual (en vivo)
| Coste | nº | ATK medio | DEF medio | **ATK+DEF (budget)** |
|---|---|---|---|---|
| 2 | 4 | 850 | 1175 | ~2.025 |
| 3 | 23 | 1.207 | 1.113 | ~2.320 |
| 4 | 28 | 1.500 | 1.200 | ~2.700 |
| 5 | 11 | 1.825 | 1.371 | ~3.196 |
| 6 | 1 | 2.000 | 1.400 | ~3.400 |
| 7 (fusión) | 6 | 3.050 | 2.167 | ~5.200 |

**Buena noticia:** ya hay una curva sólida, **~+300-400 de "presupuesto" (ATK+DEF) por cada energía**. El problema es solo el **ruido** (1200, 1205, 1210, 1230, 1240, 1270...) que no aporta nada de game design y da sensación de aleatoriedad.

### 4.2 Recomendación: presupuesto de stats por energía (stat budget)
En vez de fijar "Energía 3 = 1200 ATK" rígido (que mata los roles), fija un **presupuesto total ATK+DEF por coste** y reparte según el rol de la carta. Es el estándar en TCGs y es lo que ya estás haciendo sin saberlo:

| Coste | Budget total (ATK+DEF) | Vanilla equilibrada | Aggro (alto ATK) | Muro (alto DEF) |
|---|---|---|---|---|
| 2 | 2.000 | 1000/1000 | 1300/700 | 700/1300 |
| 3 | 2.400 | 1200/1200 | 1500/900 | 900/1500 |
| 4 | 2.800 | 1500/1300 | 1800/1000 | 1000/1800 |
| 5 | 3.200 | 1900/1300 | 2100/1100 | 1300/1900 |
| 6 | 3.600 | 2100/1500 | 2400/1200 | — |

Reglas asociadas:
- **Carta con efecto/trigger** → resta presupuesto (p. ej. −300/−400) frente a su vanilla. Así una entidad con habilidad fuerte no es además la más gorda.
- **Múltiplos de 50/100**, nunca 1205/1210. Limpia el ruido.
- **Fusiones** = presupuesto aparte (premio por sacrificar 2 cartas), claramente por encima de la curva (lo que ya pasa: ~5.200).

### 4.3 Cómo encaja con la progresión (importante para "no invencible al principio")
Hoy:
- **Nivel** (0→30) suma como mucho **+300 ATK / +300 DEF / −1 coste** (`card-level-bonus-rules.ts`), y subir a nivel 30 cuesta **17.050 XP** por carta (`card-level-rules.ts`) → a ~50-100 XP por combate son **~170-340 combates por carta**. Grind largo y sano. ✅
- **Versión** (V0→V5) cuesta **4+8+16+32+64 = 124 copias** de la misma carta y **solo desbloquea la pasiva de maestría en V5** (no da stats). Sumidero brutal de tiempo/dinero. ✅ (bien para longevidad; vigila que no sea frustrante).

→ La progresión está bien calibrada para el largo plazo. **El desajuste está en la adquisición inicial (mercado), no en el crecimiento.**

---

## 5. Mágicas (EXECUTION), Trampas (TRAP) y Fusiones — catalogación

### 5.1 Ejecuciones — efecto vs. precio (muestra)
| Carta | Coste | Efecto | Precio | Comentario |
|---|---|---|---|---|
| Exploit Ping | 2 | 600 daño directo | 250 | OK |
| Packet Storm | 3 | 900 daño directo | 475 | OK (RARE-tier real, etiquetada COMMON) |
| Recovery Patch / NotebookLLM | 2 | +700 LP | 250 / 450 | **mismo efecto, distinto precio** 🚩 |
| Refactor Burst | 2 | +400 ATK a 1 aliado | 395 | caro para 1 turno |
| Knowledge Pull / DuckDuckGo Scan | 2 | robar 1 | 150 | OK |
| Docker Defense Patch | 2 | +1000 DEF | 520 | el +DEF más alto, bien que sea caro |

**Hallazgo:** efectos idénticos con precios distintos (Recovery Patch 250 vs NotebookLLM 450; ambos curan 700). Hay que **tarifar por efecto, no por carta**.

### 5.2 Trampas — efecto vs. precio (muestra)
| Carta | Coste | Efecto | Precio |
|---|---|---|---|
| Kernel Panic / Open Crash | 3 | **anula ataque + destruye atacante** | 600 / 650 |
| Gemini Counter Seal | 2 | anula y destruye trampa rival | 460 |
| Counter Intrusion / Hydra | 2 | 500 daño al declarar ataque | 250 |
| Runtime Punish | 2 | 400 daño al activar ejecución | 220 |
| Force Overclock Lock | 2 | (lock) | **125** 🚩 |

Las trampas de **negación dura** (Kernel Panic) están bien posicionadas como las más caras. Coherente. Solo afinar las baratas sueltas.

### 5.3 Fusiones — poder
| Fusión | Stats | Materiales | Precio directo |
|---|---|---|---|
| GemGPT | 3200/2600 | ChatGPT + Gemini | 1.200 |
| KaClauli | 3100/2400 | Claude + Kali | 1.400 |
| Pytgress | 2900/2700 | Python + Postgress | 1.200 (no disp.) |
| KuberLinnet/CursHost/RustyFox/Super-C | 3000/2000 | — | 1.200 |

Son las cartas más fuertes del juego (con razón). La mecánica está bien gateada (combo de 4 cartas + setup, ver §3.4). El único problema es que **cuatro están marcadas COMMON**.

---

## 6. Problemas clave (priorizados)

| # | Severidad | Problema | Impacto |
|---|---|---|---|
| 0 | ✅ **Resuelto** | ~~Gate de fallback: mercado servido desde código, no DB~~ | DB tiene datos (120 listings, 2 packs, 10 pool entries). Gate funciona. |
| 1 | ✅ **Resuelto** | ~~Rareza sin significado~~ (COMMON a 1.200, 4 fusiones COMMON) | Migración 074: fusiones→LEGENDARY, AWS/Qwen→EPIC, Mistral/MiniMax→RARE |
| 2 | ✅ **Resuelto** | ~~Chollos~~ (Flutter 118, DigitalOcean 75) | Migración 074: Flutter→450, DigitalOcean→220, Windows92→280 |
| 3 | 🟠 Media | **Economía front-loaded** (~1.700 día 1, ~1.000/día) | Curva de adquisición demasiado rápida al inicio |
| 4 | 🟠 Media | **Falta sumidero recurrente post-deck** | Economía se desborda (wallets de 21k) una vez montado el deck |
| 5 | ✅ **Resuelto** | ~~Ruido de stats~~ (1205/1210/1230) | Migración 075: 37 cartas redondeadas a múltiplos de 50/100 |
| 6 | ✅ **Resuelto** | ~~Mismo efecto, distinto precio~~ en mágicas | Migración 076: HEAL 700 unificado a 350 (Recovery Patch + NotebookLLM) |
| 7 | 🟡 Baja | **Tienda de eventos con datos placeholder** | Revisar antes de lanzar un evento real (§2.7) |
| 8 | 🟡 Baja | `cards_catalog.json` del repo **desactualizado** (80 vs 120 cartas) | Riesgo de confusión en desarrollo |
| ~~9~~ | ✅ Resuelto | ~~Fusiones bomba día 1~~ | Falsa alarma: la cadena material+compilador+fusión ya lo gatea (§3.4) |

---

## 7. Recomendaciones concretas (accionables)

### 7.1 Reanclar rareza → stats → precio (lo más importante) ✅
Definir la rareza por **presupuesto de poder real** y derivar el precio con fórmula, no a mano:
**COMPLETADO:** Migración 074 aplicada (rarezas corregidas: fusiones→LEGENDARY, AWS/Qwen→EPIC, Mistral/MiniMax→RARE). Seeds 003/005/063/070 actualizados.

### 7.2 Eliminar los chollos ✅
Subir Flutter, DigitalOcean, Windows92, Hydra, Kotlin a su precio según fórmula (Flutter 1570 ATK c4 → ~450-500, no 118). Regla: **a igual coste+stats, igual precio** (±10%).
**COMPLETADO:** Migración 074: Flutter→450, DigitalOcean→220, Windows92→280. Seeds 005/028/029 actualizados.

### 7.3 Gatear las fusiones (clave para "no invencible al principio") ❌
Elegir una de estas dos:
- **(Preferida)** Quitar las fusiones de la compra directa: **solo craftear** vía materiales + Compilador. Esto premia el sistema que ya construiste y exige montar el combo en mesa.
- **(Alternativa)** Mantener compra directa pero a **precio prohibitivo inicial** (2.500-3.500) y/o **gated por nivel de jugador / progreso de historia**.

### 7.4 Activar sobres como sumidero principal ❌
Configurar `market_pack_definitions` (hoy vacío): packs con RNG ponderado por rareza, p. ej. sobre de 5 cartas a 500 Nexus con probabilidades fijas. Así el azar y el gasto recurrente sostienen la economía a largo plazo, y la compra directa queda como "premium" para completar.

### 7.5 Suavizar el front-load (opcional, fino) ❌
- Tutorial 600 está bien como empujón.
- Considerar que las recompensas de **primer clear de historia** entreguen **cartas** (progresión dirigida) en vez de tanto Nexus suelto, para controlar el pico del día 1.

### 7.6 Limpiar stats (cuando recatalogues) ✅
Redondear todo a múltiplos de 50/100 sobre la rejilla de §4.2. Aprovechar la misma migración para tarifar mágicas por efecto (§5.1).
**COMPLETADO:** Migración 075: 37 cartas redondeadas (c3→1200/1250, c4→1500/1550/1600, c5→1900). Migración 076: HEAL 700 unificado a 350. Seeds 005/028/029/003 actualizados.

### 7.7 Higiene de repo ❌
Regenerar/eliminar `cards_catalog.json` (80 cartas, precios viejos) para que no haya dos fuentes de verdad frente a la DB (120 cartas).

---

## 8. Respuesta directa a tus dudas

1. **¿Precios más altos o más bajos?** → Ni una cosa ni otra de forma global. **Sube el techo** (fusiones/legendarias y chollos mal tasados), **mantén el suelo** (commons de entrada baratas) y, sobre todo, **haz que la rareza y el precio sigan una fórmula coherente**. El problema es la dispersión, no la media.

2. **¿Stats fijos por energía?** → **Sí**, pero como **presupuesto ATK+DEF por coste** (no un número rígido), repartido por rol y descontando si la carta tiene efecto. Ya tienes la curva; solo hay que formalizarla y quitar el ruido.

3. **¿Deck invencible al principio?** → Hoy es posible en 2-3 días por culpa de chollos + fusiones directas. Con 7.2 y 7.3 lo cierras sin tocar la progresión (que está bien).

4. **¿Flujo de monedas?** → Generoso y front-loaded: ~1.700 el día 1, ~1.000/día activo. Sano, salvo que **faltan sumideros**: activa sobres (7.4) para que el dinero tenga a dónde ir.
