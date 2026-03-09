<!-- src/components/game/card/README.md - Documenta la capa visual de cartas y sus subcomponentes de frame/efectos. -->
# Módulo de Cartas

## Responsabilidad

Renderizar cartas del juego (entidad, ejecución, trampa, fusión) con variantes visuales y estados de interacción.

## Estructura

1. `Card.tsx`: contenedor principal de carta interactiva.
2. `CardBack.tsx`: reverso de carta.
3. `internal/`: frame, holograma, estilos de facción y piezas visuales.

## Notas de rendimiento

1. En móvil se usa modo de holograma ligero para mantener fluidez.
2. Los efectos visuales pesados deben quedar detrás de flags de performance.

