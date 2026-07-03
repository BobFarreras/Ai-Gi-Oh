<!-- docs/guia-arena6-holograma-cementerio.md - Guía de implementación de la rama feat/arena-6combats-hologram-graveyard-fixes -->
# Guía de implementación — Arena (6 combates/nivel), holograma de Documentación (móvil + desktop) y scroll del cementerio

Rama: `feat/arena-6combats-hologram-graveyard-fixes` (desde `develop`).

Esta guía documenta **diagnóstico + plan** de las 4 tareas. No implementa nada todavía: es el paso previo acordado.

---

## 1) Holograma de Documentación en móvil: "bordes raros en las cartas"

### Diagnóstico
- La escena 3D de Academy renderiza, en el pilar de Documentación, **cartas reales** (`<Card>`) dentro de `<Html transform>` de drei, cada una con dos velos holográficos superpuestos — ver [`DocumentationDeck.tsx`](../src/components/hub/academy/scene/DocumentationDeck.tsx).
- En móvil (`isLite`), el pilar usa esas cartas HTML con `occlude="blending"`. El HTML transformado en 3D (CSS 3D transform + `mix-blend-mode` + `clip-path`) **renderiza distinto en el GPU de un móvil real** que en la emulación responsive del navegador (que usa el GPU de escritorio). De ahí "en el navegador se ve perfecto, en el móvil no".
- El intento anterior (igualar el `clip-path` de los velos al de la Card, v1.8.1) **no bastó**: el artefacto no viene solo de los velos, sino del propio deck HTML transformado + blending en móvil.
- ⚠️ **Aviso de despliegue**: el fix v1.8.1 se mergeó a `develop`, **no a `main`**. Si el móvil prueba producción (`main`), aún no lo tiene. Confirmar contra qué entorno se prueba antes de dar por fallido cualquier fix.

### Solución propuesta (robusta)
Dejar de renderizar la **baraja HTML** en móvil y usar, como los otros pilares, un **plano de textura** con el shader holográfico. La textura ya existe y ya se pasa al pilar: `DOC_CARD_TEXTURE = "/assets/readme/card-render-showcase.webp"` (ver [`AcademyWorld3D.tsx`](../src/components/hub/academy/scene/AcademyWorld3D.tsx)). Esto era, de hecho, la intención documentada del modo `lite` ("Documentación como plano en vez de baraja HTML") que nunca se implementó.

En [`HologramPillar.tsx`](../src/components/hub/academy/scene/HologramPillar.tsx), la rama:
```tsx
{documentationDeck ? (
  <DocumentationDeck .../>
) : (
  <mesh ...><planeGeometry .../><academyHologramMaterial uMap={texture} .../></mesh>
)}
```
pasa a:
```tsx
{documentationDeck && !lite ? (
  <DocumentationDeck .../>
) : (
  <mesh ...><planeGeometry .../><academyHologramMaterial uMap={texture} .../></mesh>
)}
```
Efecto: en desktop, la baraja de cartas reales sigue igual; en móvil, el pilar de Documentación se ve como un holograma-plano coherente con Tutorial/Arena, **sin cartas HTML → sin bordes raros** (y con mejor rendimiento). La textura se carga siempre (`useTexture(textureUrl)`), así que no hay coste extra.

Beneficio colateral: en móvil ya no hace falta la oclusión `blending` del deck ni el `CanvasPointerEventsGuard` para ese caso (se puede simplificar en una segunda pasada, opcional).

Archivos: `src/components/hub/academy/scene/HologramPillar.tsx` (y opcional limpieza en `AcademyWorld3D.tsx`).

---

## 2) Desktop: activar el holograma de Documentación "un poco más arriba"

### Diagnóstico
El colisionador invisible que capta hover/click está en [`HologramPillar.tsx`](../src/components/hub/academy/scene/HologramPillar.tsx):
```tsx
<mesh position={[0, hologramHeight / 2, 0.2]} onPointerOver=... onClick=...>
  <planeGeometry args={[hologramWidth * 1.5, hologramHeight]} />
```
Su centro está en `hologramHeight/2` (igual que el plano de las figuras de los otros pilares). Pero la baraja de Documentación se dibuja **más arriba**: `centerY = hologramHeight * 0.52` y las cartas se abren en abanico hacia arriba (offsets +y). Resultado: la zona activa queda visualmente baja respecto a donde el usuario ve las cartas.

### Solución propuesta
Cuando el pilar es de Documentación (y en desktop, donde sí hay baraja), **subir y agrandar** el colisionador para que cubra el abanico:
```tsx
const colliderY = documentationDeck ? hologramHeight * 0.62 : hologramHeight / 2;
const colliderH = documentationDeck ? hologramHeight * 1.05 : hologramHeight;
...
<mesh position={[0, colliderY, 0.2]}>
  <planeGeometry args={[hologramWidth * 1.5, colliderH]} />
```
Valores orientativos: requieren **ajuste fino probando en desktop** (es interacción 3D). Objetivo: que el área de activación coincida con las cartas visibles, igual de "generosa" que en Tutorial/Arena.

