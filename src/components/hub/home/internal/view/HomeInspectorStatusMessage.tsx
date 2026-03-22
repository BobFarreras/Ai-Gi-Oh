// src/components/hub/home/internal/view/HomeInspectorStatusMessage.tsx - Muestra feedback de éxito/error para acciones del inspector mobile.
interface IHomeInspectorStatusMessage {
  tone: "success" | "error";
  text: string;
}

interface IHomeInspectorStatusMessageProps {
  statusMessage: IHomeInspectorStatusMessage | null;
}

export function HomeInspectorStatusMessage({ statusMessage }: IHomeInspectorStatusMessageProps) {
  if (!statusMessage) return null;
  return (
    <p
      className={`mt-2 rounded px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] ${
        statusMessage.tone === "error"
          ? "border border-rose-400/45 bg-rose-950/35 text-rose-100"
          : "border border-emerald-400/40 bg-emerald-950/30 text-emerald-200"
      }`}
    >
      {statusMessage.text}
    </p>
  );
}
