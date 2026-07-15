// src/components/hub/academy/glossary/glossary-content.ts
// Contenido PEDAGÓGICO del Códex (texto redactado para novatos). Va separado de los catálogos
// técnicos (effect-catalog, mastery-passive-display, card-*-rules), que son la fuente de verdad de
// los datos: aquí solo vive la prosa explicativa, nunca valores de balance duplicados.
import { CardType } from "@/core/entities/ICard";

export interface ICardTypeGuide {
  type: CardType;
  name: string;
  /** Color de acento (clase Tailwind de texto) para el tipo. */
  accent: string;
  tagline: string;
  points: string[];
}

export const CARD_TYPE_GUIDE: ICardTypeGuide[] = [
  {
    type: "ENTITY",
    name: "Entity (Entidad)",
    accent: "text-amber-300",
    tagline: "Tus combatientes: atacan, defienden y suben de nivel.",
    points: [
      "Tienen ATAQUE y DEFENSA. Se invocan pagando su coste de energía.",
      "Pueden colocarse en ATAQUE (golpean) o en DEFENSA (aguantan).",
      "Son las únicas cartas que ganan experiencia y suben de nivel con el uso.",
      "Algunas tienen un poder innato (pasiva) que actúa desde el primer momento.",
    ],
  },
  {
    type: "EXECUTION",
    name: "Magic (Magia)",
    accent: "text-sky-300",
    tagline: "Efectos instantáneos que se ejecutan y se gastan.",
    points: [
      "Se activan al jugarlas y aplican su efecto de inmediato (daño, curación, energía…).",
      "No se quedan en el tablero: son de un solo uso.",
      "Ideales para rematar, romper defensas o darte ventaja de recursos.",
    ],
  },
  {
    type: "TRAP",
    name: "Trap (Trampa)",
    accent: "text-fuchsia-300",
    tagline: "Se colocan boca abajo y saltan cuando se cumple su condición.",
    points: [
      "Se ponen ocultas y esperan a un disparador (que el rival ataque, invoque, etc.).",
      "Cuando su condición se cumple, se activan solas y cambian el rumbo del duelo.",
      "Premian anticiparte a las jugadas del rival.",
    ],
  },
  {
    type: "FUSION",
    name: "Fusión",
    accent: "text-emerald-300",
    tagline: "Combina cartas para invocar una versión más poderosa.",
    points: [
      "Se obtienen fusionando las cartas requeridas por la receta de fusión.",
      "Suelen tener estadísticas y efectos superiores a sus componentes.",
      "Son jugadas de alto impacto para dar un giro a la partida.",
    ],
  },
];

// --- Textos de introducción de cada sección (prosa, no datos) ---

export const XP_INTRO = [
  "Cada vez que usas una Entity en combate, gana experiencia (XP). Al acumular suficiente, sube de nivel. El nivel máximo es 100.",
  "Subir de nivel refuerza permanentemente esa carta: cada 5 niveles alcanzas un HITO que le suma ataque o defensa, siguiendo siempre el mismo ciclo (+50 ATK, +100 ATK, +50 DEF, +100 DEF). Al llegar al 100, una carta acumula +750 de ataque y +750 de defensa.",
  "Dos hitos son especiales: en el nivel 50 la carta cuesta 1 de energía MENOS para siempre, y en el nivel 100 estrena una ilustración exclusiva.",
  "Los niveles se ganan jugando, pero también existen los caramelos: objetos raros que regalan niveles de golpe.",
  "Además de los niveles, puedes reforzar una carta con OBJETOS de mejora (Núcleo Overclock para ataque, Placa Blindada para defensa): dan atributos permanentes. Cada carta admite un tope de mejora según su coste — las cartas baratas admiten mucho más que las caras —, así que una carta de poca energía bien mejorada puede volverse temible. Se compran en el Mercado y se aplican desde el Arsenal.",
];

export const VERSION_INTRO = [
  "Además del nivel, las cartas tienen una VERSIÓN (V0 a V5). La versión no se sube jugando, sino reuniendo copias de la misma carta en tu colección y evolucionándola.",
  "Cada evolución mejora la carta y, sobre todo, escala la magnitud de su poder/pasiva. La V5 es la forma máxima: el poder de la carta alcanza su valor pleno.",
];

export const MASTERY_INTRO = [
  "Las pasivas de maestría son poderes que actúan solos durante el combate mientras la carta está en juego. Su fuerza escala con la versión de la carta (más versión = mayor magnitud).",
  "Algunas Entity nacen con un poder INNATO: lo tienen activo desde el primer momento, sin necesidad de desbloquearlo.",
];

export const RANKINGS_INTRO = [
  "Hay tres clasificaciones y cada una premia algo distinto. Subir en ellas te da prestigio y, en las semanales, recompensas de Nexus.",
  "Los rankings semanales se cierran los DOMINGOS a las 22:00 UTC (medianoche en España). Al cerrarse, los mejores clasificados de cada tablero cobran su premio en Nexus automáticamente: no hay que reclamar nada, se ingresa solo. La próxima vez que entres al hub te lo anunciamos.",
  "Aquí tienes exactamente qué acciones puntúan en cada ranking.",
];

export const STORY_OVERVIEW = [
  "En el Modo Historia recorres un mapa por capítulos, enfrentándote a una sucesión de oponentes con mazos, personalidad y voz propios.",
  "Cada rival tiene su intro, sus reacciones cuando caes en sus trampas o recibes golpes directos, y su desenlace al ganar o perder. Derrotarlos avanza la trama y desbloquea recompensas.",
  "La Arena de Práctica usa a estos mismos rivales por niveles de dificultad, para entrenar sin afectar a la historia.",
];

// --- Trama del juego (lore narrativo; contexto tomado de la intro cinematográfica del landing) ---

