"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutCurrentUser } from "@/services/auth/auth-http-client";
import { Power } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Desconectar del Hub"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await logoutCurrentUser();
          if (!result.ok) {
            return;
          }
          router.push("/login");
          router.refresh();
        })
      }
      className="group relative flex h-12 items-center justify-center gap-2.5 border border-red-500/50 bg-[#120202]/80 px-6 font-mono text-xs font-black uppercase tracking-[0.2em] text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md transition-all hover:border-red-400 hover:bg-red-950/60 hover:text-red-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
    >
      {/* Scanline interno para textura de hardware */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(239,68,68,0.15)_50%)] bg-[length:100%_4px] opacity-40" />
      
      {/* Icono de encendido (gira al hacer clic) */}
      <Power className={`h-4 w-4 ${isPending ? "animate-spin text-red-300" : "animate-pulse"}`} />
      
      {/* Texto principal */}
      <span className="relative z-10 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
        {isPending ? "Desconectando" : "Desconectar"}
      </span>
      
      {/* Muescas decorativas industriales en la esquina inferior derecha */}
      <div className="absolute bottom-1 right-2 flex gap-0.5 opacity-50">
        <div className="h-1 w-1 bg-red-500" />
        <div className="h-1 w-2 bg-red-500" />
      </div>
    </button>
  );
}