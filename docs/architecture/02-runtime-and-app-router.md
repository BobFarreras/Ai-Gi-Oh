<!-- docs/architecture/02-runtime-and-app-router.md - Resume entradas App Router y orquestación runtime de cliente/servidor. -->
# Runtime y App Router

## Entradas principales

1. `app/page.tsx`: landing pública.
2. `app/login` y `app/register`: autenticación de acceso.
3. `app/hub/*`: módulos del juego (home/market/story/training/multiplayer).
4. `app/api/*`: endpoints HTTP finos sin reglas de negocio embebidas.

## Orquestación en runtime

1. Server-first en App Router para carga de datos cuando aplica.
2. Componentes client solo cuando hay interacción directa (hooks/eventos/animación).
3. En `board`, la fachada `useBoard` orquesta estado UI y puente con motor.
4. Módulos visuales grandes se fragmentan en secciones internas para no crear “GOD components”.

## Flujo general de acción

1. UI dispara evento.
2. Hook/servicio traduce a caso de uso.
3. Caso de uso aplica reglas de dominio.
4. Adaptador de infraestructura persiste o consulta.
