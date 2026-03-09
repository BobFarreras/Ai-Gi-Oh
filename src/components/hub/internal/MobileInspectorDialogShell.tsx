// src/components/hub/internal/MobileInspectorDialogShell.tsx - Shell reutilizable para diálogos mobile con animación desde punto de origen.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { IInspectorOrigin, resolveInspectorAnimationOffset } from "@/components/hub/internal/mobile-inspector-animation";

interface MobileInspectorDialogShellProps {
  isOpen: boolean;
  origin: IInspectorOrigin;
  onClose: () => void;
  onRequestClose?: (source: "overlay" | "button") => void;
  closeAriaLabel: string;
  overlayTopClassName: string;
  panelTopClassName: string;
  isDismissDisabled?: boolean;
  disableMotion?: boolean;
  children: React.ReactNode;
}

export function MobileInspectorDialogShell({
  isOpen,
  origin,
  onClose,
  onRequestClose,
  closeAriaLabel,
  overlayTopClassName,
  panelTopClassName,
  isDismissDisabled = false,
  disableMotion = false,
  children,
}: MobileInspectorDialogShellProps) {
  const animationOffset = resolveInspectorAnimationOffset(origin);
  const requestClose = (source: "overlay" | "button") => {
    onRequestClose?.(source);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={disableMotion ? false : { opacity: 0 }}
          animate={disableMotion ? { opacity: 1 } : { opacity: 1 }}
          exit={disableMotion ? { opacity: 0 } : { opacity: 0 }}
          onClick={isDismissDisabled ? undefined : () => requestClose("overlay")}
          className={`fixed inset-x-0 bottom-0 z-[220] bg-black/52 xl:hidden ${overlayTopClassName}`}
        >
          <motion.div
            initial={disableMotion ? false : { opacity: 0, scale: 0.2, x: animationOffset.x, y: animationOffset.y }}
            animate={disableMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={disableMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            transition={disableMotion ? { duration: 0.12 } : { duration: 0.3, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className={`fixed bottom-[max(8px,env(safe-area-inset-bottom))] left-2 right-2 mx-auto flex max-w-lg flex-col overflow-hidden rounded-xl border border-cyan-500/45 bg-[#020a14] shadow-[0_0_40px_rgba(0,0,0,0.65)] ${panelTopClassName}`}
          >
            <button
              type="button"
              aria-label={closeAriaLabel}
              disabled={isDismissDisabled}
              onClick={() => requestClose("button")}
              className="absolute right-3 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-md border border-cyan-400/60 bg-[#03172b] text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
            </button>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
