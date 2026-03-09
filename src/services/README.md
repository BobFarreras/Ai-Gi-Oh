<!-- src/services/README.md - Mapa de servicios de aplicación y orquestación entre UI, core e infraestructura. -->
# Módulo de Servicios

## Objetivo

Orquestar flujos de aplicación sin meter lógica de render en UI ni detalles de framework en `core/`.

## Qué encontrarás

1. `auth/`: acciones y servicios HTTP para autenticación.
2. `game/`: controladores de match y progresión post-duelo.
3. `home/`: acciones del constructor de deck.
4. `hub/`: composición de datos para dashboard central.
5. `market/`: clientes de acciones de compra/catálogo.
6. `player-persistence/`: fábricas de repositorios por entorno.
7. `story/`: composición de mapa/duelos de campaña.
8. `performance/`: telemetría de desarrollo para rendimiento.

## Regla de dependencia

`components/app -> services -> core` y servicios usan infraestructura solo para composición de repositorios.

