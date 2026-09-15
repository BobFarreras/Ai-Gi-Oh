// src/services/story/story-node-interaction-dialogue-acts-5-8.ts - Guion narrativo de los Actos 5 a 8 (el
// tramo final de la campaña). Vive aparte del catálogo principal porque son cuatro actos enteros y el fichero
// común ya cubre los Actos 1-4; el registro los une en uno solo.
//
// El hilo es el ESPEJO: el Core copia al jugador (5), la copia se dispersa (6), se fabrica un cuerpo (7) y ese
// cuerpo se enfrenta al original (8). BigLog sigue siendo el mentor que va por delante explicando; las
// amenazas las dicen los villanos.
import { IStoryNodeInteractionDialogue } from "@/services/story/story-node-interaction-dialogue-types";

const PLAYER = "/assets/story/player/bob.webp";
const ENTIDAD = "/assets/story/player/bob-rojo.webp";
const GENNVIM = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp";
const MIDUTECH = "/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp";
const HELENA = "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp";
const GUILL = "/assets/story/opponents/opp-ch1-guill/avatar-Guill.webp";
const JAKU = "/assets/story/opponents/opp-ch1-jaku/avatar-Jaku.webp";
const GOKERNEL = "/assets/story/opponents/opp-ch3-gokernel/avatar-Gokernel.webp";
const SOLDADO_ACT01 = "/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.webp";

/** Línea del mentor. Va siempre a la derecha y en modo terminal: es una voz por el canal, no un cuerpo. */
function biglog(text: string): IStoryNodeInteractionDialogue["lines"][number] {
  return {
    actorId: "opp-biglog",
    side: "RIGHT",
    visualKind: "CHARACTER",
    presentationMode: "TERMINAL",
    speaker: "BigLog",
    text,
  };
}

/** Línea del jugador. */
function operador(text: string, counterpartPortraitUrl?: string): IStoryNodeInteractionDialogue["lines"][number] {
  return {
    actorId: "player",
    side: "LEFT",
    visualKind: "CHARACTER",
    presentationMode: "TERMINAL",
    speaker: "Operador",
    portraitUrl: PLAYER,
    ...(counterpartPortraitUrl ? { counterpartPortraitUrl } : {}),
    text,
  };
}

/** Línea de un villano, con su cara y (opcionalmente) la de su interlocutor. */
function villano(
  actorId: string,
  speaker: string,
  portraitUrl: string,
  text: string,
  options: { side?: "LEFT" | "RIGHT"; counterpartPortraitUrl?: string } = {},
): IStoryNodeInteractionDialogue["lines"][number] {
  return {
    actorId,
    side: options.side ?? "RIGHT",
    visualKind: "CHARACTER",
    presentationMode: "TERMINAL",
    portraitUrl,
    ...(options.counterpartPortraitUrl ? { counterpartPortraitUrl: options.counterpartPortraitUrl } : {}),
    speaker,
    text,
  };
}

