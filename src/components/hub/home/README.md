<!-- src/components/hub/home/README.md - Guía del módulo Arsenal (Mi Home), invariantes y estructura responsive. -->
# Módulo Arsenal (Mi Home)

## Fase 0 - Invariantes de baseline

Antes de cualquier refactor responsive se mantienen estas reglas:

1. El layout `desktop (xl+)` no cambia visualmente.
2. La lógica de negocio de deck (20 cartas, límite de copias, evolución) no vive en componentes de layout.
3. Las acciones de deck y evolución siguen pasando por `services/home/deck-builder`.
4. El overlay de evolución conserva su flujo funcional.

## Fase 1 - Separación de layout

Se separa el render por breakpoint sin alterar reglas del dominio:

1. `layout/HomeDesktopWorkspace.tsx`: distribución escritorio.
2. `layout/HomeMobileWorkspace.tsx`: distribución móvil inicial.
3. `layout/HomeResponsiveWorkspace.tsx`: router visual por CSS (`xl`).
4. `HomeDeckBuilderScene.tsx`: orquestación de estado y casos de uso.

## Fase 2 - Barra mobile de filtros y acciones

1. Búsqueda por nombre en colección (`nameQuery`) integrada en `buildHomeCollectionView`.
2. `HomeDeckActionBar` desacoplada en:
   - `HomeDeckActionButtons`
   - `HomeDeckFilterControls`
3. Filtros desplegables en mobile con botón `Filtros` y panel colapsable.
4. Desktop conserva su patrón de acciones + filtros visibles.

## Fase 3 - Workspace mobile unificado

1. `layout/HomeMobileWorkspace.tsx` ahora usa tabs `Deck | Almacén`.
2. Se renderiza un único contenedor principal de cartas para mobile.
3. El `Deck` mobile muestra 20 slots en grid de 4 columnas.
4. El `Almacén` mobile muestra colección filtrada en grid de 4 columnas con indicador `D/U`.
5. La inspección de carta sigue usando `HomeCardInspectorDialog` con animación de origen.
6. En mobile, las acciones `Añadir/Remover/Evolucionar` se ejecutan desde el inspector según el origen de selección.
7. La cabecera del módulo se renombra visualmente a `Arsenal`.

## Fase 4 - Evolución responsive en mobile

1. `HomeEvolutionOverlay` adapta escala, luces y partículas para pantallas pequeñas.
2. El overlay evita recortes en móvil con paddings y tamaños fluidos.
3. Se añade feedback de copias fusionadas dentro del overlay.
4. Se incorpora test de render base en `HomeEvolutionOverlay.test.tsx`.

## Fase 5 - Robustez de acciones mobile en inspector

1. El inspector mobile evita doble acción concurrente en `Añadir/Remover/Evolución`.
2. Mientras hay operación activa, los botones quedan deshabilitados y muestran estado (`Añadiendo...`, etc).
3. Se añade cobertura en `HomeInspectorActionButtons.test.tsx` para validar bloqueo en estado pendiente.

## Fase 6 - Cierre seguro y feedback del inspector mobile

1. `MobileInspectorDialogShell` soporta `isDismissDisabled` para impedir cierre durante operaciones críticas.
2. El inspector mobile muestra mensajes breves de confirmación al completar acciones.
3. `Añadir` y `Remover` cierran el diálogo al finalizar correctamente para acelerar el flujo.
4. Se añade test de bloqueo de cierre en `MobileInspectorDialogShell.test.tsx`.

## Fase 2 del nuevo bloque (fusión dedicada)

1. `IDeck` ahora incluye `fusionSlots` (2 slots dedicados, separados del deck principal de 20).
2. Se añade panel `HomeFusionDeckPanel` debajo del contenedor de deck en desktop.
3. Reglas de inserción:
   - cartas `FUSION` solo pueden equiparse en `fusionSlots`,
   - cartas no `FUSION` no pueden entrar en `fusionSlots`.
4. Se añaden casos de uso y endpoints dedicados:
   - `AddCardToFusionDeckUseCase`,
   - `RemoveCardFromFusionDeckUseCase`,
   - `/api/home/deck/fusion/add`,
   - `/api/home/deck/fusion/remove`.
5. La validación de copias disponibles cuenta asignaciones en deck principal + bloque de fusión.

## Ajustes finales de UI (desktop + mobile)

