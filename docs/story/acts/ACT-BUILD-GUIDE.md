<!-- docs/story/acts/ACT-BUILD-GUIDE.md - Guía operativa para diseñar e implementar actos Story sin deuda técnica. -->
# Guía Profesional de Construcción de Actos Story

## Objetivo
1. Estandarizar cómo se diseña un acto (`narrativa + mapa + SQL + QA`).
2. Reducir retrabajo entre actos y evitar incoherencias entre frontend y Supabase.
3. Mantener trazabilidad de decisiones técnicas por acto.

## Flujo obligatorio de trabajo
1. Definir narrativa y objetivo táctico del acto.
2. Especificar nodos en documento del acto (tabla principal + subrutas).
3. Dibujar layout visual en `map-definitions/act-X-map-definition.ts`.
4. Mapear eventos narrativos en `story-node-interaction-dialogue-catalog.ts`.
5. Añadir retratos/audio en `story-node-dialogue-media.ts`.
6. Crear migración SQL del acto (`docs/supabase/sql/0XX_...sql`).
7. Validar pathing, bloqueos y transiciones con tests.

## Contrato mínimo por acto (documentación)
1. Resumen narrativo (3-5 puntos).
2. Flujo principal de nodos (tabla `nodeId | tipo | propósito | recompensa`).
3. Subrutas y condición de retorno al flujo principal.
4. Mapa de duelos con progresión de dificultad.
5. Eventos de activación (puentes, submissions, llaves de acceso).
6. Criterios de validación QA.

## Reglas de diseño de mapa
1. Todo nodo de transición entre actos debe existir en `resolve-story-act-transition-target.ts`.
2. Los nodos de retorno deben ser siempre navegables y tener conexión de ruta (`unlockRequirementNodeId` o `pathLinkFromNodeIds`).
3. Si hay puentes bloqueados por subruta:
   - la activación va en subruta,
   - el puente debe estar en flujo principal,
   - el hilo visual del puente debe permanecer oculto hasta activación.
4. No usar iconografía genérica no temática en teletransporte de actos.
5. Secuencia de teletransporte obligatoria:
   - avatar se reduce hasta desaparecer en nodo origen,
   - aparece en nodo de teletransporte del acto destino desde escala mínima,
   - recupera escala normal,
   - avanza un nodo en dirección narrativa (`forward` derecha, `backward` izquierda).
6. Implementación de referencia:
   - entrada: `use-story-act-entry-sequence.ts`,
   - navegación entre actos: `use-story-act-transition-navigation.ts`,
   - movimiento/cámara avatar: `use-story-circuit-motion.ts`.

## Reglas de backend (Supabase)
1. `story_duels` define orden de duelo, oponente y desbloqueo backend.
2. `story_duel_ai_profiles` define dificultad y perfil IA por aparición.
3. `story_duel_deck_overrides` define mazo/escalado por aparición.
4. Cambios de roster por acto se aplican por migración SQL idempotente.
5. Toda migración nueva debe cerrar con verificación SQL sugerida.

## Checklist de entrega de un acto
1. Mapa renderiza sin nodos huérfanos ni líneas incoherentes.
2. Pathing bloquea avance cuando corresponde y permite retroceso.
3. Eventos muestran narrativa y assets correctos.
4. Transición de acto anterior/siguiente funciona.
5. SQL aplicado sin registros duplicados o rotos.
6. `pnpm lint` y tests Story en verde.

## Verificaciones SQL recomendadas
```sql
select id, chapter, duel_index, opponent_id, unlock_requirement_duel_id, is_boss_duel, is_active
from public.story_duels
where chapter = :act
order by duel_index, id;
```

```sql
select duel_id, difficulty, is_active
from public.story_duel_ai_profiles
where duel_id like 'story-ch:act-%'
order by duel_id;
```
