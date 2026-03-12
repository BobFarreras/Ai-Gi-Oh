<!-- skills/error-handling-contracts/SKILL.md - Estándar de errores tipados y manejo UX consistente para evitar fallos silenciosos. -->
---
name: error-handling-contracts
description: Úsala en cambios con validaciones, infraestructura o UI para aplicar errores tipados y manejo consistente sin console.log productivo.
---

# Contratos de error

## Cuándo usar esta skill
Aplicar en casos de uso, servicios, adaptadores de infraestructura y UI que reporta errores al usuario.

## Reglas obligatorias
- Prohibido `console.log()` para errores en producción.
- Usar clases de error específicas (ej. `ValidationError`, `DatabaseError`).
- Traducir errores técnicos a mensajes de UX claros.
- Mantener trazabilidad sin exponer detalles sensibles.

## Flujo recomendado
1. Lanzar error tipado en capa origen.
2. Mapear error al contrato de aplicación.
3. Presentar feedback en UI con toast o error boundary.
4. Registrar contexto técnico para diagnóstico interno.

## Checklist de validación
- ¿El tipo de error representa una causa real?
- ¿La UI muestra mensaje accionable y no genérico?
- ¿Existen tests para ruta feliz y ruta de error?
- ¿No se filtran stack traces o secretos?

## Integración con Engram
- Guardar bugfixes de errores con `mem_save` en `bug/*`.
- Guardar decisiones de taxonomía de errores con `mem_save` en `decision/*`.
