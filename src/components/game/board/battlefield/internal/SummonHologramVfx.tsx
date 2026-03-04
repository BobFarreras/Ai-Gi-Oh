// src/components/game/board/battlefield/internal/SummonHologramVfx.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SummonHologramVfxProps {
  show: boolean;
}

export function SummonHologramVfx({ show }: SummonHologramVfxProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    
    // 1. CORRECCIÓN DEL WARNING DE REACT (Zero Tech Debt):
    // Diferimos el setState inicial 10ms para evitar el renderizado en cascada síncrono.
    const startId = setTimeout(() => setVisible(true), 10);
    
    // 2. HACEMOS LA ANIMACIÓN MÁS LENTA: 
    // Subimos de 980ms a 1600ms para que la entrada del holograma sea majestuosa.
    const timeoutId = setTimeout(() => setVisible(false), 1600);
    
    return () => {
      clearTimeout(startId);
      clearTimeout(timeoutId);
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
      
      {/* 1. Sombra de Entorno (Oscurece el fondo levemente) */}
      <motion.div
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 rounded-xl bg-black/60"
      />

      {/* 2. Lente del Proyector (Punto de luz intenso en la base) */}
      <motion.div
        initial={{ opacity: 1, scale: 0 }}
        animate={{ opacity: [1, 1, 0], scale: [0.1, 1.5, 3] }}
        transition={{ duration: 1.4, times: [0, 0.4, 1], ease: "easeOut" }}
        className="absolute bottom-[10%] w-6 h-6 rounded-full bg-cyan-100 blur-[2px] shadow-[0_0_30px_rgba(34,211,238,1)]"
      />

      {/* 3. EL HAZ DE LUZ HOLOGRÁFICA (LA PIRÁMIDE INVERTIDA)
          - origin-bottom: Asegura que la luz crezca disparada desde el suelo hacia arriba.
          - clip-path modificado: Ancho arriba (0% 0%, 100% 0%), punta abajo (50% 100%).
      */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0.1, scaleX: 0.2 }}
        animate={{ 
          opacity: [0, 0.9, 0], 
          scaleY: [0.1, 1.2, 1.4], // Crece mucho hacia arriba
          scaleX: [0.2, 1.5, 1.8]  // Se abre hacia los lados
        }}
        transition={{ duration: 1.4, times: [0, 0.4, 1], ease: "easeOut" }}
        className="absolute bottom-[10%] w-56 h-72 origin-bottom bg-gradient-to-t from-cyan-300/90 via-cyan-300/30 to-transparent [clip-path:polygon(0%_0%,100%_0%,50%_100%)] blur-[3px]"
      />

      {/* 4. Anillos Expansivos en el suelo (Efecto Escáner 3D) 
          Usamos rotateX(70deg) para que los anillos se tumben en perspectiva sobre el tablero.
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0.1, rotateX: 70 }}
        animate={{ opacity: [0, 0.8, 0], scale: [0.1, 1.8, 2.5] }}
        transition={{ delay: 0.1, duration: 1.3, times: [0, 0.3, 1], ease: "easeOut" }}
        className="absolute bottom-[10%] w-56 h-56 rounded-full border-2 border-cyan-300/80"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.1, rotateX: 70 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.1, 2.5, 3.5] }}
        transition={{ delay: 0.3, duration: 1.2, times: [0, 0.3, 1], ease: "easeOut" }}
        className="absolute bottom-[10%] w-56 h-56 rounded-full border border-cyan-200/40"
      />

    </div>
  );
}