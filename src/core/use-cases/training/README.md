<!-- src/core/use-cases/training/README.md - Casos de uso de aplicación para cierre y progresión del modo entrenamiento. -->
# Training Use Cases

## Alcance

Este módulo orquesta la escritura de progreso y recompensas de entrenamiento sin acoplar UI ni adaptadores HTTP.

## Caso de uso actual

1. `CompleteTrainingMatchUseCase`
   - valida cierre de partida,
   - aplica idempotencia por `battleId`,
   - actualiza progreso de tiers,
   - acredita Nexus y experiencia de jugador.

## Dependencias requeridas

1. `ITrainingMatchClaimRepository`
2. `ITrainingProgressRepository`
3. `IWalletRepository`
4. `IPlayerProgressRepository`
