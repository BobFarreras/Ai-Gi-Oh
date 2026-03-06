// src/components/hub/nodes/HubNodeDecorMultiplayer.tsx - Decoración de terminal táctica con radar dinámico para multijugador.
export function HubNodeDecorMultiplayer() {
  return (
    <>
      <div className="absolute -right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border border-emerald-200/45 bg-emerald-400/10" />
      <div className="absolute -right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border border-emerald-200/30 animate-[ping_3.4s_linear_infinite]" />
      <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-5 rounded-full bg-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      <div className="absolute right-5 top-1/2 h-1.5 w-1.5 translate-y-2 rounded-full bg-emerald-200/80 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
    </>
  );
}
