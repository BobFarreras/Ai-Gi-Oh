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

## Testing de fase 0/1

1. `layout/HomeResponsiveWorkspace.test.tsx` valida que se montan ambos layouts.
2. Las pruebas existentes de negocio y acciones del módulo se mantienen.
