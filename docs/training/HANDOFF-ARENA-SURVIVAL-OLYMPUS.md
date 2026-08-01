<!-- docs/training/HANDOFF-ARENA-SURVIVAL-OLYMPUS.md - Estado técnico, decisiones, incidencias y plan de continuidad de los modos PvE de Arena. -->
# Handoff técnico: Arena clásica, Supervivencia y Olimpo

## 1. Propósito

Este documento permite continuar la feature sin reconstruir su contexto ni duplicar lógica. Resume lo implementado en la rama `feat/arena-survival-olympus-design`, los errores encontrados, las decisiones que no deben revertirse y las fases pendientes.

Documentos canónicos complementarios:

- `docs/training/GUIA-MODOS-ARENA-SUPERVIVENCIA-OLIMPO.md`: diseño completo de producto, arquitectura, seguridad y roadmap.
- `docs/architecture/08-survival-progression-settlement.md`: settlement y progresión de Supervivencia.
- `docs/training/OLYMPUS-ASSET-INVENTORY.md`: inventario visual de Zeus, Loki y Hefes.
- `docs/training/IMPLEMENTATION_LOG.md`: historial cronológico del área Training.
- `docs/bugs/GUIA-ESTABILIDAD-COMBATE-Y-ARSENAL-MOVIL.md`: fixes anteriores de combate, IA y rendimiento móvil.

`docs/bug-fixes-guide.md` se eliminó por ser un borrador no versionado, obsoleto y contradictorio con las correcciones finales.

## 2. Decisión arquitectónica innegociable

Arena clásica, Supervivencia y Olimpo son subdominios separados sobre un kernel de combate compartido:

```text
UI del modo
  -> runtime/servicio de aplicación
    -> caso de uso del modo
      -> dominio puro
        -> repositorio
          <- adaptador Supabase

Todos los modos
  -> ICombatSession + ICombatProof
    -> GameEngine determinista compartido
```

No crear un segundo motor, un Board alternativo ni decks mock para Supervivencia/Olimpo. Tampoco introducir reglas de estos modos en componentes React o en Arena clásica.

## 3. Estado de las fases

### Completado: Fase 1 — contratos y CombatProof

- `IMatchMode` admite `SURVIVAL` y `OLYMPUS`.
- `ICombatSession`, `ICombatProof` y el diario de acciones son contratos compartidos.
- El servidor reproduce el combate y deriva ganador y LP; no confía en el resultado declarado por el navegador.
- Protocolo v3: el journal es **exclusivamente del jugador**. Ver §4 bis.
- Tickets HMAC vinculan jugador, modo, batalla, snapshot, expiración y versión de protocolo.
- El motor admite LP iniciales distintos del máximo.

Piezas principales:

- `src/core/entities/match/ICombatSession.ts`
- `src/core/use-cases/match/replay-combat-proof.ts`
- `src/services/security/duel-completion-ticket.ts`
- `src/services/security/api/parse-combat-proof.ts`

### Completado: Fase 2 — fundación Supabase local

La migración `20260101000231_150_arena_modes_foundation.sql` creó:

- sesiones y snapshots de combate;
- runs y batallas de Supervivencia;
- cartera y ledger de Fragmentos;
- catálogo de campeones y progreso individual;
- árboles de mejora;
- allowance diario, batallas, victorias y leyendas de Olimpo;
- RLS, grants mínimos y RPC transaccionales.

Las migraciones posteriores añaden inicio/emisión idempotentes, invalidación/reemisión de batallas antiguas, read model de progreso y escalado de Ascensión.

El cliente autenticado puede leer únicamente lo permitido. Las mutaciones económicas y de progreso se ejecutan mediante repositorio/RPC con `service_role`; nunca desde UI.

### Completado: Fase 3 — portal y Arena clásica

- `/hub/academy/training/arena` es el portal de los tres modos.
- `/hub/academy/training/arena/classic` conserva Arena clásica.
- El portal no monta tres tableros ni previews costosas.
- Diseño responsive con identidad separada:
  - Arena: cian/azul.
  - Supervivencia: ámbar/rojo.
  - Olimpo: oro/violeta.

