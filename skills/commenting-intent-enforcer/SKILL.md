<!-- skills/commenting-intent-enforcer/SKILL.md - Protocolo para estandarizar comentarios de intención y JSDoc en código no trivial. -->
---
name: commenting-intent-enforcer
description: Úsala cuando se quiera mejorar onboarding y mantenibilidad añadiendo comentarios de intención y JSDoc sin ruido redundante.
---

# Comentarios de intención y JSDoc

## Cuándo usar esta skill
Aplicar en refactors, módulos complejos, funciones públicas y utilidades compartidas donde el flujo no sea obvio para un nuevo integrante.

## Reglas obligatorias
- Comentarios y JSDoc en español.
- Prohibido comentario redundante de línea obvia.
- Funciones públicas y contratos compartidos deben tener JSDoc corto.
- Bloques no triviales deben incluir comentario de intención (por qué existe el bloque).

## Plantilla mínima JSDoc
```ts
/**
 * Qué hace la función en términos de intención y efecto principal.
 */
```

## Checklist de calidad
- ¿El comentario explica decisión y contexto, no sintaxis?
- ¿Se entiende el flujo sin abrir 3 archivos adicionales?
- ¿Se evita duplicar lo que ya expresa el nombre de la función?
- ¿No se introdujo deuda por exceso de comentarios verbosos?

## Integración con Engram
- Guardar decisiones de estilo en `decision/*`.
- Guardar hallazgos de mantenibilidad en `pattern/*`.
