<!-- docs/game-engine/05-opponent-ai-and-match-runtime.md - IA rival heurística y contratos desacoplados del runtime de match. -->
# IA Rival y Runtime de Match

## IA heurística del oponente

1. Servicio: `runOpponentStep`.
2. Estrategia: `HeuristicOpponentStrategy`.
3. Decisión por fase:
   - `MAIN_1`: jugar mejor carta válida,
   - `BATTLE`: seleccionar mejor ataque viable.

## Runtime de match desacoplado (Fase 0)

1. Contratos en `core/entities/match` para modos:
   - `TRAINING`, `STORY`, `MULTIPLAYER`, `TUTORIAL`.
2. Frontera: `IMatchController`.
3. Implementación local: `LocalMatchController` + `createMatchController`.

## Recompensas por modo desacopladas (Fase 1)

1. Política pura: `core/services/match/rewards/match-reward-policy.ts`.
2. Calcula `nexus` y `playerExperience`.
3. Reglas:
   - `TUTORIAL`: 0.
   - `STORY`: escalado por tier rival.
   - `TRAINING` y `MULTIPLAYER`: curvas separadas.
