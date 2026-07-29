<!-- docs/training/GUIA-MODOS-ARENA-SUPERVIVENCIA-OLIMPO.md - Plan de producto, arquitectura, seguridad, UX y entrega para los tres modos PvE competitivos. -->
# Guía de implementación: Arena, Supervivencia y Olimpo

## 1. Objetivo y alcance

Esta iniciativa convierte la Arena actual en un portal de combate con tres experiencias:

1. **Arena clásica:** conserva la escalera por niveles, rivales y recompensas actuales.
2. **Supervivencia:** encadena duelos conservando los LP restantes hasta que el jugador pierde.
3. **Olimpo:** permite elegir rivales legendarios, con dificultad y recompensas altas, y un límite diario estricto.

El trabajo incluye el rediseño responsive, el dominio, la persistencia, la seguridad, el panel de administración, la observabilidad y las pruebas. No incluye reescribir el `GameEngine` ni introducir multijugador.

## 2. Decisiones de producto cerradas

### 2.1. Arena clásica

- Mantiene tiers, ladder de ocho rivales y progresión existente.
- Conserva las recompensas actuales para no devaluar el progreso.
- Su acceso se mueve a una ruta explícita, sin mezclar sus reglas con los nuevos modos.

### 2.2. Supervivencia

- Cada jugador puede tener **una única expedición activa**.
- La expedición comienza con sus LP máximos efectivos, incluidos los bonus de combate permitidos.
- Al ganar, el siguiente duelo empieza con los LP exactos restantes.
- Cada quinta victoria consecutiva se curan **2.000 LP**, sin superar los LP máximos efectivos.
- Una derrota finaliza la expedición. Los empates se consideran derrota para evitar runs infinitas.
- Salir de la página no abandona la expedición; se puede reanudar.
- Abandonar exige confirmación y cierra la expedición sin recompensa pendiente.
- La dificultad y las recompensas escalan de forma determinista desde una potencia equivalente al tier 4.
- Los rivales reutilizan el orden canónico de Arena y aumentan de tier efectivo cada dos victorias.
- Al alcanzar el tier máximo comienza una Ascensión por vueltas completas del roster; nunca se repite indefinidamente la misma dificultad.
- El mazo del jugador se fija al iniciar cada duelo, no durante toda la expedición. Así puede ajustar el Arsenal entre combates sin alterar un duelo ya emitido.
- Cada victoria y cada hito conceden **Fragmentos de Ascensión**, una moneda exclusiva para mejorar campeones de Olimpo.

### 2.3. Olimpo

- El jugador elige un campeón clásico desbloqueado y controla su deck real contra un rival legendario.
- Los campeones se desbloquean al derrotar a cada rival dentro de su tier asignado, no solo por alcanzar el tier.
- La inversión de Fragmentos pertenece a un campeón concreto y se representa mediante un árbol pequeño de tres ramas.
- Cada árbol admite respec server-authoritative con coste configurado y una primera reasignación gratuita.
- Las cartas prestadas no reciben experiencia ni se incorporan a la colección del jugador.
- Los bonus de combate del árbol general del jugador no se aplican al campeón; los modificadores económicos permitidos sí pueden afectar a la recompensa.
- Se permiten **3 intentos diarios**, configurables desde servidor sin despliegue.
- El periodo diario usa medianoche UTC, igual que misiones y login diario.
- El intento se consume al crear la batalla, no al enviar el resultado. Cerrar la pestaña no permite repetir gratis.
- Una batalla iniciada puede reanudarse mientras su ticket siga vigente.
- Solo puede existir una batalla de Olimpo activa por jugador.
- Las recompensas se dividen en:
  - recompensa base por victoria;
  - bonus de primera victoria contra cada leyenda;
  - bonus rotativo diario o semanal opcional.
- Una derrota no entrega la recompensa premium. Puede conceder una compensación pequeña y explícita, nunca objetos raros.
- El límite, catálogo, disponibilidad y recompensas son autoridad del servidor.

La cifra de tres intentos debe almacenarse como configuración (`daily_attempt_limit`) para poder probar dos intentos en eventos sin cambiar código.

### 2.4. Matriz de desbloqueo de campeones

El tier asignado coincide con la posición canónica del rival:

| Tier requerido | Campeón | Condición |
|---|---|---|
| 1 | GenNvim | Derrotar a GenNvim en tier 1 |
| 2 | Helena | Derrotar a Helena en tier 2 |
| 3 | Jaku | Derrotar a Jaku en tier 3 |
| 4 | Midutech | Derrotar a Midutech en tier 4 |
| 5 | Soldado | Derrotar a Soldado en tier 5 |
| 6 | Guill | Derrotar a Guill en tier 6 |
| 7 | Soldado-Laptop | Derrotar a Soldado-Laptop en tier 7 |
| 8 | Gokernel | Derrotar a Gokernel en tier 8 |

