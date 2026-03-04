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

## Assets HUD esperados

Ruta: `public/assets/hud/`

1. `hud-container.png`
2. `hud-header.png`
3. `hud-section.png`
