<!-- CHANGELOG.md - Historial de cambios versionados del proyecto siguiendo SemVer y Keep a Changelog. -->
# Changelog

Este archivo sigue el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.9.1] - 2026-07-05

### Fixed
- Setup de contribuidor: `pnpm install` compila los binarios nativos (esbuild, sharp, unrs-resolver) de forma automática vía `pnpm.onlyBuiltDependencies` en `package.json`. Ya no aparece `ERR_PNPM_IGNORED_BUILDS` ni hace falta `pnpm approve-builds` (que además bloqueaba `pnpm dev`): pnpm 11 no respetaba la sintaxis `only-built-dependencies[]` del `.npmrc`.
- Auth: `getCurrentSession` devuelve `null` ante un refresh token inválido o caducado en las cookies (sesión antigua o BD local recién creada) en vez de lanzar un 500 en `/login` y `/register`.
- Bootstrap de Supabase local: el mensaje de fallo apunta a la causa real (DNS/red/VPN de Docker), y CONTRIBUTING documenta ese caso y el del refresh token.

### Changed
- Academy: el nodo de Documentación es ahora una imagen holográfica (servidor) como los de Tutorial y Arena, en vez de la baraja de cartas (se veía mal en móvil).

## [1.9.0] - 2026-07-03

### Added
- Arena — **6 combates por nivel**: cada nivel enfrenta a los mismos 6 rivales fijos y en orden (GenNvim → Helena → Jaku → Mouretech → Soldado → Guill), y a cada nivel son más fuertes. Se enfrentan por victorias (ganas a uno para pasar al siguiente) y se avanza de nivel al ganar los 6. En el lobby, fila de progreso con el avatar de cada rival (ganados / siguiente / pendientes) y contador «Combate X de N».
- Códex/Documentación (Academy): el holograma es seleccionable en todo su contenido (también el centro); en móvil muestra 3 cartas reales distintas. En Historia, sección narrativa de la trama con fuente sci-fi dedicada.

### Changed
- Arena: eliminados el rival comodín aleatorio y la dificultad adaptativa; la fuerza de cada nivel es fija (escalado/dificultad del tier). Desbloquear el siguiente nivel requiere 6 victorias (antes 5).

### Fixed
- Cementerio en combate: el diálogo hace scroll correctamente en móvil y ya no recorta las cartas.
- Academy: holograma de Documentación en móvil (bordes raros) y zona de activación del pilar en desktop.

### Internal
- Catálogo: se sellan en la fuente de verdad de migraciones (`docs/supabase/sql`) las entities Docker, TypeScript y Kubernetes para paridad con producción en clones limpios.

## [1.8.1] - 2026-07-02

### Fixed
- Tienda de canje del evento: las cartas ya muestran su descripción (y efecto/pasiva). El endpoint `cards-by-ids` devolvía un subconjunto de columnas sin `description`; ahora reutiliza el cargador canónico `loadCardsByIds` (mismo SELECT/mapeo que el resto de repos).
- Academy 3D (holograma de Documentación): los velos holográficos de las cartas usan el mismo `clip-path` biselado que la Card; con esquinas redondeadas asomaban por el chaflán y en móvil real se veían como bordes cian.

## [1.8.0] - 2026-07-02

### Added
- Academy 3D: nueva pantalla de acceso con 3 pilares holográficos, carrusel en móvil y zoom al pulsar.
- Códex/Documentación para novatos (Academy): guía navegable por secciones (tipos de carta, efectos, niveles/XP, versiones, pasivas de maestría, Historia y oponentes) con cartas reales de ejemplo y demos de VFX. Totalmente adaptada a móvil (contenedor de scroll único y fiable + pestañas fijas).
- Historia (Códex): sección narrativa de la trama del juego —planteamiento «Año 2050», las tres facciones (Big Tech, Open Source, Sindicalistas No-Code), la amenaza de «La Entidad» y el rol del Prompt Master— con fuente narrativa sci-fi dedicada.
- SEO/GEO: dominio `ai-gi-oh.es` con SEO clásico y optimización para motores de IA; imagen Open Graph/Twitter de marca generada dinámicamente.
- Combate: animación y flujo de las 10 pasivas mastery V5, y VFX de Autoguardado al morir la entity.
- Arena: dos oponentes nuevos (Guill nivel 6 + Mouretech comodín) y cambio de nivel sin recarga de página (soft-nav).
- Admin usable en móvil: Catálogo, Market, Starter, Story y el editor de mazos de Arena muestran el detalle como diálogo.
- `pnpm db:validate` valida también las cartas de los decks referenciados en migraciones.

### Changed
- Academy: mejoras de rendimiento y de UI en móvil (carrusel, oclusión de mazo, zoom al pulsar).

### Fixed
- Academy: Mouretech en tier 4, correcciones del Academy 3D en móvil y poder de carta mostrado en el cementerio.

## [1.7.2] - 2026-06-30

### Added
- `pnpm release:prepare <major|minor|patch|X.Y.Z>`: sincroniza la versión en `package.json`, `README.md` y `CHANGELOG.md` (incluidos los enlaces de comparación del pie) en un solo comando, promoviendo la sección `[Unreleased]` a la nueva versión. Evita el bump manual en 3 sitios.
- Arena (admin): editor visual de mazos estilo Story con layout de 4 columnas — oponentes y variantes, mazo (deck + fusión) con miniaturas reales, almacén con buscador/filtros e inspector con escalado versión/nivel/xp por carta; pestañas «Mazos» / «Estructura».
- Arena: recuerda el último nivel seleccionado por el jugador (cookie) en lugar de volver siempre al Nivel 1 al entrar.

### Changed
- Arena: selector de nivel más claro en el lobby (cabecera «Nivel X de N», candado en niveles bloqueados y marca del nivel actual).

### Fixed
- Arena: las cartas del oponente ahora suben ataque/defensa según su nivel (10/20/30) y reflejan su versión, aplicando las mismas reglas de progresión que el jugador (antes solo se fijaba el nivel sin recalcular los stats).

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

[Unreleased]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.9.1...HEAD
[1.9.1]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.8.1...v1.9.0
[1.8.1]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.7.2...v1.8.0
[1.7.2]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/BobFarreras/Ai-Gi-Oh/releases/tag/v1.0.0
