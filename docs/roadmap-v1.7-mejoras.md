# Roadmap v1.7 — Guía de implementación (6 fases)

> Rama: `feat/v1.7-improvements` (creada desde `main` v1.6.0).
> Estado: **solo guía** — contexto recogido, sin implementar. Cada fase puede ir en su propio commit/PR.

---

## Fase 1 — Editor de nombre: se ve todo en MAYÚSCULAS 🟢 fácil

**Diagnóstico.** En [HubProfileNameDialog.tsx](src/components/hub/internal/HubProfileNameDialog.tsx) el `<input>` (línea ~71) lleva la clase Tailwind **`uppercase`**. Eso es solo `text-transform: CSS` → el texto se *muestra* en mayúsculas aunque el usuario escriba en minúsculas. El valor real en estado (`value`) sí conserva el case (`setValue(event.target.value)`), y se guarda con `value.trim()`.

**Qué hacer.**
- Quitar `uppercase` de la clase del `<input>` (dejar `tracking-...` y el resto). Así el usuario ve exactamente lo que teclea.
- Si en el HUD el nombre se quiere ver en mayúsculas (decisión estética), hacerlo en el componente de **visualización** del HUD vía CSS, **no** en el input de edición.
- Revisar que `resolvePlayerLabel` / guardado no fuerce `.toUpperCase()` en ningún punto (no parece, pero confirmar).

**Riesgo:** nulo. **Aceptación:** teclear "NeoOperator" se ve "NeoOperator" y se guarda igual.

---

## Fase 2 — Cartas del diálogo de evento con el diseño de `Card.tsx` 🟠 medio

**Diagnóstico.** Hoy [EventPanel.tsx](src/components/hub/progression/EventPanel.tsx) usa `CardThumbnail` (miniatura ligera). Se pide usar el **`Card` completo** ([Card.tsx](src/components/game/card/Card.tsx)), que es de **tamaño fijo `260×380`** (`h-[380px] w-[260px]`), y que se vea bien en desktop y móvil.

**Reto.** `Card` no es fluido: hay que **escalarlo** para llenar la celda del grid manteniendo proporción (13/19). Dos enfoques:

- **(A) Breakpoints + `transform: scale` (bajo esfuerzo).** Contenedor con tamaños por breakpoint y variable CSS de escala (es lo que hizo la rama mobile-ux antes):
  ```tsx
  <div className="relative mx-auto h-[190px] w-[130px] [--card-scale:0.5] sm:h-[234px] sm:w-[160px] sm:[--card-scale:0.615]">
    <div style={{ width: 260, height: 380, transform: "scale(var(--card-scale))", transformOrigin: "top left" }}>
      <Card card={card} disableHoverEffects disableHologram disableDefaultShadow />
    </div>
  </div>
  ```
  Sencillo, pero solo 2-3 tamaños fijos (puede quedar pequeño/grande entre breakpoints).

- **(B) Escalado fluido con `ResizeObserver` (recomendado).** Crear un wrapper reutilizable `ResponsiveGameCard` que mida el ancho real del contenedor y aplique `scale = anchoContenedor / 260`. Llena cualquier celda sin recortes ni huecos. ~30 líneas (hook `useElementWidth` + `Card` posicionado absoluto a 260×380 con `transformOrigin: "top left"` y `transform: scale(w/260)`; contenedor con `aspect-[13/19]`).

**Recomendación.** Hacer el wrapper **(B)** reutilizable y usarlo aquí; deja la puerta abierta a reusarlo en market/colección. Mantener `disableHologram`/`disableHoverEffects` en contextos de catálogo.

**Riesgo:** medio (layout, rendimiento de muchas `Card` ricas en un grid → considerar memo y `disableHologram`). **Aceptación:** la tienda de evento muestra el `Card` completo, sin recortes, fluido en cualquier ancho.

---

## Fase 3 — Enlaces de comunidad (GitHub stars + Discord) 🟢 fácil (código)

**Dónde.** Footer de la landing [page.tsx](src/app/page.tsx) (fase SHOWCASE, junto a los CTA "Compilar ID" / "Conexión Red") y/o una barra social discreta. Opcional: repetir en el hub.

