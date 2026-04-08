<!-- docs/story/acts/act-2/NARRATIVE-NODES.md - Guion narrativo por nodo de evento del Acto 2 con intención dramática y formato. -->
# Acto 2 - Guion por Nodos de Evento

## Objetivo
1. Mantener trazable qué cuenta cada evento del acto.
2. Evitar diálogos genéricos sin función de misión.
3. Dejar claro cuándo un nodo usa diálogo terminal o vídeo.

## Nodos de evento activos
| nodeId | Formato | Intención narrativa | Resultado de gameplay |
|---|---|---|---|
| `story-ch2-event-core` | Vídeo + diálogo terminal (BigLog + Jugador) | Presentar el Valle Visual, amenaza de Helena y objetivo de limpiar ramas. | Abre comprensión del acto y marca prioridades tácticas. |
| `story-ch2-branch-lower-up-event` | Diálogo terminal | Introducir la primera mitad de la llave de pasarela. | Justifica que el puente principal siga bloqueado. |
| `story-ch2-link-recovered-event` | Diálogo terminal | Confirmar la recuperación de la segunda mitad del link tras combatir a Helena. | Cierra el arco narrativo de adquisición del link. |
| `story-ch2-bridge-submission` | Diálogo terminal | Confirmar handshake y submission final de enlace. | Desbloquea el puente en la ruta principal. |
| `story-ch2-duel-8` | Diálogo terminal pre-duelo | BigLog evalúa al jugador antes de permitir el avance al puente. | Se ejecuta briefing antes de iniciar el combate. |
| `story-ch2-transition-to-act1` | Mensaje sistema corto | Retorno táctico al acto previo. | Cambia a Acto 1. |
| `story-ch2-transition-to-act3` | Mensaje sistema corto | Cierre del sector Helena y salto al siguiente teatro. | Cambia a Acto 3. |

## Vídeo del primer evento
1. Asset activo de `story-ch2-event-core`:
   `public/assets/videos/story/act-2/intro-act-2.mp4`.
