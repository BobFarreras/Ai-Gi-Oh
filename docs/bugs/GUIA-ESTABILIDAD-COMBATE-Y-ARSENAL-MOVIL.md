<!-- docs/bugs/GUIA-ESTABILIDAD-COMBATE-Y-ARSENAL-MOVIL.md - Plan profesional para diagnosticar y corregir bloqueos, IA y rendimiento móvil. -->
# Guía de estabilidad de combate y Arsenal móvil

## Objetivo

Resolver cuatro reportes sin introducir parches específicos por oponente, dispositivo o carta:

1. Bloqueo atribuido al “nivel 8 con Jaku”.
2. Caídas de rendimiento al encadenar trampas y animaciones, sobre todo en móvil.
3. Uso inteligente de DEFENSA por parte de todos los oponentes.
4. Apertura fluida del detalle de carta en Arsenal móvil y persistencia del inspector al añadir o retirar.

La implementación debe conservar las reglas en `core/`, la orquestación en hooks/servicios y la presentación en componentes. Producción no se utilizará para reproducir ni validar estos bugs.

## Estado comprobado en el código actual

### 1. Bloqueo de Jaku en Arena, nivel 8

El reporte corresponde al modo `TRAINING`, nivel 8 de Arena. El ladder presenta los mismos ocho
oponentes en cada nivel y Jaku ocupa la tercera posición:

1. GenNvim.
2. Helena.
3. Jaku (`training-tier-3` / `opp-jaku`).

Por tanto, el caso exacto es nivel 8 con `tierWins = 2`; `resolveTrainingOpponentLoadout()` selecciona
a Jaku mediante ese número de victorias. La dificultad y el escalado proceden del tier 8, pero el deck
base de Jaku contiene fusiones, ejecuciones y cuatro trampas. Esta combinación hace prioritario revisar
acciones pendientes de fusión y decisiones de trampa durante el turno automático.

La implementación queda protegida por una regresión que simula 32 semillas con el loadout de Jaku
escalado al nivel 8. Además, una acción automática que pierda todos sus candidatos deja de repetir el
mismo estado: las fusiones vuelven a `SET` y las ejecuciones ordinarias sin objetivo se consumen.

### 2. Rendimiento de trampas y animaciones

Ya existe `useBoardPerformanceProfile()` y varios VFX desmontan su versión cara cuando `shouldReduceCombatEffects` es verdadero. Sin embargo, quedan costes simultáneos:

- Animaciones infinitas en entidades, glows y paneles.
- Varias capas SVG/Framer Motion durante combos.
- Efectos con `filter`, `blur` y `box-shadow`.
- Cambios de estado del combate que pueden volver a renderizar ramas no afectadas.

El problema debe medirse por combinación de eventos; optimizar una animación aislada no garantiza fluidez cuando se solapan trampas, daño, selección y banners.

### 3. Decisión universal de DEFENSA

La regla ya está implementada en `HeuristicOpponentStrategy.chooseModeChange()`:

- Si una entidad en ATAQUE perdería contra la mayor amenaza rival, intenta pasarla a DEFENSA.
- Se aplica a todos los perfiles, de `EASY` a `MYTHIC`.
- Existe un guard anti-oscilación para impedir cambios ATAQUE↔DEFENSA repetitivos.
- El commit histórico `b3760c8d` añadió la regresión para los seis perfiles.

Antes de modificarla hay que ejecutar sus tests y añadir el escenario exacto reportado: `DEF > ATK rival`, entidad apta para cambiar de modo y ausencia de `modeLock`. Si falla en juego pero no en la estrategia, el defecto estará en la orquestación de `runBattlePhaseStep`, no en la heurística.

### 4. Inspector móvil del Arsenal

Hay dos causas visibles que deben tratarse por separado:

- Apertura: el diálogo anima desde `scale: 0.2` y monta una carta completa; `HomeCardInspector` calcula su escala mediante `ResizeObserver`. Esa combinación puede provocar varios frames de layout y composición.
- Persistencia: `HomeCardInspectorDialog` llama actualmente a `onClose()` tras insertar y antes de retirar. El cierre no es accidental, está codificado.

La colección ya usa `HomeMiniCard` con `CardThumbnail`, por lo que el grid no debe volver a renderizar cartas completas.

