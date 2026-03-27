<!-- docs/GUIA_DESPLIEGUE_PROFESIONAL.md - Guía paso a paso para preparar y ejecutar un despliegue profesional del proyecto. -->
# Guía de Despliegue Profesional (TFM + Producción)

## 1. Objetivo del documento
Este documento define el proceso recomendado para llevar el proyecto a un nivel de despliegue profesional, con foco en:
- calidad técnica,
- trazabilidad para evaluación de TFM,
- seguridad mínima obligatoria,
- estabilidad operativa en producción.

## 2. Cuándo usar esta guía
Aplicar esta guía cuando se vaya a:
- activar GitHub Actions de forma estricta,
- preparar un entorno real de producción,
- cerrar una versión candidata para defensa de TFM.

## 3. Pre-requisitos mínimos
- Rama principal estable (`main`) sin cambios pendientes.
- Scripts funcionales en `package.json`:
  - `lint`
  - `test`
  - `build`
  - `typecheck` (si no existe, crear antes del despliegue).
- Archivo `.env.example` actualizado con todas las variables requeridas.
- Documentación de arquitectura vigente (sin eliminar docs antiguas, pero marcando su estado).

## 4. Fase A: Baseline y control de calidad
1. Crear tag de referencia pre-despliegue:
   - ejemplo: `pre-prod-hardening-v1`.
2. Ejecutar localmente:
   - `pnpm install --frozen-lockfile`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
3. Registrar métricas base:
   - tiempo de build,
   - número de tests,
   - cobertura,
   - warnings (deben ser 0 nuevos).
4. Guardar resultado en una nota de release interna.

## 5. Fase B: GitHub Actions (pipeline obligatorio)
Configurar workflows con estos gates:

1. `ci.yml` (en cada PR y push a ramas activas)
   - instalación con lockfile,
   - lint,
   - typecheck,
   - test con cobertura,
   - build.

2. `security.yml` (semanal + manual)
   - `pnpm audit`,
   - escaneo de secretos,
   - revisión de dependencias vulnerables.

3. Reglas de protección de rama
   - merge bloqueado si falla un job,
   - mínimo 1 aprobación en PR,
   - sin commits directos a `main`.

## 6. Fase C: Hardening de producción
1. Verificar configuración de Next.js:
   - cabeceras de seguridad,
   - estrategia de caché,
   - optimización de imágenes.
2. Revisar variables de entorno:
   - separar dev/staging/prod,
   - no exponer secretos en cliente.
3. Validar errores controlados:
   - páginas de error,
   - manejo de excepciones sin `console.log` genérico en producción.
4. Añadir observabilidad mínima:
   - tracking de errores,
   - logs estructurados en flujos críticos.

## 7. Fase D: Documentación lista para TFM
1. Mantener un índice maestro en `docs/INDEX.md` (cuando se cree).
2. Marcar estado de cada documento:
   - `ACTIVA`,
   - `LEGACY`,
   - `PENDIENTE_REVISIÓN`.
3. No borrar documentación antigua durante esta fase:
   - añadir aviso al inicio de docs desactualizadas,
   - enlazar al documento vigente.
4. Preparar evidencias para memoria TFM:
   - decisiones técnicas,
   - métricas antes/después,
   - resultados de pipeline.

## 8. Checklist final de Go/No-Go
No desplegar si alguno falla:
- `pnpm lint` en verde.
- `pnpm typecheck` en verde.
- `pnpm test` en verde.
- `pnpm build` en verde.
- sin vulnerabilidades críticas sin mitigación documentada.
- documentación de arquitectura y despliegue actualizada.

## 9. Plantilla de cierre de despliegue
Completar antes del release:
- versión:
- fecha:
- commit/tag:
- responsable:
- resultados CI:
- riesgos conocidos:
- plan de rollback:
- estado final: `GO` / `NO-GO`.

## 10. Roadmap recomendado (cuando haya capacidad)
1. Automatizar changelog con Conventional Commits.
2. Añadir entorno staging y smoke tests E2E.
3. Activar budgets de performance en CI.
4. Publicar dashboard de métricas técnicas para seguimiento semanal.
