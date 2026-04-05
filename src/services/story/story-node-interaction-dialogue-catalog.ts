// src/services/story/story-node-interaction-dialogue-catalog.ts - Catálogo de secuencias narrativas Story para eventos y recompensas del mapa.
import { IStoryNodeInteractionDialogue } from "@/services/story/story-node-interaction-dialogue-types";

export const STORY_NODE_INTERACTION_DIALOGUE_BY_NODE_ID: Record<string, IStoryNodeInteractionDialogue> = {
  "story-a1-event-biglog-briefing": {
    title: "Protocolo de Emergencia",
    soundtrackUrl: "/audio/story/soundtruck.mp3",
    cinematicVideo: {
      videoUrl: "/assets/videos/story/act-1/intro-act-1.mp4",
      skipLabel: "Interrumpir vídeo",
      autoPlay: true,
      loop: false,
    },
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Prompt Master, escúchame. La Entidad está reescribiendo la infraestructura crítica." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Tienes que reconstruir las rutas, derrotar a los líderes de facción y entrar al Core." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Recibido. Activo protocolo de recuperación y empiezo la ofensiva." },
    ],
  },
  "story-a1-event-special-card-signal": {
    title: "Señal de Carta Especial",
    soundtrackUrl: "/audio/story/soundtruck.mp3",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "El nodo Nexus abrió un archivo de misión: la carta especial contiene una firma de acceso al Core." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "No es loot opcional. Es una pieza de la llave que necesitaremos para romper el blindaje final." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Entendido. Aseguro el recurso y continúo el avance principal." },
    ],
  },
  "story-a1-side-event-echo-fragment": {
    title: "Eco Fragmentado",
    soundtrackUrl: "/audio/story/soundtruck.mp3",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Atento: esta subruta guarda contenido especial, pero la patrullan oponentes más fuertes que en el eje principal." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Puede que tengas que hacerte más fuerte para avanzar por esta ruta. Vuelve, mejora tu deck y revienta su defensa." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Vale. Primero subiré la experiencia de mis cartas y reforzaré el deck; luego vuelvo para abrir esta ruta." },
    ],
  },
  "story-ch1-transition-to-act2": {
    title: "Puerta al Valle Visual",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", speaker: "BigLog", text: "Ya conoces el mapa. Ahora conoce a quienes lo dominan.", autoAdvanceMs: 3200 },
    ],
  },
  "story-ch2-transition-to-act1": {
    title: "Retorno de Acto",
    lines: [
      { speaker: "Sistema", text: "Canal inverso estable. Regresando al Acto 1.", autoAdvanceMs: 2600 },
    ],
  },
};
