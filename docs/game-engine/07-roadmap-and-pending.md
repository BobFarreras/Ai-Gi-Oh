<!-- docs/game-engine/07-roadmap-and-pending.md - Pendientes funcionales y línea de diseño objetivo del bloque de combate. -->
# Roadmap y Pendientes

## Pendientes funcionales vigentes

1. Persistencia completa de progreso de campaña.
2. Persistencia de `combatLog` fuera de memoria.
3. Evolución de efectos avanzados con cobertura de pruebas.
4. Integración futura de estrategia LLM sin romper contratos actuales.

## Diseño objetivo inmediato del bloque de combate

1. Política robusta de banners de estado (`latest-wins` para transitorios).
2. Endurecer fusión con validación conjunta:
   - carta mágica,
   - 2 materiales,
   - carta final en `fusionDeck`.
3. `fusionDeck` con 2 slots dedicados fuera del deck principal.
4. Zona `destroyedPile` separada de `graveyard` para efectos futuros.
5. Regla de integridad: no salir de Arsenal con deck principal distinto de 20 cartas.

## Integración con Hub

1. `/hub` mantiene la navegación y bloqueo por progreso.
2. `HubService` decide disponibilidad de módulos antes de entrar en ruta.
3. `training` puede reutilizar flujo de combate actual hasta el tutorial dedicado.
