<!-- docs/story/acts/act-3/README.md - Especificación funcional del Acto 3 para repositorio fantasma y progresión de combate avanzada. -->
# Acto 3 - Repositorio Fantasma (Jaku)

## Resumen narrativo
1. Jaku fragmentó el índice del repositorio en **forks tóxicos** que se replican en la oscuridad.
2. El jugador recupera continuidad de rutas iluminando salas, despejando bloques y hackeando el cortafuegos.
3. El acto eleva la exigencia táctica: cierre con Jaku en su núcleo fantasma.

## Implementación (overworld)
1. Mapa: `src/services/story/overworld/act-3-overworld-tilemap.ts` (`ambient: "DARK"`), registrado como `act-3`.
2. Contenido de BD: `docs/supabase/sql/090_story_act3_jaku_flow.sql` (duelos ch3, dificultad, recompensas).
3. Nodos virtuales (recompensas/eventos/interruptores/terminal): `src/services/story/map-definitions/act-3-map-definition.ts`.
4. Diálogos: entradas `story-ch3-*` en `story-node-interaction-dialogue-catalog.ts`.

## Mecánicas interactivas nuevas (estreno del acto)
1. **Oscuridad + interruptores.** Todo el mapa está a oscuras: solo ves un radio alrededor del jugador.
   Dos interruptores (`SWITCH`) encienden la sala de entrada y la sala media, revelando rivales/objetos.
2. **Caja empujable + placa de presión.** En la rama izquierda hay un bloque de datos (`BOX`) que se empuja
   caminando contra él hasta una placa (`PLATE`); al pulsarla se abre la compuerta a la caché de recompensa.
3. **Cinta transportadora.** El ascenso del hub a la sala media es una cinta (`BELT_UP`) que arrastra hacia
   arriba; para bajar hay que caminar en contra.
4. **Terminal de código (SUBMISSION).** El registro corrupto revela la clave `PURGE-3F17`; introducirla en el
   terminal del cortafuegos abre el acceso al jefe.

## Roster
1. **Soldado-Laptop** (`opp-soldado-laptop`, oponente + deck nuevos): centinela del acto (duelos 1-4).
2. **Jaku** (`opp-jaku`, deck rehecho con 5 entidades > 1800 ATK): eco medio (duelo 5) y jefe (duelo 6).
3. Sin BigLog (ya se combate en el Acto 2); BigLog sigue como mentor/narrador de la intro.

## Flujo de nodos
1. Entrada oscura → interruptor → **Centinela del Umbral** (`story-ch3-duel-1`).
2. Hub → **Guardia del Hub** (`story-ch3-duel-2`).
3. Rama izquierda (puzzle de caja) → caché + **Centinela de la Caché** (`story-ch3-duel-4`).
4. Cinta → sala media → **Corredor Vigilado** (`story-ch3-duel-3`) → **Jaku: Eco del Núcleo** (`story-ch3-duel-5`).
5. Rama derecha → registro corrupto + terminal del cortafuegos.
6. Compuerta (terminal + eco de Jaku) → **Jaku: Núcleo Fantasma** (`story-ch3-duel-6`, BOSS) → portal al Acto 4.

## Regla de dificultad del acto
1. Inicio en rango medio-alto (ELITE) respecto al cierre del Acto 2.
2. Tramo medio con escalado continuo (ELITE sostenido).
3. Cierre en rango alto: eco de Jaku (ELITE) y Jaku jefe (MYTHIC).

## Validación del acto
1. Test: `src/services/story/overworld/act-3-overworld-tilemap.test.ts` (validez, mecánicas y gating por reachability).
2. Migración de BD idempotente; aplicar a producción al hacer release.
3. Preservar trazabilidad de decisiones de rama en `combatLog` y estado Story.
