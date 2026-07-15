<!-- CHANGELOG.md - Historial de cambios versionados del proyecto siguiendo SemVer y Keep a Changelog. -->
# Changelog

Este archivo sigue el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.15.1] - 2026-07-15

### Fixed
- **Las compras contaban mal la misión "Gasta 1000 Nexus"**: al comprar una carta o pack, el gasto no avanzaba la misión de Nexus (`SPEND_NEXUS`). Era una regresión del cierre de seguridad de v1.15: la cartera pasó a escribirse con service-role, pero las RPC `wallet_debit_nexus`/`wallet_credit_nexus` seguían atadas a `auth.uid()` (NULL bajo service-role), así que fallaban y el descuento caía a un camino alternativo que se saltaba el registro de la misión. Ahora las RPC operan sobre el jugador que envía el servidor (identidad de confianza) y registran la progresión correctamente; de paso se recupera la atomicidad del monedero. Migración **124**.

## [1.15.0] - 2026-07-15

### Added
- **Niveles hasta 100 con nueva curva de bonus**: hitos cada 5 niveles con el ciclo +50 ATK / +100 ATK / +50 DEF / +100 DEF (total **+750/+750** al llegar a 100), **−1 de energía en el nivel 50** e **imagen alternativa a nivel 100** (configurada, con fallback al render normal mientras no exista).
- **Caramelos de nivel (USB Raro)**: objeto que concede la XP exacta para subir de **+1 a +5** niveles (calculada en el servidor según el nivel real de la carta). Se compra en la sección Objetos del Mercado y se usa sobre una carta desde el Arsenal, con animación de subida de nivel.
- **Objetos de mejora permanente de ATK/DEF**: **Núcleo Overclock** (+100 ATK) y **Placa Blindada** (+100 DEF), con **tope por carta** calculado sobre el coste base (presupuesto 600/500/400/300/200 de coste 2 a 6). El tope lo valida el servidor.
- **Sección Objetos** propia en Mercado y Arsenal (conmutador Cartas/Objetos): almacén solo-objetos con su imagen, **dos flujos de equipar** (desde la carta o desde el objeto) y **cinemática** de "objeto equipado".
- **Compartir cartas en los mensajes privados (DM)**, con selector de carta en el compositor.
- **Aviso del premio semanal de ranking** al entrar al hub: el jugador ve por fin el puesto y los Nexus que ganó al cerrarse la semana.

