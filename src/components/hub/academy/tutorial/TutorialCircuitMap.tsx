// src/components/hub/academy/tutorial/TutorialCircuitMap.tsx - Muestra la cuadrícula de nodos tutorial y aplica modo guiado opcional por nodo.
"use client";

import { motion, Variants } from "framer-motion";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";
import { TutorialNodeCard } from "./TutorialNodeCard";

interface ITutorialCircuitMapProps {
  nodes: ITutorialMapNodeRuntime[];
  guidedNodeId?: string | null;
}

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
};

export function TutorialCircuitMap({ nodes, guidedNodeId = null }: ITutorialCircuitMapProps) {
  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="show"
      className="relative z-10 w-full"
    >
      {/* Grid 2x2 estricto en desktop, 1 columna en móvil */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            variants={cardVariants}
            className={`h-full ${guidedNodeId && node.id !== guidedNodeId ? "pointer-events-none opacity-45" : ""}`}
          >
            <TutorialNodeCard
              node={node}
              isForcedSelectable={Boolean(guidedNodeId && node.id === guidedNodeId)}
              isForcedDisabled={Boolean(guidedNodeId && node.id !== guidedNodeId)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
