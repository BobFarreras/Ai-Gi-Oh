<!-- docs/security/story-world-hardening.md - Medidas de hardening aplicadas a rutas y persistencia del mundo Story. -->
# Story World Hardening

## Objetivo

Reducir superficie de entrada inválida y reforzar consistencia entre API y capa de aplicación.

## Medidas aplicadas

1. Validación de `nodeId` en capa de aplicación (`assertValidStoryNodeId`).
2. Doble validación en endpoint `POST /api/story/world/move`.
3. Persistencia de historial/cursor bajo RLS propietaria (`auth.uid() = player_id`).
4. Fallback controlado cuando faltan tablas nuevas para no romper flujo de Story.

## Próximo paso recomendado

Añadir e2e específico de seguridad para rutas Story (`move`, `duels/complete`) con payloads inválidos.
