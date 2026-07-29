// src/core/services/match/combat-action-journal.ts - Captura acciones de dominio en orden sin acoplarlas al estado React.
import { CombatProofError } from "@/core/errors/CombatProofError";
import { ICombatJournalEntry, IMatchActionPayload } from "@/core/entities/match";

export const DEFAULT_COMBAT_ACTION_LIMIT = 500;

export class CombatActionJournal {
  private entries: ICombatJournalEntry[] = [];

  constructor(private readonly maxEntries = DEFAULT_COMBAT_ACTION_LIMIT) {}

  /**
   * Registra una acción ya aceptada por la UI y devuelve su entrada secuenciada.
   */
  append(actorPlayerId: string, action: IMatchActionPayload): ICombatJournalEntry {
    if (!actorPlayerId.trim()) throw new CombatProofError("El actor de la acción es obligatorio.");
    if (this.entries.length >= this.maxEntries) throw new CombatProofError("Se alcanzó el límite de acciones del combate.");
    const entry = { sequence: this.entries.length + 1, actorPlayerId, action };
    this.entries.push(entry);
    return entry;
  }

  /** Devuelve una copia para impedir mutaciones externas del journal activo. */
  getEntries(): ICombatJournalEntry[] {
    return this.entries.map((entry) => structuredClone(entry));
  }

  /** Reinicia numeración y contenido al comenzar otra batalla. */
  reset(): void {
    this.entries = [];
  }
}
