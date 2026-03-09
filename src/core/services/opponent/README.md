<!-- src/core/services/opponent/README.md - Estrategia y heurísticas de toma de decisiones del oponente IA. -->
# Módulo de Servicio de Oponente

Estrategias de toma de decisiones para el rival.

## Objetivo

1. Separar la lógica de decisión del oponente del motor base.
2. Permitir cambiar estrategia sin tocar UI ni `GameEngine`.
3. Soportar evolución a LLM y multiplayer.

## Contratos

1. `types.ts`
   - `IOpponentStrategy`
   - `IOpponentPlayDecision`
   - `IOpponentAttackDecision`

2. `runOpponentStep.ts`
   - Ejecuta un paso del turno rival según fase.
   - Ciclo actual: `MAIN_1 -> BATTLE -> cambio de turno`.
   - En `MAIN_1` puede encadenar varias jugadas en pasos consecutivos mientras sigan siendo válidas.
   - En `BATTLE` mantiene el turno hasta agotar atacantes disponibles.
   - Usa `GameEngine` para aplicar la acción elegida.

3. `HeuristicOpponentStrategy.ts`
   - Implementación actual sin IA generativa.
   - Selecciona jugadas con heurísticas de valor/coste.
   - Evalúa ataques por utilidad táctica:
     - daño esperado,
     - ventaja de mesa,
     - oportunidad de lethal,
     - riesgo de autodaño,
     - pérdida de valor del atacante.
   - Filtra ataques suicidas por dificultad:
     - `EASY`: comete más errores (menos filtros).
     - `NORMAL`: evita autodaño alto.
     - `HARD/BOSS`: evita trades perdedores y autodaño salvo `lethal` o limpieza de amenaza crítica.
   - Soporta fusión mínima: si hay carta `FUSION` + materiales válidos, puede invocar por fusión.

4. `difficulty/*`
   - `types.ts`: contratos de dificultad y progreso de campaña.
   - `difficultyProfiles.ts`: perfiles por nivel (`EASY`, `NORMAL`, `HARD`, `BOSS`).
   - `resolveDifficultyFromCampaign.ts`: resolución de nivel según progreso.

## Dificultad (roadmap)

Para añadir niveles de dificultad, se recomienda:

1. Inyectar progreso real de campaña en lugar del mock local de `useBoard`.
2. Ajustar umbrales de `resolveDifficultyFromCampaign` tras playtesting.
3. Afinar perfiles por oponente (agresivo/control/combo) encima del nivel base.

## Extensión futura

1. `LlmOpponentStrategy` implementando `IOpponentStrategy`.
2. `RemotePlayerStrategy` para multijugador real.
3. Selección de estrategia por partida vía DI/configuración.


