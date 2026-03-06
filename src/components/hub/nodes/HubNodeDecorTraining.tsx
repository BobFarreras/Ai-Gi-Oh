// src/components/hub/nodes/HubNodeDecorTraining.tsx - Decoración del dojo táctico con anillos de puntería y foco.
export function HubNodeDecorTraining() {
  return (
    <>
      <div className="absolute -left-10 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-blue-200/45" />
      <div className="absolute -left-8 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-blue-200/35" />
      <div className="absolute -left-6 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-blue-100/55 bg-blue-300/15" />
      <div className="absolute -left-5 top-1/2 h-0.5 w-12 -translate-y-1/2 bg-blue-200/55" />
    </>
  );
}