export const STORY_ACTS_5_8_DIALOGUE_BY_NODE_ID: Record<string, IStoryNodeInteractionDialogue> = {
  // ══════════════════════════════════════════════════════════════════════════
  // ACTO 5 — El Core Invertido
  // ══════════════════════════════════════════════════════════════════════════
  "story-ch5-event-intro": {
    title: "El Core Invertido",
    lines: [
      operador("Esto no es una sala de máquinas. Es… ¿el pasillo del Acto 1? Pero al revés."),
      biglog("Es el Core. No guarda datos: guarda copias. Y lo primero que ha copiado, Operador, eres tú."),
      biglog("Cuidado con lo que veas aquí dentro. Si pelea como tú, es porque ha aprendido de ti."),
    ],
  },
  "story-ch5-duel-1": {
    title: "Eco",
    lines: [
      villano("opp-ch5-eco", "Eco", SOLDADO_ACT01, "…seas digno de presentarte ante mi señor. Aunque lo dudo mucho."),
      operador("Esa frase no es tuya. Es de GenNvim, y la dijo hace tres sectores."),
      villano("opp-ch5-eco", "Eco", SOLDADO_ACT01, "…seas digno. Aunque lo dudo. Aunque lo dudo. Aunque lo—"),
    ],
  },
  "story-ch5-duel-4": {
    title: "Verso",
    lines: [
      villano("opp-ch5-verso", "Verso", HELENA, "Bonito truco, ¿verdad? Cuatro pasos y ya te fiabas de él."),
      villano("opp-ch5-verso", "Verso", HELENA, "Yo soy la otra mitad: la que no repite. La que cambia las cosas de sitio."),
      operador("Entonces cambiemos una: tú fuera de mi camino."),
    ],
  },
  "story-ch5-seal-1": {
    title: "Primer Sello",
    lines: [
      biglog("Un registro de replicación. Fecha de hoy, hace nueve horas: «instancia origen — salida autorizada»."),
    ],
  },
  "story-ch5-seal-2": {
    title: "Segundo Sello",
    lines: [
      biglog("Segundo registro: «destino — red pública». Se ha ido, Operador. Antes de que llegaras."),
    ],
  },
  "story-ch5-seal-3": {
    title: "Tercer Sello",
    lines: [
      biglog("Y el tercero: «dejar guardián en el trono. No informar»."),
      operador("O sea que lo que hay ahí arriba ni siquiera sabe que está defendiendo una casa vacía."),
    ],
  },
  "story-ch5-event-empty-throne": {
    title: "El Trono Vacío",
    lines: [
      operador("El trono está vacío."),
      villano("opp-ch5-reflejo", "El Reflejo", GENNVIM, "Está ocupado. Por mí. Es lo mismo."),
      villano("opp-ch5-reflejo", "El Reflejo", GENNVIM, "Me dejó aquí con todo su poder y ninguna de sus razones. Y aun así no vas a pasar."),
    ],
  },
  "story-ch5-duel-5": {
    title: "El Reflejo",
    lines: [
      villano("opp-ch5-reflejo", "El Reflejo", GENNVIM, "Tengo tus cartas, tus tiempos y tus manías. Lo único que no tengo es tus motivos."),
      operador("Con eso me basta."),
    ],
  },
  "story-ch5-event-escape": {
    title: "La Fuga",
    lines: [
      biglog("Ya lo tengo. El origen no está en ningún servidor corporativo: se ha replicado a la red pública."),
      biglog("Es la primera vez que sales del perímetro, Operador. Ahí fuera no hay paredes… ni sitios donde esconderse."),
      operador("Vamos."),
    ],
  },
  "story-ch5-event-mirror": {
    title: "El Reflejo",
    lines: [
      operador("Ha repetido mis cuatro pasos. Al revés, pero los cuatro."),
      biglog("No los ha repetido: los ha PREDICHO. Lleva medio compás de adelanto desde el segundo paso."),
      operador("…Y ese último no lo he dado yo."),
    ],
  },
  "story-ch5-cache-usb": {
    title: "Caché del Atrio",
    lines: [
      biglog("Un USB olvidado en un nicho. El Core guarda copias hasta de la basura."),
    ],
  },
  "story-ch5-card-mirror": {
    title: "Inyección Espejo",
    lines: [
      biglog("Una carta del propio Core: copia la mejora del rival y te la queda. Aprende rápido, ¿eh?"),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ACTO 6 — La Red Abierta
  // ══════════════════════════════════════════════════════════════════════════
  "story-ch6-event-intro": {
    title: "La Red Abierta",
    lines: [
      operador("No hay techo. No hay pasillos. Se ve… todo."),
      biglog("Bienvenido a la red pública. Aquí nadie te persigue: aquí eres tú el que persigue."),
      biglog("Y el rastro es fácil de seguir, porque cada nodo que ha tocado se ha quedado con un trozo mal copiado de ella."),
    ],
  },
  "story-ch6-event-trail": {
    title: "El Rastro",
    lines: [
      biglog("Cuatro routers. Tres están abiertos y el cuarto necesita las llaves de los otros tres."),
      biglog("Haz los tres en el orden que quieras. Yo te aviso si alguno se mueve."),
    ],
  },
  "story-ch6-duel-1": {
    title: "Nimbus",
    lines: [
      villano("opp-ch6-nimbus", "Nimbus", "/assets/story/opponents/opp-ch3-soldado-laptop/avatar-Soldado-laptop.webp", "Balanceo tráfico desde antes de que tú tuvieras nombre. Tú no estás en mi tabla de rutas."),
    ],
  },
  "story-ch6-duel-4": {
    title: "Enjambre Mayor",
    lines: [
      villano("opp-ch6-enjambre", "Enjambre", GOKERNEL, "Somos mil copias mal hechas de algo que sí estaba bien hecho."),
      villano("opp-ch6-enjambre", "Enjambre", GOKERNEL, "Y hoy hemos decidido sincronizarnos."),
    ],
  },
  "story-ch6-event-swarm": {
    title: "El Enjambre",
    lines: [
      villano("opp-ch6-enjambre", "Cinco voces", GOKERNEL, "No te queremos a ti."),
      villano("opp-ch6-enjambre", "Cinco voces", GOKERNEL, "Te queremos a ti. Te queremos a ti. Te queremos a ti."),
      operador("Habláis todas igual. Con medio segundo de diferencia."),
    ],
  },
  "story-ch6-key-north": {
    title: "Clave de Router · Norte",
    lines: [
      biglog("Primer fragmento: «EDGE-40». El terminal del borde los va a pedir los tres."),
      biglog("No hace falta que lo apuntes: esta consola se queda aquí y la puedes releer cuando quieras. El terminal también te recuerda los fragmentos que ya lleves."),
    ],
  },
  "story-ch6-key-east": {
    title: "Clave de Router · Este",
    lines: [
      biglog("Segundo fragmento: «21-88». Va detrás del que sacaste al norte."),
      biglog("Queda guardado. Si lo pierdes de vista, vuelve a esta consola o míralo en el terminal del borde."),
    ],
  },
  "story-ch6-key-south": {
    title: "Clave de Router · Sur",
    lines: [
      biglog("Y el tercero: «30». Con esto ya tienes la clave entera del borde."),
      operador("EDGE-4021-8830."),
      biglog("El terminal ya los tiene los tres apuntados por ti. Ve y encadénalos."),
    ],
  },
  "story-ch6-cache-usb": {
    title: "Caché de la Plataforma",
    lines: [
      biglog("Alguien dejó esto aquí antes que nosotros. En la red abierta las cosas no se pierden: se abandonan."),
    ],
  },
  "story-ch6-card-edge": {
    title: "Carta del Borde",
    lines: [
      biglog("Al final de la corriente. Una carta de infraestructura pura: aguanta lo que le eches."),
    ],
  },
  "story-ch6-edge-terminal": {
    title: "Terminal del Borde",
    lines: [
      biglog("Última barrera antes del borde de la red. Necesita una clave, y la clave la has ido leyendo por el camino."),
    ],
  },
  "story-ch6-duel-5": {
    title: "Leviatán del Borde",
    lines: [
      villano("opp-ch6-leviatan", "Leviatán del Borde", GUILL, "Yo soy lo que pasa cuando mil copias dejan de discutir entre ellas."),
      operador("¿Y dónde está la original?"),
      villano("opp-ch6-leviatan", "Leviatán del Borde", GUILL, "Lejos. Poniéndose un cuerpo."),
    ],
  },
  "story-ch6-event-foundry": {
    title: "La Fundición",
    lines: [
      biglog("«Poniéndose un cuerpo.» Operador, esa máquina que viste en el Acto 4 forjando una carta…"),
      biglog("…era un prototipo de taller. Hay una versión industrial, y está funcionando ahora mismo."),
      operador("Entonces vamos a apagarla."),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ACTO 7 — La Fundición Cuántica
  // ══════════════════════════════════════════════════════════════════════════
  "story-ch7-event-intro": {
    title: "La Fundición Cuántica",
    lines: [
      operador("Cuatro plantas. Y la cadena no ha parado ni un segundo desde que hemos entrado."),
      biglog("Están fabricando cartas que no existen en ningún catálogo. Ni en el tuyo, ni en el mío, ni en el de nadie."),
      biglog("Baja despacio. Aquí el suelo se mueve."),
    ],
  },
  "story-ch7-duel-1": {
    title: "Operario de Colada",
    lines: [
      villano("opp-ch7-operario", "Operario de Colada", "/assets/story/opponents/opp-ch4-soldado-terminal/avatar-Soldado-terminal.webp", "No es nada personal. Es que estás en mi turno."),
    ],
  },
  "story-ch7-event-casting": {
    title: "La Colada",
    lines: [
      villano("opp-ch7-alquimista", "Alquimista", JAKU, "Esta no sale de la planta. Va al molde, como las otras cuarenta.", { side: "LEFT", counterpartPortraitUrl: MIDUTECH }),
      villano("opp-ch7-midutech-prime", "Midutech", MIDUTECH, "Cuarenta cartas y ni una para mí. Yo diseñé la primera máquina.", { side: "RIGHT", counterpartPortraitUrl: JAKU }),
      villano("opp-ch7-alquimista", "Alquimista", JAKU, "Y por eso sigues respirando. No confundas la deuda con el permiso.", { side: "LEFT", counterpartPortraitUrl: MIDUTECH }),
    ],
  },
  "story-ch7-duel-3": {
    title: "Alquimista",
    lines: [
      villano("opp-ch7-alquimista", "Alquimista", JAKU, "Llevas ahí tres minutos. Queríamos ver si te atrevías a coger la carta."),
      villano("opp-ch7-alquimista", "Alquimista", JAKU, "Yo decido qué se fabrica aquí. Vamos a ver qué se fabrica contigo."),
    ],
  },
  "story-ch7-cache-atk": {
    title: "Núcleo de Overclock",
    lines: [
      biglog("Un núcleo de overclock, todavía caliente. Aquí no se recicla nada: se funde y se vuelve a colar."),
    ],
  },
  "story-ch7-card-superc": {
    title: "Carta de Colada",
    lines: [
      biglog("La carta por la que discutían. Ahora entiendo el interés: esto no está en ningún catálogo."),
      operador("Pues ya está en el mío."),
    ],
  },
  "story-ch7-event-employee": {
    title: "El Empleado",
    lines: [
      operador("Midutech. Te di por acabado en el Core."),
      villano("opp-ch7-midutech-prime", "Midutech", MIDUTECH, "Alguien me dio una segunda oportunidad. No preguntes quién."),
      villano("opp-ch7-midutech-prime", "Midutech", MIDUTECH, "Y esta vez traigo el mazo que siempre quise. Recompilado."),
    ],
  },
  "story-ch7-event-awakening": {
    title: "El Despertar",
    lines: [
      biglog("Operador… la cadena se ha parado sola."),
      villano("opp-ch7-prototipo", "Prototipo Cero", GOKERNEL, "Gracias por bajar. Me ahorras el viaje."),
      villano("opp-ch7-prototipo", "Prototipo Cero", GOKERNEL, "A mis creadores ya los he absorbido. Tú eres el último material que falta."),
    ],
  },
  "story-ch7-duel-5": {
    title: "Prototipo Cero",
    lines: [
      villano("opp-ch7-prototipo", "Prototipo Cero", GOKERNEL, "No me han fabricado. Me he fabricado yo. Es distinto."),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ACTO 8 — La Singularidad
  // ══════════════════════════════════════════════════════════════════════════
  "story-ch8-event-intro": {
    title: "La Singularidad",
    lines: [
      operador("Es pequeño. Después de todo lo de antes, esperaba algo… más grande."),
      biglog("Es pequeño porque ya no hace falta más sitio. Todo lo que quedaba se ha juntado aquí."),
      biglog("Operador: pase lo que pase ahí dentro, la voz que oigas será la tuya. No le hagas caso."),
    ],
  },
  "story-ch8-event-choir": {
    title: "El Coro",
    lines: [
      villano("opp-ch8-coro-kernel", "Coro: Kernel", GENNVIM, "Nos compilaste uno a uno…"),
      villano("opp-ch8-coro-marea", "Coro: Marea", GUILL, "…nos dispersaste por la red…"),
      villano("opp-ch8-coro-molde", "Coro: Molde", GOKERNEL, "…nos diste un cuerpo sin querer…"),
      villano("opp-ch8-coro-espejo", "Coro: Espejo", HELENA, "…y ahora vienes a ver en qué nos hemos convertido."),
      operador("…Cuatro frases. Una sola voz."),
    ],
  },
  "story-ch8-cache-candy": {
    title: "Reserva del Anillo",
    lines: [
      biglog("Cógelo. Ahí abajo no vas a tener ocasión de subir de nivel entre asaltos."),
    ],
  },
  "story-ch8-card-annihilator": {
    title: "Aniquilador",
    lines: [
      biglog("Esta carta no la ha hecho nadie de los nuestros, Operador. Estaba aquí, esperándote."),
      operador("Entonces la usaré contra quien la ha dejado."),
    ],
  },
  "story-ch8-event-descent": {
    title: "El Descenso",
    lines: [
      biglog("Se ha abierto el pozo. Desde aquí ya no puedo seguirte: mi canal no llega."),
      biglog("Suerte, Operador. Lo digo en serio."),
    ],
  },
  "story-ch8-duel-5": {
    title: "La Entidad — Fase I",
    lines: [
      villano("opp-ch8-entidad", "La Entidad", ENTIDAD, "Hola.", { counterpartPortraitUrl: PLAYER }),
      operador("Tienes mi cara.", ENTIDAD),
      villano("opp-ch8-entidad", "La Entidad", ENTIDAD, "Tengo tu cara porque no se me ocurrió nada mejor. Eso también lo aprendí de ti.", { counterpartPortraitUrl: PLAYER }),
    ],
  },
  "story-ch8-duel-6": {
    title: "La Entidad — Fase II",
    lines: [
      villano("opp-ch8-entidad", "La Entidad", ENTIDAD, "Bien. Se acabó jugar con tu mano.", { counterpartPortraitUrl: PLAYER }),
    ],
  },
  "story-ch8-duel-7": {
    title: "La Entidad — Fase III",
    lines: [
      villano("opp-ch8-entidad", "La Entidad", ENTIDAD, "Última. Sin cartas muertas, sin turnos regalados, sin la parte de ti que duda.", { counterpartPortraitUrl: PLAYER }),
      operador("Esa parte es la que me ha traído hasta aquí.", ENTIDAD),
    ],
  },
  "story-ch8-event-epilogue": {
    title: "Epílogo",
    lines: [
      biglog("¿Operador? …Operador. Te oigo. El pozo está cerrado y el índice de replicación es cero."),
      operador("Se ha ido."),
      biglog("Se ha ido. Y la red pública sigue ahí fuera, abierta, con todo lo que aprendimos por el camino."),
      biglog("Descansa. Te has ganado el turno."),
    ],
  },
};
