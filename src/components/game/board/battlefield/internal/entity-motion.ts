// src/components/game/board/battlefield/internal/entity-motion.ts - Configura transformaciones iniciales y animadas de entidades en slots del tablero.
interface IEntityMotionParams {
  isAttacking: boolean;
  isActivating: boolean;
  isOpponentSide: boolean;
  isHorizontal: boolean;
}

interface IEntityMotionState {
  initial: { opacity: number; scale: number; y: number; rotateY: number; rotateZ: number };
  animate: { opacity: number; scale: number; y: number; zIndex: number; rotateY: number; rotateZ: number };
}

/**
 * Evita fugas visuales al hacer spawn: el estado inicial respeta ya rotación `SET/DEFENSE`.
 */
export function resolveEntityMotionState(params: IEntityMotionParams): IEntityMotionState {
  const rotateY = 0;
  const rotateZ = params.isHorizontal ? -90 : 0;
  const scale = params.isAttacking ? 0.38 : params.isActivating ? 0.35 : 0.28;
  const y = params.isAttacking ? (params.isOpponentSide ? 30 : -30) : params.isActivating ? -20 : 0;
  const zIndex = params.isAttacking || params.isActivating ? 50 : 10;

  return {
    initial: { opacity: 0, scale: 0.2, y: -50, rotateY, rotateZ },
    animate: { opacity: 1, scale, y, zIndex, rotateY, rotateZ },
  };
}
