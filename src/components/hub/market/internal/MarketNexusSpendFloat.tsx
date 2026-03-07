// src/components/hub/market/internal/MarketNexusSpendFloat.tsx - Flotante de gasto Nexus reutilizable para compras de mercado y packs.
"use client";

import { motion } from "framer-motion";

interface MarketNexusSpendFloatProps {
  amount: number;
  triggerId: number;
  className?: string;
}

export function MarketNexusSpendFloat({ amount, triggerId, className }: MarketNexusSpendFloatProps) {
  if (triggerId <= 0) return null;

  return (
    <motion.span
      key={triggerId}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: -52, scale: 1.05 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.14, ease: "easeOut" }}
      className={`pointer-events-none absolute z-[180] text-sm font-black tracking-wide text-rose-300 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)] ${className ?? ""}`}
    >
      -{amount} NX
    </motion.span>
  );
}
