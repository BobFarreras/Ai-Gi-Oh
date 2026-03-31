<!-- src/core/services/training/README.md - Resumen del subdominio de entrenamiento y sus reglas base. -->
# Training Core

## Objetivo

Definir un núcleo de entrenamiento agnóstico de UI e infraestructura para que balancear dificultad, mazos y desbloqueos sea sencillo y seguro.

## Módulos

1. `resolve-training-tier-catalog.ts`
   - Catálogo editable de tiers.
   - Validación de consistencia (tiers consecutivos, multiplicador válido, tier 1 sin requisito).
2. `resolve-training-tier-access.ts`
   - Reglas puras de bloqueo/desbloqueo por victorias.
3. `apply-training-match-result.ts`
   - Actualiza progreso tras cada combate y detecta nuevos tiers desbloqueados.

## Regla de desbloqueo actual

1. El `tier 1` está siempre desbloqueado.
2. Cada tier `N` (N > 1) requiere `requiredWinsInPreviousTier` victorias en `tier N-1`.

## Extensibilidad

1. El catálogo se puede inyectar por configuración para temporadas/eventos sin tocar reglas de dominio.
2. `deckTemplateId` y `aiDifficulty` son contratos para conectar motor/infra en fases siguientes.
