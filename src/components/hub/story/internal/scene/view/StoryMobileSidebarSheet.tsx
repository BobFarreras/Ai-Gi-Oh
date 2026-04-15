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
  return info.offset.x > 96 || info.velocity.x > 460;
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
              className="absolute inset-0 z-[45] bg-black/45"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.2 }}
              onDragEnd={(_, info) => {
                if (shouldCloseByDrag(info)) props.onClose();
              }}
              className="absolute bottom-[calc(env(safe-area-inset-bottom)+94px)] right-0 top-[calc(env(safe-area-inset-top)+56px)] z-[55] w-[min(86vw,420px)] overflow-hidden rounded-l-2xl border-l border-cyan-400/50 bg-black/95 pb-[env(safe-area-inset-bottom)] touch-pan-x"
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
                shouldShowExitButton={false}
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
