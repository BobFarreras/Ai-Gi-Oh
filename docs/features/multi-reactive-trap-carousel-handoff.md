# Traspaso — Carrusel de trampa reactiva en MULTIJUGADOR (ficha 4, nivel 1)

> Documento de continuación para el agente. El **cimiento del motor + transporte está HECHO y probado**
> (commit `7279b454`, rama `fix/testers-bugs-mobile-traps-replacement`). Falta **solo el cableado del
> cliente** + la prueba de 2 clientes reales. NO hay nada roto: el transporte nuevo está inactivo y el flag
> de diferir está apagado por defecto, así que el multi actual se comporta igual que antes.
>
> **ACTUALIZACIÓN — CABLEADO DE CLIENTE HECHO (tests verdes).** Implementado el flujo extremo a extremo
> (atacante difiere+emite `ATTACK` diferido; defensor elige con el mismo carrusel y emite
> `RESOLVE_REACTIVE_TRAP`; atacante recibe, revela y desbloquea; auto-pasar a 15s si el defensor no decide).
> `pnpm typecheck` y `pnpm lint` limpios; tests de cliente verdes. **Solo queda la prueba manual de 2 clientes
> reales** (ver "Cómo probar"), que NO es automatizable. Detalle en `docs/roadmap-v1.17-nuevo-paquete.md` (ficha 4).
> Ficheros tocados: `handleOpponentEntityClick.ts`, `useHandleEntityClick.ts`, `usePlayerActions.ts`,
> `player-actions/types.ts`, `useMatchRuntime.ts`/`.builders.ts`/`.internal.ts`, `useBoard.ts`,
> `useRemoteOpponentAnimator.ts`, `animate-remote-action.ts`. El turn-guard NO necesitó tocar la ruta del
> servidor (ya solo valida participación/tipo/secuencia; el candado de "quién" es del motor).

## Objetivo

En multijugador, cuando el rival ataca y el defensor tiene **varias trampas reactivas elegibles**, hoy el
motor activa **la primera automáticamente**. Se quiere que el defensor **elija cuál** (o pasar), con el mismo
carrusel `‹ ›` que YA funciona contra la IA (Story/Arena/Training). El reto es hacerlo **sin romper el
determinismo** entre los dos clientes.

## Por qué era delicado (contexto imprescindible)

El motor de combate es **agnóstico**: single-player y multi llaman a las mismas funciones puras. En multi,
cada cliente **reaplica la misma secuencia de acciones** para mantener el estado sincronizado
(`apply-match-action.ts`). Hoy, al declarar el ataque, AMBOS clientes ejecutan `executeAttack` y auto-resuelven
la trampa (la primera) → convergen. Si el defensor eligiera "en caliente" en su cliente, divergirían.

**Solución (ya implementada en el motor):** la elección se convierte en una **pausa dentro del `GameState`**
(patrón `pendingTurnAction`) + una **acción propia** que ambos clientes aplican igual. Así nunca hay una
decisión "a mitad de acción" que solo ocurra en un cliente.

## Lo que YA está hecho (commit `7279b454`) — motor + transporte

| Pieza | Fichero | Qué hace |
|---|---|---|
| Estado de pausa | `src/core/use-cases/game-engine/state/types.ts` → `IPendingReactiveTrapDecision` + `GameState.pendingReactiveTrapDecision` | Guarda el ataque en pausa: defensor, atacante/objetivo, trampas elegibles, `declineCounterTrap`. |
| Diferir | `execute-attack.ts` → opción `deferReactiveTraps` | Si el defensor tiene ≥1 trampa elegible, **devuelve la pausa** en vez de resolver. **Off por defecto → single-player intacto.** |
| Resolver | `combat/resolve-reactive-trap-decision.ts` | Re-ejecuta el MISMO `executeAttack` con `{activate, chosenTrapInstanceId}` (o "pasar") y el flag apagado. Estado final **idéntico** al ataque directo con esa elección. Revalida defensor + trampa elegible. |
| Fachada | `GameEngine.ts` → `executeAttack(..., {deferReactiveTraps})` y `resolveReactiveTrapDecision(...)` | Expuesto al resto de capas. |
| Transporte | `IMatchAction.ts` → `deferReactiveTraps` en `IAttackPayload` + acción `RESOLVE_REACTIVE_TRAP` (`{activate, chosenTrapInstanceId}`) | Tipos de acción de multi. `MATCH_ACTION_TYPES` incluye la nueva (el árbitro del servidor la acepta). |
| Aplicar | `apply-match-action.ts` | `ATTACK` pasa `deferReactiveTraps`; `RESOLVE_REACTIVE_TRAP` resuelve **atribuyéndolo al EMISOR** → el motor rechaza a un atacante que intente forzar la trampa del rival. |

**Tests (verdes):** `resolve-reactive-trap-decision.test.ts` (8) y `apply-match-action.test.ts` (4):
equivalencia diferido==directo, elegir 1ª/2ª, pasar, id manipulado, sin trampas, single-player intacto,
seguridad (atacante rechazado) y **dos clientes convergen**.

## Lo que FALTA — cableado del cliente (la parte que necesita 2 clientes reales)

El objetivo del flujo, extremo a extremo:

