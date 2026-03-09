<!-- src/components/game/board/ui/README.md - Documenta componentes visuales y capas de la UI del tablero. -->
# Módulo UI del Board

Componentes visuales del tablero. Renderiza estado y eventos, sin reglas de dominio.

## Archivos principales

1. `BattleBannerCenter.tsx`
   - Cartelera central para turno/subturno.

2. `CombatLogEventRow.tsx`
   - Fila del historial con formato visual por evento.
   - Usa submódulos en `internal/combat-log-row/`.

3. `DuelResultOverlay.tsx`
   - Overlay de fin de partida con layout adaptativo de recompensas y EXP.

4. `GraveyardBrowser.tsx`
   - Navegador visual de cementerio (jugador/rival).

5. `GraveyardTransitionLayer.tsx`
   - Animaciones reutilizables hacia cementerio.

6. `PhasePanel.tsx` y `TurnTimer.tsx`
   - Estado de fase y temporizador.

7. `OpponentHandFan.tsx`
   - Representación de mano rival.

8. `CinematicNarrationOverlay.tsx`
   - Overlay lateral para diálogos especiales (inicio, fusión, final).

## Subcarpetas

1. `layers/`
   - Capas de composición de `Board`.
   - `layers/internal/` contiene tipos, selector de estado derivado y vista desacoplada de `BoardInteractiveLayer`.

2. `layout/`
   - Layout de controles y topbar.

3. `overlays/`
   - Overlays de estado visual.

4. `internal/combat-log-row/`
   - Helpers de presentación para filas del `CombatLog`.

5. `internal/duel-result/*`
   - Piezas reutilizables del overlay de resultado (panel, fuegos, densidad, estado, tipos).

6. `internal/duel-result-overlay/*`
   - Segmentación del contenedor por variantes mobile/desktop y utilidades de composición.

7. `internal/banner/*`
   - Política de priorización de mensajes del banner central + tests.

8. `../narration/*`
   - Contratos y selector de eventos narrativos desacoplados del motor.

## Reglas de módulo

1. No introducir reglas del motor aquí.
2. Las decisiones de dominio se obtienen desde hooks/casos de uso.
3. Mantener accesibilidad en elementos interactivos (`aria-label` o texto visible).


