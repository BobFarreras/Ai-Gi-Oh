import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";

interface CardHologramProps {
  card: ICard;
  isDefense: boolean;
}

export function CardHologram({ card, isDefense }: CardHologramProps) {
  const isExecution = card.type === "EXECUTION";

  if (!card.renderUrl) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex justify-center items-center" style={{ transformStyle: "preserve-3d" }}>
      <motion.div
        className="absolute bottom-[-10px] flex flex-col items-center justify-end pointer-events-none"
        style={{ width: "200%", height: "450px", transformOrigin: "bottom center", transform: isDefense ? "rotateZ(90deg)" : "none" }}
        initial={{ rotateX: -55 }}
        animate={{ rotateX: -55, y: [0, -15, 0] }}
        transition={{ y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
      >
        <div className="absolute bottom-24 w-[70%] h-[50%] bg-cyan-400/50 blur-[50px] rounded-full animate-pulse z-0 mix-blend-screen" />
        <div className="absolute bottom-16 w-[50%] h-[40%] bg-blue-600/60 blur-[60px] rounded-full animate-[pulse_2s_ease-in-out_infinite] z-0 mix-blend-screen" />

        <Image
          src={card.renderUrl}
          alt={`Render 3D de ${card.name}`}
          width={520}
          height={300}
          className="relative z-10 w-full h-[300px] object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]"
        />

        <div className="relative z-20 flex gap-4 mt-2 bg-black/95 p-3 rounded-2xl border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.5)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,1)]" />
            <span className="font-black text-white text-2xl">{card.cost}</span>
          </div>

          {!isExecution && (
            <>
              <div className="w-px h-8 bg-white/20 mx-1" />
              <div className="flex items-center gap-2">
                <Sword className="w-6 h-6 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,1)]" />
                <span className="font-black text-white text-2xl">{card.attack ?? 0}</span>
              </div>
              <div className="w-px h-8 bg-white/20 mx-1" />
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,1)]" />
                <span className="font-black text-white text-2xl">{card.defense ?? 0}</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
