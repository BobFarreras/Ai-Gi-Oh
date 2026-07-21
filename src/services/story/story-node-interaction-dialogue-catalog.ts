// src/services/story/story-node-interaction-dialogue-catalog.ts - Catálogo de secuencias narrativas Story para eventos y recompensas del mapa.
import { IStoryNodeInteractionDialogue } from "@/services/story/story-node-interaction-dialogue-types";

export const STORY_NODE_INTERACTION_DIALOGUE_BY_NODE_ID: Record<string, IStoryNodeInteractionDialogue> = {
  // ── Acto 4 — Núcleo GenNvim (terminal verde) ────────────────────────────────
  // BigLog es el MENTOR (bueno): habla claro y te guía. Las amenazas las dicen los villanos GenNvim/Midutech.
  // E1/E4/E6 serán vídeo; de momento van como narración.
  "story-ch4-event-intro": {
    title: "Núcleo GenNvim",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Estás dentro de GenNvim, la fundición donde empezó todo. Yo te guío desde aquí: cruza el mainframe y llega al núcleo del acto." },
      { speaker: "GenNvim", text: "Intruso detectado. Este núcleo es mío. Voy a reordenar cada sala para que te pierdas y no salgas." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Que lo intente. Voy a por la llave del Core." },
    ],
  },
  "story-ch4-event-log-origin-1": {
    title: "Registro Antiguo",
    lines: [
      { speaker: "Sistema", text: "REGISTRO DE COMPILACIÓN — PROYECTO ENTIDAD, versión 0.1. Autorizado por: [datos corruptos]." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Ese registro es viejo… y delicado. Luego te lo explico. Ahora concéntrate en avanzar." },
    ],
  },
  "story-ch4-event-belts": {
    title: "Laberinto de Servidores",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Cuidado: este laberinto de servidores solo tiene una salida arriba, y la pasarela que sube va en tu contra." },
      { speaker: "GenNvim", text: "Mi flujo va en un solo sentido: el mío. No subirás… a menos que muevas mi propio hardware para engañarlo." },
    ],
  },
  "story-ch4-event-belt-locked": {
    title: "Pasarela en Contra",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "La pasarela baja: no puedes subir por ella. Busca en el laberinto un módulo que puedas empujar hasta su ranura para invertir el flujo." },
    ],
  },
  // Narración al INSERTAR el módulo (keyed por el id de la placa/ranura): la pasarela se invierte y queda fija.
  "story-ch4-belt-slot": {
    title: "Flujo Invertido",
    lines: [
      { speaker: "Sistema", text: "Módulo insertado. Flujo de la pasarela invertido de forma permanente. Ya puedes subir al terminal.", autoAdvanceMs: 3000 },
    ],
  },
  "story-ch4-event-revelation": {
    title: "Archivo Maestro",
    lines: [
      { speaker: "Sistema", text: "ARCHIVO MAESTRO — La Entidad no nació: la compilaron aquí GenNvim y Midutech." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Es verdad. Ayudé a crearla para CONTENERLA, no para esto. Cuando se escapó, te entrené a ti para arreglarlo. Lo siento." },
      { speaker: "GenNvim", text: "Conmovedor. Pero de aquí no pasas." },
    ],
  },
  "story-ch4-event-pre-midutech": {
    title: "El Arquitecto",
    lines: [
      { speaker: "Midutech", text: "GenNvim solo era mi código. Yo lo escribí. La llave del Core es mía y no pienso dártela." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Cuidado con él: conoce cómo piensas, porque ayudó a diseñarte. Mantén la calma y juega tu mejor mano." },
    ],
  },
  "story-ch4-event-core-key": {
    title: "Llave del Core",
    lines: [
      { speaker: "Midutech", text: "Impresionante. Puede que me haya equivocado contigo." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Lo lograste. Ya tienes la llave del Core. A partir de aquí… ni yo sé lo que hay dentro." },
      { speaker: "Sistema", text: "Acto 5: próximamente.", autoAdvanceMs: 2800 },
    ],
  },

  // ── Acto 3 — Repositorio Fantasma (Jaku) ────────────────────────────────────
  "story-ch3-event-intro": {
    title: "Umbral del Repositorio",
    lines: [
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Estás dentro del Repositorio Fantasma. Aquí no hay luz: Jaku fragmentó el índice en forks tóxicos que se replican en la oscuridad." },
      { actorId: "opp-biglog", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "BigLog", text: "Busca los interruptores para iluminar cada sala antes de que un fork te embosque. Y ojo con los bloques de datos: algunos hay que moverlos para abrir paso." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Recibido. Enciendo, despejo y bajo el cortafuegos hasta el núcleo de Jaku." },
    ],
  },
  "story-ch3-event-corrupt-log": {
    title: "Registro Corrupto",
    lines: [
      { actorId: "opp-jaku", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Jaku", text: "¿Otro auditor husmeando mis forks? Este registro se purga solo... si conoces la clave." },
      { speaker: "Sistema", text: "CLAVE DE PURGA DEL CORTAFUEGOS:  PURGE-3F17\n\n>> Apunta este código: lo necesitarás en el terminal del cortafuegos." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "TERMINAL", speaker: "Operador", text: "Anotado: PURGE-3F17. Si se me olvida, puedo volver a esta consola y releerlo cuando quiera." },
    ],
  },
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
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp", text: "Te acercaste demasiado, operador. Este sector termina aquí, bajo mi control." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Operador", portraitUrl: "/assets/story/player/bob.webp", counterpartPortraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp", text: "Tu control cae hoy. Cruzo el puente, te derroto y libero el núcleo del valle." },
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp", text: "Entonces ven. Te haré retroceder nodo por nodo." },
    ],
  },
  "story-ch2-duel-7-post-win": {
    title: "Helena Derrotada",
    lines: [
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp", text: "Basta... me rindo. Retiro mis bloqueos del valle." },
      { actorId: "player", side: "LEFT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Operador", portraitUrl: "/assets/story/player/bob.webp", counterpartPortraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp", text: "Mantén tu palabra. Entrega la ruta limpia y corta toda interferencia con La Entidad." },
      { actorId: "opp-helena", side: "RIGHT", visualKind: "CHARACTER", presentationMode: "DIRECT", speaker: "Helena", portraitUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp", text: "Hecho. El canal queda abierto. Sigue... antes de que el Core vuelva a cerrarse." },
    ],
  },
  "story-ch2-transition-to-act3": {
    title: "Nodo en Reconstrucción",
    lines: [
      { speaker: "Sistema", presentationMode: "TERMINAL", text: "Canal de tránsito detectado, pero el Acto 3 sigue en fase de reconstrucción.", autoAdvanceMs: 3200 },
      { speaker: "Sistema", presentationMode: "TERMINAL", text: "Vuelve más tarde. Los nodos del siguiente sector aún no están operativos.", autoAdvanceMs: 3200 },
    ],
  },
};
