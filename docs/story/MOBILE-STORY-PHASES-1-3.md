<!-- docs/story/MOBILE-STORY-PHASES-1-3.md - Plan ejecutable de fases 1-3 para versión móvil de Story sin romper desktop. -->
# Story Mobile - Fases 1 a 3

## Objetivo

Preparar la base técnica para modo móvil de Story sin tocar la experiencia desktop actual (layout, flujo, lógica y comportamiento).

## Alcance estricto

1. Desktop queda congelado: no se cambian UX ni reglas actuales.
2. Mobile tendrá shell visual propia (sidebar desplegable), reutilizando exactamente la lógica/motor de Story.
3. No se modifica dominio (`core/services/story/world`) ni contratos de persistencia.

## Fase 1 - Contexto y Memoria (Engram)

### Tareas

1. Recuperar contexto previo con:
   - `engram context`
   - `engram search "story mobile sidebar"`
   - `engram search "act2 event core flujo"`
2. Registrar decisión de arranque:
   - Desktop frozen.
   - Mobile como capa de presentación.
3. Registrar hallazgos de riesgos (animación, cámara, drawer, accesibilidad).

### Criterio de salida

1. Existe evidencia de consulta de memoria.
2. Existe memoria guardada de decisión con `topic` de arquitectura Story.

## Fase 2 - Criterios de Aceptación (Definition of Done)

### Funcionales

1. En desktop, `StoryScene` se comporta exactamente igual que hoy.
2. En mobile, el panel lateral es desplegable (`sheet/drawer`) y no bloquea mapa permanentemente.
3. El mapa móvil mantiene:
   - mismo motor de movimiento,
   - mismos desbloqueos,
   - mismas transiciones y efectos,
   - mismo resultado de acciones.

### UX

1. Mapa en mobile con lectura de flujo vertical (abajo -> arriba) sin alterar coordenadas de dominio.
2. CTA de acción sigue siendo único (`smart action`) también en mobile.
3. Estado del panel accesible: abrir/cerrar por botón, backdrop y escape.

### Calidad

1. `pnpm lint`, `pnpm test`, `pnpm build` en verde.
2. Sin archivos nuevos > 150 líneas (salvo excepción justificada).
3. Sin introducir lógica de negocio en componentes.

## Fase 3 - Arquitectura UI (Preparación)

### Decisión de diseño

1. Separar orquestación (estado/acciones) de presentación responsive:
   - `StoryScene` mantiene orquestación.
   - `StorySceneDesktopLayout` renderiza desktop.
   - `StorySceneMobileLayout` renderiza mobile.
2. Ambos layouts consumen el mismo contrato de props/view-model.
3. El motor no se bifurca por plataforma.

### Estructura objetivo (sin cambiar dominio)

```text
src/components/hub/story/
  StoryScene.tsx                       # orquestación compartida
  internal/scene/view/
    StorySceneDesktopLayout.tsx        # desktop-only presentation
    StorySceneMobileLayout.tsx         # mobile-only presentation
    StoryMobileSidebarSheet.tsx        # panel desplegable mobile
```

### Riesgos y mitigación

1. Riesgo: divergencia funcional desktop/mobile.
   - Mitigación: contrato de props único y tests de interacción compartidos.
2. Riesgo: regressión de animaciones.
   - Mitigación: no reimplementar acciones; reutilizar callbacks actuales.
3. Riesgo: ruptura del flujo por viewport.
   - Mitigación: cambios en capa visual/cámara, no en grafo ni traversal.

### Criterio de salida

1. Diseño arquitectónico acordado y documentado.
2. Lista de módulos objetivo definida.
3. Ready para fase de implementación mobile (Fase 4+).

## Checklist rápido

1. Memoria Engram consultada y guardada.
2. Criterios de aceptación cerrados.
3. Arquitectura responsive definida sin tocar lógica de dominio.