**GitHub (★).** Un `<a href="https://github.com/BobFarreras/Ai-Gi-Oh">` con icono y texto "Dale una estrella". Cero complejidad. Opcional: badge dinámico de stars (shields.io) ya se usa en el README.

**Discord — ¿buena idea? Sí, y es fácil.**
- **Por qué:** para un juego con aspiración de comunidad, Discord es el estándar: soporte, feedback, anuncios, encontrar rivales para multijugador, retención. Es el "hub social" que la web no da.
- **Implementación (trivial en código):** crear un servidor Discord (gratis) → generar un **invite permanente** (`discord.gg/xxxx`) → añadir un botón `<a href>`. **No hay lógica ni backend.** El "trabajo" real es **crear y moderar** el servidor, no el código.
- **Opcional avanzado:** widget de Discord embebido (muestra online count) o webhook que publique anuncios. No necesario para empezar.

**Recomendación.** Empezar con botones simples (GitHub + invite de Discord) en la landing. Crear el servidor con canales mínimos (#anuncios, #general, #feedback, #busco-rival). Esfuerzo de código: trivial.

**Aceptación:** landing con botones de GitHub y Discord que abren los enlaces correctos.

---

## Fase 4 — Revisión de poderes V5 (mastery passive) 🟠 medio (contenido)

**Diagnóstico (NO es un bug de "sin poder", pero hay gap).**
- Al llegar a **V5**, `SupabasePlayerCardProgressRepository.upsert` asigna pasiva vía `resolveDefaultMasteryPassiveSkillId`: usa la del mapa `card_mastery_passive_map` si existe, **si no, cae al fallback** (primera pasiva activa de `card_passive_skills`). → Ninguna carta queda literalmente sin poder.
- **Pero:** solo **3 de 67 entities** tienen pasiva temática en el mapa: `entity-kali-linux`→Drenaje ATK, `entity-python`→Núcleo Defensivo, `entity-react`→Carga Letal. **Las otras 64 reciben todas la misma pasiva genérica** (el fallback). Eso es el gap real.
- **Inconsistencia:** el código define **4** pasivas ([mastery-passive-display.ts](src/core/services/progression/mastery-passive-display.ts): incluye `passive-attack-energy-plus-1`) pero la BD `card_passive_skills` solo tiene **3** (falta esa).

**Qué hacer.**
1. **Reconciliar pasivas código↔BD:** añadir `passive-attack-energy-plus-1` a `card_passive_skills` (o quitarla del código). Decidir el catálogo final de pasivas.
2. **Ampliar el catálogo de pasivas** (hoy solo 3-4) para dar variedad — p. ej. una por arquetipo/rol.
3. **Poblar `card_mastery_passive_map` para las 67 entities** con una pasiva temática. Para no elegir 67 a mano, mapear **por arquetipo** (SECURITY→drenaje ATK, DB/muros→energía defensiva, LANGUAGE/FRAMEWORK aggro→golpe directo, etc.) vía migración SQL.
4. **Decidir fusiones:** ¿también tienen pasiva V5? (Se había dicho "solo entities" — confirmar y, si aplica, excluir fusiones explícitamente.)

**Riesgo:** bajo (contenido/SQL, vía migración o panel admin). **Aceptación:** toda entity activa tiene una pasiva V5 temática (no el fallback genérico repetido) y código/BD de pasivas reconciliados.

---

## Fase 5 — Entities con poder ANTES de V5 🟠 medio-alto (motor + balance)

**Diagnóstico.** El motor **ya soporta** efectos innatos de entity vía el campo `effect` (JSON), independientes de la versión. Ejemplo en producción: `entity-chatgpt-annihilator` con `DESTROY_ENTITY_ON_BATTLE_WIN`, aplicado en el motor de combate ([attack-player-updates.ts](src/core/use-cases/game-engine/combat/internal/attack-player-updates.ts)). Es la **única** entity con efecto innato (1 de 67).

**Dos caminos.**
- **(A) Usar el campo `effect` existente (recomendado).** Dar `effect` innato a más entities (como Annihilator). Aplica siempre, sin gating de versión. Reutilizar **acciones de efecto ya soportadas** por el motor cuesta poco.
- **(B) Sistema nuevo de "pasiva a tier bajo".** Más trabajo; no necesario — `effect` ya cubre el caso.

**Caveat clave.** Cada **acción de efecto NUEVA** necesita su handler en el motor. Para entities hoy solo está cableado `DESTROY_ENTITY_ON_BATTLE_WIN`. Si se quieren otros efectos innatos (p. ej. "al invocar, roba 1", "+X ATK si hay aliado del mismo arquetipo"), hay que **implementar el handler** en el game-engine y testearlo. Reutilizar acciones existentes (las de executions/traps) donde tenga sentido reduce el coste.

**Sub-tareas.**
1. Definir QUÉ entities tendrán poder innato y CUÁL (balance — no romper el early game; recordar la auditoría de economía).
2. Para cada efecto: ¿existe handler? Si no, implementarlo en el motor + tests de integración (`src/core/use-cases/game-engine/...`).
3. Mostrar el efecto en la carta (descripción/badge) para que el jugador lo vea.

**Riesgo:** medio-alto (motor + balance + tests). **Aceptación:** N entities con efecto innato funcionando en combate, con tests verdes y balance revisado.

---

## Fase 6 — Vincular dominio `ai-gi-oh.es` 🟢 mayormente config

**Buenas noticias — el código ya es domain-agnostic.** Verificado:
- El check CSRF compara `Origin` contra el `Host` que sirve la petición ([validate-request-origin.ts](src/services/security/api/validate-request-origin.ts)) → con `ai-gi-oh.es` sirviendo, pasa solo. **Sin cambios.**
- El redirect de recuperación usa `request.nextUrl.origin` ([resolve-password-recovery-redirect.ts](src/services/auth/api/internal/resolve-password-recovery-redirect.ts)) → dinámico. **Sin cambios.**
- No hay URLs `vercel.app` hardcodeadas en `src` (solo en docs/README).

**Qué hacer (config externa).**
1. **Vercel:** Project → Settings → Domains → añadir `ai-gi-oh.es` (y `www.ai-gi-oh.es`). Seguir las instrucciones DNS del registrador del `.es` (nameservers de Vercel o registros A/CNAME). Elegir dominio **primario** y redirigir el otro (apex↔www). SSL se provisiona solo.
2. **Supabase (CRÍTICO):** Auth → URL Configuration:
   - **Site URL** → `https://ai-gi-oh.es`
   - **Redirect URLs** → añadir `https://ai-gi-oh.es/auth/callback` y `https://ai-gi-oh.es/**` (mantener los de `vercel.app` si se sigue usando). Sin esto, los **emails de confirmación y el reset de contraseña** redirigen mal o se rechazan.
3. **Decidir canónico:** ¿`vercel.app` redirige a `.es` (recomendado para SEO/marca) o se mantienen ambos? Configurar el redirect en Vercel.
4. **Docs (cosmético):** actualizar README/guías que citan `ai-gi-oh.vercel.app`.
5. **Env:** no hay `NEXT_PUBLIC_SITE_URL` ni similar → nada que tocar. (Si en el futuro se añade alguna URL absoluta, leerla de env, no hardcodear.)

**Riesgo:** bajo (config). El punto que más rompe si se olvida: **Redirect URLs de Supabase**. **Aceptación:** `https://ai-gi-oh.es` sirve la app con HTTPS y login/registro/reset-de-contraseña/emails funcionan en el nuevo dominio.

---

## Resumen de esfuerzo / orden sugerido

| Fase | Tema | Esfuerzo | Riesgo | Tipo |
|---|---|---|---|---|
| 1 | Editor nombre (uppercase) | Trivial | Nulo | Código (1 línea) |
| 6 | Dominio `.es` | Bajo | Bajo | Config (Vercel+Supabase) |
| 3 | GitHub + Discord | Bajo | Nulo | Código + crear servidor |
| 4 | Poderes V5 temáticos | Medio | Bajo | Contenido/SQL |
| 2 | Card completo responsive | Medio | Medio | UI |
| 5 | Poderes pre-V5 | Medio-alto | Medio | Motor + balance |

Orden recomendado: **1 → 6 → 3 → 4 → 2 → 5** (rápidas y de config primero; el motor/balance al final).

> **Sesión nueva para implementar:** sí, recomendable. Esta sesión está muy cargada de contexto; una sesión nueva (o una por fase/PR) arranca limpia y usa esta guía como punto de entrada. Las fases 2 y 5 son las que más conviene aislar en su propia sesión/PR.
