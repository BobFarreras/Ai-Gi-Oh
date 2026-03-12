<!-- skills/clean-architecture-enforcer/SKILL.md - Reglas operativas para mantener dependencias limpias entre UI, aplicación, dominio e infraestructura. -->
---
name: clean-architecture-enforcer
description: Úsala cuando un cambio toque límites entre capas para validar dependencias permitidas y evitar contaminación de dominio.
---

# Clean Architecture en ejecución

## Cuándo usar esta skill
Aplicar en refactors, nuevas features, cambios de carpetas o contratos entre `app/`, `services/`, `core/` e `infrastructure/`.

## Dependencias permitidas
- `app/components -> services/use-cases -> core`
- `infrastructure` implementa contratos definidos en `core`.

## Dependencias prohibidas
- `app/` importando `infrastructure/` de forma directa.
- `core/` importando frameworks o SDK externos.
- Casos de uso mezclados con renderizado de React.

## Protocolo de validación
1. Identificar capa de cada archivo modificado.
2. Revisar imports cruzados y detectar acoplamientos indebidos.
3. Extraer puertos/interfaces si falta una frontera limpia.
4. Confirmar tests de casos de uso tras el ajuste.

## Señales de alarma
- Archivo con más de un motivo de cambio.
- Lógica de dominio dentro de componentes.
- Adaptadores de infraestructura llamándose desde UI.

## Integración con Engram
- Buscar antecedentes con `mem_search`.
- Guardar decisión final con `mem_save` y `topic_key` `architecture/*` o `decision/*`.
