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
  "Cada vez que usas una Entity en combate, gana experiencia (XP). Al acumular suficiente, sube de nivel.",
  "Subir de nivel refuerza permanentemente esa carta con bonificaciones fijas al alcanzar ciertos hitos. Cuanto más juegues con una carta, más fuerte se vuelve.",
];

export const VERSION_INTRO = [
  "Además del nivel, las cartas tienen una VERSIÓN (V0 a V5). La versión no se sube jugando, sino reuniendo copias de la misma carta en tu colección y evolucionándola.",
  "Cada evolución mejora la carta y, sobre todo, escala la magnitud de su poder/pasiva. La V5 es la forma máxima: el poder de la carta alcanza su valor pleno.",
];

export const MASTERY_INTRO = [
  "Las pasivas de maestría son poderes que actúan solos durante el combate mientras la carta está en juego. Su fuerza escala con la versión de la carta (más versión = mayor magnitud).",
  "Algunas Entity nacen con un poder INNATO: lo tienen activo desde el primer momento, sin necesidad de desbloquearlo.",
];

export const STORY_OVERVIEW = [
  "En el Modo Historia recorres un mapa por capítulos, enfrentándote a una sucesión de oponentes con mazos, personalidad y voz propios.",
  "Cada rival tiene su intro, sus reacciones cuando caes en sus trampas o recibes golpes directos, y su desenlace al ganar o perder. Derrotarlos avanza la trama y desbloquea recompensas.",
  "La Arena de Práctica usa a estos mismos rivales por niveles de dificultad, para entrenar sin afectar a la historia.",
];

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
