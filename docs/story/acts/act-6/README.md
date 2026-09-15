<!-- docs/story/acts/act-6/README.md - Especificación del Acto 6 (La Red Abierta) tal y como está implementado. -->
# Acto 6 — La Red Abierta (Leviatán del Borde)

> **Diseño de los cuatro actos finales:** [ACTS-5-8-MASTER-GUIDE.md](../ACTS-5-8-MASTER-GUIDE.md).

## Resumen narrativo
1. La copia salió del perímetro corporativo y se replicó a la **red pública**. Es la primera vez que el
   Operador juega fuera de un edificio.
2. Cada nodo que la copia tocó se quedó un trozo mal copiado de ella: ese es el rastro.
3. Tres regiones abiertas, tres claves de router. La cuarta boca sólo se abre con las tres.
4. Al caer, el Leviatán confiesa lo que nadie había dicho todavía: **se está poniendo un cuerpo**.

## Dónde vive
| Pieza | Fichero |
|---|---|
| Mapa | [`act-6-overworld-tilemap.ts`](../../../../src/services/story/overworld/act-6-overworld-tilemap.ts) |
| Cinemática firma | [`act-6-swarm-cutscene.ts`](../../../../src/services/story/overworld/act-6-swarm-cutscene.ts) |
| Nodos virtuales | [`act-6-map-definition.ts`](../../../../src/services/story/map-definitions/act-6-map-definition.ts) |
| Terminal de código | [`story-node-submission-rules.ts`](../../../../src/services/story/story-node-submission-rules.ts) |
| Contenido BD | [`162_story_act6_red_abierta.sql`](../../../supabase/sql/162_story_act6_red_abierta.sql) |

- **Ambiente:** `CLOUD` — azul nocturno, venas de luz fría. Suelo de **hierba**, no de arena: la red pública
  está viva.
- **Tamaño:** 60×48. Es el único mapa **apaisado** de la campaña: se abre a lo ancho, sin techo ni pasillos.

## Flujo
El acto es deliberadamente **no lineal**: las tres regiones se hacen en el orden que quieras.

| Tramo | Nodos | Cerradura |
|---|---|---|
| Hub | `story-ch6-event-intro`, `story-ch6-event-trail`, servicios, warp al Acto 5 | — |
| Región norte | `story-ch6-duel-1` (Nimbus), `story-ch6-key-north`, `story-ch6-cache-usb` | la llave exige duel-1 |
| Región este | `story-ch6-duel-2`, corriente (cinta), `story-ch6-key-east`, `story-ch6-card-edge` | la llave exige duel-2 |
| Región sur | `story-ch6-duel-3`, `story-ch6-event-swarm` → `story-ch6-duel-4`, `story-ch6-key-south` | la llave exige duel-3 |
| Boca oeste | `story-a6-gate-west` | **las tres** claves de router |
| Borde | `story-ch6-edge-terminal` (SUBMISSION `EDGE-4021-8830`) | las tres claves |
| Cámara | `story-a6-gate-leviathan`, `story-ch6-duel-5` (BOSS) | terminal **+** Enjambre Mayor |
| Salida | `story-ch6-event-foundry`, `story-ch6-transition-to-act7` | vencer al Leviatán |

La clave del terminal **se compone leyendo las tres llaves** (`EDGE-40` + `21-88` + `30`), así que no se puede
resolver por fuerza bruta antes de haber hecho las tres regiones.

### El código no se puede perder (corregido el 2026-09-15)

En la primera versión los tres fragmentos se entregaban **una sola vez**: la consola se marcaba interactuada,
dejaba de dibujarse en el mapa y el diálogo no volvía a abrirse. Quien no se lo apuntara en un papel se quedaba
sin forma de recuperarlo en un mapa de 60×48 con las consolas en esquinas opuestas. Eso no es dificultad, es
peaje. Ahora hay **dos** vías de recuperación, y el puzzle sigue exigiendo visitar las tres regiones:

1. **Las consolas no se agotan.** `isCodeBearingStoryNodeId` (en
   [`story-node-submission-rules.ts`](../../../../src/services/story/story-node-submission-rules.ts)) marca
   los nodos cuyo diálogo contiene un código; el overworld ni los oculta ni los bloquea, así que se releen
   las veces que haga falta. El Acto 3 ya funcionaba así con su registro corrupto.
2. **El propio terminal recuerda lo que llevas.** El diálogo del borde lista los tres routers y enseña el
   fragmento **solo de los que ya has visitado** (los que faltan salen como `· · · ·`). Con los tres, un botón
   *Encadenar fragmentos* compone `EDGE-4021-8830` en el campo. Los fragmentos viven en `keyFragments` de la
   config de submission, y un test comprueba que encadenados dan exactamente el `generatedCode`.

Un nodo que aporte un `keyFragments` nuevo y no esté en la lista de nodos re-leíbles **rompe un test**: es la
misma trampa, y no se puede volver a colar.

## Rivales
| Duelo | Rival | Dificultad | Nivel/tier | Idea de mazo |
|---|---|---|---|---|
| 1-2 | Nimbus | ELITE | 88-90 / t4 | Infraestructura y muros: más DEF que ATK. Gana por agotamiento. |
| 3 | Enjambre | ELITE | 92 / t4 | Inundación: entidades baratas + invocación doble. |
| 4 | Enjambre Mayor | BOSS | 94 / t4 | El enjambre ya coordinado: la misma inundación, con remates. |
| 5 | Leviatán del Borde | MYTHIC | 96 / t5 | Todo lo anterior en un cuerpo. ATK efectivo 3490, DEF 2620. |

## Cinemática firma — "El Enjambre"
En una plaza abierta y sin paredes, **cinco** copias degradadas entran **andando** desde cinco bocas y cierran
un círculo a una casilla del jugador. Ninguna ataca: hablan las cinco a la vez (la misma línea con desfase),
cuatro se apagan y la quinta se queda. Esa es el combate.

El secuenciador de cutscenes es estrictamente secuencial, así que "a la vez" se consigue **intercalando** los
pasos: una casilla por copia y ronda. Visualmente se leen como cinco cuerpos moviéndose juntos y ligeramente
desfasados, que es exactamente el efecto buscado.

## Validación
- `act-6-overworld-tilemap.test.ts`: las tres llaves son alcanzables de salida (simultaneidad real), la boca
  oeste no se abre con dos, y el Leviatán exige terminal + Enjambre.
- `act-6-swarm-cutscene.test.ts`: cinco bocas con ruta real, avance intercalado, y despawn de cuatro.
- `story-node-submission-rules.test.ts`: los fragmentos encadenados reconstruyen el código del terminal, cada
  fragmento cuelga de una llave realmente exigida, las tres consolas son re-leíbles, y el terminal sigue
  rechazando la submission con solo dos regiones hechas.
- `OverworldSubmissionDialog.test.tsx`: el terminal tapa los fragmentos que aún no has recogido y solo ofrece
  encadenar con los tres.

## Curva de dificultad

Los niveles y los **atributos base** de los rivales los fija la migración
[`165_story_acts_5_8_dificultad.sql`](../../../supabase/sql/165_story_acts_5_8_dificultad.sql), no las
migraciones de contenido: aquéllas dejaron los mazos con los stats pelados del catálogo y el acto salía más
blando que el Acto 4. El override fija la BASE de la carta y encima se aplica la curva de nivel, así que el
ATK que ve el jugador es `base + bonus de nivel`.
