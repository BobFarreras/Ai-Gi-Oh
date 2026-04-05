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
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", speaker: "BigLog", text: "Operador, no estás tarde. Estás justo antes del colapso." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", speaker: "BigLog", text: "La Entidad no destruye nodos. Los reprograma para convertirlos en zonas hostiles." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", speaker: "Operador", text: "Entendido. Avanzaré por rutas estables y aseguraré recursos antes de cada combate." },
    ],
  },
  "story-a1-event-special-card-signal": {
    title: "Señal de Carta Especial",
    soundtrackUrl: "/audio/story/soundtruck.mp3",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", speaker: "BigLog", text: "Registro oculto detectado. Hay una carta táctica en la rama lateral." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", speaker: "BigLog", text: "Si fallas en esa ruta, quedará pendiente hasta que regreses con mejor mazo." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", speaker: "Operador", text: "Haré el intento cuando la presión principal esté controlada." },
    ],
  },
  "story-a1-side-event-echo-fragment": {
    title: "Eco Fragmentado",
    soundtrackUrl: "/audio/story/soundtruck.mp3",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", speaker: "BigLog", text: "Esta rama tiene ruido corrupto y oponentes de respuesta agresiva." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", speaker: "Operador", text: "Entro, limpio el nodo y vuelvo al eje principal." },
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
