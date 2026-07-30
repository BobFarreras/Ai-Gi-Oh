// src/components/hub/academy/training/modes/survival/useSurvivalExpedition.ts - Orquesta run, batalla, journal y liquidación de Supervivencia.
"use client";
import { useCallback, useRef, useState } from "react";
import { CombatActionJournal } from "@/core/services/match/combat-action-journal";
import { ICombatProof, IMatchActionPayload } from "@/core/entities/match";
import { ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { completeSurvivalBattle, issueSurvivalBattle, ISurvivalBattleRuntime, startSurvivalRun } from "./survival-api-client";

export function useSurvivalExpedition() {
  const [run, setRun] = useState<ISurvivalRun | null>(null);
  const [battle, setBattle] = useState<ISurvivalBattleRuntime | null>(null);
  const [reward, setReward] = useState<{ nexus: number; playerExperience: number; ascensionFragments: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const journalRef = useRef(new CombatActionJournal());
  const completedRef = useRef(false);

  /** Arranca/reanuda la run y obtiene un snapshot inmutable para el Board. */
  const enterBattle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const started = await startSurvivalRun();
      const issued = await issueSurvivalBattle(started.run.id);
      journalRef.current.reset();
      completedRef.current = false;
      setRun(started.run);
      setBattle(issued);
      setReward(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo preparar la expedición.");
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
      setReward(result.reward ?? null);
    } catch (caught) {
      completedRef.current = false;
      setError(caught instanceof Error ? caught.message : "No se pudo validar el resultado.");
    }
  }, [battle]);

  return { run, battle, reward, error, isLoading, enterBattle, recordAction, completeBattle };
}
