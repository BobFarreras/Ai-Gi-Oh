<!-- src/components/hub/market/README.md - Guía del módulo UI Market, su estructura y reglas de integración. -->
# Módulo Market (UI)

## Objetivo

Renderizar la experiencia de mercado dentro del hub:

1. Catálogo de cartas sueltas.
2. Selección y compra de sobres.
3. Apertura animada de sobre.
4. Panel combinado de `Almacén | Historial`.

## Estructura recomendada

```text
src/components/hub/market
├── MarketScene.tsx                    # Orquestación de la pantalla Market
├── MarketCardInspector.tsx            # Detalle de carta y compra contextual
├── layout/
│   └── MarketHeaderBar.tsx            # Cabecera con saldo, búsqueda y filtros
│   ├── MarketDesktopGrid.tsx          # Composición de paneles en escritorio
│   └── MarketMobileStack.tsx          # Navegación por pestañas en móvil
├── listings/
│   └── MarketListingsPanel.tsx        # Grid principal de cartas
├── packs/
│   ├── MarketPacksPanel.tsx           # Lista horizontal de sobres
│   └── MarketPackCardTile.tsx         # UI de una tarjeta de sobre
├── reveal/
│   ├── MarketPackRevealOverlay.tsx    # Overlay de apertura
│   ├── MarketRevealEnvelope.tsx       # Fase de sobre (idle/opening)
│   └── MarketRevealCardsGrid.tsx      # Fase de cartas reveladas
├── vault/
│   ├── MarketVaultPanel.tsx           # Contenedor de pestañas Almacén/Historial
│   ├── MarketVaultCollectionTab.tsx   # Pestaña de almacén
│   └── MarketVaultHistoryTab.tsx      # Pestaña de historial
├── market-filters.ts                  # Tipos de filtros/orden
├── market-listing-view.ts             # Pipeline de filtrado/ordenado
└── internal/
    ├── useMarketSceneState.ts         # Estado + acciones de la escena
    ├── market-scene-store.ts          # Store local Zustand para estado UI y datos
    ├── useMarketPurchaseActions.ts    # Acciones de compra desacopladas del render
    ├── MarketNexusSpendFloat.tsx      # Flotante reutilizable de gasto Nexus (-NX)
    ├── useSyncSelectedListing.ts      # Sincroniza selección y catálogo visible
    ├── usePackRevealPhase.ts          # Máquina de fases del overlay
    ├── format-market-transaction-date.ts
    └── pack-mosaic-cards.ts
```

## Reglas de diseño técnico

1. Componentes de UI sin reglas de negocio del dominio.
2. Compra/actualización de estado vía `services/market/market-actions.ts`.
3. Un archivo por responsabilidad; objetivo `< 150` líneas.
4. Todo elemento interactivo con `aria-label`.
5. Estado de escena gestionado con store local Zustand para minimizar re-renders.

## Dependencias y flujo

1. `app/hub/market/page.tsx` hidrata datos iniciales con casos de uso.
2. `MarketScene` usa `useMarketSceneState` (sobre Zustand local) para:
   - comprar cartas,
   - comprar sobres,
   - refrescar `wallet`, `collection`, `transactions`.
3. `MarketPackRevealOverlay` solo consume estado visual ya resuelto.
4. `MarketScene` enruta la UI por viewport:
   - `xl+`: `MarketDesktopGrid` (estructura original en 3 columnas).
   - `<xl`: `MarketMobileStack` (vista por pestañas + inspector en diálogo).
   - `PACKS` mobile: selector de sobres + CTA de compra (sin reemplazar listado de cartas libres).
   - compra de pack mobile bloquea doble tap con estado `Procesando...`.
5. Estado inicial de mercado:
   - `selectedPackId = null` para entrar siempre en **cartas sueltas**.

## Audio de Market

Integrado con `useHubModuleSfx`:

1. Abrir detalle/inspector: `DETAIL_OPEN` (`/audio/hub/common/open-detall.mp3`).
2. Cerrar detalle/inspector: `DIALOG_CLOSE` (`/audio/hub/common/cerrar-dialog.mp3`).
3. Abrir filtros: `FILTER_OPEN` (`/audio/hub/common/filter.mp3`).
4. Cerrar filtros: `FILTER_CLOSE` (`/audio/hub/common/cerrar-filtro.mp3`).
5. Comprar carta individual: `BUY_CARD` (`/audio/hub/market/comprar-carta.mp3`).
6. Comprar pack: `BUY_PACK` (`/audio/hub/market/comprar-pack.mp3`).
7. Abrir animación de pack: `PACK_REVEAL` (`/audio/landing/hero.mp3`).

## Manejo de errores

1. Los errores de compra se muestran con `HubErrorDialog` compartido.
2. El diálogo permite cierre manual (`X`) y autocierre para no bloquear el flujo.
3. El feedback sonoro de error usa `ERROR_COMMON` (`/audio/hub/common/error-common.mp3`).
4. La compra de carta no aplica descuento ni animación flotante hasta confirmar respuesta de servidor.
5. El servidor (caso de uso + repositorios persistentes) es la autoridad final de saldo, stock y disponibilidad.

## Riesgos comunes (y mitigación)

1. **Desalineación de selección** cuando cambian filtros/sobre:
   - mitigado por `useSyncSelectedListing`.
2. **Duplicación de lógica en componentes**:
   - mitigado centralizando acciones en `useMarketSceneState`.
3. **Deuda visual por componentes legacy**:
   - mantener inventario limpio y eliminar UI no referenciada.
