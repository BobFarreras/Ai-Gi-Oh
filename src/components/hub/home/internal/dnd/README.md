<!-- src/components/hub/home/internal/dnd/README.md - Documenta handlers de drag and drop del módulo Home por destino de drop. -->
# Drag and Drop de Home

## Responsabilidad

Separar la lógica de arrastre y su resolución asíncrona por destino:

1. Deck principal.
2. Bloque de fusión.
3. Área de colección (devolución).

## Objetivo

Evitar concentrar toda la orquestación DnD en `HomeDeckBuilderScene`.