1. El overlay de evolución renderiza la carta con clipping limpio para evitar artefactos de fondo.
2. El indicador de carta evolucionable pasa de punto pulsante a vibración sutil de carta.
3. La vibración evita desplazamiento horizontal para no generar scroll lateral en almacén.
4. En mobile se fuerza `overflow-x-hidden` en el contenedor de almacén para robustez visual.

## Perfil visual de cartas (Fase 2 rendimiento)

1. En desktop (`HomeCollectionPanel`) las mini-cartas usan render completo para conservar fondo visual.
2. En móvil (`HomeMobileCollectionPanel`) se activa `isPerformanceMode` con fondo simplificado (`showBackgroundInPerformanceMode`) para equilibrar estética y coste.
3. Esta separación mantiene legibilidad en desktop y estabilidad de FPS en móvil.

## Errores y seguridad de interacción

1. Los errores funcionales de Arsenal se muestran con `HubErrorDialog` (animado, con `X` y autocierre).
2. El diálogo de error reproduce `ERROR_COMMON` (`/audio/hub/common/error-common.mp3`).
3. El botón `Añadir` se deshabilita si no hay copias libres reales en almacén.
4. En mobile, las cartas sin unidades libres (`U 0`) se muestran desactivadas como en desktop.
5. La validación final sigue en backend (`AddCardToDeckUseCase`), evitando bypass por cliente.

## Audio de Arsenal

Eventos conectados vía `useHubModuleSfx`:

1. Abrir filtros mobile: `FILTER_OPEN` (`/audio/hub/common/filter.mp3`).
2. Cerrar inspector: `INSPECTOR_CLOSE` (`/audio/hub/common/cerrar-dialog.mp3`).
3. Pulsar remover: `REMOVE_CARD` (`/audio/hub/arsenal/remover.mp3`).
4. Pulsar añadir: `ADD_CARD` (`/audio/hub/arsenal/añadir.mp3`).
5. Mostrar overlay de evolución: `EVOLUTION_OVERLAY` (`/audio/hub/arsenal/evolution.mp3`).
6. Pulsar botón evolucionar: `EVOLUTION_BUTTON` (`/audio/landing/button-click.mp3`).

## Reglas de salida y combate (deck 20/20)

1. Salir de `Arsenal` con el botón `Menú` abre diálogo de confirmación si el deck principal no está en `20/20`.
2. El diálogo ofrece tres decisiones:
   - `Salir Igual` (volver al Hub),
   - `Ir al Market`,
   - `Cerrar` (seguir en Arsenal).
3. Entrar a `Training` o `Story Duel` también valida `20/20` en servidor.
4. Si no cumple, se muestra pantalla de bloqueo con CTA a `/hub/home`.

## Drag & Drop instantáneo

1. `Collection -> Deck/Fusion` aplica actualización optimista inmediata y rollback si falla persistencia.
2. `Deck/Fusion -> Collection` también es optimista para mantener respuesta instantánea.
3. `Deck -> Deck` y `Fusion -> Fusion` permiten recolocar cartas entre slots vacíos.
4. Se mantiene feedback sonoro de `ADD_CARD` y `REMOVE_CARD` en desktop y mobile.

## Sincronización UI/BD (Fase 2 - robustez)

1. Las mutaciones de deck se serializan en cola FIFO con `use-deck-mutation-queue` para evitar carreras al hacer acciones rápidas consecutivas.
2. El estado optimista ya no se sobrescribe con cada `success` remoto; así se evita el efecto visual de cartas que reaparecen temporalmente.
3. En caso de error, la UI se reconcilia contra estado autoritativo usando `GET /api/home/deck/current` antes de mostrar fallback.
4. Se mantiene cache local de sesión (`deck-state-cache`) con TTL corto para evitar remounts con snapshot antiguo tras refresh.
5. El flujo resultante prioriza experiencia instantánea sin perder consistencia final con Supabase.

## Estructura interna (Fase 2)

1. `internal/actions/`: acciones async de negocio UI (`insert/remove/evolve`).
2. `internal/dnd/`: resolución de drops por destino.
3. `internal/hooks/`: estado y composición de handlers.
4. `internal/view/`: vista principal y builder de props.
5. `internal/types/`: contratos internos compartidos.

## Testing de fase 0/1/3

1. `layout/HomeResponsiveWorkspace.test.tsx` valida que se montan ambos layouts.
2. `layout/HomeMobileWorkspace.test.tsx` valida tabs mobile y apertura del inspector.
3. Las pruebas existentes de negocio y acciones del módulo se mantienen.

