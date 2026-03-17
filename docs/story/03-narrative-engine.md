<!-- docs/story/03-narrative-engine.md - Describe el motor narrativo de briefing por capítulo para contextualizar el mapa Story. -->
# Story Narrative Engine

## Objetivo

Aportar contexto narrativo dinámico por capítulo sin acoplar texto a componentes UI.

## Implementación

1. Servicio: `src/services/story/build-story-chapter-briefing.ts`.
2. Contrato: `IStoryChapterBriefing`.
3. Panel UI: `src/components/hub/story/internal/StoryBriefingPanel.tsx`.
4. Integración: `app/hub/story/page.tsx` calcula capítulo desbloqueado máximo y resuelve briefing.

## Regla de evolución

Los capítulos nuevos deben añadirse en el servicio, manteniendo fallback para capítulos no definidos.
