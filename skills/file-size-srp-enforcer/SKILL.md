<!-- skills/file-size-srp-enforcer/SKILL.md - Guía para evitar archivos GOD y forzar SRP con límite de 150 líneas en módulos operativos. -->
---
name: file-size-srp-enforcer
description: Úsala cuando un módulo crezca o se vuelva complejo para dividir responsabilidades y mantener trazabilidad.
---

# SRP y límite de tamaño

## Cuándo usar esta skill
Aplicar en componentes, hooks, servicios y casos de uso que se acercan o superan 150 líneas.

## Regla central
- Si un archivo operativo supera 150 líneas, se divide en submódulos cohesivos en el mismo cambio.

## Estrategia de extracción
1. Identificar responsabilidades mezcladas.
2. Extraer a subcarpetas coherentes: `internal/actions`, `internal/hooks`, `internal/view`, `internal/types`.
3. Mantener API pública mínima en el módulo raíz.
4. Repetir hasta lograr un motivo de cambio por archivo.

## Antipatrones
- "Archivo contenedor" con dominio + UI + orquestación.
- Helpers genéricos sin ownership claro.
- Refactor parcial que deja dependencia circular.

## Checklist de salida
- Ningún archivo nuevo operativo >150 líneas.
- Responsabilidad única explícita por módulo.
- Tests movidos o creados junto al archivo evaluado.

## Integración con Engram
- Guardar patrones de refactor útiles con `mem_save` en `pattern/*`.
