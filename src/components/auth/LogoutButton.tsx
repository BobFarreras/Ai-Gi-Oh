// src/components/auth/LogoutButton.tsx - Botón cliente para cerrar sesión de forma segura desde secciones protegidas.
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutCurrentUser } from "@/services/auth/auth-http-client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Cerrar sesión"
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
      className="border border-rose-500/55 bg-rose-950/40 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-rose-200 transition hover:bg-rose-900/55 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
    >
      {isPending ? "Saliendo..." : "Salir"}
    </button>
  );
}
