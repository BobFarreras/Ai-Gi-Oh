<!-- skills/engram-memory-protocol/SKILL.md - Protocolo operativo para uso consistente de memoria persistente con Engram. -->
---
name: engram-memory-protocol
description: Úsala cuando la tarea requiera recuperar contexto previo, registrar decisiones o cerrar sesión con memoria persistente.
---

# Protocolo de memoria Engram

## Cuándo usar esta skill
Usar en tareas con riesgo de perder contexto entre sesiones: bugfixes, refactors, decisiones de arquitectura, cambios de configuración y entregas largas.

## Flujo obligatorio
1. Antes de implementar, buscar memoria relacionada con `mem_search` (o `engram search` en CLI).
2. Tras cada hito técnico relevante, guardar memoria con `mem_save`.
3. Al finalizar sesión, registrar `mem_session_summary` con objetivo, descubrimientos, cambios y archivos.
4. Si hay compaction o pérdida de contexto, ejecutar `mem_context` como primer paso.

## Criterio de calidad de memoria
- Título claro con módulo y resultado.
- Contenido con formato: qué, por qué, dónde, riesgo.
- Evitar ruido operacional y mensajes triviales.
- Reutilizar `topic_key` cuando el tema evoluciona.

## Convención de topic_key
- `architecture/<tema>`
- `bug/<tema>`
- `decision/<tema>`
- `pattern/<tema>`
- `config/<tema>`
- `discovery/<tema>`

## Antipatrones prohibidos
- Guardar memorias duplicadas sin valor nuevo.
- Cerrar sesión sin `mem_session_summary`.
- Continuar trabajo tras compaction sin `mem_context`.

## Plantilla mínima de guardado
- Título: `Decision|Bugfix|Discovery: <módulo> - <resumen>`
- Cuerpo:
  - Contexto.
  - Acción tomada.
  - Resultado.
  - Próximo riesgo o pendiente.
