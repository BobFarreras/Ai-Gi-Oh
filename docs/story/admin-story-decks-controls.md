<!-- docs/story/admin-story-decks-controls.md - Referencia funcional de controles del panel Admin Story Decks con slots visuales de fusión y recompensa. -->
# Admin Story Decks: controles y acciones

## Archivo de la barra superior

La barra superior con botones/selectores está en:
- `src/components/admin/AdminStoryDeckPanel.tsx`

## Controles de la barra superior

1. `Seleccionar deck story`
- Cambia el deck base activo dentro del oponente seleccionado.
- Dispara recarga de datos del editor para ese `deckListId`.

2. `Refrescar`
- Vuelve a cargar el estado remoto de Story Decks sin cambiar el contexto actual.

3. `Editar deck` / `Salir de edición`
- Activa o desactiva edición local del borrador.
- `Guardar` solo persiste cuando el modo edición está activo.

4. `Asignar al slot`
- Inserta la carta seleccionada de la colección en el slot activo del grid.

5. `Quitar`
- Limpia la carta del slot activo del grid.

6. `Guardar`
- Persiste cambios de deck base y/o configuración por duelo.
- Si estás en modo `Deck duelo`, guarda también dificultad, perfil IA, escalado por slot, 2 slots de fusión y recompensa de carta.

7. `Modo: Deck base / Modo: Deck duelo`
- Selector único de modo de edición.
- `Deck base` edita `story_deck_list_cards`.
- `Deck duelo` edita `story_duel_ai_profiles` y `story_duel_deck_overrides`.

8. `Clonar desde duelo...`
- Selector de duelo origen para clonar configuración.

9. `Clonar duelo`
- Copia al borrador actual:
  - composición del deck del duelo,
  - dificultad,
  - perfil IA (`style`, `aggression`),
  - escalado por slot (`versionTier`, `level`, `xp`).
- Activa automáticamente modo edición y deja pendiente `Guardar`.

10. `Seleccionar dificultad del duelo`
- Define dificultad del duelo activo.
- Recalcula preset base de IA para ese nivel.

11. `Seleccionar estilo IA del duelo`
- Ajusta estilo táctico (`balanced`, `aggressive`, `combo`, `control`).

12. `Aggro IA`
- Ajusta agresividad en rango `0.00` a `1.00`.

13. `Masiva duelo` (`Ver`, `Lvl`, `XP`, `Aplicar a todas`)
- Aplica escalado uniforme a todas las cartas del borrador de duelo.
- Está integrada en la misma sección superior de configuración para ahorrar espacio.

## Slots visuales dentro de Story Deck

En el mismo grid del mazo, al final se muestran 3 slots extra:

1. `Fusion 1`
2. `Fusion 2`
3. `Reward`

Comportamiento:
- Usan mini carta visual (`HomeMiniCard`) del mismo tamaño que los slots del deck.
- Soportan drag & drop desde colección.
- Soportan limpieza (botón `Quitar`) y vaciado arrastrando de vuelta a colección.
- `Fusion 1` y `Fusion 2` también permiten swap entre sí por drag & drop.

Regla de validación de fusión:
- Solo aceptan cartas `type = FUSION`.
- Si se intenta soltar una carta no `FUSION`, se muestra banner de feedback y no se aplica el cambio.
- El guardado en modo duelo exige los 2 slots de fusión válidos.

## Navegación lateral

1. `Oponentes Story`
- Catálogo de oponentes para cambiar contexto.

2. `Duelos Story` + `← Volver`
- Lista de duelos del oponente activo.
- Permite saltar rápido entre duelos y volver al catálogo de oponentes.

## Nota de guardado

- `Clonar duelo` prepara el borrador.
- El cambio queda persistido solo después de pulsar `Guardar`.