Piezas principales:

- `src/components/hub/academy/training/combat-modes/`
- `src/app/hub/academy/training/arena/`
- `src/core/config/academy-routes.ts`

### Completado: Fases 4–6 — Supervivencia autoritativa

Flujo implementado:

1. El jugador inicia o recupera su única expedición activa.
2. El servidor emite una batalla y fija un snapshot inmutable.
3. Se usan el deck real actual y fusion deck del jugador.
4. El rival procede del catálogo real de Arena.
5. El Board y GameEngine compartidos ejecutan el duelo.
6. El cliente envía el diario; el servidor reproduce y liquida.
7. Los LP restantes pasan al siguiente duelo.
8. Cada `milestoneInterval` victorias se cura `milestoneHeal` sin superar el máximo. Ambos valores salen del
   ruleset y viajan al cliente; la UI no los fija.
9. La derrota termina la run. **El empate también**: no acredita victoria ni Fragmentos, fija los LP a 0 y
   cierra la expedición igual que una derrota. Es intencional —sobrevivir exige ganar— y el informe lo dice
   explícitamente en vez de mostrarlo como una derrota más.
10. Las recompensas y Fragmentos se acreditan de forma atómica e idempotente.
11. Entre combates se muestra un informe con LP, cura, recompensa, récord y saldo.

Escalado:

- Empieza en potencia equivalente al tier 4.
- Avanza por tramos configurados.
- Reutiliza el orden canónico de oponentes de Arena.
- Al alcanzar el máximo entra en vueltas de Ascensión.
- La Ascensión aplica nivel/versión de cartas y bonus limitados, no crecimiento infinito sin caps.

Piezas principales:

- `src/core/entities/survival/ISurvival.ts`
- `src/core/use-cases/survival/`
- `src/core/services/survival/`
- `src/services/survival/`
- `src/infrastructure/persistence/supabase/SupabaseSurvivalRepository.ts`
- `src/app/api/survival/`
- `src/components/hub/academy/training/modes/survival/`

## 4. Contrato correcto del combate Survival

Este punto causó las regresiones más graves y no debe volver a alterarse.

- El deck del jugador procede de su loadout persistido, nunca de mocks.
- El deck del oponente procede del loadout real de Arena.
- Ambos decks se barajan antes del reparto.
- El Fisher–Yates canónico vive en `src/core/services/random/shuffle-with-random.ts`.
- Cada combate recibe una seed firmada distinta.
- Se usan streams separados:
  - `${seed}:player-deck`
  - `${seed}:opponent-deck`
  - `${seed}:starter`
- Ambos jugadores reciben cuatro cartas iniciales, igual que el PvE existente.
- El jugador inicial se sortea de forma determinista.
- Reabrir una batalla `ISSUED` reanuda exactamente el mismo snapshot. Esto es idempotencia y protección anti-cheat, no falta de barajado.
- La caducidad de la sesión decide si hubo abandono; liquidar una prueba ya concluida dispone además de
  `COMBAT_SETTLEMENT_GRACE_MS`, para que un duelo lento no se gane en pantalla y se rechace al enviarlo. El
  ticket de cierre vive esa suma, no solo la ventana de la sesión.
- Un snapshot Survival antiguo de tres cartas se invalida y reemite sin cambiar el índice lógico.

Implementación:

- `src/services/survival/create-survival-initial-state.ts`
- `src/services/survival/build-survival-battle-snapshot.ts`
- `src/core/use-cases/survival/IssueSurvivalBattleUseCase.ts`

## 4 bis. El rival lo juega el servidor (protocolo v3)

Hasta el protocolo v2 el journal contenía las acciones de **ambos** duelistas y el servidor las reproducía
tal cual. Como las jugadas del rival las elegía el navegador, bastaba con enviar un diario donde la IA no
jugaba nada para liquidar victoria impecable y Fragmentos ilimitados. El replay validaba legalidad, no
autoría.

