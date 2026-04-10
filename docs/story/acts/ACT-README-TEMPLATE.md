<!-- docs/story/acts/ACT-README-TEMPLATE.md - Plantilla base para documentar actos Story con estructura uniforme. -->
# Acto X - Nombre del Acto (Líder)

## Resumen narrativo
1. Contexto inicial del acto.
2. Objetivo operativo del jugador.
3. Riesgo principal de la facción.
4. Condición de cierre.

## Flujo principal de nodos
| nodeId | Tipo | Propósito | Recompensa |
|---|---|---|---|
| `story-chX-player-start` | `MOVE` | Entrada al acto. | - |
| `story-chX-event-core` | `EVENT` | Briefing principal. | - |
| `story-chX-duel-1` | `DUEL` | Primer filtro táctico. | Nexus + XP |
| `story-chX-duel-N` | `BOSS` | Cierre del acto. | Recompensa de acto |
| `story-chX-transition-to-actY` | `EVENT` | Transición al siguiente acto. | Desbloqueo Acto Y |

## Subrutas
| nodeId | Tipo | Propósito | Resultado |
|---|---|---|---|
| `story-chX-branch-a-event` | `EVENT` | Señal/llave de subruta. | - |
| `story-chX-branch-a-duel` | `DUEL` | Evaluación o riesgo extra. | Nexus + XP |
| `story-chX-bridge-submission` | `EVENT` | Activación de puente principal. | Habilita avance |

## Progresión de dificultad del acto
1. Suelo de inicio: `...`
2. Tramo medio: `...`
3. Tramo final: `...`
4. Referencias reales en BD: `story_duel_ai_profiles` + `story_duel_deck_overrides`.

## Cinemáticas y eventos
1. Nodo de vídeo (si aplica): `nodeId`.
2. Eventos terminal/dialogados: `nodeId`.
3. Eventos de activación (submission/handshake): `nodeId`.

## Validación del acto
1. Sin retroceso automático en subrutas.
2. Avance bloqueado si no se resuelve nodo requerido.
3. Puente principal bloqueado hasta activación de subruta.
4. Transición de acto habilitada solo tras cierre requerido.
