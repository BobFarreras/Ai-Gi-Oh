<!-- docs/game-engine/05-opponent-ai-and-match-runtime.md - IA rival heurística y contratos desacoplados del runtime de match. -->
# IA Rival y Runtime de Match

## IA heurística del oponente

1. Servicio: `runOpponentStep`.
2. Estrategia: `HeuristicOpponentStrategy`.
3. Decisión por fase:
   - `MAIN_1`: jugar mejor carta válida,
   - `BATTLE`: seleccionar mejor ataque viable.
4. Inteligencia de fusión por ejecución (sin depender de dificultad):
   - Nunca activa `FUSION_SUMMON` si faltan materiales reales de receta.
   - Si tiene mágica de fusión y falta material, prioriza invocar el material faltante.
   - Si la zona de entidades está llena y falta material, reemplaza la entidad menos valiosa no crítica para la receta.
   - Si la zona de ejecuciones está llena y necesita setear la mágica de fusión, reemplaza una slot no activada de menor valor.
   - Si no puede activar aún, prioriza setear la ejecución para turno de preparación.
   - Si una ejecución seteada pasa a ser válida, el bot la cambia a `ACTIVATE` antes de cerrar `MAIN_1`.
5. Selección automática de materiales pendientes:
   - Para `SELECT_FUSION_MATERIALS`, el bot selecciona entidades válidas por receta en vez de elegir cualquier carta de campo.

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
