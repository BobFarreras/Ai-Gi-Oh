# Battlefield Module

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

## Flujo visual

1. `useBoard` deriva estados (`lastDamageTarget`, buffs, selección).
2. `BattlefieldZone` enruta estados a subcomponentes.
3. `SlotGrid` pinta cartas y resaltados por acción.
4. VFX se sincronizan con eventos de `combatLog`.

## Invariantes

1. El módulo no modifica reglas de combate.
2. Solo renderiza estado recibido por props.
3. Toda interacción vuelve al hook/controlador superior.

