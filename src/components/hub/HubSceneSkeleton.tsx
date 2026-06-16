// src/components/hub/HubSceneSkeleton.tsx - Skeleton visual-neutral del hub mientras se hidrata o carga el mundo 3D.
export function HubSceneSkeleton() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#010610]">
      <div className="rounded-lg border border-cyan-500/40 bg-[#041120]/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/80">
        Cargando hub...
      </div>
    </div>
  );
}
