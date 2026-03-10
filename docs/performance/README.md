<!-- docs/performance/README.md - Guía para activar telemetría de rendimiento en desarrollo y revisar métricas de interacción. -->
# Telemetría de Rendimiento (Desarrollo)

## Fase 1: Baseline y objetivos

Usa esta guía para capturar una línea base reproducible:

1. [Protocolo Fase 1](./PHASE-1-BASELINE.md)
2. [Protocolo Fase 0 Home/Market/Combat](./PHASE-0-HOME-MARKET-BASELINE.md)
3. [Plantilla de reporte](./BASELINE-REPORT-TEMPLATE.md)
4. Comando automático: `pnpm perf:baseline:mobile`

## Auditoría E2E específica de combate

1. Script dedicado: `pnpm perf:combat:e2e`.
2. Auto con servidor local en dev: `pnpm perf:combat:e2e:auto:dev`.
3. Auto con servidor local en prod: `pnpm perf:combat:e2e:auto:prod`.
4. Ruta por defecto del benchmark: `/hub/training` (se puede sobreescribir con `--combatPath=/ruta`).
5. Reportes generados: `docs/performance/results/combat-e2e-*.json|.md`.
6. Si combate requiere login, usar sesión de Playwright: `--storageState=playwright/.auth/user.json`.

## Auditoría E2E real con BD y login

1. Script real con autenticación: `pnpm perf:combat:e2e:real`.
2. Auto con servidor dev: `pnpm perf:combat:e2e:real:auto:dev -- --email=... --password=...`.
3. Auto con servidor prod: `pnpm perf:combat:e2e:real:auto:prod -- --email=... --password=...`.
4. El flujo entra en `/login`, abre `/hub/story`, selecciona el primer duelo disponible desde BD y ejecuta interacciones de combate.
5. Reportes: `docs/performance/results/combat-e2e-real-*.json|.md`.
6. También soporta `.env.local` automáticamente (`PERF_EMAIL`, `PERF_PASSWORD`, `PERF_BASE_URL`) sin pasar credenciales por CLI.
7. Perfil por defecto: `realistic` (sin throttling artificial). Stress: `pnpm perf:combat:e2e:real:stress:auto:prod`.
8. El flujo es estricto y determinista: no usa taps por coordenadas ni fallback silencioso; si no encuentra controles válidos, falla con error explícito.

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
