# Guía de implementación — 2ª tanda de bugs de testers (2026-07)

> Contexto ya verificado (no re-investigar). Para cada bug: diagnóstico + enfoque + archivos + riesgos + tests.

---

## Bug 1 — Landing: dejar claro que se introduce el NOMBRE DE USUARIO + no forzar mayúsculas

**Diagnóstico**
- El flujo trata la entrada como un "código": [`TerminalPrompt.tsx`](../../src/components/landing/TerminalPrompt.tsx)
  (label `_ACCESS_CODE:`), [`terminal-prompt-copy.ts`](../../src/components/landing/internal/terminal-prompt-copy.ts)
  ("Introduce tu código de verificación", "¿Te has olvidado del código? No será tu nombre...") y
  [`CrawlText.tsx`](../../src/components/landing/CrawlText.tsx) ("CÓDIGO ACEPTADO", "Operador [code]").
- **Mayúsculas forzadas**: `TerminalPrompt.tsx:82` → `onChange={(e) => setInputValue(e.target.value.toUpperCase())}`.
  `normalizeLandingAccessCode` NO altera el case (solo `trim` + longitud). El input reutiliza el valor como
  nickname inicial (`aigi.pending-access-code`), así que forzar mayúsculas rompe el nombre elegido.

**Enfoque**
1. Quitar `.toUpperCase()` en el input → `setInputValue(e.target.value)` (respeta mayús/minús).
2. Reescribir copys para que sea claramente el nombre de usuario, manteniendo el tono cyberpunk:
   - `terminal-prompt-copy.ts`: "Introduce tu **nombre de usuario**:" y ajustar el help (que sí sea su nombre).
   - `TerminalPrompt.tsx`: label `_ACCESS_CODE:` → `_USUARIO:` (o `_NOMBRE_USUARIO:`).
   - `CrawlText.tsx`: "CÓDIGO ACEPTADO: [x]" → "USUARIO REGISTRADO: [x]"; "Operador [x]" se mantiene.
   - Placeholder del input: "Escribe aquí..." → "Tu nombre de usuario...".

**Archivos**: los 3 anteriores. **Riesgo**: mínimo (solo copy + 1 línea). **Tests**: no hay; verificación manual.

---

## Bug 2.1 — Evolución: en móvil no se ve la animación

**Diagnóstico**
- El overlay `HomeEvolutionOverlay` (z-[420]) se monta a nivel de escena y, por reglas de apilado, queda por
  encima del diálogo móvil `HomeCardInspectorDialog` (z-[220]). **PERO** en móvil el botón "Evolucionar" está DENTRO
  de ese diálogo modal, y tras evolucionar el diálogo **sigue abierto** (su `handleEvolve` muestra "Evolución
  completada" y NO se cierra). El modal tapa/roba el foco a la cinemática. En desktop no hay diálogo (inspector
  inline), por eso "va perfecto".
- Nota extra: en el paso de tutorial de evolución el diálogo usa `z-[426]` > overlay `z-[420]`, así que el overlay
  también quedaría por debajo en ese caso.

**Enfoque**
1. En [`HomeCardInspectorDialog.tsx`](../../src/components/hub/home/HomeCardInspectorDialog.tsx) `handleEvolve`: cerrar
   el diálogo (`onClose()`) al iniciar la evolución, para que la cinemática a pantalla completa se vea despejada. Los
   errores de evolución ya se muestran vía el `HubErrorDialog` de la escena (`handleHomeEvolveSelectedCard` setea
   `errorMessage`), así que cerrar el diálogo no oculta fallos.
2. Subir el z-index del overlay por encima del diálogo de tutorial: `z-[420]` → `z-[440]` en
   [`HomeEvolutionOverlay.tsx`](../../src/components/hub/home/HomeEvolutionOverlay.tsx).

**Riesgo**: bajo. Cerrar el diálogo en evolución es UX correcta. **Verificación**: manual en móvil. Si aún no se
viera, siguiente sospechoso = portalizar el overlay a `document.body` (fallback documentado).

---

## Bug 2.2 — Móvil: al seleccionar una carta a veces se abre el detalle VACÍO

**Diagnóstico**
- `onSelectCollectionCard` [alterna](../../src/components/hub/home/internal/hooks/use-home-workspace-handlers.ts) la
  selección: `setSelectedCollectionCardId(prev => prev === cardId ? null : cardId)`. Al re-tocar una carta ya
  seleccionada la **deselecciona** (`selectedCard` → null).
- Pero en [`HomeMobileWorkspace.tsx`](../../src/components/hub/home/layout/HomeMobileWorkspace.tsx)
  `handleSelectCollectionCard` llama SIEMPRE `setIsInspectorOpen(true)`. Repro: seleccionas A (abre) → cierras →
  vuelves a tocar A → deselecciona (null) + abre el diálogo → **detalle vacío**.

**Enfoque**
- Guardar la apertura del inspector con la presencia de carta: en `isInspectorVisible`, exigir `props.selectedCard`.
  `const isInspectorVisible = forceCloseInspector ? false : forceOpenInspectorForAction ? true : (isInspectorOpen && props.selectedCard !== null);`
  Así, si el toque deselecciona (selectedCard null), el diálogo no se abre vacío. El path de tutorial (force-open) se
  respeta intacto.

**Riesgo**: mínimo (una condición). **Tests**: `HomeMobileWorkspace.test.tsx` existe; añadir caso "re-tap deselecciona
y no abre diálogo vacío".

