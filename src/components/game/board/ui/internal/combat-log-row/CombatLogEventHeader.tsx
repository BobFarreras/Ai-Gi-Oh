// src/components/game/board/ui/internal/combat-log-row/CombatLogEventHeader.tsx - Descripción breve del módulo.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

interface CombatLogEventHeaderProps {
  event: ICombatLogEvent;
  actorName: string;
  actorToneClass: string;
  deltaText: string | null;
  deltaToneClass: string;
}

export function CombatLogEventHeader({
  event,
  actorName,
  actorToneClass,
  deltaText,
  deltaToneClass,
}: CombatLogEventHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className={`text-[10px] px-2 py-1 uppercase tracking-widest rounded border ${actorToneClass}`}>{actorName}</span>
      <div className="flex items-center gap-2">
        {deltaText && <span className={`text-[10px] px-2 py-1 rounded border font-bold ${deltaToneClass}`}>{deltaText}</span>}
        <span className="text-[10px] text-zinc-400">
          T{event.turn} · {event.phase}
        </span>
      </div>
    </div>
  );
}

