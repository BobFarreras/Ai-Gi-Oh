// src/app/hub/loading.tsx - Skeleton instantáneo durante la carga de datos del servidor en el hub.
export default function HubLoading() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#010610]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-lg border border-cyan-500/40 bg-[#041120]/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/80">
          Cargando hub...
        </div>
      </div>
    </div>
  );
}
