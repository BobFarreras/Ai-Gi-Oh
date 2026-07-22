<!-- docs/story/acts/act-4/ACT-4-FLOW.md - Guía completa del Acto 4 (Núcleo GenNvim): historia, personajes, recorrido jugable paso a paso, eventos (con el TEXTO de cada narración para montar vídeos), rivales, puzzles y puertas. Estado actual del mapa (2 laberintos). -->
# Acto 4 — Núcleo GenNvim — Guía completa

Mapa `act-4` (estética **TERMINAL** verde fósforo, 52×70). El jugador sube desde la **entrada** (abajo) hasta los
**jefes** (arriba). Este documento explica **la historia, quién es quién, qué hace el jugador para pasárselo, y el
texto exacto de cada narración** (para poder grabar los vídeos de los eventos).

---

## 1. La historia (sinopsis)

GenNvim es la **fundición/núcleo donde se "compiló" la Entidad** (el enemigo del juego). El Operador (el jugador)
entra para conseguir la **Llave del Core** y poder pasar al Acto 5. Dentro descubre la verdad sobre el origen de la
Entidad… y sobre su propio mentor.

**Arco narrativo (en orden):**
1. El Operador entra en el núcleo. **BigLog** (mentor, de los buenos) le guía. **GenNvim** (la IA del núcleo) le
   amenaza con "reordenar las salas para que se pierda" → esto justifica los **laberintos**.
2. Encuentra un **registro de compilación antiguo**: "PROYECTO ENTIDAD v0.1". BigLog se pone evasivo.
3. Cruza los laberintos de servidores (GenNvim controla el "flujo" de las pasarelas).
4. En el **Archivo Maestro** se revela que **la Entidad la compilaron aquí GenNvim y Midutech**, y **BigLog
   confiesa**: ayudó a crearla para *contenerla*, se escapó, y por eso entrenó al Operador para arreglarlo.
5. El Operador vence a **GenNvim** (jefe 1).
6. Aparece **Midutech**, el **arquitecto** que escribió el código de GenNvim (y que ayudó a diseñar al propio
   Operador). Tiene la Llave del Core.
7. El Operador vence a **Midutech** (jefe final) y consigue la **Llave del Core**. Fin del acto (Acto 5: próximamente).

### Personajes
| Personaje | Rol | Tono |
|---|---|---|
| **Operador** | El jugador | Decidido, seco |
| **BigLog** | Mentor (BUENO) | Claro, te guía; culpa/confesión en el clímax |
| **GenNvim** | IA del núcleo — **JEFE 1** | Villano frío, territorial |
| **Midutech** | El arquitecto — **JEFE FINAL** | Villano soberbio, te conoce |
| **Sistema** | Voz de terminal (logs) | Neutro, técnico |

> Nota: **las amenazas SIEMPRE las dicen los villanos (GenNvim/Midutech)**. BigLog nunca amenaza: guía y, al final,
> confiesa. (Regla de escritura del acto.)

---

## 2. Cómo se juega (leyenda de interacción)
- **Rival (`DUEL`/`BOSS`)**: NO se activa con el botón A. Se dispara por **VISIÓN**: al entrar en su haz (mira hacia
  donde vienes) te reta. Al vencerlo se aparta y libera su casilla. Los que están en un pasillo de 1 casilla son
  **obligatorios**.
- **Consola (`EVENT` con pulsar A)**: te pones al lado y pulsas **A** (lanza la narración).
- **Evento oculto (`STEP_ON`)**: salta solo al **pisar** una casilla concreta (una vez).
- **Recompensa (`REWARD_OBJECT`)**: te pones al lado y pulsas **A** para recogerla (una vez).
- **Módulo/Caja (`BOX`)**: se **empuja** una casilla al andar contra ella.
- **Ranura/Placa (`PLATE`)**: al meter el módulo encima se **enclava** y dispara su efecto (invertir la pasarela).
- **Cinta/Pasarela (`BELT`)**: te arrastra en su sentido; **no puedes subir si va en tu contra**.
- **Compuerta (`GATE`)**: barrera física; se abre al cumplir su requisito (vencer a cierto rival).

---

## 3. Recorrido paso a paso (qué hace el jugador para pasárselo)

**Ruta crítica:** Entrada → **Laberinto 1** → **Laberinto 2 (puzzle del módulo)** → Terminal → **GenNvim** → **Midutech** → Llave del Core.

### 0) Entrada (abajo)
- **Al primer paso** salta el **Evento E1 (intro)**. *(→ VÍDEO)*
- Servicios: **Mercado**, **Arsenal**, **Salir** (consolas, pulsar A). Portal de **retorno al Acto 3** (se pisa).
- El único pasillo de subida lo bloquea el **Soldado-Terminal (duel-1)** → **combate obligatorio**.

