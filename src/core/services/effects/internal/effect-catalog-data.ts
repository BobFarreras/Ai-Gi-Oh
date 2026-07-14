// src/core/services/effects/internal/effect-catalog-data.ts - Datos estáticos del catálogo de efectos (ejecuciones, trampas, innatos y triggers). Archivo de datos: excepción justificada al límite de líneas.
import { IEffectCatalogItem } from "@/core/services/effects/effect-catalog-types";

/** Efectos de ejecución (cartas mágicas). Cada uno con un JSON de ejemplo usable en el editor. */
export const EXECUTION_EFFECTS: IEffectCatalogItem[] = [
  { category: "EXECUTION", key: "DAMAGE", name: "Daño directo", description: "Inflige daño directo al objetivo (rival o propietario).", exampleJson: '{"action":"DAMAGE","target":"OPPONENT","value":300}' },
  { category: "EXECUTION", key: "HEAL", name: "Curación", description: "Cura puntos de vida del propietario.", exampleJson: '{"action":"HEAL","target":"PLAYER","value":500}' },
  { category: "EXECUTION", key: "DRAW_CARD", name: "Robar cartas", description: "Roba N cartas del mazo a la mano.", exampleJson: '{"action":"DRAW_CARD","cards":1}' },
  { category: "EXECUTION", key: "RESTORE_ENERGY", name: "Recuperar energía", description: "Recupera energía del propietario (normalmente hasta el máximo).", exampleJson: '{"action":"RESTORE_ENERGY"}' },
  { category: "EXECUTION", key: "BOOST_ATTACK_ALLIED_ENTITY", name: "Subir ATK aliado", description: "Sube el ATK de la mejor entidad aliada.", exampleJson: '{"action":"BOOST_ATTACK_ALLIED_ENTITY","value":500}' },
  { category: "EXECUTION", key: "BOOST_ATTACK_BY_ARCHETYPE", name: "Subir ATK por arquetipo", description: "Sube el ATK a las entidades aliadas de un arquetipo.", exampleJson: '{"action":"BOOST_ATTACK_BY_ARCHETYPE","archetype":"LLM","value":500}' },
  { category: "EXECUTION", key: "BOOST_DEFENSE_BY_ARCHETYPE", name: "Subir DEF por arquetipo", description: "Sube la DEF a las entidades aliadas de un arquetipo.", exampleJson: '{"action":"BOOST_DEFENSE_BY_ARCHETYPE","archetype":"DB","value":500}' },
  { category: "EXECUTION", key: "BOOST_DEFENSE_BY_CARD_ID", name: "Subir DEF de una carta", description: "Aumenta la DEF de una carta concreta.", exampleJson: '{"action":"BOOST_DEFENSE_BY_CARD_ID","targetCardId":"entity-x","value":500}' },
  { category: "EXECUTION", key: "BOOST_ATTACK_BY_CARD_ID", name: "Subir ATK de una carta", description: "Aumenta el ATK de una carta concreta.", exampleJson: '{"action":"BOOST_ATTACK_BY_CARD_ID","targetCardId":"entity-x","value":1000}' },
  { category: "EXECUTION", key: "DAMAGE_IF_ALLY_ON_BOARD", name: "Daño si tienes una carta", description: "Inflige daño al rival solo si tienes en campo una entity concreta.", exampleJson: '{"action":"DAMAGE_IF_ALLY_ON_BOARD","requiredCardId":"entity-avast","value":2000}' },
  { category: "EXECUTION", key: "GRANT_EXTRA_SUMMON", name: "Invocación extra", description: "Concede invocaciones normales EXTRA este turno (además de la normal). count ausente = 1.", exampleJson: '{"action":"GRANT_EXTRA_SUMMON","count":1}' },
  { category: "EXECUTION", key: "SWAP_HANDS", name: "Intercambiar manos", description: "Intercambia por completo tu mano con la del rival.", exampleJson: '{"action":"SWAP_HANDS"}' },
  { category: "EXECUTION", key: "SWAP_BOARD_ENTITIES", name: "Intercambiar tablero", description: "Intercambia tus entities del tablero con las del rival. Las que recibes no pueden atacar este turno.", exampleJson: '{"action":"SWAP_BOARD_ENTITIES"}' },
  { category: "EXECUTION", key: "STEAL_OPPONENT_ENTITY", name: "Robar entity rival", description: "Eliges una entity del rival y la robas a tu campo (si tienes hueco).", exampleJson: '{"action":"STEAL_OPPONENT_ENTITY"}' },
  { category: "EXECUTION", key: "STEAL_OPPONENT_EXECUTION", name: "Robar magia/trampa rival", description: "Eliges una carta puesta de magia/trampa del rival y la robas a tu campo (si tienes hueco).", exampleJson: '{"action":"STEAL_OPPONENT_EXECUTION"}' },
  { category: "EXECUTION", key: "APPLY_NO_DIRECT_ATTACKS", name: "Bloquear ataques directos", description: "El rival no puede hacer ataques directos durante N turnos (sí puede atacar a entities).", exampleJson: '{"action":"APPLY_NO_DIRECT_ATTACKS","turns":3}' },
  { category: "EXECUTION", key: "DESTROY_OPPONENT_ENTITY", name: "Destruir entity rival", description: "Eliges una entity del rival y la destruyes (va a su pila de destruidas).", exampleJson: '{"action":"DESTROY_OPPONENT_ENTITY"}' },
  { category: "EXECUTION", key: "FLIP_OPPONENT_ENTITY_TO_DEFENSE", name: "Voltear entity rival a defensa", description: "Eliges una entity del rival y la pones en modo defensa.", exampleJson: '{"action":"FLIP_OPPONENT_ENTITY_TO_DEFENSE"}' },
  { category: "EXECUTION", key: "SACRIFICE_ALLY_ENTITY_FOR_ENERGY", name: "Sacrificar entity por energía", description: "Destruyes una entity propia y ganas energía igual a su coste.", exampleJson: '{"action":"SACRIFICE_ALLY_ENTITY_FOR_ENERGY"}' },
  { category: "EXECUTION", key: "SET_DEFENSE_BY_CARD_ID", name: "Fijar DEF de una carta", description: "Fija la DEF de una carta concreta a un valor.", exampleJson: '{"action":"SET_DEFENSE_BY_CARD_ID","targetCardId":"entity-x","value":2000}' },
  { category: "EXECUTION", key: "DRAIN_OPPONENT_ENERGY", name: "Drenar energía rival", description: "Drena toda la energía del rival a 0.", exampleJson: '{"action":"DRAIN_OPPONENT_ENERGY"}' },
  { category: "EXECUTION", key: "SET_CARD_DUEL_PROGRESS", name: "Ajustar progreso en duelo", description: "Ajusta nivel/versión temporal de una carta objetivo durante el duelo.", exampleJson: '{"action":"SET_CARD_DUEL_PROGRESS","targetCardId":"entity-x","level":3,"versionTier":5}' },
  { category: "EXECUTION", key: "REVEAL_OPPONENT_SET_CARD", name: "Revelar carta seteada", description: "Revela una carta colocada boca abajo del rival.", exampleJson: '{"action":"REVEAL_OPPONENT_SET_CARD","zone":"ANY"}' },
  { category: "EXECUTION", key: "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND", name: "Robar del cementerio rival", description: "Roba una carta del cementerio rival a tu mano.", exampleJson: '{"action":"STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND"}' },
  { category: "EXECUTION", key: "RETURN_GRAVEYARD_CARD_TO_HAND", name: "Devolver del cementerio a mano", description: "Devuelve una carta de tu cementerio a la mano.", exampleJson: '{"action":"RETURN_GRAVEYARD_CARD_TO_HAND"}' },
  { category: "EXECUTION", key: "RETURN_GRAVEYARD_CARD_TO_FIELD", name: "Devolver del cementerio al campo", description: "Devuelve una carta de tu cementerio al campo.", exampleJson: '{"action":"RETURN_GRAVEYARD_CARD_TO_FIELD","cardType":"ENTITY"}' },
  { category: "EXECUTION", key: "FUSION_SUMMON", name: "Invocación por fusión", description: "Inicia el flujo de invocación por fusión.", exampleJson: '{"action":"FUSION_SUMMON","recipeId":"fusion-x","materialsRequired":2}' },
];