## Decisión de arquitectura

### Opciones consideradas

#### Opción A: reducir duraciones y desactivar animaciones concretas en móvil

- Ventaja: cambio pequeño.
- Inconvenientes: no controla solapamientos, no reduce propagación de estado y reaparecerá con cada VFX nuevo.
- Decisión: descartada como solución principal.

#### Opción B: presupuesto de VFX, render granular y transiciones móviles estables

- Introducir una política central que limite qué efectos decorativos pueden coexistir según el perfil.
- Mantener siempre el feedback funcional: carta activada, objetivo, daño y resultado.
- Desmontar capas decorativas caras en perfil reducido.
- Evitar que un evento de una carta invalide todos los slots.
- Mantener montado el inspector durante mutaciones de deck.

- Ventaja: solución medible, extensible y testeable.
- Coste: requiere instrumentación y cambios coordinados en módulos pequeños.
- Decisión: opción elegida.

PixiJS no se introduce en este bugfix. Solo se evaluará si, después de optimizar DOM, estado y composición, el baseline móvil continúa fuera de objetivo.

## Plan de implementación

### Fase 0 — Reproducción determinista local

1. Aplicar Supabase local:

   ```powershell
   pnpm supabase:bootstrap:local
   pnpm supabase:env:apply
   pnpm dev
   ```

2. Crear la reproducción fija de Arena:
   - `mode = TRAINING`, `tier = 8`, `tierWins = 2`.
   - `opponentTemplateId = training-tier-3`, `opponentId = opp-jaku`.
   - Dificultad, escalado y variante de deck resueltos por el catálogo local.
   - Turno, fase y `pendingTurnAction`.
   - Últimos 20 eventos de `combatLog`.
   - Cartas activas y trampas implicadas.
3. Añadir un fixture local con el deck real de Jaku y ejecutar semillas deterministas que cubran:
   - preparación y activación de `exec-fusion-gemgpt` / `exec-fusion-kaclauli`;
   - selección de materiales de fusión;
   - activación y rechazo de sus trampas;
   - cambio de modo y transición a la siguiente fase.
4. Prohibir credenciales, IDs de usuario o tokens reales en fixtures y logs.

**Criterio de salida:** el bloqueo se reproduce con un test o una simulación local; si no se reproduce, se registra como “no confirmado”, no como solucionado.

### Fase 1 — Watchdog del turno rival sin alterar reglas

1. Instrumentar cada paso de `runMainPhaseStep` y `runBattlePhaseStep` con un identificador de transición.
2. Distinguir espera legítima de:
   - selección pendiente sin candidatos;
   - promesa de trampa no resuelta;
   - transición que devuelve el mismo estado;
   - animación que mantiene bloqueada la interacción.
3. Hacer que una acción pendiente imposible produzca un error de dominio tipado y un evento de `combatLog`.
4. No usar un timeout que salte silenciosamente la acción: el fallback debe ser determinista y quedar registrado.

**Tests:**

- Reproducción exacta del duelo reportado.
- Acción pendiente sin candidatos.
- Trampa reactiva aceptada, rechazada y expirada.
- El turno alcanza `END` sin bucle.

### Fase 2 — IA defensiva universal

1. Ejecutar primero la suite existente de `HeuristicOpponentStrategy`.
2. Añadir una matriz de casos para todas las dificultades:
   - `DEF propia > ATK rival` y `ATK propia < amenaza`: cambia a DEFENSA.
   - Puede ganar un intercambio: conserva ATAQUE.
   - `modeLock` impide el cambio.
   - Entidad recién invocada o que ya actuó: respeta reglas del motor.
3. Añadir integración en `runBattlePhaseStep` para verificar que la decisión se aplica antes del ataque.
4. Mantener la heurística en `core/services/opponent`; no duplicarla en React ni personalizarla para Jaku.

**Criterio de salida:** los seis perfiles producen la misma decisión básica cuando comparten el mismo estado legal.

### Fase 3 — Presupuesto de efectos del combate

1. Medir un combo representativo en build de producción con CPU 4x:

   ```powershell
   pnpm build
   pnpm start
   pnpm perf:baseline:mobile:auto:prod
   ```

