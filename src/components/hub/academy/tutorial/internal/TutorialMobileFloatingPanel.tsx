// src/components/hub/academy/tutorial/internal/TutorialMobileFloatingPanel.tsx - Panel flotante móvil de acciones rápidas del mapa tutorial.
"use client";

import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { TutorialQuickCompleteAction } from "@/components/hub/academy/tutorial/internal/TutorialQuickCompleteAction";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";

interface ITutorialMobileFloatingPanelProps {
  isTutorialAlreadyCompleted: boolean;
}

/**
 * Mantiene controles críticos accesibles en móvil sin tapar la interacción del mapa.
 */
export function TutorialMobileFloatingPanel({ isTutorialAlreadyCompleted }: ITutorialMobileFloatingPanelProps) {
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-[170] flex justify-center px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-2">
        <TutorialQuickCompleteAction isAlreadyCompleted={isTutorialAlreadyCompleted} />
        <AcademyBackButton label="Volver a Academy" href={ACADEMY_HOME_ROUTE} className="w-full justify-center" />
      </div>
    </footer>
  );
}