Como cada tier presenta el mismo ladder ordenado, el estado histórico se puede reconstruir sin regalar campeones: el campeón de posición `N` está derrotado en su tier si `tierStats[tier=N].wins >= N`. Después del despliegue, cada victoria válida también genera un registro explícito e idempotente de desbloqueo.

## 3. ADR: límites del dominio

### Opción A: extender el tier de Arena con flags

Añadir campos como `isSurvival`, `carryLp` o `dailyLimit` al catálogo actual.

**Ventaja:** menos archivos al principio.

**Costes:** mezcla tres ciclos de vida distintos, complica `CompleteTrainingMatchUseCase`, hace ambiguo el progreso y crea condicionales permanentes.

### Opción B: contextos separados sobre un kernel compartido

Mantener Arena clásica, Supervivencia y Olimpo como subdominios independientes que reutilizan el motor, la carga de mazos, la IA, la economía y la prueba de combate.

**Ventajas:** reglas aisladas, pruebas pequeñas, evolución independiente y menor riesgo de romper Arena.

**Coste:** más contratos y repositorios explícitos.

### Decisión

Se adopta la **opción B**:

```text
UI de modo
  -> servicio/runtime server-side
    -> caso de uso del modo
      -> reglas puras del dominio
        -> contratos de repositorio
          <- adaptadores Supabase

Los tres modos
  -> CombatSession / CombatProof
    -> GameEngine determinista existente
```

No se añadirá lógica de Supervivencia u Olimpo a componentes de Arena clásica.

## 4. Navegación y rutas

```text
/hub/academy/training
  ├─ Tutorial
  └─ Portal de combate
      /hub/academy/training/arena
        ├─ /classic
        ├─ /survival
        └─ /olympus
```

- `/arena` pasa a ser el selector de los tres modos.
- La Arena actual se mueve a `/arena/classic`.
- Los enlaces de resultados, cookies y prefetch deben apuntar a `/classic`.
- No se hará redirect automático desde `/arena`, porque esa URL tendrá contenido propio.
- Los bookmarks antiguos seguirán llegando a una pantalla útil: el portal permite entrar a Arena clásica con un toque.
- Las constantes se centralizan en `academy-routes.ts`; no se dispersan strings de rutas.

## 5. Experiencia visual responsive

### 5.1. Dirección de arte

El portal presenta tres “sectores” reconocibles:

- **Arena clásica:** cian/azul, estructura competitiva y progreso de ladder.
- **Supervivencia:** ámbar/rojo, pulso vital, contador de racha y ruta ascendente.
- **Olimpo:** blanco/oro/violeta, arquitectura monumental y leyendas bloqueadas.

El diseño espectacular debe provenir de composición, tipografía, iluminación estática y transiciones breves. No se usarán blurs grandes ni animaciones infinitas para simular riqueza visual.

### 5.2. Desktop

- Hero superior con estado global y título “Nexus Combat”.
- Grid de tres paneles, cada uno con estado real:
  - Arena: nivel y siguiente rival.
  - Supervivencia: run activa, racha y LP.
  - Olimpo: intentos restantes y próximo reset.
- Hover con `transform` y glow contenido.
- El tablero solo se carga al entrar en una batalla; nunca se renderizan tres previews de `Board`.

### 5.3. Mobile

- Stack vertical de tarjetas con resumen y CTA de ancho completo.
- La información esencial aparece antes del arte.
- Respeto de `safe-area-inset-*`, targets táctiles de mínimo 44 px y ausencia de hover como requisito.
- Selector de leyendas en carrusel con scroll nativo y `scroll-snap`, sin listeners continuos.
- HUD de Supervivencia fijo y compacto: LP, victoria actual y próximo hito.
- El detalle de rival usa sheet accesible, no modal pesado con múltiples cartas completas.

### 5.4. Rendimiento y accesibilidad

- Miniaturas estáticas para cartas y rivales; `<Card>` completa solo en detalle o tablero.
- Carga dinámica del Board después de confirmar “Combatir”.
- Componentes memoizados con comparadores por contenido y callbacks estables.
- Efectos caros desmontados mediante `useBoardPerformanceProfile`.
- Movimiento basado en `transform` y `opacity`; sin animar `filter`, `width` o sombras de pantalla completa.
- `prefers-reduced-motion` y el selector global de FX se respetan.
- Toda acción tiene nombre accesible y estado de foco visible.
- Los cambios de intentos, LP y recompensa se anuncian con región `aria-live`.
- Objetivos móviles: INP menor de 200 ms, CLS menor de 0,1 y al menos 30 FPS con CPU 4x.

## 6. Modelo de dominio

### 6.1. Contrato compartido de batalla

Extender el modo de match de forma explícita:

```ts
export type IMatchMode =
  | "TRAINING"
  | "SURVIVAL"
  | "OLYMPUS"
  | "STORY"
  | "MULTIPLAYER"
  | "TUTORIAL";
```

Definir `ICombatSession` con:

- `battleId`;
- `mode`;
- `playerId`;
- `opponentId`;
- `seed`;
- snapshot/versiones de ambos loadouts;
- LP iniciales y máximos de cada lado;
- fecha de emisión y expiración;
- versión del protocolo de prueba.

El estado inicial debe aceptar `startingHealthPoints` por jugador, validado entre 1 y su máximo. No se debe reutilizar `playerStartingLpBonus`: un bonus cambia vida actual y máxima; Supervivencia solo transporta vida actual.

### 6.2. Supervivencia

Entidades:

- `ISurvivalRun`: estado agregado de la expedición.
- `ISurvivalBattle`: batalla emitida y su snapshot.
- `ISurvivalMilestone`: regla de curación/recompensa.
- `ISurvivalRunSummary`: vista segura para UI.

Estados de run:

```text
ACTIVE -> COMPLETED_DEFEAT
ACTIVE -> ABANDONED
```

Estados de batalla:

```text
ISSUED -> COMPLETED
ISSUED -> EXPIRED
```

Invariantes:

- `currentLp` está entre 0 y `maxLp`.
- Solo una run `ACTIVE` por jugador.
- Solo una batalla `ISSUED` por run.
- El índice de batalla siempre crece de uno en uno.
- Una victoria incrementa la racha exactamente una vez.
- La curación de hito se aplica después de derivar los LP finales.
- La recompensa y el avance se aplican en la misma transacción.

Regla pura recomendada:

```text
LP siguiente = min(
  LP máximo de la run,
  LP final verificado + (racha_nueva % 5 == 0 ? 2000 : 0)
)
```

Escalado inicial recomendado:

```text
rosterIndex = (battleIndex - 1) % rosterSize
effectiveTier = min(maxConfiguredTier, 4 + floor((battleIndex - 1) / 2))
ascensionRank = floor(max(0, battleIndex - firstMaxTierBattle) / rosterSize)
```

La resolución ocurre por capas y queda guardada en el snapshot:

1. Roster y variante de deck del catálogo de Arena.
2. Escalado de cartas del `effectiveTier`.
3. Perfil de IA del tramo (`HARD`, `BOSS`, `MASTER`, `MYTHIC`).
4. Modificadores de Ascensión configurados por vuelta completa.

Cuando cartas y versiones alcanzan sus máximos, la Ascensión aplica incrementos moderados y limitados de LP, energía y presión de combate. No añade ATK/DEF infinito ni altera cartas del catálogo. El panel admin define caps, tramos y recompensas, y un simulador batch rechaza configuraciones con loops, duración P95 excesiva o saltos de dificultad no previstos.

### 6.3. Olimpo

Entidades:

- `IOlympusOpponentDefinition`;
- `IOlympusChampionDefinition`;
- `IOlympusChampionUnlock`;
- `IChampionUpgradeTree`;
- `IPlayerChampionProgress`;
- `IAscensionFragmentWallet`;
- `IOlympusDailyAllowance`;
- `IOlympusBattle`;
- `IOlympusVictory`;
- `IOlympusRewardDefinition`.

Invariantes:

- El periodo se deriva en servidor como fecha UTC; nunca se recibe del cliente.
- `attemptsUsed <= dailyAttemptLimit`.
- La creación de batalla incrementa intentos y guarda snapshot de rival en una transacción.
- Solo se acredita una victoria por `battleId`.
- El bonus de primera victoria tiene unicidad `(playerId, opponentId)`.
- Un rival inactivo o fuera de ventana no puede emitir una batalla.
- El campeón debe constar como desbloqueado por una victoria verificada en su tier asignado.
- Comprar o resetear nodos bloquea cartera y progreso del campeón en una misma transacción.
- El snapshot usa la composición real del deck del campeón y aplica después sus nodos; nunca muta Arena ni la colección.

### 6.4. Progresión de campeones

Cada campeón referencia un oponente y una variante base versionada del catálogo de Arena. La composición de cartas es real, pero sus niveles, versiones y habilidades se resuelven para Olimpo:

```text
deck Arena versionado
  -> escala base del campeón
  -> nodos comprados por el jugador
  -> caps de Olimpo
  -> snapshot inmutable de batalla
```

El árbol contiene entre 8 y 12 nodos y tres ramas:

- **Potencia:** `+5 level` global, versiones de grupos concretos y mejora del fusion deck.
- **Resistencia:** LP, consistencia y energía con topes explícitos.
- **Identidad:** habilidad propia y mejora de cartas emblemáticas.

No existe `+1 versionTier` global repetible. Cada nodo declara selector de cartas, operación, magnitud, prerrequisitos y coste. Los Fragmentos se almacenan en una cartera con ledger idempotente. El respec devuelve el porcentaje configurado, nunca acepta importes calculados por cliente y deja un asiento de auditoría.

### 6.5. Dificultad legendaria

No se debe crear una dificultad “tramposa” aumentando números sin control. Cada leyenda combina:

- perfil `MYTHIC` como base;
- deck y fusion deck versionados;
- habilidades de oponente reutilizando `IOpponentSkillRank`;
- estrategia táctica con parámetros explícitos;
- modificadores de LP/energía declarativos;
- reglas especiales visibles antes de combatir.