1. **Atacante (cliente local, multi):** al atacar (`handleOpponentEntityClick` /
   `useHandleEntityClick.ts`), si es multijugador **y** el defensor (rival) tiene trampas reactivas elegibles
   para el disparo, ejecutar `executeAttack` con `deferReactiveTraps: true` y **emitir** `ATTACK` con
   `deferReactiveTraps: true` en el payload. El estado local queda en pausa (`pendingReactiveTrapDecision`).
   Mostrar un estado "esperando la decisión del rival" (no bloquear el turno con error).
   - Ojo: hoy el atacante hace su reveal de la 1ª trampa + decide su contra-trampa (Nullify) ANTES de
     `executeAttack`. Ese `declineCounterTrap` ya viaja en la pausa (`IPendingReactiveTrapDecision.declineCounterTrap`);
     mantenerlo. La elección de trampa del DEFENSOR es lo nuevo.
   - Cómo saber si es multi: el emisor `useLocalActionEmitter()` es un noop fuera de multi; hace falta un flag
     explícito de "modo multijugador" accesible en el handler (revisar `LocalActionEmitterProvider` / el
     contexto del board en multi para exponer `isMultiplayer`). NO usar heurísticas frágiles.

2. **Defensor (cliente que recibe el ataque):** en `multiplayer/animate-remote-action.ts` (caso `ATTACK`),
   tras `apply()` el estado tendrá `pendingReactiveTrapDecision` apuntando al jugador local. Detectarlo y:
   - Reunir las trampas elegibles con `findReactiveTraps` (`hooks/internal/trapPreview.ts`) usando los
     `eligibleTrapInstanceIds` de la pausa (o recomputar por trigger; deben coincidir).
   - Lanzar el **mismo** `requestTrapActivationDecision(listaElegibles, "ON_OPPONENT_ATTACK_DECLARED")` que ya
     usa el carrusel vs IA → devuelve `{ activate, chosenTrapInstanceId }`.
   - **Emitir** `RESOLVE_REACTIVE_TRAP` con esa decisión y aplicarla localmente (`GameEngine.resolveReactiveTrapDecision`).

3. **Ambos clientes** aplican `RESOLVE_REACTIVE_TRAP` (el atacante lo recibe como acción remota; el defensor
   lo aplicó al emitir) → el ataque se resuelve con la trampa elegida. Convergen (ya probado a nivel motor).

4. **Turn-guard (el punto MÁS sensible):** el defensor emite `RESOLVE_REACTIVE_TRAP` **durante el turno del
   atacante**. Revisar `useMultiplayerMatchChannel.ts`, `useRemoteOpponentTurn.ts` y la ruta
   `/api/multiplayer/match/action/route.ts`: hoy la infra asume que emite el jugador ACTIVO. Hay que permitir
   esta acción reactiva del no-activo **sin** abrir la puerta a otras acciones fuera de turno (idealmente:
   solo se acepta `RESOLVE_REACTIVE_TRAP` del defensor cuando existe `pendingReactiveTrapDecision` que le
   apunta). El servidor solo relaya y valida participación/tipo/secuencia; el candado de "quién puede" es del
   motor (`resolveReactiveTrapDecision` ya exige que el emisor sea el defensor).

### Casos límite a cubrir en el cliente
- **Desconexión / timeout del defensor** con la pausa abierta: el atacante no debe quedar colgado. Definir un
  fallback (p.ej. el turn timer resuelve "pasar" automáticamente, o la 1ª elegible). Debe ser **determinista**
  en ambos lados (misma acción `RESOLVE_REACTIVE_TRAP` generada por el temporizador, no estados divergentes).
- **Ataque directo:** la pausa cubre `ON_OPPONENT_ATTACK_DECLARED` y, si es directo, también
  `ON_OPPONENT_DIRECT_ATTACK_DECLARED` (ya contemplado en `execute-attack.ts`). El carrusel debe ofrecer la
  unión; un único `chosenTrapInstanceId` activa solo la que casa (el motor lo maneja).
- **Reveal en el atacante:** hoy revela la 1ª trampa; con el defensor eligiendo, el atacante verá la que el
  defensor active al resolver. No pre-reveles una elección que aún no ocurrió.

## Cómo probar (obligatorio antes de fusionar)
- **2 clientes reales** en una partida ranked/multi: defensor con 2+ trampas reactivas del mismo trigger.
  Verificar que el defensor elige, que el atacante ve la trampa correcta activarse, y que **ambos tableros
  quedan idénticos** (sin desync). Probar también "pasar", ataque directo, y desconexión del defensor.
- Mantener verdes los tests de motor/transporte y añadir tests del flujo de cliente (mock del emisor).

## Definition of done
`CI=true pnpm quality:check` en verde con exit real; tests que fallan sin el cambio; **prueba de 2 clientes
reales**; y actualizar el glosario si cambia algo visible. Al terminar, marcar la ficha 4 como ✅ en
`docs/roadmap-v1.17-nuevo-paquete.md` (hoy 🟡 con el cimiento hecho).

## Aparte — Fase 6 de la IA (ficha 5, independiente, sin red)
Dar a la IA un criterio para elegir "qué trampa activo" mejor que "la primera" cuando tiene varias elegibles
(hoy usa el default del motor). Es local y de bajo riesgo; se puede hacer antes o después del cableado de
cliente. El motor YA acepta `chosenTrapInstanceId`, así que sería computar la mejor trampa del defensor-IA y
pasarla en el punto donde la IA defiende.
