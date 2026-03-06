"use client";

import { motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { CardBack } from "@/components/game/card/CardBack";

interface OpponentHandProps {
    hand: ICard[];
}

interface OpponentHandProps {
    hand: ICard[];
}

export function OpponentHand({ hand }: OpponentHandProps) {
    return (
        <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 flex justify-center items-start z-30 pointer-events-none perspective-[1000px]">
            {hand.map((_, i) => {
                const total = hand.length;
                const center = (total - 1) / 2;
                const offset = i - center;

                // LA FÓRMULA DEL ABANICO CERRADO:
                const rotation = offset * 15; // Más grados = más curva de abanico
                const yPos = Math.abs(offset) * Math.abs(offset) * 4; // Caída suave en los extremos
                const xPos = offset * 20; // Menor valor = cartas mucho más juntas

                return (
                    <motion.div
                        key={`op-hand-${i}`}
                        // Framer Motion ahora controla la escala (35%) para evitar la caja negra
                        initial={{ y: -100, scale: 0.35 }}
                        animate={{ y: yPos, x: xPos, rotate: rotation, scale: 0.35 }}
                        className="origin-top absolute"
                        style={{ zIndex: 10 - Math.abs(offset) }}
                    >
                        {/* Le damos una sombra pesada directamente al CardBack */}
                        <CardBack className="shadow-[0_20px_50px_rgba(0,0,0,0.9)]" />
                    </motion.div>
                );
            })}
        </div>
    );
}