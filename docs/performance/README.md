<!-- docs/performance/README.md - Guía para activar telemetría de rendimiento en desarrollo y revisar métricas de interacción. -->
# Telemetría de Rendimiento (Desarrollo)

## Fase 1: Baseline y objetivos

Usa esta guía para capturar una línea base reproducible:

1. [Protocolo Fase 1](./PHASE-1-BASELINE.md)
2. [Plantilla de reporte](./BASELINE-REPORT-TEMPLATE.md)
3. Comando automático: `pnpm perf:baseline:mobile`

## Activación

1. Abre la app en navegador.
2. Ejecuta en consola:

```js
localStorage.setItem("debug-performance", "1");
location.reload();
```

## Lectura de métricas

1. Render counters por componente:

```js
window.__AIGIOH_PERF__?.renders
```

2. Muestras de latencia por interacción:

```js
window.__AIGIOH_PERF__?.interactions
```

## Reset rápido

```js
window.__AIGIOH_PERF__ = { renders: {}, interactions: [] };
```

## Política de resultados versionados

1. `docs/performance/results/` no debe acumular históricos locales de cada ejecución.
2. Se conserva solo `.gitkeep` y reportes curados que se referencien explícitamente en una fase.
3. Los resultados automáticos locales (`baseline-mobile-*.json/.md`) se consideran artefactos temporales y se pueden limpiar.

## Interacciones instrumentadas

1. `board.playAction`
2. `board.activateSelectedExecution`
3. `market.buyCard`
4. `market.buyPack`
5. `home.insertCard`
6. `home.removeCard`
7. `home.evolveCard`
