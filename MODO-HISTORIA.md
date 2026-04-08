<!-- MODO-HISTORIA.md - Documento índice del modo historia con reglas globales y enlaces a documentación modular por acto. -->
# Modo Historia: La Guerra del Código

## Objetivo del documento
1. Servir como resumen ejecutivo de campaña.
2. Centralizar reglas globales del modo Story.
3. Enlazar la documentación modular por acto.

## Premisa global
1. Año 2050: el ciberespacio queda fracturado por conflicto entre facciones.
2. La Entidad reprograma nodos y degrada infraestructura crítica.
3. El jugador, Prompt Master, restaura rutas y control operativo hasta el Core.

## Reglas globales de campaña
1. Sin retroceso automático en ramas secundarias.
2. No se puede avanzar sin resolver el nodo de progresión requerido.
3. Si se pierde en una rama secundaria, queda pendiente para reintento manual.
4. El motor de combate es único para todos los actos (sin reglas especiales ad hoc).
5. Todo evento relevante de turno/fase/combate debe reflejarse en `combatLog`.

## Convención de nodos
1. `MOVE`
2. `EVENT`
3. `DUEL`
4. `BOSS`
5. `REWARD_NEXUS`
6. `REWARD_CARD`

## Documentación modular por actos
1. Índice general: [docs/story/acts/README.md](docs/story/acts/README.md)
2. Acto 1: [docs/story/acts/act-1/README.md](docs/story/acts/act-1/README.md)
3. Acto 2: [docs/story/acts/act-2/README.md](docs/story/acts/act-2/README.md)
4. Acto 3: [docs/story/acts/act-3/README.md](docs/story/acts/act-3/README.md)
5. Acto 4: [docs/story/acts/act-4/README.md](docs/story/acts/act-4/README.md)
6. Acto 5: [docs/story/acts/act-5/README.md](docs/story/acts/act-5/README.md)

## Regla de dificultad profesional
1. No existe cantidad fija de duelos por acto.
2. La curva se define por progreso relativo del acto: inicio más accesible y cierre más exigente.
3. El acto siguiente empieza con suelo de dificultad igual o superior al cierre anterior.
4. La dificultad por aparición se define por duelo en `story_duel_ai_profiles`.
5. El escalado de deck por aparición se define por duelo en `story_duel_deck_overrides`.

## Estado de implementación
1. Acto 1 ya tiene mapa, rama secundaria, cinemática de evento y escalado por duelo.
2. Actos 2-5 quedan documentados en módulos dedicados para implementación incremental.