El balance se valida mediante simulación batch del motor. Objetivo inicial:

- tasa de victoria de jugador objetivo entre 10 % y 25 %;
- ninguna partida bloqueada;
- duración P50 y P95 acotadas;
- ausencia de deck-outs o loops no diseñados.

## 7. Prueba de combate y autoridad del servidor

### 7.1. Amenaza actual

Un ticket HMAC impide cambiar `playerId`, `battleId` o tier, pero no demuestra que el `outcome` enviado por el navegador ocurrió. Esto es insuficiente para LP persistentes, límites diarios y recompensas premium.

### 7.2. Diseño elegido: replay determinista

1. El servidor crea la sesión con seed, snapshots y LP iniciales.
2. El cliente registra un diario ordenado de acciones tipadas.
3. Al completar, envía `battleId`, ticket y diario; no envía una victoria autoritativa.
4. El servidor carga el snapshot, reproduce acciones con el `GameEngine` y deriva:
   - ganador;
   - LP finales;
   - turnos;
   - flawless;
   - eventos de progresión permitidos.
5. Una única transacción persiste resultado, progreso y recompensa.

El diario debe incluir número de secuencia y acción de dominio, no eventos visuales. La IA también debe ser reproducible desde seed/perfil; si alguna decisión aún no es determinista, se registra como acción validable hasta eliminar esa excepción.

### 7.3. Protecciones

- Ticket HMAC separado por modo, con `protocolVersion`, `battleId`, snapshot hash y expiración.
- Comparación de firma en tiempo constante.
- Límite de tamaño de body y máximo de acciones/turnos.
- Secuencias estrictamente crecientes y acciones válidas para el estado reproducido.
- Idempotencia por `battleId`.
- Rate limit por jugador y ruta.
- Origen de mutación confiable y usuario obtenido de sesión.
- Nunca aceptar desde cliente: recompensa, LP final, intentos restantes, rival interno o multiplicador.
- Logs sin tickets, secretos, mazos privados completos ni datos personales.

Para Arena clásica se puede migrar al mismo protocolo después de estabilizarlo en Supervivencia. Olimpo no se publica con el resultado declarado por cliente.

## 8. Persistencia Supabase

### 8.1. Tablas propuestas

```text
combat_sessions
  id, player_id, mode, seed, snapshot_hash, snapshot_json,
  protocol_version, status, issued_at, expires_at, completed_at

player_survival_runs
  id, player_id, status, current_lp, max_lp, wins,
  current_battle_index, ruleset_version, started_at, completed_at, version

survival_rulesets
  id, version, start_tier, battles_per_tier, roster_json,
  milestone_interval, milestone_heal, is_active, published_at

survival_scaling_stages
  id, ruleset_id, from_battle, ai_profile,
  card_scale_json, ascension_modifiers_json, reward_definition_id

survival_battles
  battle_id, run_id, battle_index, opponent_id,
  effective_tier, ascension_rank, starting_lp, ending_lp,
  outcome, milestone_heal, reward_json

combat_mode_wallets
  player_id, ascension_fragments, updated_at, version

combat_mode_wallet_transactions
  id, player_id, operation_id, amount, reason, metadata, created_at

olympus_champions
  id, arena_opponent_id, required_tier, required_ladder_position,
  base_deck_variant_id, base_scale_json, is_active, version

olympus_champion_upgrade_nodes
  id, champion_id, branch, prerequisite_node_ids,
  effect_json, fragment_cost, sort_order, is_active, version

player_olympus_champion_unlocks
  player_id, champion_id, source_tier, source_battle_id, unlocked_at

player_olympus_champion_progress
  player_id, champion_id, unlocked_node_ids, respec_count, version

olympus_opponents
  id, code, display_name, deck_template_id, ai_profile,
  combat_modifiers_json, reward_definition_id,
  available_from, available_until, is_active, version

olympus_opponent_deck_entries
  id, opponent_id, zone, position, card_id,
  level, xp, version_tier, attack_bonus, defense_bonus

olympus_daily_usage
  player_id, period_key, attempts_used, daily_limit

olympus_battles
  battle_id, player_id, champion_id, opponent_id,
  champion_snapshot_hash, opponent_snapshot_hash, period_key,
  attempt_number, outcome, reward_json, completed_at

olympus_first_victories
  player_id, opponent_id, battle_id, claimed_at
```

Las definiciones de catálogo pueden ser legibles por usuarios autenticados. Runs, sesiones, uso y resultados solo permiten leer filas propias.

### 8.2. Constraints e índices

