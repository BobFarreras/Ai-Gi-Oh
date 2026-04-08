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
| `story-ch2-duel-7` | Diálogo directo pre-duelo (Helena + Jugador) | Amenaza inmediata antes del boss final del acto. | Se ejecuta antes de entrar al combate del boss. |
| `story-ch2-duel-7-post-win` | Diálogo directo post-victoria (Helena + Jugador) | Rendición de Helena tras la derrota. | Se ejecuta antes de la animación de retirada del nodo boss. |
| `story-ch2-transition-to-act1` | Mensaje sistema corto | Retorno táctico al acto previo. | Cambia a Acto 1. |
| `story-ch2-transition-to-act3` | Mensaje sistema corto | Cierre del sector Helena y salto al siguiente teatro. | Cambia a Acto 3. |

## Vídeo del primer evento
1. Asset activo de `story-ch2-event-core`:
   `public/assets/videos/story/act-2/intro-act-2.mp4`.

## Visuales de nodos EVENT
1. Se elimina icono hardcode genérico de ChatGPT en nodos EVENT.
2. `story-ch2-branch-lower-up-event` usa `public/assets/story/llave-1.webp`.
3. `story-ch2-link-recovered-event` usa `public/assets/story/llave-2.webp`.
4. Resto de eventos usan icono genérico de diálogo/evento.
5. En nodos `EVENT` narrativos, al cerrar diálogo se dispara animación de recogida (el icono se contrae hacia el avatar del jugador).