### 1) Laberinto 1 (la "sala de abajo")
- Es un **laberinto real de servidores**: pasillos de 1 casilla con **bifurcaciones y callejones sin salida**. Hay
  **un único camino correcto** de abajo (entrada) a arriba (salida hacia el laberinto 2).
- **Rama lateral izquierda (obligatorio para el objeto):** un **soldado (duel-2)** guarda el **Aumento de ATAQUE**
  (`Núcleo Overclock`). Sin vencerlo no llegas al objeto.
- **Rama lateral derecha:** sala opcional *(pendiente de contenido — ver §7)*.

### 2) Laberinto 2 (la "sala del módulo") + puzzle de la pasarela
- **Al entrar** salta el **Evento E3 (laberinto de servidores)**.
- Otro **laberinto real** (bifurcaciones + callejones). Escondido en un **callejón sin salida** hay un **USB Raro**
  (`REWARD_OBJECT`, sube nivel de carta).
- **Rama lateral izquierda (obligatorio):** **soldado (duel-4)** guarda el **Aumento de DEFENSA** (`Placa Blindada`)
  y la **consola del Registro Antiguo** (Evento E2, ver abajo).
- **Rama lateral derecha:** **soldado (duel-3)** guarda una sala *(pendiente de contenido — ver §7)*.
- **Arriba del laberinto está la cámara del módulo.** El **módulo (caja) TAPA el embudo de salida**: no puedes subir.
  - Al toparte con la pasarela en contra salta el evento **"Pasarela en Contra"** (te dice qué hacer).
  - **Empuja el módulo hasta su RANURA** (a la izquierda): eso **invierte la pasarela de forma PERMANENTE** y
    despeja el embudo → salta **"Flujo Invertido"**. (Si el módulo se atasca, hay un **botón de reinicio** que lo
    devuelve a su sitio: anti-bloqueo.)
  - Sube por la pasarela ya invertida hacia el terminal.

### 3) Terminal
- Consola del **Archivo Maestro** → **Evento E4 (revelación)**. *(→ VÍDEO)*
- Un **Soldado-Terminal (duel-5)** de antesala. **La compuerta al jefe (`gate-boss`) solo se abre tras vencer a
  duel-5.**

### 4) Sala del jefe (arriba)
- La sala está **partida en dos por un muro de servidores**.
- **Mitad baja: GenNvim (JEFE 1).** Su visión cubre su mitad: **entrar = combate**.
- Tras vencerlo salta el **Evento E5 (pre-Midutech)** y se abre la **puerta post-GenNvim** (`gate-postboss`), que
  **solo abre si venciste a GenNvim**.
- **Mitad alta: Midutech (JEFE FINAL).** Su visión cubre su mitad.
- Al vencerlo salta el **Evento E6 (Llave del Core)** → cierre del acto (Acto 5 "próximamente"). *(→ VÍDEO)*

---

## 4. Eventos: cuándo saltan y TEXTO para los vídeos

Los tres marcados **(VÍDEO)** son los que vas a grabar; el resto son narraciones in-game (te los dejo por si quieres
ilustrarlos también). El texto es el actual del catálogo `story-node-interaction-dialogue-catalog.ts`.

### E1 — «Núcleo GenNvim» · id `story-ch4-event-intro` · **(VÍDEO)**
*Dispara: al primer paso del acto.*
- **BigLog:** "Estás dentro de GenNvim, la fundición donde empezó todo. Yo te guío desde aquí: cruza el mainframe y llega al núcleo del acto."
- **GenNvim:** "Intruso detectado. Este núcleo es mío. Voy a reordenar cada sala para que te pierdas y no salgas."
- **Operador:** "Que lo intente. Voy a por la llave del Core."

### E2 — «Registro Antiguo» · id `story-ch4-event-log-origin-1`
*Dispara: consola en la sala del Aumento de DEFENSA (laberinto 2, rama izq). Pulsar A.*
- **Sistema:** "REGISTRO DE COMPILACIÓN — PROYECTO ENTIDAD, versión 0.1. Autorizado por: [datos corruptos]."
- **BigLog:** "Ese registro es viejo… y delicado. Luego te lo explico. Ahora concéntrate en avanzar."

### E3 — «Laberinto de Servidores» · id `story-ch4-event-belts`
*Dispara: al pisar la entrada del laberinto 2.*
- **BigLog:** "Cuidado: este laberinto de servidores solo tiene una salida arriba, y la pasarela que sube va en tu contra."
- **GenNvim:** "Mi flujo va en un solo sentido: el mío. No subirás… a menos que muevas mi propio hardware para engañarlo."

