<!-- CHANGELOG.md - Historial de cambios versionados del proyecto siguiendo SemVer y Keep a Changelog. -->
# Changelog

Este archivo sigue el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

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

[Unreleased]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/BobFarreras/Ai-Gi-Oh/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/BobFarreras/Ai-Gi-Oh/releases/tag/v1.0.0
