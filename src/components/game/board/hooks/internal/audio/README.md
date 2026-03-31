<!-- src/components/game/board/hooks/internal/audio/README.md - Convenciones de audio por acción de efecto para combate. -->
# Audio por efecto (`effect.action`)

## Estructura de carpetas
- `public/audio/sfx/effects/execution/`
- `public/audio/sfx/effects/trap/`

## Convención de nombre
- Nombre de archivo = `effect.action` en minúsculas y con `_`.
- Ejemplos:
  - `DAMAGE` -> `damage.mp3`
  - `DRAW_CARD` -> `draw_card.mp3`
  - `NEGATE_OPPONENT_TRAP_AND_DESTROY` -> `negate_opponent_trap_and_destroy.mp3`

## Flujo de reproducción
1. `useGameAudio` procesa `combatLog`.
2. `resolveEffectAudioPath` intenta ruta específica por acción.
3. Si el archivo falla/no existe, `safePlayWithFallback` usa el sonido genérico de `mapEventToTrack`.

## Resultado
- Puedes añadir nuevos `.mp3` por efecto sin tocar lógica.
- Si falta un archivo, el combate no se queda sin sonido.
