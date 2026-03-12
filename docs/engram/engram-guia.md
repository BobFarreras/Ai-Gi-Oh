<!-- docs/engram/engram-guia.md - Guía operativa de Engram para uso diario del equipo. -->
# Guía de Engram para ai-gi-oh

## 1. Objetivo
Esta guía define cómo usar Engram de forma consistente para mantener memoria persistente entre sesiones de desarrollo y reducir retrabajo técnico.

## 2. Estado actual del proyecto
- Engram instalado en Windows (`engram 1.9.4`).
- Integración con Codex completada con `engram setup codex`.
- Base local creada en `C:\Users\Boby\.engram\engram.db`.
- Prueba funcional ejecutada con `engram save` y `engram search`.

## 3. Comprobación rápida (antes de trabajar)
Ejecutar en terminal:

```powershell
engram version
engram stats
```

Resultado esperado:
- Versión visible de Engram.
- Estadísticas sin error de base de datos.

## 4. Protocolo de uso diario

### 4.1 Cuándo buscar memoria (`mem_search` / `engram search`)
Buscar siempre al inicio de tareas que puedan tener historial:
- Refactors de arquitectura.
- Bugfixes sobre módulos ya tocados.
- Cambios de reglas del motor de juego.
- Configuración de infra, seguridad o performance.

### 4.2 Cuándo guardar memoria (`mem_save` / `engram save`)
Guardar después de hitos relevantes:
- Bugfix validado.
- Decisión de diseño o arquitectura.
- Descubrimiento técnico que cambie un enfoque.
- Cambio de configuración que afecte build, test o despliegue.

### 4.3 Cierre obligatorio de sesión (`mem_session_summary`)
Antes de terminar una sesión, registrar resumen estructurado con:
- Objetivo.
- Descubrimientos.
- Cambios realizados.
- Archivos clave modificados.

### 4.4 Recuperación tras compaction o pérdida de contexto (`mem_context`)
Cuando el agente pierda contexto:
1. Ejecutar `mem_context` (o `engram context`).
2. Recuperar memoria reciente del proyecto.
3. Continuar trabajo con contexto restaurado.

## 5. Convención de temas (`topic_key`)
Usar claves estables para consolidar decisiones sin duplicar ruido:
- `architecture/<topic>`
- `bug/<topic>`
- `decision/<topic>`
- `pattern/<topic>`
- `config/<topic>`
- `discovery/<topic>`

Ejemplos:
- `architecture/auth-boundary`
- `bug/combat-trap-null-guard`
- `config/vitest-timeout-policy`

## 6. Plantillas recomendadas

### 6.1 Plantilla de bugfix
- Título: `Bugfix: <modulo> - <resumen corto>`
- Contenido:
  - Qué fallaba.
  - Causa raíz.
  - Solución aplicada.
  - Riesgos/regresión a vigilar.

### 6.2 Plantilla de decisión técnica
- Título: `Decision: <area> - <decision>`
- Contenido:
  - Contexto.
  - Opciones evaluadas.
  - Decisión final y tradeoff.
  - Impacto en arquitectura y tests.

## 7. Comandos útiles de CLI
```powershell
engram search "auth boundary"
engram save "Decision: auth" "Se separa repositorio de infraestructura por SRP"
engram context
engram stats
engram tui
```

## 8. Problemas comunes y solución
- `engram` no se reconoce: revisar `PATH` y reiniciar terminal.
- No aparecen herramientas MCP en Codex: reiniciar Codex.
- Memorias vacías o irrelevantes: mejorar títulos, usar plantillas y topic_key.

## 9. Checklist de sesión
- Inicio: buscar contexto previo si hay historial.
- Durante: guardar hitos de valor real.
- Cierre: registrar resumen de sesión obligatorio.

## 10. Skills activas del proyecto
Skills disponibles para reforzar ejecución consistente:
- `engram-memory-protocol`
- `architecture-decision`
- `testing-enforcement`
- `nextjs-app-router-guardrails`
- `clean-architecture-enforcer`
- `repository-pattern-supabase`
- `file-size-srp-enforcer`
- `error-handling-contracts`
- `combat-log-invariants`
- `commenting-intent-enforcer`

## 11. Matriz de activación por intención
Usar esta tabla como criterio operativo para elegir skills sin ambigüedad:

| Intención principal | Skill obligatoria | Skills complementarias |
| --- | --- | --- |
| Recuperar contexto o continuar sesión | `engram-memory-protocol` | `architecture-decision` |
| Cambios de arquitectura o límites de capas | `architecture-decision` | `clean-architecture-enforcer`, `engram-memory-protocol` |
| Cambios de App Router y componentes | `nextjs-app-router-guardrails` | `clean-architecture-enforcer`, `testing-enforcement` |
| Persistencia con Supabase | `repository-pattern-supabase` | `clean-architecture-enforcer`, `error-handling-contracts` |
| Refactor por tamaño/complejidad | `file-size-srp-enforcer` | `architecture-decision`, `testing-enforcement` |
| Validaciones y fallos de negocio/infra | `error-handling-contracts` | `testing-enforcement`, `engram-memory-protocol` |
| Cambios del motor de juego (turnos/fases/combate) | `combat-log-invariants` | `testing-enforcement`, `engram-memory-protocol` |
| Implementación/refactor con cambio de comportamiento | `testing-enforcement` | skill principal de dominio + `engram-memory-protocol` |

## 12. Orden recomendado cuando aplican varias skills
1. `engram-memory-protocol` (buscar contexto previo).
2. Skill de dominio principal (arquitectura, App Router, repositorio, combate, etc.).
3. `clean-architecture-enforcer` o `file-size-srp-enforcer` si hay riesgo estructural.
4. `testing-enforcement` antes de cerrar implementación.
5. `engram-memory-protocol` para `mem_save` y `mem_session_summary` de cierre.

## 13. Regla para evitar exceso de skills
- No activar más de 3 skills principales por tarea.
- Si dos skills dicen lo mismo, gana la más específica del dominio.
- Si hay conflicto, priorizar: `Agents.md` > skill de dominio > skill genérica.
- Revisar consolidación trimestral y fusionar skills redundantes.
