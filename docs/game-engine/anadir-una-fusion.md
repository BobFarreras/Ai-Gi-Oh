# Cómo añadir una fusión nueva (y que la IA sepa usarla)

**TL;DR:** el algoritmo de fusión de la IA es **genérico / data-driven**. NO hay código por-fusión. Si
añades los DATOS de forma consistente, tanto el jugador como la IA (de EASY a MYTHIC) pueden usar la fusión
sin tocar nada del algoritmo. Esta guía existe porque al añadir el 2º lote de fusiones aparecieron bugs
genéricos (no "faltaba implementar la fusión X") que ya están arreglados de raíz.

## Qué NO hay que tocar

- **La IA de fusión** (`src/core/services/opponent/opponent-fusion-*.ts`, `heuristic-fusion-materials.ts`).
  Empareja materiales por `requiredMaterialIds` / `requiredArchetypes` y opera sobre las cartas en juego.
  Es agnóstica a qué fusión sea.
- **El motor de fusión** (`src/core/use-cases/game-engine/fusion/*`). Valida por id/arquetipo.

## Checklist de DATOS para una fusión nueva `fusion-X`

Todo con **ids consistentes** entre código y BD. La carta debe existir en el **catálogo de código** (para
training/local/simulador y para la derivación del bloque de fusión) **y** en los **seeds de BD**
(`docs/supabase/sql/…`) para colecciones reales / arena / historia.

1. **Carta resultado** `fusion-X` (tipo `FUSION`) en `src/core/data/mock-cards/fusions.ts` **y** seed BD.
   Campos: `fusionRecipeId: "fusion-X"`, `fusionMaterials: ["entity-a", "entity-b"]`, stats, arquetipo.
2. **Receta** en `src/core/use-cases/game-engine/fusion/fusion-recipes.ts`: `resultCardId: "fusion-X"` con
   `requiredMaterialIds: ["entity-a", "entity-b"]` (o `requiredArchetypes`).
3. **Ejecutable** `exec-fusion-X` (tipo `EXECUTION`) en `src/core/data/mock-cards/executions.ts` **y** seed BD:
   `effect: { action: "FUSION_SUMMON", recipeId: "fusion-X", materialsRequired: 2 }`.
4. **Materiales** `entity-a`, `entity-b` existen como carta de ENTITY (código **y** BD) con esos ids exactos.

## Invariantes que NO se pueden romper (causaron los bugs históricos)

- ⚠️ **El motor IGNORA `requiredEnergyPerMaterial` y `requiredTotalEnergy`** (`validateFusionEnergy` es no-op;
  solo valida ids/arquetipos). Son **letra muerta**. El matcher de la IA NO debe volver a exigirlos, o
  rechazaría pares válidos y la IA no fusionaría nunca (bug real: python coste 3 < 4 exigido → 0 fusiones).
- ⚠️ **`requiredMaterialIds` de la receta DEBE casar con los ids reales de las entities.** Si no casan, ni el
  jugador ni la IA pueden fusionar.
- ⚠️ **No hace falta configurar el bloque de fusión aparte.** `withDerivedFusionResults`
  (`src/components/game/board/hooks/internal/initialDeckFactory.ts`) hace que el `fusionDeck` incluya SIEMPRE
  la carta resultado de cada `exec-fusion-X` presente en el mazo. Basta con meter el ejecutable en el mazo.
  (Si algún modo nuevo montara el `GameState` sin pasar por `create-board-match-config.ts`, hay que derivar
  el `fusionDeck` también ahí.)

## Verificación (tests de regresión que lo blindan)

- `src/components/game/board/hooks/internal/fusion-deck-derivation.test.ts` — cada `exec-fusion-X` deriva su
  `fusion-X`.
- `src/core/services/opponent/opponent-fusion-completion.test.ts` — la IA (tier EASY) COMPLETA cada receta.

Ambos tienen un **tripwire** `expect(...).toBe(7)` con el número de fusiones con ejecutable. Al añadir una 8ª,
esos asserts fallarán a propósito: **súbelos a 8 y re-ejecuta** — el bucle de ambos tests cubre la nueva
automáticamente. Si la nueva no fusiona, el test lo caza antes de llegar a producción.

## Límite conocido (no es bug)

Bajo presión alta (rival atacando con ~2000+ ATK) la IA puede no arrancar la fusión: los materiales suelen
tener poca defensa y el "ancla" moriría antes de juntar el par, así que evita fusiones suicidas a propósito.
Mejora futura: que la IA proteja/buffee el material ancla.
