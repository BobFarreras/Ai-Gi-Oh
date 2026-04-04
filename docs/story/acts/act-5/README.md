<!-- docs/story/acts/act-5/README.md - Especificación funcional del Acto 5 para cierre de campaña contra La Entidad. -->
# Acto 5 - Core Invertido (La Entidad)

## Resumen narrativo
1. El jugador entra al núcleo con información acumulada de facciones.
2. La Entidad adapta su presión al estilo del jugador.
3. El acto cierra la campaña principal.

## Flujo de nodos
1. Entrada al borde del Core.
2. Evento de contacto directo.
3. Tramo de duelos de guardianes.
4. Evento de colapso del núcleo.
5. Boss final y epílogo.

## Contenido del acto
1. `MOVE` para progresión final.
2. `EVENT` para secuencias de cierre narrativo.
3. `REWARD_NEXUS`/`REWARD_CARD` opcionales de tramo final.
4. `DUEL` de alta exigencia.
5. `BOSS` final de campaña.

## Regla de dificultad del acto
1. Rango alto sostenido durante todo el acto.
2. El boss final debe usar la configuración más exigente del balance activo.
3. Ramas secundarias post-campaña pueden reutilizar dificultad máxima.

## Validación del acto
1. Mantener compatibilidad total con motor de combate base.
2. Cierre narrativo sin reglas especiales que rompan consistencia de tablero.