Contrato vigente:

- El journal solo admite acciones cuyo actor es el jugador; declarar una del rival se rechaza.
- El servidor juega los turnos del rival con `resolveOpponentIntent`, el mismo resolutor puro que usa el
  tablero para animar. No hay dos bucles de IA.
- La única decisión humana dentro del turno rival —activar o no una trampa reactiva, y cuál— viaja como
  acción del jugador (`RESOLVE_REACTIVE_TRAP`) y se consume justo cuando el servidor deriva el disparo.
- El perfil de IA lo fija el ruleset y lo envía el servidor (`aiProfile`); el cliente nunca lo elige. Si
  cliente y servidor usaran perfiles distintos, el replay divergiría en cada combate.
- `cancelUnresolvablePendingTurnAction` no viaja por el journal: el servidor la deriva igual.

Piezas principales:

- `src/core/services/opponent/resolve-opponent-intent.ts`
- `src/core/use-cases/match/internal/derive-opponent-turn.ts`
- `src/components/game/board/hooks/internal/opponent-turn/`

No devolver las acciones del rival al journal ni reintroducir una dificultad fija en la UI.

## 5. UI, tablero, audio y assets

Supervivencia reutiliza la presentación real del combate:

- `PlayerHUD` recibe identidad e imagen del oponente real.
- El Board recibe el estado autoritativo, no crea un estado mock interno.
- Se conserva el mismo motor de animaciones, cartas, IA, logs y resultado.
- El lobby muestra el índice exacto de la batalla emitida.
- Una batalla pendiente usa el CTA `Reanudar Combate`.
- El detalle intermedio no destruye la expedición al navegar.

Soundtrack:

- Archivo: `public/audio/survival/pulso-de-neon.m4a`.
- Ruta canónica: `/audio/survival/pulso-de-neon.m4a`.
- Se prepara durante el gesto del CTA para cumplir autoplay móvil.
- `Board` recibe `customSoundtrackPath`.
- No iniciar dos instancias de audio ni reemplazar el sistema compartido.

Assets de Olimpo:

```text
public/assets/combat/olympus/opponents/
  zeus/{avatar,intro,victoria,derrota}.webp
  loki/{avatar,intro,victoria,derrota}.webp
  hefes/{avatar,intro,victoria,derrota}.webp
```

No moverlos a Story: son contenido propio del modo Olimpo.

## 6. Incidencias encontradas y solución final

### Survival parecía un mock

Síntomas:

- mismas cartas;
- rival aparentemente fijo;
- deck del jugador incorrecto;
- avatar ausente.

Causa:

- snapshots emitidos antes de conectar los loadouts reales seguían siendo válidos y se reanudaban;
- partes de presentación no recibían el runtime real.

Solución:

- cargar ambos loadouts reales antes de construir el snapshot;
- invalidar snapshots legacy incompatibles;
- reemitir de forma transaccional;
- pasar presentación real al HUD;
- distinguir visualmente iniciar de reanudar.

### Manos aparentemente repetidas

Diagnóstico local confirmó que combates completados tenían seeds y manos diferentes. La confusión combinaba:

- reanudación legítima del mismo snapshot;
- lobby con `currentBattleIndex + 1`;
- mano Survival de tres cartas frente a cuatro en Arena/Story;
- algoritmo de barajado duplicado.

Solución:

- barajado canónico compartido;
- cuatro cartas;
- seed independiente para iniciador;
- índice real de batalla;
- CTA de reanudación;
- tests de manos de ambos jugadores, replay y alternancia de iniciador.

### Soundtrack no arrancaba en móvil

Causa: iniciar audio después de operaciones asíncronas pierde el gesto de usuario requerido por navegadores móviles.

Solución: preparar la pista al pulsar el CTA y consumir esa instancia en el sistema compartido de audio del Board.

### Abandonar un combate perdido salía gratis

Una batalla `ISSUED` se reanudaba siempre con el mismo snapshot, así que perder y cerrar la pestaña
permitía repetir el combate con información perfecta hasta ganarlo; dejar caducar la sesión lo reemitía
sin coste.

