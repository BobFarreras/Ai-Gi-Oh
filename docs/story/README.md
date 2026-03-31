<!-- docs/story/README.md - Guía técnica del funcionamiento Story: mapa, duelos, progreso y rendimiento. -->
# Story: funcionamiento y estructura

## 1. Qué está hardcoded y qué está en Supabase

### Hardcoded (código)
- Definición visual del mapa por acto (posiciones, rutas, nodos virtuales):
  - `src/services/story/map-definitions/act-1-map-definition.ts`
  - `src/services/story/map-definitions/act-2-map-definition.ts`
  - Registro: `src/services/story/map-definitions/story-map-definition-registry.ts`
- Reglas de navegación/grafo Story (desbloqueo, orden, transiciones):
  - `src/core/services/story/world/*`

### Supabase (datos dinámicos)
- Duelos y relación con deck/oponente:
  - `story_duels`, `story_deck_lists`, `story_deck_list_cards`, `story_opponents`
- Progreso jugador:
  - `player_story_duel_progress`, `player_story_world_state`
- Configuración por duelo (fase nueva):
  - `story_duel_ai_profiles` (difficulty + ai_profile)
  - `story_duel_deck_overrides` (card_id + version/level/xp + overrides)

Conclusión: el layout visual del mapa está en código, pero el contenido jugable (duelos, decks, dificultad y progreso) sale de BD.

## 2. Flujo del mapa Story

1. La pantalla Story llama `getStoryMapRuntimeData`.
2. Se cargan de Supabase:
   - lista de duelos (`listStoryDuels`)
   - progreso del jugador
   - estado compacto del mundo Story
3. Se construye grafo y desbloqueos con `buildStoryWorldGraph` + `resolveStoryUnlockedNodeIds`.
4. Se fusiona con la definición visual local (`mergeStoryMapVisualDefinition`).
5. Se devuelve runtime por acto activo (`nodes`, `currentNodeId`, `availableActIds`).

Archivo principal:
- `src/services/story/get-story-map-runtime-data.ts`

## 3. Flujo de un combate Story

1. Al entrar en `/hub/story/chapter/[chapter]/duel/[duelIndex]`, se ejecuta `getStoryDuelRuntimeData`.
2. Se carga el duelo y oponente desde repo (`SupabaseOpponentRepository`).
3. Se resuelve deck del oponente:
   - base desde `story_deck_list_cards`
   - si existen overrides activos del duelo, se usan esos (`story_duel_deck_overrides`)
4. Se resuelve dificultad del duelo:
   - primero `story_duel_ai_profiles.difficulty`
   - fallback a `story_opponents.difficulty`
5. Se resuelve perfil IA:
   - `story_duel_ai_profiles.ai_profile` (`style`, `aggression`)
   - normalización con defaults seguros por dificultad
   - mezcla final en perfil heurístico del bot (`HeuristicOpponentStrategy`)
6. Se carga deck del jugador una sola vez al inicio.
7. Durante el combate no hay lecturas continuas de BD para el motor.
8. Al terminar, se llama API de cierre para persistir resultado/progreso/recompensas.

Archivos clave:
- `src/services/story/get-story-duel-runtime-data.ts`
- `src/infrastructure/persistence/supabase/SupabaseOpponentRepository.ts`
- `src/app/api/story/duels/complete/route.ts`

## 4. Rendimiento y cache

Estado actual (correcto para MVP/proyecto profesional inicial):
- Se hace carga server-side por entrada de pantalla (Story map o Duel).
- No hay polling durante combate.
- Se minimizan llamadas en paralelo con `Promise.all` donde aplica.

¿Guardar mapa en navegador para evitar llamadas?
- Se puede (ej. `sessionStorage`), pero no es la estrategia principal recomendada aquí.
- Riesgo: estado obsoleto tras cambios de progreso, admin updates o multi-dispositivo.

Recomendación profesional:
1. Mantener servidor como fuente de verdad.
2. Añadir caché corta en servidor (si hace falta):
   - `unstable_cache`/revalidate por usuario y acto.
3. Usar invalidación explícita tras acciones que cambian estado (`duel complete`, reset, admin).
4. Solo usar caché cliente como optimización visual, nunca como verdad del estado.

## 5. Admin Story Decks (fase actual)

Ahora el panel admin permite:
- editar deck base del oponente,
- seleccionar duelo concreto asociado al deck,
- editar dificultad por duelo,
- editar escalado estático por slot (`versionTier`, `level`, `xp`).

Esto permite casos como:
- `GemNvim ROOKIE` con deck base,
- `GemNvim ELITE` con mismo deck pero más nivel/exp/version por carta.

## 6. Extensión recomendada

Para seguir escalando sin romper motor:
1. Añadir presets por duelo (botón “aplicar +N level/+N version a todos los slots”).
2. Versionado de mapa visual en BD solo si necesitáis editor de nodos 100% dinámico.
3. Mantener contrato estable `IStoryDuelDefinition` y adaptar por repositorio.

## 7. Archivos de referencia rápida

- Mapa runtime: `src/services/story/get-story-map-runtime-data.ts`
- Mapa visual: `src/services/story/map-definitions/*`
- Duelos repo: `src/infrastructure/persistence/supabase/SupabaseOpponentRepository.ts`
- Runtime duelo: `src/services/story/get-story-duel-runtime-data.ts`
- Perfil IA rival: `src/core/services/opponent/difficulty/resolve-opponent-difficulty-profile.ts`
- UI story: `src/components/hub/story/README.md`
