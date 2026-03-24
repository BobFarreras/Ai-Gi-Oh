<!-- docs/training/TUTORIAL-REDESIGN-V2.md - Plan de rediseño del tutorial por nodos, motor guiado y migración profesional. -->
# Tutorial Redesign V2

## Objetivo

Reemplazar el tutorial monolítico por un sistema de nodos guiados, con ritmo controlado, narrador BigLog y foco visual reusable para cualquier elemento interactivo.

## Principios

1. Motor agnóstico de UI: reglas y flujo en `core/services/use-cases`.
2. UI desacoplada: componentes solo renderizan estado y eventos.
3. Progresión profesional: desbloqueo secuencial por nodos.
4. Fuente única de verdad: progreso por nodo + claim final idempotente.

## Nodos del mapa

1. `Preparar Deck` (`/hub/academy/tutorial/arsenal`).
2. `Market` (`/hub/academy/tutorial/market`).
3. `Combate Base` (`/hub/academy/training/tutorial`).
4. `Recompensa Final` (`/hub/academy/tutorial/reward`).

## Motor de pasos guiados (target)

Cada paso define:

1. `targetSelector` para spotlight.
2. `allowedActions` para bloquear interacciones no permitidas.
3. `completionType`: `MANUAL_NEXT`, `USER_ACTION` o `BOTH`.
4. `expectedAction` para validar avance automático.
5. `dialogue` con BigLog + avatar/intro.

## Recompensa final del tutorial

Se añadirá un caso de uso idempotente para reclamar una única vez:

1. Opción A: pack de cartas.
2. Opción B: Nexus (moneda).

La decisión final se parametrizará por configuración para balanceo sin tocar UI.

## Plan por fases

1. Fase 1: Dominio de mapa tutorial + runtime + página `/hub/academy/tutorial`.
2. Fase 2: Motor genérico de spotlight/bloqueo y botón `Siguiente`.
3. Fase 3: Nodo `Preparar Deck` con guía sobre la UI real de Arsenal.
4. Fase 4: Nodo `Market` con flujo completo de filtros y compra.
5. Fase 5: Refactor del tutorial de combate al motor por pasos.
6. Fase 6: Persistencia por nodo + claim de recompensa final.
7. Fase 7: Limpieza de legacy, hardening y cierre de deuda técnica.

## Criterios de aceptación

1. El tutorial no avanza por accidente.
2. El jugador sabe siempre qué botón/zona debe usar.
3. Todas las pantallas tienen pausas de comprensión con feedback visual.
4. `pnpm lint`, `pnpm test`, `pnpm build` en verde en cada fase.
