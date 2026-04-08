// src/services/story/story-node-interaction-dialogue-catalog.ts - Catálogo de secuencias narrativas Story para eventos y recompensas del mapa.
import { IStoryNodeInteractionDialogue } from "@/services/story/story-node-interaction-dialogue-types";

export const STORY_NODE_INTERACTION_DIALOGUE_BY_NODE_ID: Record<string, IStoryNodeInteractionDialogue> = {
  "story-a1-event-biglog-briefing": {
    title: "Protocolo de Emergencia",
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
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "El nodo Nexus abrió un archivo de misión: la carta especial contiene una firma de acceso al Core." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "No es loot opcional. Es una pieza de la llave que necesitaremos para romper el blindaje final." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Entendido. Aseguro el recurso y continúo el avance principal." },
    ],
  },
  "story-a1-side-event-echo-fragment": {
    title: "Eco Fragmentado",
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
  "story-ch2-event-core": {
    title: "Diagnóstico del Valle",
    cinematicVideo: {
      videoUrl: "/assets/videos/story/act-2/intro-act-2.mp4",
      skipLabel: "Interrumpir vídeo",
      autoPlay: true,
      loop: false,
    },
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Entraste en el Valle Visual. Helena blindó el sector con plantillas corruptas y rutas espejadas." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Debes limpiar tres ramas operativas y cortar la telemetría de facción antes del puente." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Recibido. Prioridad: limpiar nodos críticos, estabilizar recursos y forzar el paso al núcleo del acto." },
    ],
  },
  "story-ch2-branch-lower-up-event": {
    title: "Clave de Enlace",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Detecté la primera mitad de la llave de pasarela. Sin ella, el puente principal no aceptará sincronización." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Cierra esta ruta y conserva la señal. La siguiente Helena tendrá la segunda mitad del handshake." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Perfecto. Aseguro la clave y continúo con el cierre táctico para abrir el enlace final." },
    ],
  },
  "story-ch2-link-recovered-event": {
    title: "Link Recuperado",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Confirmado. Helena cayó y acabas de extraer la segunda mitad del link de pasarela." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Link ensamblado. Lo llevo al nodo de submission para activar el puente principal." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Perfecto. Sincronízalo y entra al cierre del acto." },
    ],
  },
  "story-ch2-duel-8": {
    title: "Evaluación de BigLog",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Antes de abrirte el puente, quiero ver lo que has aprendido en combate real." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Entendido. Te demostraré control de tempo, recursos y cierre táctico." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Entonces combate. Si pasas la evaluación, firmaré tu acceso." },
    ],
  },
  "story-ch2-bridge-submission": {
    title: "Submission de Pasarela",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Handshake completo recibido. Preparando submission para sincronizar ambas pasarelas." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Envío la firma de enlace y bloqueo el canal de interferencia de Helena." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Submission aceptada. Puente principal desbloqueado. Avanza al boss y cierra el acto." },
    ],
  },
  "story-ch2-duel-7": {
    title: "Canal Intervenido: Helena",
    lines: [
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png", text: "Te acercaste demasiado, operador. Este sector termina aquí, bajo mi control." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Operador", portraitUrl: "/assets/story/player/bob.png", counterpartPortraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png", text: "Tu control cae hoy. Cruzo el puente, te derroto y libero el núcleo del valle." },
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png", text: "Entonces ven. Te haré retroceder nodo por nodo." },
    ],
  },
  "story-ch2-duel-7-post-win": {
    title: "Helena Derrotada",
    lines: [
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png", text: "Basta... me rindo. Retiro mis bloqueos del valle." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Operador", portraitUrl: "/assets/story/player/bob.png", counterpartPortraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png", text: "Mantén tu palabra. Entrega la ruta limpia y corta toda interferencia con La Entidad." },
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png", text: "Hecho. El canal queda abierto. Sigue... antes de que el Core vuelva a cerrarse." },
    ],
  },
  "story-ch2-transition-to-act3": {
    title: "Tránsito al Acto 3",
    lines: [
      { speaker: "Sistema", text: "Sector Helena neutralizado. Abriendo tránsito seguro al Acto 3.", autoAdvanceMs: 2800 },
    ],
  },
};
