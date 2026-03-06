# Board UI Module

Componentes visuales del tablero. Renderiza estado y eventos, sin reglas de dominio.

## Archivos principales

1. `BattleBannerCenter.tsx`
   - Cartelera central para turno/subturno.

2. `CombatLogEventRow.tsx`
   - Fila del historial con formato visual por evento.
   - Usa submódulos en `internal/combat-log-row/`.

3. `DuelResultOverlay.tsx`
   - Overlay de fin de partida.

4. `GraveyardBrowser.tsx`
   - Navegador visual de cementerio (jugador/rival).

5. `GraveyardTransitionLayer.tsx`
   - Animaciones reutilizables hacia cementerio.

6. `PhasePanel.tsx` y `TurnTimer.tsx`
   - Estado de fase y temporizador.

7. `OpponentHandFan.tsx`
   - Representación de mano rival.

## Subcarpetas

1. `layers/`
   - Capas de composición de `Board`.

2. `layout/`
   - Layout de controles y topbar.

3. `overlays/`
   - Overlays de estado visual.

4. `internal/combat-log-row/`
   - Helpers de presentación para filas del `CombatLog`.

## Reglas de módulo

1. No introducir reglas del motor aquí.
2. Las decisiones de dominio se obtienen desde hooks/casos de uso.
3. Mantener accesibilidad en elementos interactivos (`aria-label` o texto visible).

