<!-- docs/refactor/GUIA-REFAC-STEP-BY-STEP.md - Plan operativo de refactorización integral del proyecto con fases, entregables y criterios de cierre. -->
# Guía de Refactorización Paso a Paso

## Objetivo

Dejar el proyecto listo para TFM en nivel profesional:

1. Arquitectura limpia y entendible.
2. Cero deuda técnica crítica.
3. Rendimiento estable en móvil y desktop.
4. Seguridad y calidad de código verificables.
5. Documentación actualizada en español.

## Reglas de ejecución

1. No mezclar fases grandes en el mismo commit.
2. Cada fase termina con evidencia (`lint`, `test`, `build`, docs).
3. No introducir archivos `GOD` ni módulos >150 líneas (salvo excepción justificada).
4. Refactor sin tests de regresión = fase incompleta.

## Fase 0: Preparación de rama y baseline

### Tareas

1. Crear rama de trabajo de refactor.
2. Confirmar baseline de rendimiento y calidad actual.
3. Congelar nuevas features.

### Entregables

1. Reporte baseline en `docs/performance/results/`.
2. Registro de riesgos iniciales.

### Criterio de cierre

1. Baseline reproducible y versionado.

## Fase 1: Auditoría técnica completa

### Tareas

1. Mapear módulos `home`, `market`, `board`, `core`, `infra`.
2. Detectar:
   - archivos no usados,
   - duplicidades,
   - lógica de negocio en UI,
   - dependencias incorrectas,
   - deuda de tipos,
   - documentación obsoleta.
3. Revisar seguridad básica (auth/session, validaciones servidor, errores).

### Entregables

1. Documento de hallazgos priorizado (Crítico/Medio/Bajo).
2. Lista de archivos candidatos a eliminar/mover.

### Criterio de cierre

1. Backlog de refactor priorizado y aprobado.

## Fase 2: Reorganización de estructura y módulos

### Tareas

1. Reordenar carpetas con criterio de dominio.
2. Extraer módulos por responsabilidad única.
3. Eliminar archivos muertos.

### Entregables

1. Estructura nueva documentada.
2. Imports saneados y build verde.

### Criterio de cierre

1. Navegación de código clara por subdominio.

## Fase 3: Refactor de estado y flujo (UI/App)

### Tareas

1. Consolidar estado por slices (ejemplo: Zustand por módulo).
2. Reducir prop drilling y re-renders masivos.
3. Separar claramente estado de UI vs estado de dominio.

### Entregables

1. Stores/hooks por módulo con tests.
2. Métricas de render antes/después.

### Criterio de cierre

1. Re-renders críticos controlados en profiler.

## Fase 4: Refactor de dominio y servicios

### Tareas

1. Mover reglas de negocio fuera de componentes.
2. Reforzar contratos de repositorio y casos de uso.
3. Eliminar lógica duplicada entre UI y servicios.

### Entregables

1. Casos de uso/servicios con tests unitarios.
2. Componentes más pequeños y sin lógica de dominio.

### Criterio de cierre

1. Flujo `UI -> app/service -> core -> infra` respetado.

## Fase 5: Rendimiento final (cierre)

### Tareas

1. Optimizar INP/LCP residuales por pantalla.
2. Virtualización donde aplique.
3. Ajustes móviles (animaciones y efectos pesados en modo lite).

### Entregables

1. Reporte de rendimiento final (3 corridas y mediana).
2. Comparativa baseline vs final.

### Criterio de cierre

1. INP/LCP/CLS en objetivos acordados.

## Fase 6: Seguridad y hardening

### Tareas

1. Revisar auth/session y origen de datos de usuario.
2. Revisar validaciones en API routes y mensajes de error.
3. Revisar dependencias y configuración de producción.

### Entregables

1. Checklist de seguridad completado.
2. Issues críticos cerrados.

### Criterio de cierre

1. Sin alertas de seguridad críticas abiertas.

## Fase 7: Documentación final y handover

### Tareas

1. Actualizar README y docs de arquitectura.
2. Documentar decisiones de diseño y tradeoffs.
3. Generar guía operativa de despliegue y QA.

### Entregables

1. Documentación funcional y técnica actualizada.
2. Checklist de mantenimiento futuro.

### Criterio de cierre

1. Un tercero puede entender y ejecutar el proyecto sin contexto previo.

## Checklist de calidad por fase

1. `pnpm lint`
2. `pnpm test`
3. `pnpm build`
4. Documentación afectada actualizada.
5. Resumen de cambios + riesgo residual.

## Orden recomendado de implementación

1. Fase 1 y 2 primero.
2. Fase 3 y 4 después.
3. Fase 5 como cierre técnico.
4. Fase 6 y 7 antes de entregar TFM.

## Definición de terminado (DoD) global

1. Arquitectura consistente con SRP y capas.
2. Tests y quality gates en verde.
3. Rendimiento móvil aceptable y estable.
4. Seguridad revisada.
5. Documentación final completa.