---

## Bug 3 — Carta bloqueada: mejorar animación/UI y banner dedicado (no "error")

**Diagnóstico**
- Modelo: `entity.lockedTurnsRemaining` ([`IPlayer.ts:15`](../../src/core/entities/IPlayer.ts)), efecto
  `LOCK_OPPONENT_ENTITY`. La entity bloqueada no puede atacar
  ([`attack-validation.ts:40`](../../src/core/use-cases/game-engine/combat/internal/attack-validation.ts) →
  `GameRuleError "Esta carta está bloqueada y no puede atacar."`).
- Visual actual en [`SlotCellEntity.tsx`](../../src/components/game/board/battlefield/internal/SlotCellEntity.tsx):
  solo un badge diminuto `🔒 N` arriba-derecha (líneas 124-131). (El pill "LOCK" de `shouldShowBlockedLock` es OTRO
  concepto: trampa que bloquea un ataque, no el LOCK por turnos — no tocar.)
- Banner "error": al intentar atacar con la carta bloqueada, el `GameRuleError` sale por
  [`BoardErrorOverlay.tsx`](../../src/components/game/board/ui/overlays/internal/BoardErrorOverlay.tsx) con estilo
  ROJO de error (muestra `code` + `message`). El usuario quiere un banner de "bloqueo" (no de error) con los turnos.

**Enfoque**
1. **Visual de carta bloqueada** (`SlotCellEntity.tsx`, cuando `lockedTurnsRemaining > 0`):
   - Envolver `<Card>` en un div con `grayscale` + `brightness` reducido (el filtro debe ir en el wrapper de la Card,
     no en un overlay, para apagar la carta real: holograma/atributos/arte).
   - Tinte oscuro semitransparente encima + **candado** (lucide `Lock`) centrado con animación de "cierre" al montar
     (scale/settle) y el contador de turnos restantes debajo. Sustituye/mejora el badge `🔒 N`.
2. **Banner de bloqueo (no error)**:
   - Extender `IBoardUiError` ([`boardError.ts`](../../src/components/game/board/hooks/internal/boardError.ts)) con
     `tone?: "error" | "blocked"` (solo UI; `toBoardUiError` sigue devolviendo error normal).
   - En [`handleOwnEntityClick.ts`](../../src/components/game/board/hooks/internal/player-actions/handleOwnEntityClick.ts):
     al clicar una entity propia en ATAQUE con `lockedTurnsRemaining > 0`, en vez de seleccionarla como atacante,
     `setLastError({ code: "GAME_RULE_ERROR", tone: "blocked", message: "Carta bloqueada. Faltan N turno(s)..." })` y
     `return`. Así el jugador no llega a disparar el `GameRuleError` del motor (que queda como red de seguridad).
   - `BoardErrorOverlay.tsx`: si `tone === "blocked"`, render con estilo ámbar/cian + icono de candado (no rojo, sin
     la palabra "ERROR"), mostrando el mensaje con los turnos.

**Riesgo**: medio (toca render de tablero y flujo de clic). Cuidado de: no afectar el pill de trampa
(`shouldShowBlockedLock`), no romper `handleOwnEntityClick.test.ts`, mantener el filtro grayscale sin cambiar el
layout (wrapper transparente al flujo, la Card es de tamaño fijo). El motor sigue validando (defensa) para IA/MP.

**Tests**: `handleOwnEntityClick.test.ts` (añadir: clic en entity bloqueada no la selecciona y setea tone blocked);
verificación visual del candado/gris.

---

## Orden sugerido
1. Bug 1 (copy + toUpperCase) — trivial.
2. Bug 2.2 (guard inspector) — 1 condición.
3. Bug 2.1 (cerrar diálogo en evolución + z-index) — pequeño.
4. Bug 3 (visual bloqueo + banner) — el de más miga.

`pnpm typecheck` + `pnpm lint` + tests de áreas tocadas antes de commit. `pnpm` siempre (no npm).

---

## Estado de implementación (2026-07-11)

Los 4 bugs implementados.

- **Bug 1**: quitado `.toUpperCase()` del input; copys reescritos (terminal + crawl) para pedir el nombre de usuario;
  label `_USUARIO:` y placeholder "Tu nombre de usuario...".
- **Bug 2.1**: `HomeCardInspectorDialog.handleEvolve` cierra el diálogo al evolucionar (la cinemática ya no queda
  tapada por el modal); overlay subido a `z-[440]` (por encima del diálogo de tutorial `z-[426]`). Fallos → HubErrorDialog.
- **Bug 2.2**: `isInspectorVisible` exige `props.selectedCard !== null` → no más detalle vacío al deseleccionar.
  Tests de `HomeMobileWorkspace` actualizados + caso nuevo de deselección.
- **Bug 3**: candado grande con animación de cierre + turnos restantes y carta en gris (`grayscale brightness`) en
  `SlotCellEntity`; banner de bloqueo dedicado (tono `blocked` ámbar + candado en `BoardErrorOverlay`, interceptado en
  `handleOwnEntityClick` con los turnos restantes, sin llegar al error rojo del motor). Test de handler añadido.

Verificación: `pnpm typecheck` ✅, `pnpm lint` ✅, `pnpm build` ✅, tests de áreas tocadas ✅ (board/home/landing 133).
**Pendiente (requiere login/dispositivo)**: verificación visual en móvil de la evolución (2.1), el detalle (2.2) y el
candado/gris + banner de bloqueo en combate (3).
