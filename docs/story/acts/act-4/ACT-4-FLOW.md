<!-- docs/story/acts/act-4/ACT-4-FLOW.md - Recorrido jugable del Acto 4 (Núcleo GenNvim): salas, qué interactúa, qué evento salta y cuándo, puzzles y rivales. Para entender el flujo de un vistazo. -->
# Acto 4 — Recorrido jugable (cómo funciona)

Mapa `act-4` (verde TERMINAL, 52×56). El jugador sube de la **entrada** (abajo) al **núcleo/jefes** (arriba). Este
doc explica **qué hay en cada sala, qué se interactúa, qué evento salta y cuándo**.

## Leyenda de interacción
- **Rival (`DUEL`/`BOSS`)**: NO se activa con el botón A. Se dispara por **VISIÓN**: cuando entras en su haz
  (mira hacia donde vienes) te reta. Al vencerlo, se aparta y libera su casilla. Los que están en un pasillo de
  1 casilla son **obligatorios** (no hay otro camino).
- **Consola / botón (`EVENT`/`SWITCH`)**: te pones al lado y pulsas **A**.
- **Evento oculto (`STEP_ON`)**: salta solo al **pisar** una casilla concreta (una vez).
- **Recompensa (`REWARD_*`)**: te pones al lado y pulsas **A** para recogerla (una vez).
- **Cinta (`BELT`)**: te arrastra en su sentido; **no puedes ir en contra**; un input perpendicular te deja salir
  por el lateral.
- **Compuerta (`GATE`)**: barrera física; se abre cuando cumples su requisito (pulsar placa / vencer a un jefe).

---

## Recorrido paso a paso

### 1. Entrada (abajo)
- **Al primer paso** salta el **evento E1 (intro)**: GenNvim te detecta, BigLog te avisa. *(Será vídeo; de momento narración.)*
- Servicios: **Mercado**, **Arsenal**, **Salir** (consolas, pulsar A). Portal de **retorno al Acto 3** (se pisa).
- El corredor de subida al hub lo bloquea el **Soldado-Terminal (duel-1)** → **combate obligatorio** (su visión
  mira hacia ti). Al vencerlo, subes.

### 2. Hub → ramas
- Desde el hub salen pasillos (estrechados con **atrezzo de servidores**, como muros) hacia izquierda/derecha y
  arriba al laberinto.
- En pasillos laterales hay **rivales obligatorios** que guardan **objetos**:
  - **Rama con aumento de ATAQUE** (`Núcleo Overclock`): un soldado obligatorio en el pasillo; tras vencerlo,
    recoges el objeto (pulsar A al lado).
  - **Rama con aumento de DEFENSA** (`Placa Blindada`): igual, otro soldado obligatorio.

### 3. Laberinto de pasarelas (sala central) — **estilo Pokémon**
- Al entrar salta el **evento E3 (pasarelas)**: GenNvim te avisa de que "el flujo va donde él dice".
- La sala es un **laberinto de cintas**: para subir tienes que elegir bien los giros. **Si te equivocas de
  pasarela, la corriente te arrastra de vuelta abajo** (a la entrada del laberinto) y vuelves a empezar el tramo.
- Escondido en el laberinto hay un **USB Raro** (`REWARD_OBJECT`, sube nivel de carta): pulsar A al lado.
- La caja empujable + placa siguen abriendo la **compuerta del tramo alto** (terminal → jefe).

### 4. El puente al terminal (cinta EN CONTRA) + el botón
- El puente que sube al terminal es una **cinta que baja** (`BELT_DOWN`): **no puedes subir por ella**.
- Al llegar salta el evento **"Flujo en Contra"** (te lo explica).
- Para invertirla hay un **botón** (`SWITCH` con `beltToggleRect`) en **otra sala** (rama derecha alta).
  **Sí: el botón gira la pasarela** — al pulsarlo, la cinta pasa de bajar a **subir** y ya puedes pasar (salta el
  evento **"Flujo Redirigido"**).
- **Ese botón está guardado por un soldado OBLIGATORIO**: no llegas al botón sin vencerlo (pasillo de atrezzo).

### 5. Terminal
- Consola del **registro-madre** → **evento E4 (revelación)**: se descubre que la Entidad se compiló aquí
  (GenNvim + Midutech), y BigLog confiesa. *(Será vídeo.)*
- Otro **Soldado-Terminal (duel-5)** de antesala antes del jefe.

### 6. Sala del jefe (arriba)
- La sala está **partida en dos por un muro de atrezzo**.
- **Mitad baja: GenNvim (BOSS 1)** — su visión cubre toda su mitad: **entrar = combate**.
- Tras vencerlo salta el evento **E5 (pre-Midutech)** y se abre la **puerta post-GenNvim**
  (`story-a4-gate-postboss`), que **solo abre si has vencido a GenNvim**.
- **Mitad alta: Midutech (BOSS FINAL)** — su visión cubre su mitad.
- Al vencerlo salta el **evento E6 (llave del Core)** → cierre del acto (warp al Acto 5, "próximamente").

---

## Resumen de eventos (id → cuándo salta)
| Evento | id | Disparo |
|---|---|---|
| E1 Intro | `story-ch4-event-intro` | Primer paso del acto |
| E3 Pasarelas | `story-ch4-event-belts` | Al pisar la entrada del laberinto |
| Flujo en Contra | `story-ch4-event-belt-locked` | Al pisar el puente sin invertirlo |
| Flujo Redirigido | `story-ch4-belt-button` | Al pulsar el botón (invierte la cinta) |
| E2 Log del Origen | `story-ch4-event-log-origin-1` | Consola (pulsar A) |
| E4 Revelación | `story-ch4-event-revelation` | Consola registro-madre (pulsar A) |
| E5 Pre-Midutech | `story-ch4-event-pre-midutech` | Al pisar tras vencer a GenNvim |
| E6 Llave del Core | `story-ch4-event-core-key` | Al pisar tras vencer a Midutech |

## Puertas y llaves
- `story-a4-gate-boss` (terminal→jefe) — requiere la **placa** del laberinto (caja encima).
- `story-a4-gate-postboss` (GenNvim→Midutech) — requiere **vencer a GenNvim** (`story-ch4-duel-6`).
- El **botón** invierte la cinta del puente (belt-toggle) — requiere vencer al **soldado guardián**.

## Rivales (7)
1-5 = **Soldado-Terminal** (obligatorios en pasillos: entrada, pasillo del aumento ATK, guardián del botón,
pasillo del aumento DEF, antesala del terminal). 6 = **GenNvim** (boss). 7 = **Midutech** (boss final).

## Objetos
- **USB Raro** (`candy-usb-raro-1`) — dentro del laberinto.
- **Núcleo Overclock** (`item-nucleo-overclock`, +ATK) — pasillo con rival obligatorio.
- **Placa Blindada** (`item-placa-blindada`, +DEF) — pasillo con rival obligatorio.
