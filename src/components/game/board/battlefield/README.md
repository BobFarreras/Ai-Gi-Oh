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

## Cola de efectos (regla obligatoria)

1. Si una trampa se activa durante un ataque o efecto, el flujo visual/sonoro prioriza la trampa antes de continuar la acción original.
2. El orden de resolución visible es de más reciente a más antigua cuando hay cadena de respuestas (counter trap).
3. Ningún `DIRECT_DAMAGE` por efecto debe arrancar antes de que termine la fase de bloqueo/objetivo del evento de trampa anterior.
4. Las cartas removidas del slot se mantienen de forma temporal (`sticky`) para evitar que vayan al cementerio visualmente antes de cerrar su VFX.
5. `cargar.mp3` está reservado a activaciones de trampa y se protege con deduplicación para evitar dobles disparos por re-render.

## Invariantes

1. El módulo no modifica reglas de combate.
2. Solo renderiza estado recibido por props.
3. Toda interacción vuelve al hook/controlador superior.



