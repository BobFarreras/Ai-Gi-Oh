// src/components/hub/academy/training/modes/tutorial/internal/ensure-combat-node-completion.ts - Sincroniza idempotentemente el nodo de combate tutorial antes de claims y salida.
import { postTutorialNodeCompletion } from "@/services/tutorial/tutorial-node-progress-client";

/** Garantiza que el nodo tutorial de combate quede persistido como completado. */
export async function ensureCombatNodeCompletion(): Promise<boolean> {
  try {
    await postTutorialNodeCompletion("tutorial-combat-basics");
    return true;
  } catch {
    return false;
  }
}
