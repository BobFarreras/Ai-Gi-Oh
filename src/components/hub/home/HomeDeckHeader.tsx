// src/components/hub/home/HomeDeckHeader.tsx - Encabezado futurista de Mi Home con estado de progreso del deck.
interface HomeDeckHeaderProps {
  filledCards: number;
}

export function HomeDeckHeader({ filledCards }: HomeDeckHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-cyan-700/45 bg-[#041120]/88 px-5 py-4 shadow-[0_0_26px_rgba(8,145,178,0.2)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.08),transparent_45%,rgba(59,130,246,0.08))]" />
      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300/85">Deck Control Hub</p>
          <h1 className="text-3xl font-black uppercase tracking-wider text-cyan-100">Mi Home</h1>
          <p className="mt-1 text-sm font-medium text-slate-200">Construye tu mazo con 20 cartas y máximo 3 copias por carta.</p>
        </div>
        <div className="rounded-lg border border-cyan-600/45 bg-[#071a30] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Deck Ready</p>
          <p className="text-xl font-black text-cyan-100">{filledCards}/20</p>
        </div>
      </div>
    </header>
  );
}
