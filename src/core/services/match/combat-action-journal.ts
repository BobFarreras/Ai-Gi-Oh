// src/core/services/match/combat-action-journal.ts - Captura acciones de dominio en orden sin acoplarlas al estado React.
import { CombatProofError } from "@/core/errors/CombatProofError";
import { ICombatJournalEntry, IMatchActionPayload } from "@/core/entities/match";

export const DEFAULT_COMBAT_ACTION_LIMIT = 500;

export class CombatActionJournal {
  private entries: ICombatJournalEntry[] = [];
  private overflowed = false;

  constructor(private readonly maxEntries = DEFAULT_COMBAT_ACTION_LIMIT) {}

  /**
   * Registra una acción ya aceptada por la UI. Al desbordar devuelve null y marca el journal en vez de
   * lanzar: se invoca desde handlers de React y del bucle de la IA, donde un throw rompería el combate
   * sin salida posible para el jugador.
   */
  append(actorPlayerId: string, action: IMatchActionPayload): ICombatJournalEntry | null {
    if (!actorPlayerId.trim()) throw new CombatProofError("El actor de la acción es obligatorio.");
    if (this.entries.length >= this.maxEntries) {
      this.overflowed = true;
      return null;
    }
    const entry = { sequence: this.entries.length + 1, actorPlayerId, action };
    this.entries.push(entry);
    return entry;
  }

  /** Un journal desbordado ya no puede probar el combate: la liquidación debe rechazarse antes de enviarla. */
  hasOverflowed(): boolean {
    return this.overflowed;
  }

  /** Devuelve una copia para impedir mutaciones externas del journal activo. */
  getEntries(): ICombatJournalEntry[] {
    return this.entries.map((entry) => structuredClone(entry));
  }

  /** Reinicia numeración, contenido y desbordamiento al comenzar otra batalla. */
  reset(): void {
    this.entries = [];
    this.overflowed = false;
  }
}
