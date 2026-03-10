<!-- src/components/game/board/ui/internal/duel-result-overlay/README.md - Describe la segmentación interna del overlay de resultado. -->
# Internos de Overlay de Resultado

Submódulos de UI para separar responsabilidades de `DuelResultOverlay.tsx`.

1. `types.ts`
   - Contratos de props compartidos entre variantes mobile/desktop.
2. `resolve-duel-result-text.ts`
   - Regla de texto de cabecera del resultado final.
3. `use-duel-result-mobile.ts`
   - Hook de viewport móvil y pestaña activa.
4. `DuelResultActionButton.tsx`
   - Botón de acción común (reinicio/salida).
5. `DuelResultExperienceContent.tsx`
   - Estado de carga, vacío y grilla de cartas con EXP.
6. `DuelResultMobileContent.tsx`
   - Composición visual para móvil.
7. `DuelResultDesktopContent.tsx`
   - Composición visual para escritorio.

