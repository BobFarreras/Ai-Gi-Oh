# Guía de implementación — Detalle de cartas en combate + Badge "Estado del Arquitecto"

> Rama: `feat/combat-detail-and-hub-badge` (desde `develop`) · Fecha: 2026-07-12
> Objetivo: 3 mejoras/bugs con la mínima deuda técnica, respetando la arquitectura por capas
> (core/services · services · components) y las convenciones del repo.
>
> **Estado: IMPLEMENTADO** — typecheck ✓ · lint ✓ · 1245 tests ✓ · build ✓.

---

## Resumen ejecutivo

| # | Tema | Tipo | Capa principal | Riesgo |
|---|------|------|----------------|--------|
| 1 | El detalle de carta V5 no explica el efecto del poder | Bug de presentación | `core/services/progression` + paneles de board | Bajo |
| 2 | En móvil, tocar una carta del historial no abre su detalle | Bug funcional | `components/game/board` | Bajo |
| 3 | Recuadros del badge "Estado del Arquitecto" no navegan | Mejora UX | `components/hub` | Bajo |

Ninguna de las tres requiere tocar base de datos ni migraciones.

---

## 1) El poder V5 aparece "desbloqueado" pero sin explicar su efecto

### Cómo funciona hoy

- El texto del poder se resuelve en un único sitio de dominio:
  [`resolveMasteryPassiveLabel`](../../src/core/services/progression/mastery-passive-display.ts)
  traduce el `masteryPassiveSkillId` a una frase con la **magnitud escalada por versión**
  (p.ej. *"Drenaje de ATK: al ser atacada, reduce 200 ATK del atacante."*).
- [`composeCardPowerDescription`](../../src/core/services/progression/compose-card-power-description.ts)
  antepone esa frase a la descripción de la carta.
- Los paneles de detalle ya la usan:
  [`SidePanels.tsx:121`](../../src/components/game/board/SidePanels.tsx) (desktop) y
  [`BoardMobilePanelsDialog.tsx:99`](../../src/components/game/board/ui/overlays/BoardMobilePanelsDialog.tsx).
- El catálogo de 10 plantillas (`PASSIVE_TEMPLATE`) cubre exactamente los 10 IDs de
  [`MASTERY_PASSIVE_IDS`](../../src/core/services/progression/mastery-passive-ids.ts), y el seed
  solo usa IDs de ese catálogo.

### Diagnóstico (dos defectos reales)

**a) Fallback genérico sin efecto.**
`resolveMasteryPassiveLabel` devuelve `"Pasiva Mastery activa en esta carta."` cuando el ID de pasiva
no tiene plantilla. Además,
[`resolve-live-selected-card.ts:32-33`](../../src/components/game/board/internal/resolve-live-selected-card.ts)
fabrica una línea `"[Pasiva V5] <label>"` **incluso cuando `masteryPassiveSkillId` es null**
(usa el placeholder `"unknown-passive-id"`), produciendo literalmente:

```
[Pasiva V5] Pasiva Mastery activa en esta carta.
```

→ dice que hay un poder V5 desbloqueado pero **no explica el efecto**. Esto ocurre en cualquier
carta con `versionTier >= 5` que **no lleve un `masteryPassiveSkillId` mapeado** (oponentes de
Story/Arena, cartas sin pasiva de arquetipo asignada, etc.).

**b) Doble impresión del efecto.**
`resolveLiveSelectedCard` **ya antepone** `"[Pasiva V5] <label>"` a `description`, y luego los paneles
llaman a `composeCardPowerDescription(liveSelectedCard)`, que **vuelve a anteponer** la misma frase.
En una carta V5 con pasiva válida el efecto se muestra **dos veces** (una con prefijo `[Pasiva V5]`,
otra sin él). Es confuso y frágil.

### Solución recomendada (consolidar en una única fuente de verdad)

1. **`resolveLiveSelectedCard`**: eliminar `withMasteryDescription`. Debe limitarse a resolver la
   versión viva de la carta (stats/buffs) y devolverla tal cual. Deja de mutar `description`.
   Esto elimina el doble prefijo y el `"[Pasiva V5]"` fabricado. *(Verificar el test asociado.)*

