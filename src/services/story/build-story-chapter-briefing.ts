// src/services/story/build-story-chapter-briefing.ts - Construye briefing narrativo por capítulo Story para contextualizar el mapa.
export interface IStoryChapterBriefing {
  chapter: number;
  arcTitle: string;
  objective: string;
  tension: string;
}

const STORY_CHAPTER_BRIEFINGS: Record<number, IStoryChapterBriefing> = {
  1: {
    chapter: 1,
    arcTitle: "Acto 1 · Borde Exterior",
    objective: "Rastrear anomalías y limpiar nodos corruptos del Sector Alpha.",
    tension: "Las facciones menores sospechan de tu presencia y bloquean rutas críticas.",
  },
  2: {
    chapter: 2,
    arcTitle: "Acto 2 · Guerra de Facciones",
    objective: "Derrotar líderes de facción y reunir las Root Keys de acceso.",
    tension: "Big Tech y Open Source escalan el conflicto mientras la Entidad se expande.",
  },
  3: {
    chapter: 3,
    arcTitle: "Acto 3 · Descenso a Deep Net",
    objective: "Entrar en el núcleo inestable y contener nodos con reglas alteradas.",
    tension: "El mapa muta en tiempo real; cada decisión puede cerrar rutas de salida.",
  },
};

/**
 * Entrega contexto narrativo estable para el capítulo activo del jugador.
 */
export function buildStoryChapterBriefing(chapter: number): IStoryChapterBriefing {
  return (
    STORY_CHAPTER_BRIEFINGS[chapter] ?? {
      chapter,
      arcTitle: `Acto avanzado · Capítulo ${chapter}`,
      objective: "Explorar nuevos nodos y consolidar progreso contra la Entidad.",
      tension: "La red está fragmentada y las rutas son impredecibles.",
    }
  );
}