Solución: si la sesión de una batalla **jugable** caduca sin liquidarse, se registra como derrota y cierra
la expedición (`forfeit_survival_battle`). La incompatibilidad de snapshot sigue reemitiendo sin castigo,
porque esa es culpa nuestra y no del jugador. La política vive en
`src/core/services/survival/resolve-issued-battle-disposition.ts`.

Segunda mitad (checkpoint por turno): el cliente reporta su diario en cada frontera de turno a la misma
ruta de cierre, y el servidor decide si eso liquida el combate o solo registra avance. Como el turno del
rival lo deriva él (§4 bis), **el golpe letal aparece al reproducir aunque el cliente no lo reporte**: dejar
de enviar el final no evita la derrota. Reanudar reconstruye el estado desde el avance registrado con
`replayJournalToState`, así que no se reinicia el combate ni se reparten manos nuevas.

El historial es inmutable: `checkpoint_combat_session` solo acepta diarios más largos y
`assertJournalExtendsCheckpoint` rechaza los que contradicen lo ya registrado.

Residuo conocido: un cliente modificado que nunca reporte puede reintentar dentro de la ventana de sesión;
al caducar, cae en el cierre por abandono. Eliminarlo del todo exigiría que el servidor dirigiera el turno
en vez de reproducirlo.

### Riesgo de premiar dos veces

Solución: settlement y ledger idempotentes por `battleId`, con locks y unicidad en Supabase. Los retries recuperan el resultado persistido.

## 7. Tests y gates ya alcanzados

Última validación de la corrección de apertura:

- 29/29 tests relacionados.
- `pnpm exec tsc --noEmit`.
- `pnpm lint`.
- `pnpm build`.
- pgTAP Supabase local: 49/49.

Cobertura relevante:

- reglas puras de encuentro, recompensa y Ascensión;
- start/issue/complete;
- replay de CombatProof;
- rutas API;
- repositorio/mappers;
- lobby y debrief;
- audio personalizado;
- barajado, cuatro cartas, seeds distintas, starter y resume;
- RLS, privilegios, concurrencia e idempotencia.

Antes de continuar:

```bash
pnpm lint
pnpm test
supabase test db
pnpm build
```

No usar Supabase de producción para desarrollo. `.env.local` debe apuntar a la instancia local y cualquier migración nueva debe validarse con reset/pgTAP local.

## 8. Completado: Olimpo dominio/API (pasos 1-7 y 9)

El runtime de Olimpo ya existe de extremo a extremo salvo la UI (§10) y el panel admin (§9).

| Paso | Estado | Piezas |
| --- | --- | --- |
| 1. Caracterizar tablas, RPC y seeds | Hecho | `supabase/tests/database/olympus_domain.test.sql` |
| 2. Entidades y reglas puras | Hecho | `src/core/entities/olympus/IOlympus.ts`, `src/core/services/olympus/` |
| 3. `IOlympusRepository` | Hecho | `src/core/repositories/IOlympusRepository.ts` |
| 4. Adaptador Supabase y mappers | Hecho | `SupabaseOlympusRepository.ts`, `internal/olympus-repository-mappers.ts` |
| 5. Casos de uso | Hecho | `src/core/use-cases/olympus/` |
| 6. Snapshot con el GameEngine compartido | Hecho | `src/services/olympus/` |
| 7. APIs finas | Hecho | `src/app/api/olympus/` |
| 8. Administración versionada | Hecho (falta el simulador) | `src/app/api/admin/pve-modes/`, `src/components/admin/internal/pve/` |
| 9. Tests unitarios, API, RLS y pgTAP | Hecho para lo anterior | co-localizados + pgTAP |

Decisiones que se tomaron dentro de esta fase y no deben revertirse:

- La configuración vive en `olympus_settings`, versionada y con una sola fila activa. Intentos diarios,
  TTL de batalla, coste y porcentaje de reembolso del respec salen de ahí, nunca del cliente ni de
  constantes en código.
