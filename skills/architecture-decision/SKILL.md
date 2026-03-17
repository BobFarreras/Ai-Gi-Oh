<!-- skills/architecture-decision/SKILL.md - Guía para tomar y documentar decisiones de arquitectura sin introducir deuda técnica. -->
---
name: architecture-decision
description: Úsala cuando haya cambios de diseño, límites entre capas, repositorios, casos de uso o decisiones estructurales de Next.js.
---

# Decisiones de arquitectura

## Cuándo usar esta skill
Aplicar cuando un cambio afecte dependencias entre capas, contratos de dominio, repositorios, flujos de aplicación o estructura de módulos.

## Proceso de decisión
1. Definir problema y alcance real.
2. Enumerar mínimo 2 opciones viables.
3. Evaluar tradeoffs en complejidad, testabilidad, mantenibilidad y performance.
4. Elegir opción y justificarla con impacto técnico.
5. Registrar decisión en ADR o documentación equivalente.

## Guardrails obligatorios
- Mantener separación UI -> services/use-cases -> core.
- Prohibido mover lógica de negocio a componentes React.
- Prohibido acceso directo a DB desde UI o rutas API sin repositorio.
- Evitar archivos >150 líneas en servicios, hooks y componentes.

## Checklist de implementación
- Contratos tipados sin `any`.
- Responsabilidad única por archivo.
- Tests de casos de uso y regresión actualizados.
- Documentación en español actualizada en el mismo cambio.

## Integración con Engram
- Buscar memoria previa antes de decidir (`mem_search`).
- Guardar decisión final con `mem_save` usando `topic_key` de `architecture/*` o `decision/*`.
- Añadir en la memoria el tradeoff principal para futuras sesiones.
