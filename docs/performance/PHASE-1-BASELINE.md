<!-- docs/performance/PHASE-1-BASELINE.md - Protocolo operativo de la Fase 1 para medir baseline de rendimiento en móvil. -->
# Fase 1: Baseline de Rendimiento (Móvil)

## Objetivo

Capturar métricas iniciales reproducibles antes de refactorizar más capas.

KPIs objetivo del proyecto:

1. INP móvil `< 200 ms` (objetivo ideal `< 150 ms`)
2. LCP móvil `< 2.5 s`
3. CLS `< 0.1`

## Entorno de medición

1. Ejecuta `pnpm dev`.
2. Abre Chrome y entra en la ruta a medir.
3. Abre DevTools (`F12`) y activa Device Toolbar (`Ctrl + Shift + M`).
4. Usa un perfil fijo para comparar siempre igual:
   iPhone 12 Pro o Pixel 7
5. En Network selecciona `Fast 4G`.
6. En CPU selecciona `4x slowdown`.
7. Cierra extensiones que puedan alterar timings.

## Pantallas obligatorias de Fase 1

1. `/hub/home`
2. `/hub/market`
3. `/hub/story/chapter/.../duel/...` (combate móvil real)

## Protocolo por pantalla

1. Abre la pantalla con recarga dura (`Ctrl + Shift + R`).
2. Espera a que termine el render principal.
3. En DevTools abre `Performance`.
4. Activa `Web Vitals`.
5. Pulsa `Record`.
6. Ejecuta escenario de interacción de 20-30 segundos:
   Home: seleccionar cartas, añadir/remover rápido en deck.
   Market: comprar carta y pack, cambiar filtros y búsqueda.
   Combate: seleccionar carta, jugar acción, cambiar fase, ataques.
7. Detén grabación.
8. Guarda la traza (`Save profile...`) en `docs/performance/traces/`.
9. Copia LCP/CLS/INP a la plantilla de reporte.

## Telemetría interna (opcional, recomendada)

Activa en consola:

```js
localStorage.setItem("debug-performance", "1");
location.reload();
```

Lee métricas:

```js
window.__AIGIOH_PERF__?.renders
window.__AIGIOH_PERF__?.interactions
```

## Criterio de aceptación de Fase 1

1. Existe una traza por cada pantalla obligatoria.
2. Existe un reporte con fecha y entorno.
3. Cada pantalla tiene al menos un cuello de botella identificado.
4. El equipo acuerda top 3 prioridades para Fase 2.

## Ejecución automática (recomendada)

1. Arranca servidor en otra terminal:
   `pnpm dev`
2. Ejecuta baseline automático:
   `pnpm perf:baseline:mobile`
3. Alternativa totalmente automática (levanta servidor de dev):
   `pnpm perf:baseline:mobile:auto`
4. Automático en producción local (requiere `pnpm build` antes):
   `pnpm perf:baseline:mobile:auto:prod`
5. Opciones útiles:
   `pnpm perf:baseline:mobile:realistic`
   `pnpm perf:baseline:mobile:stress`
6. Para ruta de combate concreta:
   `pnpm perf:baseline:mobile -- --combatPath=/hub/story/chapter/1/duel/0`

El script genera:

1. JSON en `docs/performance/results/`
2. Markdown en `docs/performance/results/`

## Notas de calidad

1. No mezclar resultados de escritorio y móvil en el mismo bloque.
2. No comparar métricas de `dev` con `build` sin indicarlo explícitamente.
3. Repetir cada prueba 3 veces y guardar mediana.
