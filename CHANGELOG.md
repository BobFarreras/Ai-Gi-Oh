<!-- CHANGELOG.md - Historial de cambios versionados del proyecto siguiendo SemVer y Keep a Changelog. -->
# Changelog

Este archivo sigue el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.7.1] - 2026-06-30

### Fixed
- Instalación limpia de contribuidor: `entity-ubuntu` y `entity-duckduckgo` se referenciaban en el mercado pero ninguna migración las creaba en `cards_catalog` (existían solo en producción), rompiendo `supabase db reset` con FK 23503 al sembrar (migración 085, valores idénticos a producción + su pasiva V5).

### Added
- Test de validación `pnpm db:validate`: comprueba estáticamente (sin Docker) que toda carta referenciada por `seed.sql` la cree alguna migración de `cards_catalog`. Integrado en `quality:check` (gate de CI/PR) y como paso previo de `pnpm db:reset`.
- Documentación del flujo de contribución de BD en `docs/supabase/README.md` ("Regla de oro: toda carta nueva en prod necesita una migración" + sección del test de validación).

## [1.7.0] - 2026-06-29

### Added
- Tienda de evento: muestra la carta completa (`ResponsiveGameCard`) escalada de forma fluida a cualquier ancho, en vez de la miniatura.
- Enlaces de comunidad en la landing (GitHub + Discord) con iconos sociales animados (expansión en desktop, estética glass).
- Catálogo de 10 pasivas mastery V5 temáticas por arquetipo, con 6 mecánicas nuevas (Caja de Herramientas, Aprendizaje Continuo, Autoguardado, Cortafuegos Reactivo, Regeneración, Sobrecarga) y mapeo de las 67 entities (migración 078).
- Poderes innatos de entity: 10 cartas de stats bajos con pasiva activa desde V0 que escala hasta V5, vía resolver de magnitud editable (migración 079).
- Admin: selector de pasiva (V5 o innata) en el detalle del Card Catalog, y glosario de efectos del juego (pasivas, ejecuciones, trampas, innatos, triggers).
- Admin: editor de efecto de carta con selector de acción que inserta la plantilla JSON + interpretación en lenguaje claro.

### Changed
- El editor de nombre de operador ya no fuerza mayúsculas: el texto se ve tal cual se teclea.
- El poder de la carta (pasiva V5 o innata) se integra en su descripción, mostrando la magnitud real según la versión.

## [1.6.0] - 2026-06-29

### Added
- Desplegable de estadísticas en el HUD ("Estado del Arquitecto"): ELO + liga, saldo de Nexus y nº de cartas en colección, con carga lazy (endpoint `/api/player/hud-stats`).
- Sincronización de BD para contribuidores: `supabase/seed.sql` idempotente con el contenido esencial + comandos `pnpm db:reset` (regenera migraciones + reset) y `pnpm db:seed:dump` (regenera el seed desde la BD fuente).
- Auditoría de economía documentada (`docs/auditoria-economia-cartas.md`) y rebalanceo del catálogo: rareza coherente, precios corregidos, stats redondeados a rejilla y muros con coste ajustado (migraciones 074-077).
- Publicación automática de la Release de GitHub al pushear un tag `v*` (workflow `release-on-tag`).
- Onboarding: la recompensa diaria se abre con un leve retardo al llegar al hub.

### Changed
- El mercado se sirve siempre desde la BD: eliminado el fallback al mock y sus 4 consultas por arranque (mejora la latencia de login/hub).
- Login, registro y landing redirigen al hub si ya hay sesión; el logout vuelve a la landing y limpia la sesión.
- `.env*.example`, README, CONTRIBUTING y guía de despliegue sincronizados (mapa de variables de Vercel, comandos de BD).

### Fixed
- Tienda de eventos responsive en móvil: las cartas ya no se recortan.
- Card picker del admin: lee del catálogo real (no del mock) y sin `setState` síncrono en efecto.
- `getCurrentSession` devuelve `null` sin sesión en vez de lanzar (evita crash en `/login`).
- Onboarding: dock y recompensa diaria ocultos durante la narración/tutorial.
- Login: no rompe la UI ante respuestas no-JSON.
- IDs de la tienda de eventos derivados de la carta seleccionada.

### Security
- Rate limiting distribuido real en producción (Upstash) y límite de login por email reducido de 8 a 4 intentos / 10 min.
- `cards-by-ids` usa la sesión autenticada (RLS) en lugar de la service-role key.

## [1.5.0] - 2026-06-26

### Added
- Fusiones nuevas: CursHost, KuberLinnet, RustyFox y Super-C; cinemático de fusión agnóstico por convención (vídeo y render derivados del id, sin tocar código por fusión).
- 4 cartas mágicas (executions): Claude (recupera energía), Hydra (baja el ataque de todas las entities rivales), Cursor (descarta una carta de la mano rival) y Edge (destruye todas las trampas del rival).
- Mecánica de bloqueo de entity por turnos (Brave 2 turnos / GitHub 3 turnos): el jugador elige una entity rival que no podrá atacar durante N turnos; la IA la usa y respeta el bloqueo.
- Editor de eventos del admin: borrar reglas de puntos, retos de colección integrados en "Cómo se ganan puntos" y selector con todos los objetivos.
- Cartas nuevas disponibles en el mercado.

### Fixed
- Grid del mercado: scroll fluido sin cartas faltantes ni saltos (móvil y escritorio).
- Progreso de misiones de acción que mostraba siempre el máximo (LEAST con NULL en SQL); corregido en la migración 069.
- Login diario: se sincroniza entre el popup automático y el dock sin recargar la página.

### Changed
- IA: usa las nuevas cartas mágicas y de bloqueo; recetas de fusión del 2º lote completas.

## [1.0.0] - 2026-04-18

### Added
- Primera release estable del proyecto AI-GI-OH.
- Base jugable completa: Hub, Academy, Arsenal/Home, Market y Story.
- Hardening de seguridad en autenticación y rutas sensibles.
- Quality gates automáticos en CI (`lint`, `typecheck`, `test:coverage`, `audit`, `build`).
- Presentación TFM web interna en `/presentacion-tfm`.

[Unreleased]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.7.1...HEAD
[1.7.1]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/BobFarreras/Ai-Gi-Oh/releases/tag/v1.0.0
