// src/components/hub/story/internal/scene/view/StoryMobileSidebarSheet.tsx - Drawer móvil del panel táctico Story sin afectar el layout desktop.
"use client";
import { AnimatePresence, PanInfo, motion } from "framer-motion";
import { StorySidebar } from "@/components/hub/story/internal/scene/panels/StorySidebar";
import { IStorySceneSidebarViewProps } from "./story-scene-view-props";

interface IStoryMobileSidebarSheetProps extends IStorySceneSidebarViewProps {
  isOpen: boolean;
  onClose: () => void;
}

function shouldCloseByDrag(info: PanInfo): boolean {
  return info.offset.y > 120 || info.velocity.y > 520;
}

export function StoryMobileSidebarSheet(props: IStoryMobileSidebarSheetProps) {
  return (
    <>
      <AnimatePresence>
        {props.isOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar panel táctico"
              onClick={props.onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/55"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.22 }}
              onDragEnd={(_, info) => {
                if (shouldCloseByDrag(info)) props.onClose();
              }}
              className="absolute inset-x-0 bottom-0 z-50 h-[min(78dvh,820px)] overflow-hidden rounded-t-2xl border-t border-cyan-400/50 bg-black/95 pb-[env(safe-area-inset-bottom)] touch-pan-y"
            >
              <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-cyan-300/55" />
              <StorySidebar
                briefing={props.briefing}
                selectedNode={props.selectedNode}
                isMoving={props.isBusy}
                movementError={props.movementError}
                interactionFeedback={props.interactionFeedback}
                smartActionLabel={props.smartActionLabel}
                canRunSmartAction={props.canRunSmartAction}
                isCompactMode
                onExitToHub={props.onExitToHub}
                onSmartAction={props.onSmartAction}
                onDeselect={props.onDeselect}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
