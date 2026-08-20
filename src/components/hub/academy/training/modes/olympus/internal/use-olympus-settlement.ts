// src/components/hub/academy/training/modes/olympus/internal/use-olympus-settlement.ts - Gestiona journal, checkpoints e informe de Olimpo.
import { Dispatch, SetStateAction, useCallback, useRef } from "react";
import { ICombatJournalEntry, ICombatProof, IMatchActionPayload } from "@/core/entities/match";
import { CombatActionJournal } from "@/core/services/match/combat-action-journal";
import { completeOlympusBattle, IOlympusBattleRuntime, IOlympusSettlement } from "../olympus-api-client";

const CHECKPOINT_MIN_INTERVAL_MS = 12_000;
const OVERFLOW_MESSAGE = "Este combate superó el límite de acciones registrables. Sal y reanúdalo para poder liquidarlo.";
const UNSETTLED_MESSAGE = "El servidor todavía no da este combate por terminado. Reintenta o restaura el combate para salir del bloqueo.";

interface IUseOlympusSettlementInput {
  battle: IOlympusBattleRuntime | null;
  setSettlement: Dispatch<SetStateAction<IOlympusSettlement | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

/** Mantiene el journal fuera del estado React para no propagar renders por cada acción del tablero. */
export function useOlympusSettlement(input: IUseOlympusSettlementInput) {
  const { battle, setSettlement, setError, setIsLoading } = input;
  const journalRef = useRef(new CombatActionJournal());
  const completedRef = useRef(false);
  const lastCheckpointLengthRef = useRef(0);
  const lastCheckpointAtRef = useRef(0);
  const pendingSettlementRef = useRef<IOlympusSettlement | null>(null);

  const restoreJournal = useCallback((entries: ICombatJournalEntry[]) => {
    journalRef.current.restore(entries);
    completedRef.current = false;
    pendingSettlementRef.current = null;
    lastCheckpointLengthRef.current = entries.length;
    lastCheckpointAtRef.current = 0;
  }, []);

  const submitJournal = useCallback(async (isFinal: boolean, reveal = false) => {
    if (!battle) return;
    if (completedRef.current) {
      if (reveal && pendingSettlementRef.current) setSettlement(pendingSettlementRef.current);
      return;
    }
    if (journalRef.current.hasOverflowed()) {
      if (isFinal) setError(OVERFLOW_MESSAGE);
      return;
    }
    const entries = journalRef.current.getEntries();
    if (!isFinal) {
      const isTooSoon = Date.now() - lastCheckpointAtRef.current < CHECKPOINT_MIN_INTERVAL_MS;
      if (entries.length <= lastCheckpointLengthRef.current || isTooSoon) return;
      lastCheckpointLengthRef.current = entries.length;
      lastCheckpointAtRef.current = Date.now();
    }
    if (isFinal) setIsLoading(true);
    const proof: ICombatProof = {
      sessionId: battle.session.id, battleId: battle.session.battleId, mode: "OLYMPUS",
      snapshotHash: battle.session.snapshotHash, protocolVersion: battle.session.protocolVersion, entries,
    };
    try {
      const result = await completeOlympusBattle(battle.completionTicket, proof);
      if (!result.settled) {
        if (isFinal) setError(UNSETTLED_MESSAGE);
        return;
      }
      completedRef.current = true;
      pendingSettlementRef.current = result;
      setError(null);
      if (reveal) setSettlement(result);
    } catch (caught) {
      if (isFinal) setError(caught instanceof Error ? caught.message : "No se pudo validar el resultado.");
    } finally {
      if (isFinal) setIsLoading(false);
    }
  }, [battle, setError, setIsLoading, setSettlement]);

  const recordAction = useCallback((action: IMatchActionPayload, actorPlayerId?: string) => {
    if (!battle) return;
    const recorded = journalRef.current.append(actorPlayerId ?? battle.session.playerId, action);
    if (!recorded) setError(OVERFLOW_MESSAGE);
    else if (action.type === "NEXT_PHASE") void submitJournal(false);
  }, [battle, setError, submitJournal]);

  return {
    restoreJournal,
    recordAction,
    completeBattle: useCallback(() => submitJournal(true), [submitJournal]),
    revealSettlement: useCallback(() => submitJournal(true, true), [submitJournal]),
  };
}
