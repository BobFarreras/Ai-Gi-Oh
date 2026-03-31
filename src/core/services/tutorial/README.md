<!-- src/core/services/tutorial/README.md - Documenta reglas puras del mapa tutorial y su cálculo de estado runtime. -->
# Tutorial Services

Este módulo contiene reglas puras del tutorial:

1. Catálogo de nodos (`resolve-tutorial-node-catalog`).
2. Resolución de estado de nodos (`resolve-tutorial-map-state`).
3. Resolución de recompensa final (`resolve-tutorial-final-reward`).

Nota de diseño actual:
- El mapa expone nodos pendientes como `AVAILABLE`.
- La guía de inicio (forzar "Preparar Deck" primero) se aplica en UI, no en este módulo puro.

No depende de React ni de infraestructura.