/** Efectos de trampa. */
export const TRAP_EFFECTS: IEffectCatalogItem[] = [
  { category: "TRAP", key: "REDUCE_OPPONENT_ATTACK", name: "Bajar ATK rival", description: "Baja el ATK de las entidades rivales.", exampleJson: '{"action":"REDUCE_OPPONENT_ATTACK","value":500}' },
  { category: "TRAP", key: "REDUCE_OPPONENT_DEFENSE", name: "Bajar DEF rival", description: "Baja la DEF de las entidades rivales.", exampleJson: '{"action":"REDUCE_OPPONENT_DEFENSE","value":500}' },
  { category: "TRAP", key: "NEGATE_ATTACK_AND_DESTROY_ATTACKER", name: "Negar ataque y destruir", description: "Niega el ataque y destruye al atacante.", exampleJson: '{"action":"NEGATE_ATTACK_AND_DESTROY_ATTACKER"}' },
  { category: "TRAP", key: "NEGATE_ATTACK", name: "Bloquear ataque", description: "Bloquea el ataque declarado por el rival (no se resuelve) sin destruir al atacante.", exampleJson: '{"action":"NEGATE_ATTACK"}' },
  { category: "TRAP", key: "NEGATE_OPPONENT_TRAP_AND_DESTROY", name: "Negar y destruir trampa", description: "Niega y destruye una trampa del rival al activarse.", exampleJson: '{"action":"NEGATE_OPPONENT_TRAP_AND_DESTROY"}' },
  { category: "TRAP", key: "NEGATE_OPPONENT_EXECUTION_AND_DESTROY", name: "Negar y destruir magia", description: "Cuando el rival activa una magia, anula su efecto y destruye esa carta antes de que se resuelva.", exampleJson: '{"action":"NEGATE_OPPONENT_EXECUTION_AND_DESTROY"}' },
  { category: "TRAP", key: "REINFORCE_LINKED_ENTITY_ON_ATTACK", name: "Escudo persistente ligado", description: "Solo se activa si el rival ataca a una de tus entities ligadas (linkedCardId). Al saltar, TODAS tus entities ligadas ganan DEF (acumulable). La trampa no se consume: sigue puesta.", exampleJson: '{"action":"REINFORCE_LINKED_ENTITY_ON_ATTACK","linkedCardId":"entity-typescript","value":1000}' },
  { category: "TRAP", key: "DESTROY_ALL_TRAPS", name: "Destruir todas las trampas", description: "Destruye todas las trampas puestas del rival en el tablero.", exampleJson: '{"action":"DESTROY_ALL_TRAPS"}' },
  { category: "TRAP", key: "DISCARD_OPPONENT_HAND_CARD", name: "Descartar mano rival", description: "Descarta cartas de la mano del rival (las más antiguas, determinista).", exampleJson: '{"action":"DISCARD_OPPONENT_HAND_CARD","count":1}' },
  { category: "TRAP", key: "LOCK_OPPONENT_ENTITY", name: "Bloquear entidad rival", description: "Bloquea una entidad rival (no puede atacar) durante N turnos del rival.", exampleJson: '{"action":"LOCK_OPPONENT_ENTITY","turns":1}' },
  { category: "TRAP", key: "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES", name: "Copiar buff rival", description: "Copia el buff del rival a tus entidades aliadas.", exampleJson: '{"action":"COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES"}' },
  { category: "TRAP", key: "NULLIFY_OPPONENT_BUFF", name: "Anular y penalizar buff rival", description: "Cuando el rival buffea sus entities, bloquea el aumento y además le resta ese mismo valor: la entity acaba por debajo de su valor original. El aviso en pantalla muestra el aumento bloqueado (un buff de +400 se anuncia como -400).", exampleJson: '{"action":"NULLIFY_OPPONENT_BUFF"}' },
  { category: "TRAP", key: "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED", name: "Forzar a ataque", description: "Fuerza el modo ataque y bloquea la postura de la entidad recién invocada.", exampleJson: '{"action":"FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED"}' },
  { category: "TRAP", key: "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN", name: "Drenaje en ataque directo", description: "En ataque directo: pone al rival a 0 de energía y al dueño a 10.", exampleJson: '{"action":"DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN"}' },
  { category: "TRAP", key: "APPLY_DAMAGE_OVER_TIME", name: "Infección: daño por turno", description: "Cuando el rival activa una trampa, lo infecta con daño en LP al inicio de cada uno de sus turnos (turns ausente = hasta el final del duelo). No se acumula: se refresca, no suma.", exampleJson: '{"action":"APPLY_DAMAGE_OVER_TIME","value":300}' },
  { category: "TRAP", key: "APPLY_HEAL_OVER_TIME", name: "Regeneración por turno", description: "Cuando el rival activa una trampa, cura LP al dueño al inicio de cada uno de sus turnos (turns ausente = hasta el final del duelo). No se acumula: se refresca, no suma.", exampleJson: '{"action":"APPLY_HEAL_OVER_TIME","value":300}' },
  { category: "TRAP", key: "REFLECT_DIRECT_DAMAGE", name: "Reflejar ataque directo", description: "Cuando el rival te ataca directo, anula ese golpe (tú no recibes daño) y refleja el ATK de la entity atacante a los LP del rival.", exampleJson: '{"action":"REFLECT_DIRECT_DAMAGE"}' },
];

