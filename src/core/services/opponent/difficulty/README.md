<!-- src/core/services/opponent/difficulty/README.md - Perfiles y resolución de dificultad para el bot rival. -->
# Módulo de Dificultad de Oponente

Este módulo separa la dificultad del rival de la historia real de campaña.

## Qué problema resuelve

1. Permite tener IA escalable aunque la campaña aún no esté implementada.
2. Evita hardcodear comportamiento en componentes UI.
3. Facilita tunear dificultad sin tocar reglas del motor.

## Archivos

1. `types.ts`
   - `OpponentDifficulty`: niveles soportados (`EASY`, `NORMAL`, `HARD`, `BOSS`, `MASTER`, `MYTHIC`).
   - `ICampaignProgress`: datos mínimos de progreso para resolver nivel.
   - `IOpponentDifficultyProfile`: pesos heurísticos por dificultad.

2. `difficultyProfiles.ts`
   - Mapa de pesos por nivel.
   - Controla agresividad, aversión al riesgo y umbral de ataque.
   - `EASY` acepta más jugadas malas.
   - `HARD/BOSS/MASTER/MYTHIC` castiga más autodaño y pérdidas de valor.

3. `resolveDifficultyFromCampaign.ts`
   - Traduce progreso (`chapterIndex`, `duelIndex`, `victories`) a nivel de dificultad.
   - Diseñado para sustituir fácilmente por lógica narrativa real.

4. `story-ai-profile.ts`
   - Normaliza `ai_profile` (`style`, `aggression`) con defaults seguros.
   - Evita payloads incompletos o inválidos en runtime/admin.

5. `resolve-opponent-difficulty-profile.ts`
   - Combina dificultad base (`EASY|NORMAL|HARD|BOSS`) con `ai_profile`.
   - Traduce `style/aggression` a pesos heurísticos finales.
   - Es la puerta recomendada para ajustar personalidad de IA sin tocar motor.

6. `src/services/training/internal/training-card-scaling.ts`
   - Aplica `versionTier`, `level` y `xp` por dificultad efectiva de Training.
   - Mantiene mismas stats para todas las copias del mismo deck rival.

## Cómo se usa hoy

1. `useBoard` crea un `campaignProgress` temporal.
2. `resolveDifficultyFromCampaign` devuelve el nivel.
3. `HeuristicOpponentStrategy` usa `resolve-opponent-difficulty-profile`:
   - en modos genéricos: sólo dificultad base.
   - en Story: dificultad base + `ai_profile` del duelo.
4. En Training:
   - `resolve-training-opponent-loadout` calcula dificultad adaptativa.
   - Con esa dificultad aplica escalado estático de cartas (`training-card-scaling`).

## Qué cambiar cuando exista campaña real

1. Sustituir el estado mock de `campaignProgress` por un `CampaignProgressRepository`.
2. Mantener `resolveDifficultyFromCampaign` como única puerta de entrada.
3. Ajustar perfiles tras playtesting por capítulo/oponente.