2. Registrar por interacción:
   - FPS mínimo y frames largos.
   - INP.
   - renders de `Board`, slots y overlays.
   - número de nodos y animaciones simultáneas.
3. Crear un resolver puro de presupuesto visual:
   - `FULL`: feedback funcional y decoración completa.
   - `BALANCED`: una decoración principal por evento.
   - `REDUCED`: solo feedback funcional barato.
4. En móvil, desmontar efectos decorativos secundarios al solaparse; no ocultarlos solo mediante CSS.
5. Sustituir animaciones de `filter`, blur o sombras expansivas por `transform`, opacidad o gradientes estáticos.
6. Pasar a cada slot únicamente flags propios (`isTrapActivating`, `isAttacking`, `isTargeted`) y estabilizar callbacks.
7. Memoizar componentes con comparadores por contenido y tests puros.

**Objetivos mínimos:**

- Ningún frame largo superior a 100 ms durante el combo de referencia.
- INP inferior a 200 ms con CPU 4x.
- Solo los slots afectados se vuelven a renderizar.
- Aspecto idéntico en perfil `FULL`.

### Fase 4 — Inspector móvil fluido y persistente

1. Separar selección, apertura y mutación:
   - Seleccionar una carta abre el inspector.
   - Insertar o retirar actualiza deck, contadores y acciones sin cerrar.
   - Cerrar queda reservado al botón, backdrop, navegación o evolución cinematográfica.
2. Eliminar `onClose()` de los flujos exitosos de insertar y retirar.
3. Mantener el `selectedCardId` estable durante la actualización optimista y reconciliarlo con la respuesta.
4. Si la última copia desaparece de una fuente, conservar el detalle usando el catálogo local y actualizar `selectedCardSource`.
5. Sustituir la entrada desde `scale: 0.2` por una transición de `opacity + translateY` o una escala cercana a 1, solo con `transform`.
6. Calcular el tamaño inicial del inspector con CSS; reservar `ResizeObserver` para cambios reales de viewport y evitar `setState` si la escala no cambia.
7. Memoizar el cuerpo de detalle para que cambios de botones o estado pending no reconstruyan la carta completa.

**Tests de componente:**

- Pulsar una miniatura abre un único inspector.
- Añadir no cierra el inspector y actualiza las acciones.
- Retirar no cierra el inspector y actualiza origen/copias.
- Doble pulsación durante pending no duplica la petición.
- Error mantiene el inspector abierto y presenta feedback accesible.
- Cierre por botón y backdrop sigue funcionando.

## Orden recomendado de PR

1. **PR A — Arena 8 contra Jaku:** fixture determinista, instrumentación y regresión del turno.
2. **PR B — IA defensiva:** verificación de la regla existente e integración en fase de batalla.
3. **PR C — Arsenal móvil:** persistencia del inspector y reducción de layout/composición.
4. **PR D — Rendimiento de combate:** baseline, presupuesto VFX y render granular.

Separar los PR evita mezclar reglas de dominio con optimizaciones visuales y permite revertir cada cambio de forma independiente.

## Quality gates

Cada PR debe cumplir:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Además:

- Tests co-localizados y TDD.
- Ningún `any`.
- Ningún archivo de hook, servicio o componente por encima de 150 líneas.
- Cabecera de ruta y comentarios de intención en español.
- Baseline móvil antes/después adjunto al PR de rendimiento.
- Validación funcional exclusivamente contra Supabase local.
- Sin secretos, datos personales ni logs de producción en documentación o fixtures.

## Resultado implementado

- Arena 8/Jaku: fixture real (`tier = 8`, `tierWins = 2`) y 32 simulaciones sin `STUCK`.
- Turno rival: recuperación determinista de acciones pendientes sin candidato.
- IA: test de integración confirma que incluso `EASY` aplica el repliegue antes de terminar `BATTLE`.
- Arsenal móvil: añadir y retirar conservan el inspector; errores también mantienen el contexto.
- Apertura móvil: transición corta cercana a escala real y `ResizeObserver` sin actualizaciones subpíxel.
- Combate móvil: presupuesto `FULL / BALANCED / REDUCED`; el nivel reducido desmonta beam y carga de
  trampas, pero mantiene etiqueta funcional y sonido.