- Índice único parcial para una run activa por jugador.
- Índice único parcial para una sesión emitida por jugador y modo cuando aplique.
- `UNIQUE(run_id, battle_index)` y `UNIQUE(battle_id)`.
- `PRIMARY KEY(player_id, period_key)` en uso diario.
- `PRIMARY KEY(player_id, champion_id)` en desbloqueos y progreso de campeón.
- `UNIQUE(player_id, operation_id)` en el ledger de Fragmentos.
- Checks para LP, intentos, estados y recompensas no negativas.
- Índices en todas las columnas usadas por RLS (`player_id`) y lookups (`status`, `expires_at`, `period_key`).
- Foreign keys a usuario, sesión, oponente y definición de recompensa.

### 8.3. RLS y privilegios

- RLS habilitado en toda tabla del esquema expuesto.
- `authenticated`: solo `SELECT` de filas propias y catálogos activos.
- Sin `INSERT`, `UPDATE` o `DELETE` directos de progreso/recompensas desde navegador.
- Mutaciones mediante repositorios server-side y cliente privilegiado nunca expuesto.
- Funciones transaccionales invocadas por servidor:
  - sin `SECURITY DEFINER` si el `service_role` ya aporta privilegio;
  - `EXECUTE` revocado de `PUBLIC`, `anon` y `authenticated`;
  - `search_path` fijado;
  - parámetros validados y nombres cualificados.
- Si se necesitara `SECURITY DEFINER`, la implementación vive en esquema privado y se expone mediante un wrapper mínimo con privilegios cerrados.

### 8.4. Transacciones

Operaciones atómicas mínimas:

1. `start_survival_run`.
2. `issue_survival_battle`.
3. `complete_survival_battle`.
4. `abandon_survival_run`.
5. `issue_olympus_battle` (bloquea fila diaria e incrementa intento).
6. `complete_olympus_battle`.
7. `purchase_champion_upgrade`.
8. `respec_champion_upgrades`.
9. `grant_champion_unlock_from_arena_win`.

Cada función bloquea el agregado con `SELECT ... FOR UPDATE`, comprueba estado y aplica idempotencia. No se repetirá el patrón “reservar claim y después hacer varias escrituras independientes”, porque un fallo intermedio puede dejar una batalla cobrada pero incompleta.

La migración inicial reconstruye desbloqueos desde `player_training_progress`: para cada campeón `N`, inserta el unlock únicamente cuando las victorias del tier `N` alcanzan su posición `N`. Esta operación debe ser repetible y no sobrescribir registros explícitos.

### 8.5. Desarrollo local

Flujo obligatorio:

```bash
pnpm supabase --help
pnpm supabase start
pnpm supabase db reset --local
pnpm supabase test db --local
pnpm test
```

- Las migraciones y `seed.sql` recrean catálogos, rivales y usuarios de prueba.
- `.env.local` apunta exclusivamente a la URL y publishable/anon key locales.
- El service role local solo existe en servidor.
- CI levanta Supabase local, aplica migraciones y ejecuta pgTAP.
- Nunca se validan estos modos contra producción.

## 9. Casos de uso y repositorios

### 9.1. Casos de uso

```text
combat/
  IssueCombatSessionUseCase
  VerifyCombatProofUseCase

survival/
  GetSurvivalStateUseCase
  StartSurvivalRunUseCase
  IssueSurvivalBattleUseCase
  CompleteSurvivalBattleUseCase
  AbandonSurvivalRunUseCase
  ResolveSurvivalDifficultyUseCase

olympus/
  GetOlympusStateUseCase
  IssueOlympusBattleUseCase
  CompleteOlympusBattleUseCase
  UnlockOlympusChampionUseCase
  PurchaseChampionUpgradeUseCase
  RespecChampionUpgradesUseCase
  ResolveOlympusChampionLoadoutUseCase
```

### 9.2. Contratos

```text
ICombatSessionRepository
ISurvivalRunRepository
ISurvivalBattleRepository
ICombatModeWalletRepository
IOlympusCatalogRepository
IOlympusBattleRepository
IOlympusAllowanceRepository
IOlympusChampionRepository
IOlympusChampionProgressRepository
IAtomicCombatSettlementRepository
```

Los casos de uso dependen de contratos de `core`; las rutas solo autentican, parsean, llaman al caso de uso y traducen errores.

### 9.3. Errores de dominio

Crear errores concretos:

- `ActiveRunAlreadyExistsError`;
- `NoActiveSurvivalRunError`;
- `BattleAlreadyActiveError`;
- `OlympusDailyLimitReachedError`;
- `OpponentUnavailableError`;
- `CombatProofRejectedError`;
- `CombatSessionExpiredError`.

La UI traduce cada uno a mensaje y CTA útil. No se usa `console.log()` ni se filtran errores internos.

## 10. Estructura UI propuesta

