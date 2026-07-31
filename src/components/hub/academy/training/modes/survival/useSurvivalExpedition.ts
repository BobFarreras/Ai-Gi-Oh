// src/components/hub/academy/training/modes/survival/useSurvivalExpedition.ts - Orquesta run, batalla, journal y liquidación de Supervivencia.
"use client";
import { useCallback, useRef, useState } from "react";
import { CombatActionJournal } from "@/core/services/match/combat-action-journal";
import { ICombatProof, IMatchActionPayload } from "@/core/entities/match";
import { ISurvivalProgress, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import {
  completeSurvivalBattle,
  issueSurvivalBattle,
  ISurvivalBattleRuntime,
  ISurvivalSettlement,
  startSurvivalRun,
} from "./survival-api-client";

export function useSurvivalExpedition() {
  const [run, setRun] = useState<ISurvivalRun | null>(null);
  const [battle, setBattle] = useState<ISurvivalBattleRuntime | null>(null);
  const [progress, setProgress] = useState<ISurvivalProgress | null>(null);
  const [settlement, setSettlement] = useState<ISurvivalSettlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const journalRef = useRef(new CombatActionJournal());
  const completedRef = useRef(false);

  /** Arranca/reanuda la run y obtiene un snapshot inmutable para el Board. */
  const enterBattle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const started = await startSurvivalRun();
      setNotice(started.forfeitedPreviousRun
        ? "Tu expedición anterior se cerró como derrota: dejaste un combate sin terminar."
        : null);
      const issued = await issueSurvivalBattle(started.run.id);
      journalRef.current.reset();
      completedRef.current = false;
      setRun(started.run);
      setProgress(started.progress);
      setBattle(issued);
      setSettlement(null);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo preparar la expedición.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Registra acciones aceptadas de ambos duelistas en el orden real del cliente. */
  const recordAction = useCallback((action: IMatchActionPayload, actorPlayerId?: string) => {
    if (!battle) return;
    journalRef.current.append(actorPlayerId ?? battle.session.playerId, action);
  }, [battle]);

  /** Liquida una sola vez; el backend reproduce el journal antes de acreditar nada. */
  const completeBattle = useCallback(async () => {
    if (!battle || completedRef.current) return;
    completedRef.current = true;
    setIsLoading(true);
    setError(null);
    const proof: ICombatProof = {
      sessionId: battle.session.id,
      battleId: battle.session.battleId,
      mode: "SURVIVAL",
      snapshotHash: battle.session.snapshotHash,
      protocolVersion: battle.session.protocolVersion,
      entries: journalRef.current.getEntries(),
    };
    try {
      const result = await completeSurvivalBattle(battle.completionTicket, proof);
      setRun(result.run);
      setProgress(result.progress);
      setSettlement(result);
    } catch (caught) {
      completedRef.current = false;
      setError(caught instanceof Error ? caught.message : "No se pudo validar el resultado.");
    } finally {
      setIsLoading(false);
    }
  }, [battle]);

  return {
    run, battle, progress, settlement, error, notice, isLoading,
    enterBattle, recordAction, completeBattle,
  };
}