Archivo: `src/components/hub/academy/scene/HologramPillar.tsx`.

---

## 3) Arena: "6 combates por nivel, siempre los mismos 6 rivales, más fuertes cada nivel"

### Modelo ACTUAL (revisado en código + BD)

**BD (`arena_*`, proyecto activo):**
- `arena_opponents` — **7 oponentes**: `training-tier-1` GenNvim · `training-tier-2` Helena · `training-tier-3` Jaku · `training-tier-4` BigLog · `training-tier-5` Soldado · `training-tier-6` Guill · `training-mouretech` Mouretech. Cada uno con **2 variantes de mazo** (20 cartas DECK + 2 FUSION).
- `arena_tiers` — **6 tiers**, cada uno con UN `opponent_id` "firma" y `required_wins_in_previous_tier = 5` (tier 1 = 0):

  | tier | code | dificultad | opponent_id | escalado (V/L/xp) |
  |---|---|---|---|---|
  | 1 | BOOT | EASY | training-tier-1 | — |
  | 2 | SPARK | NORMAL | training-tier-2 | 1 / 10 / 980 |
  | 3 | CORE | HARD | training-tier-3 | 3 / 10 / 980 |
  | 4 | ASCENT | BOSS | training-mouretech | 3 / 20 / 2800 |
  | 5 | NEXUS | MASTER | training-tier-5 | 3 / 30 / 5600 |
  | 6 | APEX | MYTHIC | training-tier-6 | 5 / 30 / 9800 |

**Lógica ([`resolve-training-opponent-loadout.ts`](../src/services/training/resolve-training-opponent-loadout.ts)):**
- El rival de cada combate = `roster[tierMatches % roster.length]`, donde el `roster` es **variable por tier** (`resolveRosterTemplateIds`): en tier 1 un "showcase" de 5, en tiers >1 el rival del tier + todos los anteriores.
- Comodín aleatorio (Mouretech) con 25% de probabilidad por combate.
- **Dificultad adaptativa** por win-rate (`resolveAdaptiveDifficulty`).
- Avanzar de nivel = **5 victorias** en el tier anterior ([`resolve-training-tier-access.ts`](../src/core/services/training/resolve-training-tier-access.ts)).
- El rival "siguiente" se resuelve server-side en [`arena/page.tsx`](../src/app/hub/academy/training/arena/page.tsx) a partir de `tierWins`/`tierMatches` del progreso.

**→ Conclusión:** el modelo actual NO es "6 fijos por nivel". El roster cambia por tier, rota por nº de combates, hay comodín aleatorio y dificultad adaptativa. Por eso no cuadra con tu idea.

### Modelo DESEADO (tu especificación)
- Roster **fijo de 6 rivales**, iguales en **todos** los niveles, en un orden definido.
- Cada nivel = **6 combates** contra esos 6, **en orden**.
- Cada nivel superior = **los mismos 6 pero más fuertes** (escalado creciente).
- Nivel 1 = 6 combates en el orden de `arena_opponents`.

### Decisiones a confirmar (bloquean la implementación)
1. **¿Qué 6 rivales y en qué orden?** `arena_opponents` tiene 7 (incluye Mouretech). Recomendado (de más débil a más fuerte, coherente con la narrativa): **GenNvim → Helena → Jaku → BigLog → Soldado → Guill** (`training-tier-1..6`), y **Mouretech fuera del ladder** (o como encuentro especial opcional). *Alternativa: incluir Mouretech y quitar a uno.*
2. **Índice del rival dentro del nivel:** por **victorias** (`tierWins`) → hay que **ganar al #1 para pasar al #2** (escalera "gánalos en orden"; una derrota repite rival). *Alternativa:* por combates jugados (`tierMatches`) → recorres los 6 ganes o pierdas. **Recomendado: por victorias.**
3. **Avance de nivel:** al llegar a **6 victorias** en el nivel (batir a los 6) se desbloquea el siguiente. (`required_wins_in_previous_tier`: 5 → **6**.)
4. **Nº de niveles:** mantener **6** (escalado BOOT→APEX ya existente), reutilizando el escalado por tier. *Se puede cambiar el nº después sin tocar la lógica.*
5. **Dificultad adaptativa:** **eliminarla** (choca con "fuerza fija por nivel"); cada nivel usa el escalado/dificultad fijos del tier.
6. **Variante de mazo por rival:** cada rival tiene 2 variantes; mantener la rotación actual (`variants[index % 2]`) o fijar una. Sin impacto en tu spec; propongo mantener rotación.

### Cambios de CÓDIGO (una vez confirmadas las decisiones)
En [`resolve-training-opponent-loadout.ts`](../src/services/training/resolve-training-opponent-loadout.ts):
- **Sustituir `resolveRosterTemplateIds`** por un **roster fijo ordenado** (constante `ARENA_LADDER_ROSTER = ["training-tier-1","training-tier-2","training-tier-3","training-tier-4","training-tier-5","training-tier-6"]`), idéntico para todos los tiers. Validar que existan en el catálogo (BD/preset).
- **`resolveSelectedTemplateId`** → `roster[index % 6]` con `index = tierWins` (decisión 2). **Quitar el comodín** (`wildcardTemplateId`/`wildcardRoll`/`WILDCARD_OPPONENT_CHANCE`).
- **Quitar `resolveAdaptiveDifficulty`** (decisión 5): usar `input.aiDifficulty` tal cual.
- El escalado sigue viniendo de `defaultScaling` (del tier) — cada nivel más fuerte. ✔️ ya soportado.
- Exponer en el loadout el índice/rival actual y el total (6) para que el lobby muestre "Combate X/6" y el rival correcto.

