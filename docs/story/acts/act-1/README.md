<!-- docs/story/acts/act-1/README.md - Especificación funcional del Acto 1 con flujo de nodos, rama secundaria y curva inicial de dificultad. -->
# Acto 1 - Protocolo de Emergencia (BigLog)

## Resumen narrativo
1. BigLog establece el contexto de crisis global.
2. El jugador aprende navegación de rutas, economía Nexus y eventos.
3. Se introduce rama secundaria de riesgo/recompensa.
4. El cierre abre transición al Acto 2.

## Flujo principal de nodos
| nodeId | Tipo | Propósito | Recompensa |
|---|---|---|---|
| `story-ch1-player-start` | `MOVE` | Punto de entrada del acto. | - |
| `story-a1-event-biglog-briefing` | `EVENT` | Briefing de crisis y misión. | - |
| `story-a1-move-transit` | `MOVE` | Tránsito a eje principal. | - |
| `story-a1-reward-nexus-cache` | `REWARD_NEXUS` | Primer cache de recursos. | Nexus |
| `story-a1-event-special-card-signal` | `EVENT` | Señal de carta/rama lateral. | Marca narrativa |
| `story-ch1-duel-1` | `DUEL` | Primer enfrentamiento del acto. | Nexus + XP |
| `story-a1-reward-card-guardian` | `REWARD_CARD` | Carta táctica base. | Carta |
| `story-a1-move-main-bridge` | `MOVE` | Puente al tramo final. | - |
| `story-ch1-duel-3` | `DUEL` | Filtro de presión media. | Nexus + XP |
| `story-ch2-duel-3` | `DUEL` | Pre-cierre de acto. | Nexus + XP |
| `story-ch2-duel-4` | `BOSS` | Cierre de acto. | Recompensa de acto |
| `story-ch1-transition-to-act2` | `EVENT` | Transición al acto siguiente. | Desbloqueo Acto 2 |

## Rama secundaria
| nodeId | Tipo | Propósito | Resultado |
|---|---|---|---|
| `story-a1-side-event-echo-fragment` | `EVENT` | Señal lateral de riesgo. | - |
| `story-a1-side-move-scraper-path` | `MOVE` | Entrada a rama secundaria. | - |
| `story-ch1-duel-2` | `DUEL` | Duelo opcional de presión temprana. | Nexus + XP |
| `story-a1-side-reward-card` | `REWARD_CARD` | Recompensa táctica opcional. | Carta |

## Progresión de dificultad del acto
1. No depende de número fijo de duelos.
2. Distribución actual del acto:
   - `story-ch1-duel-1`: `ROOKIE`
   - `story-ch1-duel-2`: `STANDARD`
   - `story-ch1-duel-3`: `ELITE`
   - `story-ch2-duel-3`: `ELITE`
   - `story-ch2-duel-4`: `BOSS`
3. El escalado por duelo se materializa en `story_duel_ai_profiles` y `story_duel_deck_overrides`.

## Cinemática
1. Evento de vídeo full-screen en `story-a1-event-special-card-signal`.
2. Botón flotante para interrumpir vídeo.
3. El vídeo no altera reglas del motor de combate.

## Validación del acto
1. No hay retroceso automático en ramas secundarias.
2. No se avanza de plataforma sin resolver el nodo activo.
3. Derrota en rama secundaria deja la rama pendiente para reintento manual.
