<!-- docs/story/NARRACION_OPONENTES.md - Guía de integración de retratos, textos y audios narrativos por oponente Story. -->
# Narración de Oponentes (Story)

## Objetivo

El combate usa narración reactiva sin consultar BD durante la partida.  
El pack se prepara antes del duelo y luego todo corre en memoria.

## Dónde configurar textos/audio/retratos

1. Catálogo tipado:
   - `src/services/story/story-opponent-narration-catalog.ts`
2. Constructor del pack runtime:
   - `src/services/story/build-story-opponent-narration-pack.ts`
3. Claves semánticas obligatorias por oponente:
   - `intro`
   - `trap`
   - `fusion`
   - `directHitToPlayer`
   - `directHitToOpponent`
   - `opponentVictory`
   - `opponentDefeat`

## Estructura de assets recomendada

1. Retratos:
   - `public/assets/story/opponents/<opponent-id>/`
2. Audios:
   - `public/audio/story/<opponent-id>/`

### Oponentes actualmente normalizados (fase 1-2)

1. `opp-ch1-apprentice`
2. `opp-ch1-biglog`
3. `opp-ch1-jaku`
4. `opp-ch1-helena`
5. `opp-ch1-soldier-act01`

### Ejemplo de assets (`opp-ch1-apprentice`)

1. Retratos:
   - `public/assets/story/player/bob.png` (HUD jugador temporal)
   - `public/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png` (HUD)
   - `public/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.png`
   - `public/assets/story/opponents/opp-ch1-apprentice/victoria-GenNvim.png`
   - `public/assets/story/opponents/opp-ch1-apprentice/derrota-GenNvim.png`
2. Audios:
   - `public/audio/story/opp-ch1-apprentice/intro.mp3`
   - `public/audio/story/opp-ch1-apprentice/trampa.mp3`
   - `public/audio/story/opp-ch1-apprentice/impacto-directo-opponente.mp3`
   - `public/audio/story/opp-ch1-apprentice/impacto-directo-jugador.mp3`
   - `public/audio/story/opp-ch1-apprentice/fusion.mp3`
   - `public/audio/story/opp-ch1-apprentice/victoria-oponente.mp3`
   - `public/audio/story/player/fusion.mp3`
   - `public/audio/story/player/impacto-directo.mp3`
   - `public/audio/story/player/trampa.mp3`

## Fallback de audio recomendado

1. Si falta un archivo específico de una línea narrativa:
   - no fuerces `audioUrl` en el override,
   - deja que use el audio base del pack por defecto.
2. Esto evita silencios en victoria/derrota por rutas inexistentes.

## Cómo probar rápido

1. Entra al duelo Story capítulo 1, duelo 1.
2. Verifica:
   - Inicio: overlay lateral con retrato + audio.
   - Fusión del oponente: overlay especial.
   - Si pierdes: diálogo final del oponente.
3. Ataque directo:
   - Debe salir burbuja breve en HUD con audio corto.

## Nota de arquitectura

1. En runtime de combate no hay lecturas de Supabase para narración.
2. Si en futuro quieres CMS/BD:
   - cargar pack en server antes de renderizar `Board`,
   - pasar `narrationPack` como prop,
   - mantener motor del duelo aislado de I/O.
3. El catálogo narrativo es independiente de `story_opponents`.
4. La sincronización con Supabase (IDs finales, dificultad y decks) se realizará en la siguiente fase de integración de oponentes.

## Soundtrack BOSS

1. Duelos con `isBossDuel = true` reproducen música en loop al iniciar combate (tras overlays de entrada).
2. Ruta principal esperada:
   - `public/audio/story/effects/boss-soundtrack.mp3`
3. Fallback automático:
   - `public/audio/story/soundtruck.mp3`