En [`arena/page.tsx`](../src/app/hub/academy/training/arena/page.tsx): el `deckTemplateId` del tier deja de determinar el rival (el roster es global); pasar `tierWins` como índice. Ajustar el texto del lobby ("Nivel X · Combate Y/6 · Rival: …").

En [`resolve-training-tier-catalog.ts`](../src/core/services/training/resolve-training-tier-catalog.ts): `DEFAULT_TRAINING_TIERS` con `requiredWinsInPreviousTier: 6` (tiers 2..6). `opponent_id`/`deckTemplateId` pasa a ser informativo (el roster es global); se puede conservar por compatibilidad.

Lobby / cliente: [`TrainingArenaLobby.tsx`](../src/components/hub/academy/training/modes/arena/internal/TrainingArenaLobby.tsx) y tipos — mostrar progreso "Combate Y/6" y el rival en orden.

### Cambios de BD (migración nueva, p. ej. `087_arena_six_combats.sql`)
- `arena_tiers.required_wins_in_previous_tier`: **5 → 6** (tiers 2..6).
- Revisar/definir el **escalado por tier** para que la curva 1→6 sea coherente (tier 1 sin escalado o V0/L1; hasta V5/L30 en APEX). Ajustar `default_version_tier/level/xp` si hace falta.
- `opponent_id` de cada tier deja de usarse para elegir rival (el roster es global). Dejar el que haya; no romper la FK.
- **No** hace falta tocar `arena_opponents` ni las variantes salvo que se decida excluir/mover a Mouretech.
- Aplicar con `apply_migration` y añadir el `.sql` a `docs/supabase/sql/` (convención del repo). `pnpm db:validate` debe seguir verde.

### Tests a actualizar/añadir
- [`resolve-training-opponent-loadout.test.ts`](../src/services/training/resolve-training-opponent-loadout.test.ts): nuevo comportamiento (roster fijo, orden por victorias, sin comodín, sin adaptativa).
- [`resolve-training-tier-catalog.test.ts`](../src/core/services/training/resolve-training-tier-catalog.test.ts): `requiredWins = 6`.
- Añadir test: "nivel 1 = 6 combates en orden GenNvim→…→Guill" y "nivel 2 = mismos 6, más fuertes".

---

## 4) Móvil en combate: el diálogo del Cementerio no deja hacer scroll (se corta)

### Diagnóstico
En [`GraveyardBrowser.tsx`](../src/components/game/board/ui/GraveyardBrowser.tsx), la rejilla de cartas usa `overflow-y-auto` dentro de un contenedor `grid ... max-h-[58vh]`, pero **le falta `min-h-0`**. Un ítem de grid/flex tiene `min-height: auto` por defecto: no se encoge por debajo de su contenido, así que el `overflow-y-auto` **no llega a activarse** y el contenido se desborda/corta (patrón clásico). En desktop se disimula porque el panel de detalle fija altura; en móvil (una sola columna) se ve cortado.

### Solución propuesta
Añadir `min-h-0` a la rejilla scrollable (línea ~65) y al contenedor grid (línea ~64), y darle una altura acotada fiable en móvil:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-4 min-h-0 max-h-[58vh]">
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-h-0 overflow-y-auto pr-1 ...">
```
Alternativa equivalente y muy robusta: mover el límite de altura al propio elemento scrollable (`max-h-[58vh] min-h-0 overflow-y-auto`). Verificar que en móvil se llega hasta la última carta con scroll, y que en desktop el panel de detalle (`hidden lg:flex`) sigue igual.

Archivo: `src/components/game/board/ui/GraveyardBrowser.tsx`.

---

## Orden de implementación sugerido y verificación
1. **Cementerio** (bug corto, alto impacto): fix `min-h-0` + probar scroll móvil.
2. **Holograma móvil** (plano en `lite`) y **collider desktop** (subir zona activa): ambos en `HologramPillar.tsx`.
3. **Arena** (mayor): confirmar decisiones → código → migración BD → tests.
4. Gate: `CI=true pnpm quality:check` completo antes de commitear/pushear.
5. Release: patch/minor según alcance (arena = cambio de gameplay → probablemente **minor**), `release:prepare`, merge a `develop`, tag, y merge a `main` para producción.

### Notas
- El holograma y el collider **no puedo verificarlos en dispositivo real** desde aquí (hub tras login + artefacto de GPU móvil): requieren tu confirmación en el móvil.
- La Arena toca gameplay: conviene validar la curva de dificultad jugando 1-2 niveles tras implementar.