```text
src/components/hub/academy/training/combat-modes/
  CombatModePortal.tsx
  CombatModeCard.tsx
  internal/
    combat-mode-card-equality.ts
    CombatModeStatus.tsx
    CombatModePortalBackdrop.tsx

src/components/hub/academy/training/modes/classic/
  TrainingArenaClient.tsx
  internal/...

src/components/hub/academy/training/modes/survival/
  SurvivalClient.tsx
  SurvivalLobby.tsx
  SurvivalRunHud.tsx
  internal/
    useSurvivalBattle.ts
    SurvivalMilestoneTrack.tsx

src/components/hub/academy/training/modes/olympus/
  OlympusClient.tsx
  OlympusLobby.tsx
  OlympusChampionTree.tsx
  OlympusOpponentCard.tsx
  internal/
    useOlympusBattle.ts
    useChampionProgression.ts
    OlympusAllowanceStatus.tsx
```

Cada componente, hook, servicio o caso de uso debe permanecer por debajo de 150 líneas. Los tipos y configuración pueden superar el límite solo con justificación.

## 11. Administración

Se crean dos secciones nuevas en el panel. Pueden reutilizar componentes visuales y utilidades del editor de Arena, pero no sus endpoints ni tablas: compartir presentación no debe acoplar los dominios.

### 11.1. Supervivencia

El administrador permite:

- ordenar o excluir rivales reutilizando IDs del roster de Arena;
- elegir tier inicial y frecuencia de incremento;
- configurar perfiles de IA por tramo;
- editar curación, hitos, Fragmentos y recompensas;
- definir caps y modificadores por Ascensión;
- activar, versionar o programar configuraciones;
- previsualizar los primeros combates y cada vuelta del roster;
- ejecutar simulaciones batch antes de publicar.

La configuración activa es inmutable para una run ya iniciada: `ISurvivalRun` conserva `rulesetVersion`. Publicar cambios crea una versión nueva y no altera expediciones en curso.

### 11.2. Olimpo

El administrador permite:

- crear, ordenar, activar y programar legendarios;
- editar identidad, avatar, IA, LP, energía y reglas visibles;
- editar deck y fusion deck con el selector de cartas existente;
- fijar nivel, experiencia y versión por carta;
- configurar recompensa base, primera victoria y pools premium;
- configurar los tres intentos globales y reset UTC;
- vincular campeón con rival/tier/posición y variante real de Arena;
- editar nodos, ramas, costes, prerrequisitos, efectos y respec;
- previsualizar el loadout final para cualquier combinación de nodos.

Toda mutación administrativa pasa por autorización existente, validación de use case y auditoría con diff antes/después. No se aceptan efectos arbitrarios en JSON: `effect_json` se valida contra una unión discriminada y un catálogo cerrado de operaciones.

### 11.3. Seguridad de publicación

- Borrado lógico para definiciones utilizadas por batallas.
- Control optimista por `version` para impedir sobrescrituras entre administradores.
- Validación de veinte cartas, fusion deck válido, IDs existentes y caps.
- Una configuración no puede activarse sin simulación satisfactoria y reward policy válida.
- Los cambios solo se prueban contra Supabase local y staging antes de producción.

## 12. APIs

```text
GET  /api/training/survival
POST /api/training/survival/runs
POST /api/training/survival/battles
POST /api/training/survival/battles/complete
POST /api/training/survival/abandon

GET  /api/training/olympus
POST /api/training/olympus/battles
POST /api/training/olympus/battles/complete
POST /api/training/olympus/champions/upgrade
POST /api/training/olympus/champions/respec
```

Recomendación Next.js:

- Las páginas cargan el estado inicial como Server Components.
- Las Route Handlers se reservan para mutaciones y reanudación.
- Los payloads se parsean como `unknown` y se estrechan con validadores existentes.
- Las respuestas no incluyen secretos ni snapshots internos completos.
- `Cache-Control: no-store` en estado individual e intentos.
- Errores de límite usan `429`; conflicto de batalla/run usa `409`; prueba inválida usa `422`.

## 13. Recompensas y economía

- Definiciones de recompensa versionadas y persistidas.
- El resultado guarda un snapshot de la recompensa aplicada para auditoría.
- Wallet, experiencia, inventario y resultado se actualizan atómicamente.
- Objetos raros usan una clave de operación única ligada al `battleId`.
- Los modificadores del árbol se aplican mediante la política común de economía, con caps específicos por modo.
- Supervivencia entrega recompensa incremental y bonus de hito; no acumula un “bote” solo en cliente.
- Los Fragmentos de Ascensión se acreditan por victoria y con bonus cada cinco; su curva y cap diario son configurables.
- Gastar Fragmentos solo modifica el árbol del campeón elegido.
- Olimpo muestra probabilidades o recompensas exactas antes de gastar intento.
- Toda modificación se somete a simulación económica para evitar inflación.

Configuración inicial sugerida, pendiente de balance:

| Modo | Recompensa |
|---|---|
| Supervivencia 1-4 | base baja por victoria |
| Supervivencia 5/10/15... | base + bonus de hito |
| Olimpo derrota | experiencia pequeña, sin drop premium |
| Olimpo victoria | Nexus + experiencia + pool legendario |
| Primera victoria | recompensa única no repetible |

Los importes definitivos no se codifican hasta disponer de métricas de economía.

## 14. Observabilidad y analítica

Eventos mínimos:

- `combat_mode_viewed`;
- `survival_run_started`;
- `survival_battle_started`;
- `survival_battle_completed`;
- `survival_milestone_reached`;
- `survival_run_ended`;
- `ascension_fragments_earned`;
- `champion_unlocked`;
- `champion_upgrade_purchased`;
- `champion_upgrades_respecced`;
- `olympus_opponent_selected`;
- `olympus_attempt_started`;
- `olympus_battle_completed`;
- `combat_proof_rejected`.

Propiedades permitidas: modo, rival, índice, outcome derivado, duración, turnos, LP, perfil de rendimiento y versión. No registrar cartas privadas completas, tickets ni identificadores sensibles.

Dashboard de salud:

- tasa de inicio/completado;
- abandono y expiración;
- victorias por tramo/rival;
- P50/P95 de duración;
- rechazos de replay;
- duplicados idempotentes;
- latencia P95 de start/complete;
- FPS/INP móvil segmentado por perfil.

## 15. Estrategia de pruebas

### 15.1. Dominio unitario

- Carry de LP y cap máximo.
- Curación exactamente en victorias 5, 10, 15.
- Empate y derrota finalizan run.
- Escalado determinista de rival/recompensa.
- Progresión desde tier 4, salto cada dos combates y Ascensión tras el máximo.
- Desbloqueo del campeón solo al derrotarlo dentro de su tier asignado.
- Reconstrucción histórica mediante victorias mínimas del tier correcto.
- Compra y respec por campeón sin saldo negativo ni efectos fuera de caps.
- Period key UTC y reset.
- Límite diario y primera victoria.
- Rechazo de estados/transiciones inválidas.

### 15.2. Replay del motor

- Mismo seed + snapshots + acciones produce mismo resultado.
- Acción fuera de orden o ilegal se rechaza.
- Modificar LP/outcome del payload no cambia el resultado derivado.
- Límite de acciones y expiración.
- Cartas con trampas, fusiones, efectos temporales y robos.

### 15.3. Repositorios y base de datos local

Tests pgTAP:

- RLS impide leer runs de otro jugador.
- `anon`/`authenticated` no pueden mutar progreso.
- Dos requests concurrentes crean un solo intento/run/battle.
- Dos compras concurrentes no gastan los mismos Fragmentos.
- Vencer a Guill fuera del tier 6 no lo desbloquea.
- Completar dos veces no duplica recompensa.
- Fallo en wallet hace rollback de todo.
- Índices, constraints, grants y `search_path`.
- Reset UTC en frontera de día.

### 15.4. API

- Sin sesión, origen no confiable y body inválido.
- Ticket de otro jugador/modo/batalla.
- `409`, `422` y `429` correctos.
- Reintento de completion devuelve resultado idempotente.
- Nunca confía en reward, opponent, period o LP del body.

### 15.5. Componentes

- Navegación semántica por teclado.
- CTA cambia entre iniciar y reanudar.
- No consume intento al abrir detalle; sí al confirmar batalla.
- Solo ofrece campeones desbloqueados y explica la condición de los bloqueados.
- Árbol muestra costes, prerrequisitos, saldo y resultado del respec.
- El detalle no se cierra por actualizaciones de estado no relacionadas.
- Countdown y LP anunciados de forma accesible.
- Perfil móvil desmonta efectos costosos.

### 15.6. E2E

- Run completa con cinco victorias y curación.
- Recarga/reanudación entre combates.
- Derrota y nueva expedición.
- Tres intentos de Olimpo y bloqueo hasta reset.
- Concurrencia en dos pestañas.
- Flujo con red intermitente y reintento idempotente.
- Viewports móvil pequeño, móvil medio, tablet y desktop.