2. **`composeCardPowerDescription`**: hacerla robusta como único punto que antepone el poder:
   - Preferir `card.masteryPassiveLabel` si ya viene resuelto (lo fija
     [`applyCardProgressionToCard`](../../src/services/game/apply-card-progression-to-card.ts) con la
     magnitud correcta de la versión); si no, resolver desde `masteryPassiveSkillId` + `versionTier`.
   - Devolver la descripción **sin línea de poder** cuando no hay pasiva real (no inventar texto).

3. **`resolveMasteryPassiveLabel`** (opcional, mejora): que el fallback devuelva `null` en vez de la
   frase genérica cuando el ID no está mapeado, para no afirmar un poder que no sabemos describir.
   Alternativa conservadora: mantener la frase pero solo cuando `masteryPassiveSkillId` no sea null.

Resultado: en desktop y móvil el detalle muestra **una sola** línea con el efecto y su magnitud,
y las cartas sin pasiva no muestran ninguna afirmación vacía.

### Ficheros
- `src/components/game/board/internal/resolve-live-selected-card.ts` (+ su `.test.ts`)
- `src/core/services/progression/compose-card-power-description.ts` (+ `.test.ts`)
- `src/core/services/progression/mastery-passive-display.ts` (+ `.test.ts`) — opcional
- Consumidores (sin cambios de llamada): `SidePanels.tsx`, `BoardMobilePanelsDialog.tsx`,
  `HomeCardInspector.tsx`, `MarketCardInspectorSelectedView.tsx`

### Verificación
- Test unitario: carta V5 con pasiva → una sola línea de efecto con magnitud correcta.
- Test unitario: carta `versionTier>=5` **sin** `masteryPassiveSkillId` → sin línea de poder fabricada.
- Manual: abrir detalle de una carta V5 en combate (desktop y móvil).

---

## 2) En móvil, tocar una carta del historial no abre su detalle

### Diagnóstico (causa raíz encontrada)

El detalle de carta en móvil se dibuja por **dos** caminos distintos:

- `BoardMobileSelectedCardOverlay` — overlay central que **solo** se muestra para entidades vivas del
  tablero o la carta que se está jugando de la mano
  ([`board-selection-state.ts:33-41`](../../src/components/game/board/ui/layers/internal/board-selection-state.ts)).
  Nunca para una carta arbitraria del combat log (cementerio, jugadas pasadas).
- `BoardMobilePanelsDialog` — panel lateral izquierdo pensado para mostrar `selectedCard`, pero
  **recibe `selectedCard={null}` hardcodeado**:
  [`BoardActionControlsSection.tsx:26`](../../src/components/game/board/internal/BoardActionControlsSection.tsx).

En el historial, cada fila llama `onCardClick → board.previewCard(card)`, que fija
`board.selectedCard`… pero ese estado **no llega a ningún renderer de detalle** en móvil
(`BoardMobilePanelsDialog` lo ignora por el `null` fijo, y el overlay central no aplica a cartas del
log). Por eso el tap "no hace nada".

### Solución recomendada

Que `BoardMobilePanelsDialog` gestione un estado local propio de "carta inspeccionada desde el log",
en lugar de depender de `board.selectedCard` (que está acoplado a la selección de tablero/mano y
provocaría overlays duplicados con `BoardMobileSelectedCardOverlay`).

- En `BoardMobilePanelsDialog`: `const [inspectedCard, setInspectedCard] = useState<ICard|null>(null)`.
- Pasar `onCardClick={setInspectedCard}` a las filas del log (`CombatLogEventRow`).
- El panel de detalle izquierdo se renderiza desde `inspectedCard` (resuelto con
  `resolveLiveSelectedCard`, que ya incluye cementerio en `collectAllCards`), con prioridad al
  `pendingTrapActivationPrompt` existente.
- El botón de cerrar (`X`) limpia `inspectedCard`.
- Al cerrar el historial, limpiar también `inspectedCard` para no dejar el panel colgado.

Ventajas: cero acoplamiento con el estado del board, sin overlays duplicados, y el `selectedCard`
hardcodeado a `null` deja de ser el mecanismo (se puede eliminar la prop o dejarla solo para trampas).

