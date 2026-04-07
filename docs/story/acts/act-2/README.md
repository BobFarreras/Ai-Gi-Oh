<!-- docs/story/acts/act-2/README.md - Especificación funcional del Acto 2 con rutas de facción, nodos críticos y progresión de dificultad intermedia. -->
# Acto 2 - Valle Visual (Helena)

## Resumen narrativo
1. Helena protege el valle y cuestiona al jugador.
2. La Entidad contamina plantillas y bloqueos visuales.
3. El acto combina rutas de control, evaluación BigLog y cierre de facción.

## Flujo de nodos
1. Nodo de entrada del acto.
2. Evento de advertencia de facción.
3. Tramo de duelos intermedios y recompensas.
4. Evento crítico de corrupción.
5. Subruta de evaluación contra BigLog (`story-ch2-duel-8`).
6. Submission de sincronización para abrir el puente principal.
7. Duelo de cierre y transición al siguiente acto (`story-ch2-transition-to-act3`).
8. El jugador vuelve desde la subruta al eje principal para cruzar el puente ya activado.

## Contenido del acto
1. `MOVE` para recorrido y bifurcaciones.
2. `EVENT` para narrativa y evidencia de corrupción.
3. `REWARD_NEXUS` y `REWARD_CARD` para preparación de mazo.
4. `DUEL` para filtros de progresión (incluye evaluación mentor BigLog).
5. `EVENT` de tipo submission para desbloqueo de pasarela.
6. `BOSS` para cierre de facción.

## Regla de dificultad del acto
1. El suelo de inicio debe ser igual o superior al cierre real del acto previo.
2. El tramo final debe subir al menos un nivel frente al inicio.
3. La distribución exacta se define por duelo en BD, no en este documento.

## Validación del acto
1. Ramas secundarias no rompen avance principal.
2. Bloqueos de ruta respetan secuencia nodo a nodo.
3. El puente al boss requiere completar la submission `story-ch2-bridge-submission`.
4. La submission requiere resolver antes la subruta de evaluación `story-ch2-duel-8`.
5. Transición de acto solo tras resolver cierre requerido.
