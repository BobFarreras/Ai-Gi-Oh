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
  { category: "TRAP", key: "NEGATE_OPPONENT_TRAP_AND_DESTROY", name: "Negar y destruir trampa", description: "Niega y destruye una trampa del rival al activarse.", exampleJson: '{"action":"NEGATE_OPPONENT_TRAP_AND_DESTROY"}' },
  { category: "TRAP", key: "DESTROY_ALL_TRAPS", name: "Destruir todas las trampas", description: "Destruye todas las trampas puestas del rival en el tablero.", exampleJson: '{"action":"DESTROY_ALL_TRAPS"}' },
  { category: "TRAP", key: "DISCARD_OPPONENT_HAND_CARD", name: "Descartar mano rival", description: "Descarta cartas de la mano del rival (las más antiguas, determinista).", exampleJson: '{"action":"DISCARD_OPPONENT_HAND_CARD","count":1}' },
  { category: "TRAP", key: "LOCK_OPPONENT_ENTITY", name: "Bloquear entidad rival", description: "Bloquea una entidad rival (no puede atacar) durante N turnos del rival.", exampleJson: '{"action":"LOCK_OPPONENT_ENTITY","turns":1}' },
  { category: "TRAP", key: "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES", name: "Copiar buff rival", description: "Copia el buff del rival a tus entidades aliadas.", exampleJson: '{"action":"COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES"}' },
  { category: "TRAP", key: "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED", name: "Forzar a ataque", description: "Fuerza el modo ataque y bloquea la postura de la entidad recién invocada.", exampleJson: '{"action":"FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED"}' },
  { category: "TRAP", key: "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN", name: "Drenaje en ataque directo", description: "En ataque directo: pone al rival a 0 de energía y al dueño a 10.", exampleJson: '{"action":"DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN"}' },
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
