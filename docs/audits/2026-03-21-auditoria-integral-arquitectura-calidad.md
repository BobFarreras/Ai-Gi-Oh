<!-- docs/audits/2026-03-21-auditoria-integral-arquitectura-calidad.md - Resultado de auditoría integral de arquitectura, calidad y riesgos técnicos del proyecto. -->
# Auditoría Integral (2026-03-21)

## Scope

1. Revisión de cumplimiento respecto a `Agents.md` y `Architecture.md`.
2. Validación de quality gates (`lint`, `test`, `build`).
3. Revisión de estructura, documentación y riesgos de seguridad/consistencia.

## Resultado de gates

1. `pnpm lint`: en verde.
2. `pnpm build`: en verde.
3. `pnpm test -- --run --reporter=dot`: falla con `6` archivos de test y `7` tests fallidos.

## Vulnerabilidades y riesgos detectados

### Alta severidad

1. Regresión funcional en lógica de progresión de training tiers.
2. Evidencia:
3. `src/core/services/training/apply-training-match-result.test.ts`
4. `src/core/services/training/resolve-training-tier-access.test.ts`
5. `src/core/use-cases/training/GetTrainingArenaStateUseCase.test.ts`
6. Impacto: desbloqueo de tiers inconsistente y estado efectivo de arena incorrecto.

### Alta severidad

1. Regresión en reglas de combate UI (cambio de modo ATTACK/DEFENSE).
2. Evidencia:
3. `src/components/game/board/hooks/useBoard.integration.battle-rules.test.ts`
4. Impacto: comportamiento de interacción del tablero no coincide con contrato esperado.

### Media severidad

1. Desalineación test-código en mapa Hub (regla de bloqueo Story).
2. Evidencia:
3. `src/core/use-cases/hub/GetHubMapUseCase.test.ts`
4. Impacto: riesgo de publicar con contrato de acceso ambiguo entre Hub y Academy.

### Media severidad

1. Deuda estructural por archivos >150 líneas en UI/hooks sensibles.
2. Evidencia:
3. `src/components/hub/story/StoryCircuitMap.tsx` (265)
4. `src/components/hub/market/MarketScene.tsx` (230)
5. `src/components/game/board/internal/BoardTutorialFlowOverlay.tsx` (210)
6. `src/components/game/board/hooks/useBoard.ts` (167)
7. Impacto: baja mantenibilidad, mayor probabilidad de regresiones y ruptura de SRP.

### Media severidad

1. Cobertura de cabecera obligatoria no completa en algunos archivos.
2. Evidencia parcial:
3. `src/components/ui/GameSelect.tsx`
4. `src/components/hub/academy/training/TrainingModeSelection.tsx`
5. `src/components/hub/academy/training/TrainingModeCard.tsx`
6. `src/components/hub/academy/training/TrainingMode3DPanel.tsx`
7. Impacto: menor trazabilidad en PR y auditoría.

## Acciones aplicadas en esta auditoría

1. Se actualizó documentación de arquitectura runtime:
2. `docs/architecture/02-runtime-and-app-router.md`.
3. Se actualizó arquitectura funcional para Academy/Tutorial/Training:
4. `docs/architecture/04-domain-hub-home-market-story.md`.
5. Se normalizó cabecera/comentario de intención en:
6. `src/app/hub/academy/page.tsx`.
7. Se eliminaron documentos raíz obsoletos:
8. `HUB.md`

## Pendientes críticos

1. Resolver y estabilizar los `7` tests fallidos antes de merge.
2. Alinear contrato Hub/Academy entre tests y política de acceso real.
3. Ejecutar refactor SRP en componentes/hooks que exceden 150 líneas.
4. Completar cabeceras obligatorias pendientes para cumplimiento total de `Agents.md`.
