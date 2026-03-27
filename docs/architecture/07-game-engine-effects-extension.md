<!-- docs/architecture/07-game-engine-effects-extension.md - Guía operativa para extender efectos y triggers del motor sin romper contratos. -->
# Extensión de Efectos y Triggers del Motor

## Objetivo

Definir un flujo seguro y repetible para añadir nuevos efectos de cartas o nuevos eventos reactivos de trampas, manteniendo compatibilidad con el motor y cobertura de tests.

## Mapa técnico actual

1. Contrato de efectos: `src/core/entities/ICard.ts` (`ICardEffect`, `TrapTrigger`).
2. Parsing de catálogo Supabase: `src/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card.ts`.
3. Efectos EXECUTION: `src/core/use-cases/game-engine/actions/internal/execution-effect-registry.ts`.
4. Efectos TRAP: `src/core/use-cases/game-engine/effects/internal/trap-effect-registry.ts`.
5. Triggers reactivos del motor: `src/core/use-cases/game-engine/effects/internal/trap-trigger-registry.ts`.

## Flujo A: Añadir un nuevo efecto EXECUTION o TRAP

1. Añadir el contrato tipado en `ICard.ts`.
2. Incluir el nuevo tipo en la unión `ICardEffect`.
3. Actualizar el mapper de Supabase (`map-card-catalog-row-to-card.ts`) para parsear el JSON del efecto.
4. Registrar el handler en el registry correcto:
   - EXECUTION: `execution-effect-registry.ts`.
   - TRAP: `trap-effect-registry.ts`.
5. Si el efecto necesita flujo interactivo (selección, estado pendiente), resolverlo en caso de uso específico y no forzarlo en el registry síncrono.
6. Añadir tests unitarios del registry (caso feliz + límites + no-op/control de error).
7. Ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test`.

## Flujo B: Añadir un nuevo trigger reactivo de trampa

1. Extender `TrapReactiveEvent` en `trap-trigger-registry.ts`.
2. Mapear el nuevo evento al trigger de dominio (`TrapTrigger`) dentro de `resolveReactiveTrapEvent`.
3. Conectar el evento desde el punto correcto del motor:
   - combate (`execute-attack.ts`) si ocurre durante ataque.
   - ejecución (`resolve-execution.ts`) si ocurre al resolver EXECUTION.
   - otros casos de uso cuando aplique.
4. Añadir tests de mapping del registry de triggers.
5. Añadir test de integración en el caso de uso que dispara el evento.

## Checklist de seguridad y robustez

1. No usar `any`; tipado explícito en contrato y handlers.
2. Mantener inmutabilidad de `GameState` e `IPlayer`.
3. No introducir lógica de negocio en componentes UI.
4. Si una acción no está soportada por el registry, devolver `null` controlado o error de dominio tipado según contrato existente.
5. Toda ruta nueva de efecto debe quedar cubierta por tests.
6. Si cambia comportamiento funcional, actualizar documentación en `docs/architecture/*` en el mismo commit.

## Plantilla rápida de implementación

```text
1) Extender ICardEffect en ICard.ts
2) Parsear JSON en map-card-catalog-row-to-card.ts
3) Registrar handler en execution/trap registry
4) Conectar trigger (si aplica) en trap-trigger-registry.ts y caso de uso origen
5) Añadir tests co-localizados
6) Validar lint + typecheck + test
```

## Señales de mala implementación (evitar)

1. `switch` gigante mezclando todos los dominios del motor.
2. Reglas de combate escritas dentro de componentes React.
3. Efecto nuevo sin contrato en `ICardEffect`.
4. Persistir JSON de efecto sin adaptar el mapper.
5. Merge sin tests del nuevo flujo.
