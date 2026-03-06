// src/components/auth/LogoutButton.tsx - Botón de cierre de sesión reutilizable con modo compacto e interfaz de confirmación.
"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutCurrentUser } from "@/services/auth/auth-http-client";
import { Power } from "lucide-react";
import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";

interface LogoutButtonProps {
  iconOnly?: boolean;
  confirmBeforeLogout?: boolean;
}

export function LogoutButton({ iconOnly = false, confirmBeforeLogout = false }: LogoutButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const runLogout = useCallback(() => {
    startTransition(async () => {
      const result = await logoutCurrentUser();
      if (!result.ok) return;
      setIsDialogOpen(false);
      router.push("/login");
      router.refresh();
    });
  }, [router]);

  return (
    <>
      <button
        type="button"
        aria-label="Desconectar del Hub"
        disabled={isPending}
        onClick={() => {
          if (confirmBeforeLogout) {
            setIsDialogOpen(true);
            return;
          }
          runLogout();
        }}
        className={`group relative flex h-12 items-center justify-center border border-red-500/50 bg-[#120202]/80 font-mono text-xs font-black uppercase text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md transition-all hover:border-red-400 hover:bg-red-950/60 hover:text-red-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] disabled:cursor-not-allowed disabled:opacity-50 ${
          iconOnly ? "w-12 px-0 tracking-normal" : "gap-2.5 px-6 tracking-[0.2em]"
        }`}
        style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(239,68,68,0.15)_50%)] bg-[length:100%_4px] opacity-40" />
        <Power className={`h-4 w-4 ${isPending ? "animate-spin text-red-300" : "animate-pulse"}`} />
        {!iconOnly ? (
          <>
            <span className="relative z-10 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
              {isPending ? "Desconectando" : "Desconectar"}
            </span>
            <div className="absolute bottom-1 right-2 flex gap-0.5 opacity-50">
              <div className="h-1 w-1 bg-red-500" />
              <div className="h-1 w-2 bg-red-500" />
            </div>
          </>
        ) : null}
      </button>
      <LogoutConfirmDialog
        isOpen={isDialogOpen}
        isPending={isPending}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={runLogout}
      />
    </>
  );
}
