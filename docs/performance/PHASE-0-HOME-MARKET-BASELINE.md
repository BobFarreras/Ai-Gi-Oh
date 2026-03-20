<!-- docs/performance/PHASE-0-HOME-MARKET-BASELINE.md - Protocolo de baseline para Home/Market/Combat antes de cambios de UX y layout. -->
# Fase 0: Baseline Home, Market y Combat

## Objetivo

Medir una línea base reproducible antes de aplicar cambios de UI/flujo.

## Entorno obligatorio

1. Ejecutar en build de producción local:
   - `pnpm build`
   - `pnpm start`
2. Medir en:
   - Desktop real.
   - Mobile emulado (Chrome Device Toolbar).
   - Mobile real (si es posible).
3. No usar `pnpm dev` para baseline final de rendimiento.

## Escenarios mínimos

1. Arsenal (`/hub/home`):
   - Abrir y cerrar inspector.
   - Añadir/quitar cartas.
   - Pulsar `Menú` con deck incompleto.
2. Market (`/hub/market`):
   - Scroll en listado.
   - Compra de carta suelta.
   - Compra de pack.
3. Combat (`/hub/academy/training/arena` o Story):
   - Selección de carta.
   - Activar ejecución.
   - Paso de fase.

## Métricas a registrar

1. LCP
2. INP
3. CLS
4. Latencia de interacción percibida en acciones críticas (`home.insertCard`, `home.removeCard`, `market.buyCard`, `board.playAction`).

## Formato de entrega

1. Guardar reporte en `docs/performance/results/` con fecha.
2. Incluir:
   - dispositivo/navegador,
   - perfil de red/CPU,
   - ruta y acción,
   - valor observado.

## Criterio para avanzar a Fase 1+

1. Baseline documentado para Home/Market/Combat.
2. Misma metodología usada antes y después para comparar mejoras reales.
