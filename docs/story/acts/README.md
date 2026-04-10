<!-- docs/story/acts/README.md - Índice modular del modo historia por actos y reglas de diseño. -->
# Story por Actos

## Objetivo
1. Dividir la narrativa Story en módulos pequeños y trazables.
2. Asegurar que cada acto documente flujo de nodos, ramas, duelos y progresión.
3. Evitar que un único documento concentre demasiadas responsabilidades.

## Estructura
1. [Guía de construcción](./ACT-BUILD-GUIDE.md)
2. [Plantilla README de acto](./ACT-README-TEMPLATE.md)
3. [Acto 1](./act-1/README.md)
4. [Acto 2](./act-2/README.md)
5. [Acto 3](./act-3/README.md)
6. [Acto 4](./act-4/README.md)
7. [Acto 5](./act-5/README.md)

## Convención de nodos
1. `MOVE`: tránsito y posicionamiento.
2. `EVENT`: diálogo/interacción narrativa.
3. `DUEL`: combate estándar.
4. `BOSS`: combate de cierre de tramo.
5. `REWARD_NEXUS`: recompensa económica.
6. `REWARD_CARD`: recompensa de carta.

## Regla de dificultad (sin cantidad fija de duelos)
1. Cada acto puede tener la cantidad de duelos que requiera su diseño.
2. La dificultad se distribuye por progreso relativo dentro del acto:
   - inicio más accesible,
   - tramo medio de presión,
   - tramo final de alta exigencia.
3. El acto siguiente no debe reiniciar en dificultad inferior al suelo del acto previo.
4. La dificultad por aparición se define por duelo en `story_duel_ai_profiles`, no en `story_opponents`.
5. El escalado de mazo por aparición se define en `story_duel_deck_overrides`.

## Contrato de documentación por acto
1. Resumen narrativo.
2. Flujo principal de nodos.
3. Ramas secundarias.
4. Mapa de duelos y progresión de dificultad.
5. Entradas de vídeo/cinemática.
6. Criterios de validación del acto.
