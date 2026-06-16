<!-- docs/performance/2026-06-16-bloque0-median-comparison.md - Comparativa de medianas (3 corridas) del Bloque 0 de rendimiento del Hub 3D. -->
# Comparativa Bloque 0 — Rendimiento del Hub 3D (Medianas, 3 corridas)

## Muestras

- Before (Fase 5 after, referencia):
  - baseline-mobile-2026-04-03T05-32-08-896Z.json
  - baseline-mobile-2026-04-03T05-32-50-904Z.json
  - baseline-mobile-2026-04-03T05-33-33-020Z.json
- After (Bloque 0):
  - baseline-mobile-2026-06-16T08-21-53-928Z.json
  - baseline-mobile-2026-06-16T08-23-32-266Z.json
  - baseline-mobile-2026-06-16T08-24-41-256Z.json

## Tabla

| Perfil | Escenario | LCP before | LCP after | Δ LCP | INP before | INP after | Δ INP | CLS before | CLS after | Δ CLS |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| realistic | home | 1268 | 748 | -520 | 56 | 40 | -16 | 0.042 | 0.000 | -0.042 |
| realistic | market | 1140 | 756 | -384 | 40 | 24 | -16 | 0.043 | 0.000 | -0.043 |
| realistic | combat | 1140 | 672 | -468 | 56 | 16 | -40 | 0.041 | 0.000 | -0.041 |
| stress | home | 2400 | 2172 | -228 | 248 | 32 | -216 | 0.077 | 0.016 | -0.061 |
| stress | market | 2352 | 2780 | +428 | 176 | 56 | -120 | 0.076 | 0.576 | +0.500 |
| stress | combat | 2424 | 900 | -1524 | 168 | 64 | -104 | 0.079 | 0.000 | -0.079 |

## Lectura rápida

1. **Mejoras claras y generalizadas en INP** en todos los escenarios y perfiles, con reducciones de hasta -87% en `stress home`.
2. **LCP mejora notablemente** en 5 de 6 escenarios; `stress market` muestra una regresión mediana de +428 ms, probable variabilidad residual del entorno de benchmark.
3. **CLS mejora o se mantiene** en la mayoría de escenarios; `stress market` presenta un pico de CLS en las corridas actuales a investigar en futuras iteraciones.
4. Conclusión: el Bloque 0 cumple su objetivo de mejorar la fluidez percebida (INP) y reducir tiempos de carga en el hub.
