<!-- src/components/hub/market/internal/README.md - Explica estado interno del market, store Zustand y acciones de compra. -->
# Internos de Market

## Responsabilidad

Orquestar estado de escena, acciones de compra y conciliación optimista del módulo `market`.

## Componentes clave

1. Store local basada en Zustand para estado de escena.
2. Hooks de acciones (`buy-card`, `buy-pack`) con reconciliación de snapshot servidor.
3. Helpers de errores y feedback visual.

## Regla

No incluir render UI en este nivel; solo estado y orquestación.

