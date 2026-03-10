<!-- src/components/game/board/battlefield/README.md - Componentes visuales del campo de batalla y animaciones de entidades. -->
# Módulo Battlefield

Render del campo de batalla, slots y VFX de acciones de combate/ejecución.

## Archivos

1. `BattlefieldZone.tsx`
   - Composición de cementerio + líneas de slots + mazo.
   - Aplica flash de daño localizado por zona.

2. `SlotGrid.tsx`
   - Render de slots (entidades/ejecuciones/trampas).

3. `ExecutionActivationVfx.tsx`
   - Efectos visuales al activar cartas de ejecución.

4. `DigitalBeam.tsx`
   - Efecto de haz para impactos dirigidos.

5. `BuffImpactVfx.tsx`
   - Efectos de aumento de estadísticas.

6. `internal/`
   - `BattlefieldLanes.tsx`: líneas superiores/inferiores.
   - `BattlefieldPiles.tsx`: mazo y cementerio.
   - `useDamageFlash.ts`: hook de flash temporal de daño.
   - `BattlefieldView.tsx` + `battlefield-types.ts`: render desacoplado y contratos.
   - `use-battlefield-mobile-fit.ts`: ajuste responsive para móvil.
   - `battlefield-props-equality.ts`: comparator memo para estabilidad de render.

## Flujo visual

1. `useBoard` deriva estados (`lastDamageTarget`, buffs, selección).
2. `BattlefieldZone` enruta estados a subcomponentes.
3. `SlotGrid` pinta cartas y resaltados por acción.
4. VFX se sincronizan con eventos de `combatLog`.

## Invariantes

1. El módulo no modifica reglas de combate.
2. Solo renderiza estado recibido por props.
3. Toda interacción vuelve al hook/controlador superior.



