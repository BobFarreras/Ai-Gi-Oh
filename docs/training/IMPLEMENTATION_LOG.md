<!-- docs/training/IMPLEMENTATION_LOG.md - Bitácora de implementación por fases del módulo de entrenamiento. -->
# Training Implementation Log

## Fase 1 - Dominio agnóstico y TDD

1. Se creó el subdominio `core/services/training` con reglas puras:
   - catálogo editable de tiers,
   - acceso/desbloqueo por victorias,
   - aplicación de resultado de combate.
2. Se añadieron entidades de entrenamiento en `core/entities/training`.
3. Se añadieron tests co-localizados para garantizar comportamiento base.
4. Commit: `ec0cd6f`.

## Fase 2 - Backend y persistencia

1. Se implementó `CompleteTrainingMatchUseCase` con:
   - idempotencia por `battleId`,
   - actualización de progreso training,
   - recompensa Nexus + experiencia de jugador.
2. Se añadieron repositorios de contrato + adaptadores Supabase.
3. Se creó endpoint `POST /api/training/matches/complete`.
4. Se añadió migración SQL `022_phase_training_progression.sql` y documentación de Supabase.
5. Commit: `0df32f2`.

## Fase 3 - Navegación de modos (Tutorial o Training)

1. `/hub/training` pasa a ser selector de modo.
2. Se crean rutas separadas:
   - `/hub/training/tutorial`
   - `/hub/training/arena`
3. Se reutiliza guard de deck incompleto para ambas rutas.
4. Se añade test del selector de modos para accesibilidad y rutas.
5. Commit: pendiente al cerrar esta fase.

## Validación global aplicada por fase

1. `pnpm lint`
2. `pnpm test`
3. `pnpm build`
