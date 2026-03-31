<!-- src/core/use-cases/tutorial/README.md - Describe casos de uso de aplicación del sistema tutorial. -->
# Tutorial Use Cases

Casos de uso de aplicación para orquestar estado del tutorial:

1. `GetTutorialMapStateUseCase`: devuelve el runtime del mapa de nodos para la UI.
2. `CompleteTutorialNodeUseCase`: persiste completion idempotente de nodos funcionales.
3. `ClaimTutorialFinalRewardUseCase`: valida elegibilidad y aplica claim final único.

Las reglas de dominio viven en `core/services/tutorial`.
