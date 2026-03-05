<!-- HUB.md - Documenta la lógica funcional y de navegación del dashboard central (sala de control). -->
# Hub Central (Sala de Control)

## Objetivo

El hub es la puerta de entrada a los modos principales del juego fuera del duelo directo.

## Flujo actual

1. El usuario entra en `/hub`.
2. Se carga `GetHubMapUseCase` con `HubService` + `IHubRepository`.
3. El servicio aplica reglas de acceso (`HubAccessPolicy`) sobre las secciones.
4. La UI renderiza paneles HUD clicables (`HubSceneNode`).
5. Si la sección está bloqueada:
   - no navega,
   - muestra motivo de bloqueo al hacer click.
6. Si la sección está desbloqueada:
   - navega a su ruta (`/hub/*`).

## Reglas de acceso implementadas

1. `MARKET`, `HOME`, `TRAINING`: desbloqueadas por defecto.
2. `STORY`: requiere tutorial completado.
3. `MULTIPLAYER`: requiere al menos 1 medalla.

## Rutas de módulos

1. `/hub/market`
2. `/hub/home`
3. `/hub/training`
4. `/hub/story`
5. `/hub/multiplayer`

## Mi Home (Deck Builder)

1. El deck del jugador usa `20` slots fijos.
2. No se permiten más de `3` copias de una misma carta (`card.id`).
3. El guardado del deck falla si existe cualquier slot vacío.
4. `Mi Home` trabaja con dos fuentes:
   - Deck actual del jugador.
   - Almacén/Colección de cartas disponibles.
5. La UI se divide en:
   - Panel `Deck` (20 slots interactivos y reordenables),
   - Panel `Almacén` (cartas disponibles para añadir).
6. Las acciones de UI se orquestan vía `deck-builder-actions.ts` reutilizando casos de uso de dominio.

## Assets HUD esperados

Ruta: `public/assets/hud/`

1. `hud-container.png`
2. `hud-header.png`
3. `hud-section.png`

## Mercado (fase inicial de dominio)

1. Moneda del mercado: `Nexus`.
2. El catálogo contempla:
   - compra directa de cartas,
   - compra de sobres con cartas aleatorias.
3. Rarezas previstas para mercado:
   - `COMMON`, `RARE`, `EPIC`, `LEGENDARY`.
4. La rareza y probabilidad se gestionan en la capa `market` y no altera todavía las reglas del motor de combate.

## Mercado (fase 4 mock conectada)

1. Repositorios `in-memory` activos para:
   - catálogo de cartas y sobres,
   - wallet Nexus,
   - colección del jugador,
   - transacciones.
2. Casos de uso implementados:
   - `GetMarketCatalogUseCase`,
   - `BuyMarketCardUseCase`,
   - `BuyPackUseCase`.
3. La ruta `/hub/market` ya consume catálogo real mock y muestra saldo Nexus/catálogo/sobres como base para la UI completa.
