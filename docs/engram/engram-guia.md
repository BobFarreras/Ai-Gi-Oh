<!-- docs/engram/engram-guia.md - Guía para uso consistente de memoria persistente con Engram. -->

# Guía de Memoria Engram

## Formato de almacenamiento

Las memorias de sesión se almacenan en este directorio como archivos Markdown con frontmatter YAML.

## Convención de nombres

- `decision/<tema>.md` — Decisiones arquitectónicas o técnicas importantes
- `discovery/<tema>.md` — Hallazgos durante auditorías o debug
- `bug/<tema>.md` — Bugs documentados con diagnóstico
- `pattern/<tema>.md` — Patrones de diseño adoptados

## Plantilla mínima

```markdown
---
topic_key: "architecture/rendering-engine"
date: "2026-06-10"
status: "active"
---

# Título

## Contexto
Qué situación o problema motivó la decisión/descubrimiento.

## Decisión / Hallazgo
Qué se decidió o descubrió.

## Consecuencias
Impacto en el proyecto, riesgos, seguimientos pendientes.

## Archivos afectados
- `ruta/archivo.ext`
```

## Memorias activas

1. [decision/rendering-engine.md](./decision/rendering-engine.md) — Decisión de arquitectura de renderizado para rendimiento
2. [decision/phase1-assets-complete.md](./decision/phase1-assets-complete.md) — Fase 1.1 completada: migración de assets