### Changed
- **UX de reemplazo de zona** (magia/trampa con las 3 zonas llenas): ahora es **cancelable**, con barra propia persistente y confirmación rediseñada; ya no deja cartas resaltadas sin salida.
- El **deck activo del Arsenal** muestra las stats reales (nivel/versión/**mejoras**), igual que el almacén, no las base.

### Fixed
- **OpenClaw** muestra el aumento bloqueado (**−400**) en vez del delta bruto (−800); el efecto (restar el doble) no cambia.
- **Multijugador**: `instanceId` determinista para cartas revividas (Antigrabity) y las acciones del rival que el motor rechaza dejan de tragarse en silencio.
- **Rendimiento móvil**: se retira el `backdrop-blur` a pantalla completa de los overlays de fusión, los paneles móviles de descarte/sacrificio y el resaltado del modo reemplazo (el mayor asesino de FPS en móvil).

### Security
- **Cerrado el agujero de escritura de las tablas de valor**: un jugador podía darse Nexus infinitos, regalarse cartas y ponerse todo a nivel 100/V5 con un `PATCH` directo a Supabase. Ahora toda escritura de cartera/colección/progresión pasa por **service-role** o RPC **security definer** (identidad por `auth.uid()`); la migración **122** revoca a `authenticated` los permisos de escritura y las RPC de cartera. Test de regresión que caza cualquier reintroducción.
- **Cerrada la vulnerabilidad de CARD_SHARE**: la instantánea de la carta compartida la construye el servidor desde la colección real (valida posesión), no la metadata del cliente; se acaba el poder apuntar la imagen a una URL externa arbitraria. Las rutas de chat solo admiten `TEXT`/`CARD_SHARE`.

### Internal
- Migraciones **118** (aviso de premio semanal, `seen_at` + `ack_weekly_prizes`), **119** (arte de nivel máximo), **120/121** (caramelos de nivel + compra), **122** (bloqueo de tablas de valor) y **123** (objetos de mejora + RPC `buy_card_upgrade_item`/`apply_card_upgrade`), todas aplicadas a producción.
- Curva de niveles como **tabla de datos** (`CARD_LEVEL_MILESTONES`), leída también por el Códex. Regla de tope en `card-upgrade-rules.ts` con su espejo SQL `card_upgrade_budget`.
- `get-match-session-data` resuelve **los dos mazos** con progresión **y mejoras**, así que ambos clientes ven idénticos los stats en combate.

## [1.14.0] - 2026-07-14

### Added
- **Evento — nuevas cartas en la tienda de Fragmentos**: Flutter Enjambre (400), Escudo Firewall (400), Golpe Naranja (350) y Avast (250).
- **Nuevas formas de ganar Fragmentos**: ganar combates multijugador (+100) y una misión de evento por **superar el Nivel 5 de la Arena** (300 Fragmentos), retroactiva para quien ya lo haya logrado.
- **Novedades**: sección del boletín que presenta las cartas nuevas con su render, efecto y acceso a la tienda.
- **Arena — dos rivales nuevos del Acto 3**: Soldado-Laptop (7º) y Gokernel (8º y último), que cierran el roster del ladder como combates finales de cada nivel; Soldado-Laptop estrena las trampas nuevas del evento.
- **Arena — Niveles 7 (ZENITH) y 8 (SINGULARITY)**: niveles de prestigio sobre el techo MYTHIC con mayor recompensa (x2.9 y x3.3).

### Changed
- El roster del ladder de Arena pasa de 6 a 8 rivales: completar un nivel exige ahora 8 victorias.
- El progreso de Arena es **monótono**: un nivel ya desbloqueado nunca se re-bloquea aunque suba el requisito de victorias.
- **Novedades**: retiradas las secciones "Motor Overworld v2" y "Próximamente: Nuevas Cartas".

### Internal
- Migraciones **115** (objetivo de misión de estado `REACH_ARENA_TIER` + misión `evt-launch-arena-tier5`), **116** (oponente `training-soldado-laptop` + niveles 7/8) y **117** (oponente `training-gokernel`, `required_wins_in_previous_tier = 8`). Cada oponente con 2 variantes de mazo. Aplicadas a producción; contenido de evento/novedades/arena sincronizado en `seed.sql`.
- `resolveTrainingTierAccess` incorpora suelo monótono de nivel desbloqueado; `ARENA_LADDER_ROSTER` y el catálogo de tiers (código) reflejan el roster de 8 y los niveles 7/8.

## [1.13.0] - 2026-07-14

### Added
- **~18 cartas nuevas de magia y trampa** con efectos de motor nuevos, más la entity **Antigrabity** y su poder innato **Reactivación** (revive del cementerio al inicio de su turno). Incluye:
  - Magia: +1000 ATK a una carta concreta (figma/copilot/arch), Golpe Naranja (daño condicional), Firewall Fortaleza (bloquea ataques directos 3 turnos), Red Neuronal Cloud (destruir entity), Appel (voltear a defensa), Cubo Metálico (sacrificar por energía), Núcleo de Datos (doble invocación), reaq m (intercambiar tablero), Terminal Córtice (intercambiar manos), Octocat (robar entity), Procesador Cuántico (robar magia/trampa).
  - Trampa: Bandera Windows (infección −300 LP/turno), Abrazo Hugging (regeneración +300 LP/turno), Flutter Enjambre (anula ataque directo y refleja el ATK), Escudo Metasploit (bloquea el ataque), OpenClaw (penaliza el buff rival por debajo de su base), Escudo Firewall (anula y destruye la magia rival), Escudo TypeScript (escudo persistente ligado, +1000 DEF acumulable).
- **Sistema de estados multi-turno** a nivel de jugador (base de daño/curación por turno y "sin ataques directos").
- **Badges de estado en el HUD** (escudo, infección, regeneración) en escritorio y móvil.
- **Ayuda "?" de puntuación** en cada tablero de ranking + sección de rankings en el Códex, con premios en vivo desde la BD.
- Los recuadros del badge "Estado del Arquitecto" del hub navegan a su sección correspondiente.

### Changed
- El **contra-trampa Nullify es decidible**: pregunta antes de activarse (también en ataque directo y ante buffs), en vez de saltar solo.
- **OpenClaw** no solo anula el buff rival: penaliza dejando las entities por debajo de su valor original.
- **Escudo TypeScript** refuerza TODAS tus TypeScript y solo se activa si el rival ataca a una de ellas.
- El **glosario/Códex** incluye automáticamente todos los efectos nuevos, con carta de ejemplo real, y la **IA** sabe jugar las magias nuevas.

### Fixed
- La misma carta presente en ambos campos (p. ej. una fusión) ya no confunde la selección de objetivo en combate.
- El detalle de una carta V5 explica el efecto del poder sin duplicar el texto.
- Tocar una carta del combat log abre su detalle también en móvil.
- El texto de cierre del ranking semanal muestra la hora local (24:00) en vez de 22:00 UTC.

### Internal
- Migraciones **096–114** (todas aditivas, `INSERT ... ON CONFLICT`): las ~18 cartas nuevas + Antigrabity y sus listings de mercado.
- Motor: sistema de estados (`IActiveStatusEffect`), negación de ataque generalizada, contra-magia con reordenación de timing (interceptar antes de resolver), trampa persistente (`keepTrapSet`), y condición de activación de trampa por efecto/contexto (`trapActivationConditionMet`).
- 19 cartas del lote añadidas a `mock-cards` (cartas-ejemplo del Códex y resolubles por la IA) y heurísticas de IA en `select-opponent-play`.
- Guía maestra del lote (`docs/features/new-cards-magic-trap-guide.md`) documentada por fases.

## [1.12.0] - 2026-07-12

### Added
- **Rankings semanales**: dos clasificaciones nuevas (Actividad y Comercio) con premios automáticos los domingos (pg_cron). Actividad suma combates y misiones/eventos/diarias reclamadas; Comercio suma cartas, packs y evoluciones.
- **Selector de rankings**: la página de ranking pasa a un selector entre tres tableros (Multijugador ELO, Actividad, Comercio) con transición animada de posiciones al cambiar.
- **Mensajes privados 1-a-1** (estilo WhatsApp): bandeja de conversaciones, no-leídos, tiempo real y notificaciones (badge de no-leídos en el botón de chat y en el enlace de mensajes).
- **Responder arrastrando** un mensaje (estilo WhatsApp) en el chat de comunidad y en los privados.
- **Columna de Nexus gastados** en el ranking comercial (suma de compras de la semana).

### Changed
- Hub: los botones flotantes se recolocan en móvil (clúster 2×2) para no invadir el centro ni la etiqueta del jugador.

### Fixed
- Historia (Acto 3): corregido el bloqueo (soft-lock) del puzzle de la caja y la placa; al ganar el duelo de la sala la puerta ya no se cerraba dejando al jugador atrapado (la placa queda enclavada).

### Internal
- Migraciones 093 (responder a mensajes), 094 (rankings semanales + pg_cron), 095 (mensajes privados con RLS estricta).
- Documentación: guía del batch comunidad+rankings y diseño del selector de ranking.

## [1.11.0] - 2026-07-11

### Added
- **Chat de comunidad en vivo**: página `/hub/chat` con presencia en tiempo real (Supabase Realtime), reacciones con emojis, compartir cartas y retar a duelo desde el chat.
- **Historia (Acto 3)**: "Repositorio Fantasma" (Jaku) con flujo narrativo completo sobre el overworld, nuevo mapa, soundtrack y oponente Soldado-Laptop.
- **Badge de acto** al entrar al overworld ("ACTO N · Nombre").
- **Motor overworld v2**: mecánicas interactivas (puertas, puentes, eventos), schema v2, lighting, reglas de empuje y sightline.
- **Progresión**: misiones reclamables siempre arriba en cada sección (diarias, semanales, evento).
- **Novedades**: badge del campana se borra al abrir el diálogo (visto en localStorage).
- Test de flujo de combate del oponente HeuristicOpponentStrategy.

### Changed
- Arsenal/Mercado: muestra ATK/DEF/coste según nivel y versión del jugador.
- Performance (board): aislamiento del re-render de slot por selección (menos jank en móvil).
- Combate: entidad bloqueada no puede atacar zona de magias/trampas rival.
- Fusiones Story ahora opcionales en admin + animación de bloqueo mejorada.

### Fixed
- Testers 2a tanda: landing usuario, evolución/detalle móvil, UI de bloqueo.
- Testers lote: arsenal, market, combate, IA, magias.

### Internal
- Migraciones 089-092: overworld v2, Acto 3 Jaku, chat messages, chat reactions.
- Documentación: diseño del chat/foro de comunidad (Supabase Realtime + pg_cron).
- Guía del motor overworld (`docs/story/overworld-engine-guide.md`).
- Lote de fixes testers (`docs/fixes/2026-07-testers-batch.md`, `2026-07-testers-batch-2.md`).

## [1.10.4] - 2026-07-09

### Fixed
- Historia (overworld): los eventos vistos (diálogos, vídeos, cutscenes) se guardan en la base de datos y ya no reaparecen al entrar desde otro navegador o dispositivo; antes solo se recordaban en `localStorage`.
- Historia (overworld): recoger una recompensa de Nexus ya no duplica la cantidad ni muestra varias etiquetas «+N» al mantener la dirección contra ella (guard de reclamación en vuelo).
- Combate (móvil): las cartas del tablero vuelven a mostrar los atributos flotantes (energía/ATK/DEF) como en escritorio —imagen holográfica arriba, atributos grandes y legibles debajo—, sin el coste de la animación en bucle ni los blurs de GPU del holograma de escritorio.

### Changed
- Historia (overworld): las recompensas y eventos interactivos se activan **pulsando el botón de acción** frente a ellos (antes se disparaban al pisarlos o al chocar), lo que elimina el tirón de recogerlos en marcha.

### Added
- Historia (overworld): al recoger una carta se muestra la carta real a tamaño de lectura y se encoge hacia el personaje.

## [1.10.3] - 2026-07-09

### Fixed
- Historia (overworld, móvil): la escena se ajusta al **alto visible real** del dispositivo (`window.visualViewport`), en vez de `100dvh`/el wrapper `min-h-dvh` del hub, que se extendían por debajo de la barra del sistema. Se acabaron los controles cortados y el scroll indebido.
- Historia (overworld, móvil): los **vídeos** ya no se entrecortan. Mientras se reproduce un vídeo se pausa el bucle de render del canvas (60Hz) para no competir con el decodificador; se reanuda al cerrarlo.

## [1.10.2] - 2026-07-09

### Fixed
- Historia (overworld): un jugador nuevo vuelve a ver los eventos. El caché local de "eventos vistos" se aislaba solo por mapa, así que se filtraba entre cuentas del mismo navegador; ahora la clave incluye también el jugador.
- Historia (overworld): se elimina el "freno" al cruzar casillas de evento o recompensa. El movimiento solo se detiene cuando se abre algo que bloquea (combate, mercado/arsenal, cutscene, vídeo, narración o panel de acción); los pasos sin acción y las recompensas normales se cogen sin detener al personaje.
- Multijugador (móvil): el botón "Ranking" ya no se sale del contenedor. Los badges de presencia se alinean a la izquierda y el botón cabe con su texto completo.
- Ranking (móvil): la forma reciente (últimas 5 partidas) se muestra como un gráfico circular de 5 secciones (ocupa mucho menos y deja sitio al nombre); en escritorio se mantienen las bolitas. Además, tocar una fila despliega el nombre completo.

## [1.10.1] - 2026-07-08

### Fixed
- Móvil (PWA / pantalla completa): los controles del overworld ya no quedan tapados por la barra de navegación del sistema ni obligan a hacer scroll. Se declara el viewport con `viewport-fit=cover` (habilita las `env(safe-area-inset-*)` en toda la app) y el D-pad y el botón de acción respetan el área segura inferior.

## [1.10.0] - 2026-07-08

### Added
- **Modo Historia rediseñado como overworld semi-abierto** (estilo Pokémon): recorres un mapa 2D con tu personaje (flechas/WASD, o D-pad en táctil), esquivas o retas a los rivales según su **línea de visión**, recoges Nexus/cartas al pisarlos, activas eventos con vídeo/narración, y entras a **Mercado** y **Arsenal** como nodos del propio mapa. Cubre el **Acto 1** (facility de servidores) y el **Acto 2** ("Valle Visual": búnkeres sobre el abismo, puentes, dos mitades de llave y jefa). Sustituye al panel de nodos clásico y se activa por entorno (`STORY_OVERWORLD_ENABLED`), de forma reversible.
- Overworld: **minimapa** de esquina, **zoom de cámara** por salas, **cutscenes** guionizadas (intro con BigLog), **puertas y puentes** que se abren en vivo al cumplir requisitos, patrullas de rivales con acercamiento antes del combate, recompensas que se recogen al chocar, y **jefe obligatorio** ante el portal del siguiente acto.
- **Penalización de 50 Nexus** al perder o abandonar un duelo de Historia (server-authoritative y limitada al saldo, nunca deja el monedero en negativo).

### Changed
- Diálogo de **pausa** en combate: botón "Reanudar Combate" (antes "Reanudar Simulación") y aviso claro de que abandonar penaliza con 50 Nexus.
- Controles del overworld **adaptados al dispositivo**: en escritorio se muestra una ayuda de teclado difuminada (W/A/S/D + Espacio); en móvil, un D-pad y un botón de acción con estética cibernética que respetan la *safe-area* (no los tapa la barra del móvil) y con la cámara más alejada para ver más mapa.

### Internal
- Esquema (migración **089**): columnas `overworld_map_id` y `overworld_position` en `player_story_world_state` (aditiva y no destructiva). El contenido de Historia (duelos, decks, cartas) se reutiliza del ya existente en producción.

## [1.9.2] - 2026-07-06

### Added
- Contribuidores: `pnpm db:make-admin` concede acceso al panel de administración en la BD local (por email, con guarda anti-producción), documentado en CONTRIBUTING («Acceder al panel de administración en local»). Antes no había forma clara de hacerse admin en local.

### Changed
- Arena (móvil): cabecera del lobby más compacta. El selector de nivel es un desplegable con estilo de juego (`GameSelect`, como Market/Arsenal) con los niveles bloqueados atenuados; se ocultan en móvil «Arena · Nivel X de N» y la frase «Te faltan X victorias…», y las monedas de rivales del ladder son más pequeñas. En desktop sin cambios.

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

[Unreleased]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.15.1...HEAD
[1.15.1]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.15.0...v1.15.1
[1.15.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.10.4...v1.11.0
[1.10.4]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.10.3...v1.10.4
[1.10.3]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.10.2...v1.10.3
[1.10.2]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.10.1...v1.10.2
[1.10.1]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.9.2...v1.10.0
[1.9.2]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.9.1...v1.9.2
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