- **El respec ya cobra.** La primera reasignación por campeón es gratuita (`respec_free_allowance`) y las
  siguientes descuentan `respec_cost`, con un asiento de ledger propio (`operation_id || ':cost'`) para que
  el cobro sea auditable por separado del reembolso.
- Las leyendas provisionales `legendary-kernel` y `legendary-nexus` dieron paso a **Zeus, Loki y Hefes**,
  con las rutas de arte de §5 ya en BD, reglas visibles, recompensa base, bonus de primera victoria y
  compensación por derrota como columnas administrables.
- `combat_modifiers_json` usa `energyBonus` (energía **por encima** del máximo compartido), no
  `startingEnergy`: el motor arranca a energía máxima y un valor absoluto de 5 habría sido un nerf.
- Abandonar e invalidar están separados, igual que en Supervivencia: `forfeit_olympus_battle` cierra como
  derrota con el intento gastado; `invalidate_olympus_battle` borra la batalla y **devuelve el intento**,
  porque un snapshot incompatible es deuda nuestra.
- Un efecto de nodo que el resolutor no sabe aplicar se rechaza al mapear. Ignorarlo en silencio
  convertiría un nodo pagado en decoración.
- Sin selector explícito de cartas, `SIGNATURE_CARD_LEVEL` sube el fusion deck del campeón.
- `resolveIssuedBattleDisposition` y el rate limit PvE son ahora kernel compartido
  (`core/services/match/`, `services/security/api/rate-limit/`), no piezas de Supervivencia.

Reglas de producto:

- El jugador selecciona un campeón clásico que ya derrotó en su tier.
- Controla el deck real versionado de ese campeón.
- Los Fragmentos se gastan por campeón, no globalmente.
- El árbol es pequeño, con prerrequisitos y caps.
- La primera reasignación es gratuita; las siguientes usan coste configurado.
- Las cartas prestadas no ganan experiencia ni entran en la colección.
- El rival es Zeus, Loki o Hefes, cada uno con deck legendario propio.
- Hay tres intentos diarios configurables y reinicio UTC.
- El intento se consume al emitir la batalla.
- Solo puede existir una batalla activa.
- Una batalla pendiente puede reanudarse mientras el ticket sea válido.
- La primera victoria por leyenda se recompensa una sola vez.
- El cliente nunca decide intentos, rival interno, outcome, recompensa ni periodo UTC.

## 9. Completado: panel admin de los modos PvE

Ruta: `/admin-portal/<slug>/pve-modes`. Cuatro pestañas, ningún GOD component; cada panel vive en
`src/components/admin/internal/pve/` y ninguno supera las 150 líneas.

| Sección de esta guía | Estado | Dónde se edita |
| --- | --- | --- |
| Configuración: límite diario, expiración y ventanas | Hecho | Pestaña **Config Olimpo** (`olympus_settings`) |
| Leyendas: identidad, assets, disponibilidad y reglas especiales | Hecho | Pestaña **Leyendas** → `AdminOlympusLegendForm` |
| Decks legendarios: composición y versión | Hecho | Pestaña **Leyendas** → `AdminOlympusLegendDeckEditor` |
| Recompensas: base, primera victoria y rotación | Hecho | Pestaña **Leyendas** (rotación = ventanas de disponibilidad) |
| Campeones: vínculo con rival/tier y versión de deck | Hecho | Pestaña **Campeones** |
| Árboles: nodos, costes, prerequisitos, selectores y caps | Hecho | Pestaña **Campeones** → `AdminOlympusNodeRow` |
| Supervivencia: stages, hitos, recompensas y Ascensión | Hecho | Pestaña **Supervivencia** |
| Auditoría: quién publicó cada versión y cuándo | Hecho | `admin_audit_log` + historial de versiones en pantalla |
| Simulación: batches por seed, P50/P95 y stalls | **Pendiente** | ver §11 |

Reglas de versionado que implementa el panel (no revertir):