Gates por PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm supabase test db --local
pnpm build
```

La medición visual se realiza con build de producción y CPU 4x, no con `next dev`.

## 16. Plan de entrega por PR

### PR 1 — Contratos y ADR

- Documentación final.
- Tipos de modos y contratos compartidos.
- Tests de configuración y transiciones.
- Sin UI ni migración productiva.

### PR 2 — Prueba determinista de combate

- Diario de acciones tipado.
- Replay server-side.
- Límites y errores.
- Suite de regresión con cartas complejas.

### PR 3 — Fundación Supabase local

- Migraciones creadas con CLI.
- Tablas, constraints, RLS, grants y funciones transaccionales.
- Seed de rivales y recompensas ficticias.
- pgTAP y tests de concurrencia.

### PR 4 — Portal de modos y traslado de Arena

- `/arena` como portal.
- Arena clásica en `/arena/classic`.
- Rediseño desktop/mobile.
- Compatibilidad de navegación y tests de componentes.

### PR 5 — Supervivencia dominio/API

- Runs, emisión, finalización, escalado por Ascensión, curación, Fragmentos y recompensas.
- Integración con replay y economía.
- Tests unitarios, API y base de datos.

### PR 6 — Supervivencia UI

- Lobby, HUD, hitos, reanudación y resultados.
- Perfil móvil y métricas de rendimiento.
- E2E de cinco victorias.

### PR 7 — Olimpo dominio/API/admin

- Catálogo, campeones, desbloqueos por tier, árbol/respec, allowance diario, intentos, primeras victorias y recompensas.
- Editores admin de Supervivencia y Olimpo con versionado, simulación y auditoría.
- Tests de concurrencia y seguridad.

### PR 8 — Olimpo UI

- Selector legendario, detalles, intentos, countdown y combate.
- E2E de límite diario y reanudación.
- Accesibilidad y responsive.

### PR 9 — Balance, observabilidad y hardening

- Simulaciones batch.
- Caps económicos.
- Rate limits y dashboards.
- Auditoría Supabase, performance y regresión completa.

Cada PR debe ser desplegable y reversible. Ninguno puede depender de datos creados manualmente en producción.

## 17. Feature flags y rollout

- Flags server-side: `combat_portal_enabled`, `survival_enabled`, `olympus_enabled`.
- Catálogos inactivos por defecto hasta terminar seed y balance.
- Orden:
  1. equipo interno local;
  2. staging con datos sintéticos;
  3. porcentaje pequeño de usuarios;
  4. apertura gradual.
- Si se desactiva un modo, las runs y batallas existentes permanecen legibles y reanudables durante una ventana de gracia.
- Rollback de UI no borra progreso; migraciones destructivas se posponen a otra release.

## 18. Criterios de aceptación

### Portal

- Los tres modos se entienden en menos de un vistazo.
- Funciona a 320 px y desktop sin overflow.
- El Board no forma parte del bundle inicial del portal.

### Supervivencia

- Conserva LP verificados entre duelos.
- Cura 2.000 LP cada cinco victorias y respeta el máximo.
- Empieza con potencia equivalente al tier 4 y escala hasta Ascensión sin meseta permanente.
- Acredita Fragmentos de forma atómica e idempotente.
- Sobrevive a recarga, navegación y retry de red.
- No duplica avance ni recompensa en concurrencia.

### Olimpo

- Consume como máximo tres intentos por periodo UTC.
- Solo permite controlar campeones derrotados dentro de su tier asignado.
- Usa el deck real versionado del campeón con su árbol aplicado sobre un snapshot.
- Compra y respec afectan exclusivamente al campeón seleccionado.
- El cliente no puede modificar rival, límite, outcome o recompensa.
- La primera victoria se concede una sola vez.
- La UI explica intentos, reset, dificultad y recompensa antes de confirmar.

### Calidad

- Cero `any`.
- SRP y archivos de comportamiento por debajo de 150 líneas.
- Cabeceras y comentarios de intención en español.
- Cobertura mínima del 80 % en servicios y casos de uso críticos.
- `lint`, `typecheck`, tests, pgTAP y build en verde.
- Sin warnings nuevos ni acceso a Supabase desde UI.

## 19. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Cliente falsifica victoria o LP | Replay determinista y outcome derivado |
| Dos pestañas gastan o cobran dos veces | Locks, índices únicos y transacción |
| Desconexión consume intento de Olimpo | Aviso previo y reanudación temporal |
| Run bloqueada por sesión expirada | Estado `EXPIRED` y recuperación idempotente |
| Inflación por recompensas | Catálogo versionado, caps y simulación |
| Nueva UI degrada móvil | Board lazy, miniaturas, efectos desmontables y budgets |
| Refactor rompe Arena actual | Traslado primero, tests de caracterización y flag |
| Función privilegiada expuesta | Grants mínimos, RLS, schema privado cuando proceda y pgTAP |
| Replay diverge por aleatoriedad | Seed única, ids deterministas y tests de cartas complejas |
| Escalado infinito vuelve las partidas largas o injustas | Caps, Ascensión por capas, sudden pressure y simulación P95 |
| Cambiar Arena rompe campeones ya configurados | Referencias versionadas y snapshots inmutables |
| Árboles multiplican el coste de balance | Plantilla común de 8-12 nodos y efectos cerrados |

## 20. Referencias técnicas

- Arquitectura local: `docs/architecture/`.
- Motor y efectos: `docs/architecture/03-domain-game.md` y `07-game-engine-effects-extension.md`.
- Arena existente: `docs/training/ARENA-PROGRESION-Y-ESCALADO.md`.
- Rendimiento: `docs/performance/PERFORMANCE-MASTERPLAN.md`.
- Desarrollo local Supabase: <https://supabase.com/docs/guides/local-development>.
- Seguridad RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>.
- Testing de base de datos: <https://supabase.com/docs/guides/database/testing>.

## 21. Definición de terminado

La feature estará terminada cuando los tres modos estén disponibles desde el portal, las reglas y recompensas sean autoritativas, los flujos críticos estén reproducidos en Supabase local y los budgets de móvil se cumplan. Una pantalla visualmente completa sin replay, atomicidad, RLS, tests de concurrencia o medición de rendimiento se considera incompleta.
