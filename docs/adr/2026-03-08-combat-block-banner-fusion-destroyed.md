<!-- docs/adr/2026-03-08-combat-block-banner-fusion-destroyed.md - ADR de fase 0 para banners, fusión con deck dedicado y pila de destrucción. -->
# ADR: Bloque Combate - Fase 0 (Banners, Fusion Deck y Destroyed Pile)

## Contexto

Se necesita preparar un nuevo bloque de mejoras de combate sin introducir deuda técnica:

1. Evitar cola de banners atrasados cuando el jugador actúa muy rápido.
2. Endurecer reglas de fusión con carta final preseleccionada en deck dedicado.
3. Garantizar deck válido (20 cartas) antes de salir de Arsenal.
4. Añadir una nueva zona de descarte permanente (`destroyedPile`) separada del cementerio.

## Decisiones

### 1) Política de banners en ráfaga de eventos

1. El sistema de banner del tablero trabajará con política `latest-wins` para eventos transitorios.
2. Si entran múltiples eventos en cola en ventana corta, se descartarán intermedios y se mostrará el más reciente.
3. Se mantienen excepciones para banners críticos (errores bloqueantes o resultado de duelo), que no se descartan.

### 2) Fusión con `fusionDeck` dedicado

1. La invocación de fusión requerirá siempre:
   - carta mágica de fusión,
   - 2 materiales válidos en campo,
   - carta final presente en `fusionDeck`.
2. Si falta la carta final en `fusionDeck`, la resolución se cancela con error de dominio y mensaje claro en UI.
3. Ubicación visual acordada:
   - **Arsenal/Home**: bloque de `fusionDeck` debajo del contenedor principal del deck.
   - **Combate**: `fusionDeck` visible en UI del tablero, al lado del bloque de deck/cementerio.

### 3) Guarda dura de salida de Arsenal

1. Si el deck principal no tiene exactamente 20 cartas, el usuario no podrá salir del módulo.
2. La guarda mostrará diálogo de error explicativo (motivo + acción recomendada).
3. Esta validación se aplicará en UI y se reforzará en capa de aplicación para evitar bypass cliente.

### 4) Nueva zona `destroyedPile`

1. Se introduce `destroyedPile` por jugador, separada de `graveyard`.
2. Regla funcional:
   - `graveyard`: cartas descartadas/destruidas normales recuperables por efectos.
   - `destroyedPile`: cartas removidas permanentemente (no recuperables salvo efecto explícito futuro).
3. Se extenderán eventos del `combatLog` para distinguir destino (`GRAVEYARD` vs `DESTROYED_PILE`).

## Consecuencias

1. Menos ruido visual y mejor percepción de control en partidas rápidas.
2. Fusión más robusta y sin estados inconsistentes por recetas incompletas.
3. Mayor seguridad de integridad del deck antes de entrar en duelo.
4. Base sólida para futuras mecánicas de exilio, reciclaje selectivo y fusiones desde cementerio.

## Alcance de esta fase

1. Esta ADR define contratos y arquitectura (sin cambios funcionales completos aún).
2. Las fases siguientes implementarán motor, UI, persistencia y pruebas de regresión.
