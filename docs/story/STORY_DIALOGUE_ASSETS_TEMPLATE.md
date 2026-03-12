<!-- docs/story/STORY_DIALOGUE_ASSETS_TEMPLATE.md - Plantilla operativa para preparar textos, retratos y audios de diálogos Story. -->
# Plantilla de Assets Narrativos Story

## Objetivo

Usar una convención única para rellenar contenido de diálogos (`texto`, `imagen`, `audio`) por nodo virtual sin tocar lógica de motor.

## Ubicaciones

1. Retratos: `public/assets/story/dialogues/`
2. Audios: `public/audio/story/dialogues/`
3. Textos y mapeo: `src/services/story/resolve-story-node-interaction-dialogue.ts`
4. Rutas multimedia: `src/services/story/story-node-dialogue-media.ts`

## Convención de nombres

1. Imagen: `<node-id>-line-<NN>.png`
2. Audio: `<node-id>-line-<NN>.mp3`

Ejemplo:
- `story-ch1-event-briefing-line-01.png`
- `story-ch1-event-briefing-line-01.mp3`

## Nodos actuales

1. `story-ch1-event-briefing`
2. `story-ch1-reward-cache`
3. `story-ch2-event-signal`
4. `story-ch2-reward-card`

## Plantilla por línea

| nodeId | lineIndex | speaker | text | portraitUrl | audioUrl |
|---|---:|---|---|---|---|
| `story-ch1-event-briefing` | 0 | `Canal de mando` | `...` | `/assets/story/dialogues/story-ch1-event-briefing-line-01.png` | `/audio/story/dialogues/story-ch1-event-briefing-line-01.mp3` |
| `story-ch1-event-briefing` | 1 | `Canal de mando` | `...` | `/assets/story/dialogues/story-ch1-event-briefing-line-02.png` | `/audio/story/dialogues/story-ch1-event-briefing-line-02.mp3` |
| `story-ch1-reward-cache` | 0 | `Sistema` | `...` | `/assets/story/dialogues/story-ch1-reward-cache-line-01.png` | `/audio/story/dialogues/story-ch1-reward-cache-line-01.mp3` |
| `story-ch2-event-signal` | 0 | `Canal cifrado` | `...` | `/assets/story/dialogues/story-ch2-event-signal-line-01.png` | `/audio/story/dialogues/story-ch2-event-signal-line-01.mp3` |
| `story-ch2-event-signal` | 1 | `Canal cifrado` | `...` | `/assets/story/dialogues/story-ch2-event-signal-line-02.png` | `/audio/story/dialogues/story-ch2-event-signal-line-02.mp3` |
| `story-ch2-reward-card` | 0 | `Sistema` | `...` | `/assets/story/dialogues/story-ch2-reward-card-line-01.png` | `/audio/story/dialogues/story-ch2-reward-card-line-01.mp3` |

## Checklist de integración

1. Añadir PNG/MP3 en carpetas `public/`.
2. Actualizar rutas en `story-node-dialogue-media.ts`.
3. Ajustar textos en `resolve-story-node-interaction-dialogue.ts`.
4. Validar en `/hub/story` que cada línea muestra imagen y audio correctos.
