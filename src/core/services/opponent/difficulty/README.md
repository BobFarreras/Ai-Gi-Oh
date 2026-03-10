<!-- src/core/services/opponent/difficulty/README.md - Perfiles y resolución de dificultad para el bot rival. -->
# Módulo de Dificultad de Oponente

Este módulo separa la dificultad del rival de la historia real de campaña.

## Qué problema resuelve

1. Permite tener IA escalable aunque la campaña aún no esté implementada.
2. Evita hardcodear comportamiento en componentes UI.
3. Facilita tunear dificultad sin tocar reglas del motor.

## Archivos

1. `types.ts`
   - `OpponentDifficulty`: niveles soportados (`EASY`, `NORMAL`, `HARD`, `BOSS`).
   - `ICampaignProgress`: datos mínimos de progreso para resolver nivel.
   - `IOpponentDifficultyProfile`: pesos heurísticos por dificultad.

2. `difficultyProfiles.ts`
   - Mapa de pesos por nivel.
   - Controla agresividad, aversión al riesgo y umbral de ataque.
   - `EASY` acepta más jugadas malas.
   - `HARD/BOSS` castiga más autodaño y pérdidas de valor.

3. `resolveDifficultyFromCampaign.ts`
   - Traduce progreso (`chapterIndex`, `duelIndex`, `victories`) a nivel de dificultad.
   - Diseñado para sustituir fácilmente por lógica narrativa real.

## Cómo se usa hoy

1. `useBoard` crea un `campaignProgress` temporal.
2. `resolveDifficultyFromCampaign` devuelve el nivel.
3. `HeuristicOpponentStrategy` recibe ese nivel y aplica el perfil.

## Qué cambiar cuando exista campaña real

1. Sustituir el estado mock de `campaignProgress` por un `CampaignProgressRepository`.
2. Mantener `resolveDifficultyFromCampaign` como única puerta de entrada.
3. Ajustar perfiles tras playtesting por capítulo/oponente.



