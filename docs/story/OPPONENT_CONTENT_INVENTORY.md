<!-- docs/story/OPPONENT_CONTENT_INVENTORY.md - Inventario operativo de assets narrativos por oponente Story. -->
# Inventario de Contenido de Oponentes (Fase 2)

## Objetivo
Trazar qué contenido narrativo está cargado en proyecto y qué falta por subir antes de integrar los 4 oponentes nuevos en mapa/duelos.

## Fuente de verdad
1. Contrato tipado: `src/services/story/story-opponent-narration-catalog.ts`
2. Construcción runtime del pack: `src/services/story/build-story-opponent-narration-pack.ts`

## Estado de assets (2026-03-16)
| Opponent ID | Perfil narrativo | Audios en `public/audio/story/<id>` | Imágenes en `public/assets/story/opponents/<id>` |
| --- | --- | --- | --- |
| `opp-ch1-apprentice` | Completo | Completo | Completo |
| `opp-ch1-biglog` | Completo (contrato) | Pendiente de subir | Pendiente de subir |
| `opp-ch1-jaku` | Completo (contrato) | Pendiente de subir | Pendiente de subir |
| `opp-ch1-helena` | Completo (contrato) | Pendiente de subir | Pendiente de subir |
| `opp-ch1-soldier-act01` | Completo (contrato) | Pendiente de subir | Pendiente de subir |

## Estado de persistencia Story (Fase 3)
1. La migración `017_phase_5_2_story_opponent_roster_expansion.sql` deja el roster en Supabase con:
   - `opp-ch1-apprentice` mostrado como `GenNvim`.
   - alta de `opp-ch1-biglog`, `opp-ch1-jaku`, `opp-ch1-helena`, `opp-ch1-soldier-act01`.
2. También crea mazos dedicados (`story_deck_lists` + `story_deck_list_cards`) para cada nuevo oponente.
3. En esta fase no se añaden nodos de mapa ni nuevos duelos visibles; eso se integra en la fase de layout Story.

## Nomenclatura acordada
1. Retratos: `intro-<Nombre>.png`, `victoria-<Nombre>.png`, `derrota-<Nombre>.png`, `avatar-<Nombre>.png`.
2. Audios base por oponente:
   - `intro.mp3`
   - `trampa.mp3`
   - `fusion.mp3`
   - `impacto-directo-jugador.mp3`
   - `impacto-directo-opponente.mp3`
   - `victoria-oponente.mp3`
   - `derrota-oponente.mp3`
3. Excepción permitida (ya modelada): `opp-ch1-soldier-act01` usa `intro-combate.mp3` y variantes de victoria/derrota con sufijo.
