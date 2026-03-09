// src/components/game/board/ui/internal/duel-result-overlay/DuelResultActionButton.tsx - Botón de salida/reinicio con estilo unificado para desktop y móvil.
interface IDuelResultActionButtonProps {
  label: string;
  onClick: () => void;
  className: string;
}

export function DuelResultActionButton({ label, onClick, className }: IDuelResultActionButtonProps) {
  return (
    <button onClick={onClick} className={className} aria-label={label}>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[bg-pan_3s_linear_infinite]" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}
