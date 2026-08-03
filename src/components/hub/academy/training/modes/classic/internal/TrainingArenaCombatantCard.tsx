// src/components/hub/academy/training/modes/classic/internal/TrainingArenaCombatantCard.tsx - Presenta un duelista en el lobby clásico.
"use client";
import Image from "next/image";
import { motion } from "framer-motion";

interface ITrainingArenaCombatantCardProps {
  alignment: "player" | "opponent";
  name: string;
  imageUrl: string;
}

/** Unifica la tarjeta de ambos duelistas y conserva sus identidades cromáticas. */
export function TrainingArenaCombatantCard({ alignment, name, imageUrl }: ITrainingArenaCombatantCardProps) {
  const isPlayer = alignment === "player";
  const cardClass = isPlayer
    ? "order-1 border-cyan-300/45 bg-[#05192d]/90"
    : "order-3 border-rose-300/45 bg-[#230b17]/90";
  const cornerClass = isPlayer ? "border-cyan-300/55" : "border-rose-300/55";
  const labelClass = isPlayer ? "text-cyan-200" : "text-rose-200";
  const frameClass = isPlayer ? "border-cyan-200/30" : "border-rose-200/30";
  return (
    <motion.article
      initial={{ x: isPlayer ? -34 : 34, y: 20, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.46, ease: "easeOut", delay: isPlayer ? 0.08 : 0.14 }}
      className={`relative flex min-h-0 flex-col rounded-2xl border p-2.5 shadow-2xl md:order-none md:block md:p-3 ${cardClass}`}
    >
      <div className={`pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t ${cornerClass}`} />
      <div className={`pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r ${cornerClass}`} />
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${labelClass}`}>{name}</p>
      <div className={`mt-2 flex min-h-0 flex-1 rounded-xl border bg-black/20 p-1.5 md:block ${frameClass}`}>
        <div className={`h-full w-full overflow-hidden rounded-lg border bg-black/40 md:aspect-[4/3] md:h-auto ${frameClass}`}>
          <Image src={imageUrl} alt={`Avatar de ${name}`} width={540} height={720} className="h-full w-full object-cover object-center" priority />
        </div>
      </div>
    </motion.article>
  );
}