> Alternativa descartada: pasar `selectedCard={board.selectedCard}`. Colisiona con
> `BoardMobileSelectedCardOverlay` (doble detalle al tocar entidades del tablero). Más frágil.

### Ficheros
- `src/components/game/board/ui/overlays/BoardMobilePanelsDialog.tsx` (+ `.test.tsx`)
- `src/components/game/board/internal/BoardActionControlsSection.tsx` (ajustar props si procede)

### Verificación
- Manual (móvil / viewport estrecho): abrir historial → tocar una carta de una fila de batalla →
  se abre el panel de detalle con su descripción y poder → cerrar vuelve al log.
- Comprobar cementerio: una carta destruida citada en el log también abre detalle.

---

## 3) Recuadros del badge "Estado del Arquitecto" navegables

### Contexto

[`HubProgressSection.tsx`](../../src/components/hub/HubProgressSection.tsx) es un widget cliente del
HUD ([`HubSceneHudOverlay.tsx:77`](../../src/components/hub/HubSceneHudOverlay.tsx)). Muestra 6
métricas repartidas en 2 filas (la 2ª es lazy tras "Ver más"):

1. Medallas · 2. Capítulo · 3. Tutorial · 4. Liga/Ranking · 5. Nexus · 6. Colección

Actualmente `ProgressItem` es un `<div>` no interactivo.

### Rutas de destino (todas existen bajo `src/app/hub/…`)

| Recuadro | Destino | Ruta |
|----------|---------|------|
| Nexus | Market | `/hub/market` |
| Colección | Arsenal | `/hub/arsenal` |
| Liga/Ranking | Ranking | `/hub/ranking` |
| Capítulo | Story | `/hub/story` |
| Tutorial | Academy | `/hub/academy` |
| Medallas | Arena | `/hub/academy/training/arena` |

> **Medallas → Arena** confirmado: las medallas del HUD se calculan desde Story **y Arena**
> ([`resolve-hub-runtime-progress.ts`](../../src/services/hub/internal/resolve-hub-runtime-progress.ts)).

### Solución recomendada

- Convertir `ProgressItem` en un botón navegable cuando reciba un `href` opcional (mantener el `<div>`
  para ítems sin destino, p.ej. si algún recuadro no debe navegar).
- Navegar con `useRouter().push(href)` de `next/navigation` (patrón ya usado en el hub) y disparar
  `onToggleSound?.()` en el click, coherente con el resto del widget.
- Accesibilidad: `role`/`aria-label` (“Ir a Market”, etc.), foco visible y `type="button"`.
- **Respetar el gate del tutorial**: mientras el tutorial no esté completado ni saltado
  (`!hasCompletedTutorial && !hasSkippedTutorial`, ver
  [`HubAccessPolicy.ts`](../../src/core/services/hub/HubAccessPolicy.ts)), las secciones meta están
  bloqueadas. Opciones: (a) deshabilitar la navegación de los recuadros bloqueados, o (b) no navegar
  fuera durante el tour guiado. Recomendado: deshabilitar los que no estén en las secciones
  desbloqueadas para no romper el onboarding.

### Ficheros
- `src/components/hub/HubProgressSection.tsx` (+ nuevo/actualizado test)

### Verificación
- Manual: click en cada recuadro navega a la ruta correcta; sonido de HUD suena.
- Con tutorial pendiente: los recuadros bloqueados no navegan fuera del tour.

---

## Decisiones tomadas (2026-07-12)

1. **Medallas → Arena** (`/hub/academy/training/arena`).
2. **Gate del tutorial**: deshabilitar los recuadros de secciones bloqueadas mientras el gate esté
   activo (no rompe el onboarding).
3. **Fallback poder V5**: **ocultar** la línea cuando no hay pasiva mapeada (no afirmar un poder que
   no sabemos describir).

## Orden de trabajo sugerido

1. #2 (bug funcional aislado, alto impacto UX, bajo riesgo).
2. #1 (refactor de presentación con tests de dominio).
3. #3 (mejora UX del hub).

## Checklist de calidad (memoria del repo)

- Usar **pnpm** (no npm).
- Antes de commitear: `CI=true pnpm quality:check` con exit code real (sin enmascarar).
- Mensajes de commit en el estilo del repo (`fix(...)` / `feat(...)`).