- **Supervivencia y configuración de Olimpo se publican, no se editan.** Guardar inserta una versión nueva
  y mueve `is_active` en una transacción (`publish_survival_ruleset`, `publish_olympus_settings`, migración
  155). Una expedición en curso conserva su `ruleset_version`: su escalado queda congelado.
- **Leyendas, campeones y nodos se editan en sitio y suben su `version`.** Es seguro porque cada batalla
  guarda su snapshot inmutable en `combat_sessions`: el replay reproduce lo que se emitió, no el catálogo
  de hoy.
- **Retirar es archivar cuando hay historial.** Una leyenda con batallas jugadas y un nodo ya comprado pasan
  a `is_active = false`; borrarlos dejaría batallas huérfanas y sacaría el coste del nodo del reembolso del
  respec.
- **Solo se publican tipos de efecto soportados** (`GLOBAL_LEVEL`, `GLOBAL_VERSION_TIER`,
  `SIGNATURE_CARD_LEVEL`, `STARTING_LP`, `STARTING_ENERGY`). La lista viva está en
  `src/core/entities/admin/IAdminPveModes.types.ts` y la validan API y UI; cualquier otro tipo hace fallar
  el mapeo a propósito, para que un nodo cobrado nunca quede sin efecto.

Reutilización (no duplicar): el editor de deck legendario monta `AdminArenaDeckGrid`,
`AdminStarterDeckCollectionPanel`, `HomeCardInspector`, `DetailBonusControls` y las funciones puras de
`admin-arena-deck-entry-state`, las mismas de Arena y Story. El gate, el rate limit y la auditoría son los
compartidos de `/api/admin/*`.

## 10. Fase posterior: UI de Olimpo

Solo después de estabilizar los contratos:

- selector de campeón desbloqueado;
- selector de leyenda;
- detalle con dificultad, recompensa e intentos;
- árbol de mejoras y respec;
- countdown al reset UTC;
- confirmación explícita antes de consumir intento;
- reanudación;
- Board lazy con estado autoritativo;
- resultado y primera victoria;
- diseño oro/violeta responsive;
- carrusel móvil con scroll nativo y `scroll-snap`;
- targets de 44 px, foco visible, `aria-live` y reduced motion.

## 11. Hardening final

Después de la UI:

- simulación batch y balance de decks;
- caps económicos y revisión de inflación;
- rate limits;
- observabilidad sin tickets ni snapshots privados en logs;
- auditoría Supabase de RLS/grants/functions;
- E2E de tres intentos, dos pestañas, reanudación y red intermitente;
- perfil móvil con CPU 4x;
- objetivos: INP < 200 ms, CLS < 0,1 y al menos 30 FPS;
- rollout mediante flags server-side;
- checkpoint por turno del journal, para que reanudar continúe desde el último turno confirmado en vez de
  reiniciar la batalla (cierra el resto del abandono descrito en §6).

## 12. Commits de referencia

```text
5858b2ae  fundación autoritativa de modos
ec6835b0  fundación Supabase segura
01705750  portal de modos
d2cd127a  dominio y API de Supervivencia
94807631  UI autoritativa de Supervivencia
a8cac1f9  presentación real de Arena en Survival
9c357bfa  reemisión de batallas legacy con decks reales
6ff7a31d  progresión completa de expedición
b65f767d  apertura PvE unificada y barajado seeded
```

## 13. Checklist para el siguiente agente

- Consultar Engram antes de modificar arquitectura.
- Trabajar desde el estado actual de la rama y preservar cambios ajenos.
- TDD y tests co-localizados.
- Cero `any`.
- UI sin Supabase directo.
- Servicios, hooks y componentes por debajo de 150 líneas.
- Cabecera de ruta y comentario de intención en cada archivo modificado.
- No duplicar Board, GameEngine, barajado, audio, IA ni carga de decks.
- No aceptar autoridad económica o de combate desde el cliente: el journal es solo del jugador (§4 bis).
- Actualizar esta guía y `IMPLEMENTATION_LOG.md` al cerrar cada fase.
- Guardar decisión y resumen de sesión en Engram.
