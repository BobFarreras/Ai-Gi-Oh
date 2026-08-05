<!-- docs/architecture/09-fusion-snapshot-authority.md - Decisión sobre la autoridad de cartas y recetas de fusión durante un combate. -->
# Autoridad de fusiones en el snapshot

## Problema

El panel admin persistía atributos y materiales en `cards_catalog`, pero la resolución por EXEC sustituía la carta del combate por `FUSION_CARDS`. Un balance de producción podía quedar ignorado aunque el deck se hubiera hidratado correctamente.

## Opciones evaluadas

1. Sustituir únicamente la búsqueda del resultado. Es pequeño, pero deja materiales e IA ligados a recetas globales.
2. Usar la carta completa del `fusionDeck` del jugador para resultado, receta, selección e IA.

## Decisión

Se adopta la segunda opción. Supabase es la autoridad al construir el combate y `GameState.player*.fusionDeck` es la autoridad inmutable durante su ejecución. El motor no consulta infraestructura ni catálogos globales.

Las recetas legacy permanecen como compatibilidad para cartas internas sin `fusionMaterials`; nunca reemplazan los metadatos presentes en una carta del snapshot.

## Consecuencias

- Story, Arena, Survival, Olimpo y Multiplayer reproducen los mismos atributos y materiales.
- Una partida emitida conserva su balance aunque el admin cambie el catálogo después.
- Una EXEC sin resultado en el `fusionDeck` queda en espera y no puede materializar una carta ajena al snapshot.
- Este cambio no altera la economía: se cobra el `cost` de la EXEC; `fusionEnergyRequirement` no añade un segundo coste.