/** Efectos innatos de entity (se aplican sin importar la versión). */
export const ENTITY_EFFECTS: IEffectCatalogItem[] = [
  { category: "ENTITY", key: "DESTROY_ENTITY_ON_BATTLE_WIN", name: "Destruir al ganar combate", description: "Al ganar un combate entre entidades, manda la rival a la zona de destruidas.", exampleJson: '{"action":"DESTROY_ENTITY_ON_BATTLE_WIN"}' },
];

/** Triggers de trampa (cuándo se puede activar). No son efectos: van en el campo `trigger`. */
export const TRAP_TRIGGERS: IEffectCatalogItem[] = [
  { category: "TRAP_TRIGGER", key: "ON_OPPONENT_ATTACK_DECLARED", name: "Al declarar ataque el rival", description: "Se puede activar cuando el rival declara un ataque." },
  { category: "TRAP_TRIGGER", key: "ON_OPPONENT_DIRECT_ATTACK_DECLARED", name: "Al declarar ataque directo", description: "Se puede activar cuando el rival declara un ataque directo a tus LP." },
  { category: "TRAP_TRIGGER", key: "ON_OPPONENT_EXECUTION_ACTIVATED", name: "Al activar ejecución el rival", description: "Se puede activar cuando el rival activa una carta de ejecución." },
  { category: "TRAP_TRIGGER", key: "ON_OPPONENT_TRAP_ACTIVATED", name: "Al activar trampa el rival", description: "Se puede activar cuando el rival activa una trampa." },
  { category: "TRAP_TRIGGER", key: "ON_OPPONENT_STAT_BUFF_APPLIED", name: "Al aplicar buff el rival", description: "Se puede activar cuando el rival aplica un buff de atributos." },
  { category: "TRAP_TRIGGER", key: "ON_OPPONENT_ENTITY_SET_PLAYED", name: "Al setear entidad el rival", description: "Se puede activar cuando el rival coloca una entidad boca abajo." },
];
