// src/core/services/progression/mission-sort.ts - Ordenación de misiones: reclamables arriba, en progreso medio, reclamadas abajo.
import { IMissionView } from "@/core/entities/progression/IMission";

type SortPriority = 0 | 1 | 2;

/** Prioridad de ordenación: 0=reclamable, 1=en_progreso, 2=reclamada. */
function getMissionSortPriority(mission: IMissionView): SortPriority {
  if (mission.completed && !mission.claimed) return 0;
  if (!mission.completed) return 1;
  return 2;
}

/** Ordena misiones dentro de un grupo: reclamables primero, luego en progreso, luego reclamadas. Mantiene el orden original dentro de cada prioridad. */
export function sortMissionsByPriority(missions: IMissionView[]): IMissionView[] {
  return [...missions].sort((a, b) => getMissionSortPriority(a) - getMissionSortPriority(b));
}
