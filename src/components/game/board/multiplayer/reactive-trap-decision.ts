// src/components/game/board/multiplayer/reactive-trap-decision.ts - Constantes compartidas del carrusel de
// trampa reactiva en multi (ficha 4): el margen del defensor para decidir y el auto-pasar del atacante lo
// leen desde aquí para que el contador visible y el temporizador real usen EXACTAMENTE el mismo valor.

/** Margen (ms) del defensor para elegir su trampa reactiva antes de auto-pasar. El fallback emite el MISMO
 *  RESOLVE_REACTIVE_TRAP "pasar" en su cliente, así que ambos tableros siguen convergiendo. */
export const REACTIVE_TRAP_DECISION_TIMEOUT_MS = 15_000;
