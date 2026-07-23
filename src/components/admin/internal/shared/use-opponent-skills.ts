// src/components/admin/internal/shared/use-opponent-skills.ts - Carga y edita las habilidades de combate de un
// oponente (Arena por tier / Story por oponente) contra /api/admin/opponent-skills. Optimista al guardar.
"use client";

import { useCallback, useEffect, useState } from "react";
import { OpponentSkillTargetType } from "@/core/entities/progression/IOpponentSkillRank";
import { IOpponentSkillNodeOption } from "@/core/services/progression/skill-tree/resolve-opponent-combat-modifiers";

interface IOpponentSkillRankDto {
  nodeId: string;
  rank: number;
}

export function useOpponentSkills(opponentId: string | null, opponentType: OpponentSkillTargetType) {
  const [nodes, setNodes] = useState<IOpponentSkillNodeOption[]>([]);
  const [ranks, setRanks] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!opponentId) {
      setNodes([]);
      setRanks(new Map());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/opponent-skills?opponentType=${opponentType}&opponentId=${encodeURIComponent(opponentId)}`);
      if (!res.ok) throw new Error("load");
      const data = (await res.json()) as { nodes: IOpponentSkillNodeOption[]; ranks: IOpponentSkillRankDto[] };
      setNodes(data.nodes ?? []);
      setRanks(new Map((data.ranks ?? []).map((entry) => [entry.nodeId, entry.rank])));
    } catch {
      setError("No se pudieron cargar las habilidades.");
    } finally {
      setLoading(false);
    }
  }, [opponentId, opponentType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setRank = useCallback(
    async (nodeId: string, rank: number) => {
      if (!opponentId) return;
      setRanks((prev) => {
        const next = new Map(prev);
        if (rank >= 1) next.set(nodeId, rank);
        else next.delete(nodeId);
        return next;
      });
      try {
        const res = await fetch(`/api/admin/opponent-skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opponentType, opponentId, nodeId, rank }),
        });
        if (!res.ok) throw new Error("save");
      } catch {
        setError("No se pudo guardar la habilidad.");
        void reload();
      }
    },
    [opponentId, opponentType, reload],
  );

  return { nodes, ranks, loading, error, setRank };
}
