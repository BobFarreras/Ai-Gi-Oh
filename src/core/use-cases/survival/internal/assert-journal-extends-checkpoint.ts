// src/core/use-cases/survival/internal/assert-journal-extends-checkpoint.ts - Impide reescribir lo ya jugado al reportar avance.
import { ICombatJournalEntry } from "@/core/entities/match";
import { CombatProofError } from "@/core/errors/CombatProofError";

/**
 * Postgres normaliza el orden de claves de un `jsonb`, así que el avance guardado vuelve con otro orden
 * que el enviado por el cliente. Comparar el texto crudo daba falsos conflictos: hay que canonizar antes.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.keys(source)
    .filter((key) => source[key] !== undefined)
    .sort()
    .reduce<Record<string, unknown>>((canonical, key) => {
      canonical[key] = canonicalize(source[key]);
      return canonical;
    }, {});
}

function isSameAction(left: ICombatJournalEntry, right: ICombatJournalEntry): boolean {
  return JSON.stringify(canonicalize(left.action)) === JSON.stringify(canonicalize(right.action));
}

/**
 * El checkpoint persistido es historia: un envío posterior solo puede prolongarlo. Sin esto, reanudar y
 * mandar una partida distinta permitiría rehacer las jugadas ya reportadas.
 */
export function assertJournalExtendsCheckpoint(
  checkpoint: ICombatJournalEntry[],
  submitted: ICombatJournalEntry[],
): void {
  if (submitted.length < checkpoint.length) {
    throw new CombatProofError("El diario enviado es más corto que el avance ya registrado.");
  }
  checkpoint.forEach((entry, index) => {
    const candidate = submitted[index];
    if (
      candidate.sequence !== entry.sequence
      || candidate.actorPlayerId !== entry.actorPlayerId
      || !isSameAction(candidate, entry)
    ) {
      throw new CombatProofError("El diario enviado contradice el avance ya registrado.");
    }
  });
}
