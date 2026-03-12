<!-- skills/combat-log-invariants/SKILL.md - Invariantes para asegurar que turnos, fases y combate siempre queden registrados en combatLog. -->
---
name: combat-log-invariants
description: Úsala en cambios del motor de juego para garantizar que combatLog sea la fuente única de historial y feedback.
---

# Invariantes de combatLog

## Cuándo usar esta skill
Aplicar en cambios de `game-engine/` relacionados con estado, acciones, fases, combate, fusión o feedback de UX.

## Invariantes obligatorios
- Todo cambio relevante de turno/fase/combate escribe en `combatLog`.
- `combatLog` es la fuente única para historial visual y carteleras de estado.
- Eventos de sonido o feedback derivan de entradas de `combatLog`.

## Protocolo de implementación
1. Identificar transiciones de estado afectadas.
2. Definir evento de log con intención de negocio clara.
3. Emitir log en el punto de verdad de la transición.
4. Verificar consumo del log por UI/feedback sin fuentes paralelas.

## Checklist de pruebas
- Test de transición de turno con entrada de log.
- Test de fase/combate con contenido de log esperado.
- Test de regresión para evitar eventos silenciosos.

## Integración con Engram
- Guardar descubrimientos de invariantes con `mem_save` en `pattern/*`.
- Guardar bugfixes de eventos perdidos en `bug/*`.
