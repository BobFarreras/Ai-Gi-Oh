<!-- HUB.md - Documenta la lógica funcional y de navegación del dashboard central (sala de control). -->
# Hub Central (Sala de Control)

## Objetivo

El hub es la puerta de entrada a los modos principales del juego fuera del duelo directo.

## Flujo actual

1. El usuario entra en `/hub`.
2. Se carga `GetHubMapUseCase` con `HubService` + `IHubRepository`.
3. El servicio aplica reglas de acceso (`HubAccessPolicy`) sobre las secciones.
4. La UI renderiza paneles HUD clicables (`HubSceneNode3D` + `HubNodeActionPanel`).
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

## Refactor Hub 3D (Fase 0 - Contrato)

Estado: aprobado para implementación por fases.

### Objetivo visual

1. Sustituir el estilo HUD plano por una sala de control futurista coherente.
2. Construir navegación con nodos tácticos 3D (escena central) y paneles de estado desacoplados.
3. Evitar dependencia de imágenes estáticas como base principal del diseño.

### Decisiones de arquitectura UI

1. `HubShell` será el contenedor raíz visual del hub.
2. `HubScene3D` será responsable exclusiva de:
   - canvas 3D,
   - cámara/luces,
   - nodos de navegación.
3. Widgets desacoplados:
   - `HubUserSection`,
   - `HubSessionSection` (logout),
   - `HubProgressSection` (medallas/capítulo/tutorial).
4. El header clásico desaparece y se reemplaza por `HubProgressSection`.
5. La lógica de bloqueo/desbloqueo de secciones se mantiene en dominio (`HubAccessPolicy`, use-cases), nunca en componentes 3D.

### Reutilización de fondo

1. Se reutiliza `CyberBackground.tsx` como capa base atmosférica.
2. El fondo se usa como capa inferior no interactiva (`pointer-events: none`).
3. La escena 3D y widgets se montan por encima, con jerarquía de `z-index` documentada.

### Reglas de calidad para el refactor

1. Sin archivos nuevos >150 líneas (salvo excepción justificada).
2. Tests co-localizados para:
   - mapeo de nodos,
   - render de estados lock/unlock,
   - navegación por sección.
3. Accesibilidad obligatoria en nodos clicables (`aria-label`).
4. No se permite lógica de negocio en componentes de escena.

## Guía de implementación por fases

### Fase 1: Shell y secciones desacopladas

1. Crear `HubShell`, `HubUserSection`, `HubSessionSection`, `HubProgressSection`.
2. Integrar `CyberBackground` como base.
3. Mantener rutas y estados de bloqueo actuales.

#### Estado actual

1. `HubShell` implementado y en uso desde `src/app/hub/page.tsx`.
2. `HubScene` queda enfocada en una escena sin contenedores globales, con nodos distribuidos por pantalla.
3. `HubUserSection`, `HubSessionSection` y `HubProgressSection` se renderizan como nodos flotantes integrados en la escena.
4. Cada sección principal tiene decoración propia desacoplada en `src/components/hub/nodes/*`.
5. El layout de nodos es asimétrico y evita solapes entre secciones interactivas.
6. Si no hay soporte WebGL, el hub cae automáticamente a `HubSceneFallback2D`.

### Fase 2: Escena 3D mínima

1. Introducir `react-three-fiber` + `drei`.
2. Renderizar nodos 3D básicos por sección.
3. Mantener fallback visual 2D si WebGL no está disponible.

#### Estado actual

1. Navegación real en nodos 3D (`router.push`) usando panel accesible (`HubNodeActionPanel`).
2. Secciones bloqueadas muestran `lockReason` al hacer click.
3. Nodos 3D mantienen estética y movimiento libre de cámara.

### Fase 3: Identidad visual por sección

1. Tema visual por nodo (`HOME`, `MARKET`, `STORY`, `TRAINING`, `MULTIPLAYER`).
2. Animaciones de hover/lock/unlock.
3. Integración de sonidos y feedback contextual.

### Fase 4: Hardening y documentación final

1. Optimización de rendimiento (FPS, densidad de efectos).
2. Cobertura de tests y accesibilidad.
3. Eliminación de estilos/archivos legacy del hub.

#### Estado actual

1. `MarketCore3D` refactorizado en submódulos (`market/*`) para reducir complejidad y facilitar mantenimiento.
2. Eliminados wrappers legacy no usados en hub 3D.
3. Añadidos tests co-localizados:
   - `HubNodeActionPanel.test.tsx`,
   - `hub-3d-node-math.test.ts`,
   - `market-radar-utils.test.ts`.

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
