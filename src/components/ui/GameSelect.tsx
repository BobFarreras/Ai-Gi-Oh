// src/components/ui/GameSelect.tsx - Selector reutilizable con estilo visual del juego para filtros y formularios.
import { LucideIcon } from "lucide-react";

interface GameSelectOption {
  label: string;
  value: string;
}

interface GameSelectProps {
  label: string;
  value: string;
  options: GameSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  Icon: LucideIcon;
}

export function GameSelect({ label, value, options, onChange, ariaLabel, Icon }: GameSelectProps) {
  return (
    <label className="flex w-[165px] min-w-0 flex-col gap-1 border border-cyan-400/45 bg-[linear-gradient(160deg,rgba(4,27,44,0.95),rgba(3,16,30,0.98))] px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18),0_0_14px_rgba(34,211,238,0.18)]">
      <span className="flex items-center gap-1">
        <Icon size={12} className="text-cyan-300" />
        {label}
      </span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-cyan-500/45 bg-[linear-gradient(180deg,rgba(4,34,56,0.96),rgba(3,22,38,0.98))] px-2 py-1 text-xs font-bold text-cyan-50 outline-none transition hover:border-cyan-300/70 focus:border-cyan-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