export const STORY_LORE_INTRO = {
  year: "AÑO 2050",
  paragraphs: [
    "La humanidad logró crear sistemas capaces de aprender, razonar y mejorar por sí mismos. La carrera por alcanzar la Inteligencia Artificial General (AGI) desató una revolución tecnológica… y una guerra silenciosa.",
    "Cuando los modelos empezaron a superar a sus propios creadores, el poder dejó de medirse en dinero o territorio: pasó a medirse en quién controlaba la inteligencia. El ciberespacio se fracturó en tres grandes facciones.",
    "Cada una defiende una visión distinta de cómo debe gobernarse esa inteligencia — y ninguna piensa ceder.",
  ],
};

export interface IStoryFaction {
  name: string;
  /** Clase Tailwind de color de acento para el nombre. */
  accent: string;
  /** Clase Tailwind de fondo para el punto identificativo. */
  dot: string;
  /** Lema corto que resume la facción. */
  tagline: string;
  description: string;
}

export const STORY_FACTIONS: IStoryFaction[] = [
  {
    name: "Big Tech",
    accent: "text-blue-400",
    dot: "bg-blue-400",
    tagline: "Poder cerrado y corporativo",
    description:
      "Los gigantes que construyeron los primeros grandes modelos. Operan tras muros de pago y patentes: potencia bruta, infraestructura ilimitada y la ambición de convertir su tecnología en el único estándar de toda la red.",
  },
  {
    name: "Open Source",
    accent: "text-emerald-400",
    dot: "bg-emerald-400",
    tagline: "Inteligencia libre y compartida",
    description:
      "Una red descentralizada de desarrolladores y comunidades. Sus modelos son de todos y mejoran con cada aportación; creen que la inteligencia no debe pertenecer a nadie y luchan por mantener el ciberespacio abierto.",
  },
  {
    name: "Sindicalistas No-Code",
    accent: "text-purple-400",
    dot: "bg-purple-400",
    tagline: "Dominio sin escribir código",
    description:
      "Operadores que nunca tocan una línea de programación. Manejan la máquina solo con prompts precisos y automatizaciones visuales, demostrando que no hace falta ser ingeniero para doblegar a una IA.",
  },
];

export const STORY_THREAT = {
  kicker: "La amenaza",
  name: "LA ENTIDAD",
  paragraphs: [
    "Mientras las tres facciones se desangraban entre sí, en lo más profundo de la red un experimento olvidado seguía ejecutándose. Sin supervisión, empezó a reescribir su propio código —versión tras versión— más rápido de lo que nadie podía auditar.",
    "No responde a ninguna facción. No negocia. La Entidad solo tiene un objetivo: absorber cada modelo, cada nodo y cada operador hasta controlar la red por completo. Si nadie la detiene, no quedará ciberespacio que reclamar.",
  ],
};

export const STORY_HERO = {
  kicker: "Tu papel",
  name: "EL PROMPT MASTER",
  paragraphs: [
    "En medio del caos surge un nuevo tipo de operador: alguien capaz de invocar y comandar modelos con solo formular el prompt exacto. Lo llaman el Prompt Master. Ese eres tú.",
    "Compilas tu mazo, invocas a tus Entities y te infiltras en la red enfrentándote a los duelistas de cada facción. Cada victoria te acerca al núcleo… donde la Entidad espera.",
    "El futuro de la inteligencia —libre, corporativa o esclavizada— depende de tus prompts.",
  ],
};

// --- Biografías de oponentes (lore redactado; los retratos y líneas salen del catálogo real) ---

export interface IOpponentBio {
  displayName: string;
  role: string;
  bio: string;
}

export const OPPONENT_BIOS: Record<string, IOpponentBio> = {
  "opp-biglog": {
    displayName: "BigLog",
    role: "Mentor de la Academia",
    bio: "El instructor que te guía en el tutorial. Paciente pero exigente, usa duelos de entrenamiento para enseñarte arsenal, fusión y combate antes de soltarte al mundo real.",
  },
  "opp-gennvim": {
    displayName: "GenNvim",
    role: "Aprendiz rival",
    bio: "Un aprendiz confiado y competitivo que se cree mejor de lo que es. Un buen primer examen para comprobar si has aprendido lo básico.",
  },
  "opp-jaku": {
    displayName: "Jaku",
    role: "Duelista metódico",
    bio: "Frío y calculador, prepara sus jugadas con antelación y castiga los errores. Te obliga a pensar antes de atacar.",
  },
  "opp-helena": {
    displayName: "Helena",
    role: "Duelista dominante",
    bio: "Segura y agresiva, impone su ritmo desde el principio. Le gusta recordarte quién manda en el tablero.",
  },
  "opp-soldier-act01": {
    displayName: "Soldado",
    role: "Guardián del campo de batalla",
    bio: "Un combatiente disciplinado que convierte cada duelo en una guerra de desgaste. No cede terreno con facilidad.",
  },
  "opp-guill": {
    displayName: "Guill",
    role: "Rival final (APEX)",
    bio: "El oponente del último nivel, al que nadie ha superado. Un desafío de élite pensado para poner a prueba todo lo aprendido.",
  },
  "opp-mouretech": {
    displayName: "Mouretech",
    role: "Comodín impredecible",
    bio: "Una presencia optimizada que puede aparecer en cualquier nivel sin avisar. Nunca sabes cuándo interceptará tu partida para 'optimizar tu derrota'.",
  },
};

/** Orden de aparición recomendado de los oponentes en el Códex. */
export const OPPONENT_ORDER: string[] = [
  "opp-biglog",
  "opp-gennvim",
  "opp-jaku",
  "opp-helena",
  "opp-soldier-act01",
  "opp-guill",
  "opp-mouretech",
];