### «Pasarela en Contra» · id `story-ch4-event-belt-locked`
*Dispara: al llegar a la pasarela del embudo sin haberla invertido.*
- **BigLog:** "La pasarela baja: no puedes subir por ella. Busca en el laberinto un módulo que puedas empujar hasta su ranura para invertir el flujo."

### «Flujo Invertido» · id `story-ch4-belt-slot`
*Dispara: al meter el módulo en la ranura.*
- **Sistema:** "Módulo insertado. Flujo de la pasarela invertido de forma permanente. Ya puedes subir al terminal."

### E4 — «Archivo Maestro» · id `story-ch4-event-revelation` · **(VÍDEO)**
*Dispara: consola del registro-madre en el terminal. Pulsar A.*
- **Sistema:** "ARCHIVO MAESTRO — La Entidad no nació: la compilaron aquí GenNvim y Midutech."
- **BigLog:** "Es verdad. Ayudé a crearla para CONTENERLA, no para esto. Cuando se escapó, te entrené a ti para arreglarlo. Lo siento."
- **GenNvim:** "Conmovedor. Pero de aquí no pasas."

### E5 — «El Arquitecto» · id `story-ch4-event-pre-midutech`
*Dispara: al pisar la mitad alta de la sala del jefe, tras vencer a GenNvim.*
- **Midutech:** "GenNvim solo era mi código. Yo lo escribí. La llave del Core es mía y no pienso dártela."
- **BigLog:** "Cuidado con él: conoce cómo piensas, porque ayudó a diseñarte. Mantén la calma y juega tu mejor mano."

### E6 — «Llave del Core» · id `story-ch4-event-core-key` · **(VÍDEO)**
*Dispara: al pisar tras vencer a Midutech.*
- **Midutech:** "Impresionante. Puede que me haya equivocado contigo."
- **BigLog:** "Lo lograste. Ya tienes la llave del Core. A partir de aquí… ni yo sé lo que hay dentro."
- **Sistema:** "Acto 5: próximamente."

---

## 5. Rivales (7)
| # | id | Dónde | Papel |
|---|---|---|---|
| 1 | `story-ch4-duel-1` | Corredor de entrada | Obligatorio para subir |
| 2 | `story-ch4-duel-2` | Laberinto 1, rama izq | Guarda el Aumento de ATK |
| 3 | `story-ch4-duel-3` | Laberinto 2, rama der | Guarda sala opcional *(pdte. contenido)* |
| 4 | `story-ch4-duel-4` | Laberinto 2, rama izq | Guarda el Aumento de DEF + consola E2 |
| 5 | `story-ch4-duel-5` | Antesala del terminal | Obligatorio (abre `gate-boss`) |
| 6 | `story-ch4-duel-6` | Sala del jefe (baja) | **GenNvim (JEFE 1)** |
| 7 | `story-ch4-duel-7` | Sala del jefe (alta) | **Midutech (JEFE FINAL)** |

Rivales 1–5 son **Soldado-Terminal**. (Los decks/perfiles de IA están en `docs/supabase/sql/145_story_act4_gennvim_flow.sql`.)

## 6. Puertas, puzzles y objetos
- **Puzzle del módulo (laberinto 2):** empujar el **módulo (caja)** hasta su **ranura** invierte la **pasarela** del
  embudo de forma **permanente** (aunque el módulo se mueva después, no hay bloqueo). Es el cerrojo para subir.
- `gate-boss` (terminal → jefe): requiere **vencer a duel-5**.
- `gate-postboss` (GenNvim → Midutech): requiere **vencer a GenNvim (duel-6)**.
- **Objetos:**
  - **USB Raro** (`candy-usb-raro-1`) — callejón sin salida del **laberinto 2**.
  - **Núcleo Overclock** (`item-nucleo-overclock`, +ATK) — laberinto 1, tras **duel-2**.
  - **Placa Blindada** (`item-placa-blindada`, +DEF) — laberinto 2, tras **duel-4**.

## 7. Pendiente / decisiones abiertas
- **Vídeos:** E1, E4, E6 (marcados arriba). El resto son narraciones in-game.
- **Salas laterales sin contenido:** la rama **derecha del laberinto 1** y la **derecha del laberinto 2** (guardada
  por duel-3) están accesibles pero **vacías**. Opciones: meter otro objeto/recompensa, un evento, o sellarlas.
- **Habilidades de combate** de `opp-ch4-*` (soldado/GenNvim/Midutech): asignar en el panel de admin.
- **Más laberintos:** las otras salas (terminal, entrada) podrían convertirse en laberintos con el helper `carveMaze`.
