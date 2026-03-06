// src/components/ui/GameSelect.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronDown } from "lucide-react";

interface GameSelectOption {
  label: string;
  value: string;
}

interface GameSelectProps {
  label: string;
  value: string;
  options: GameSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  Icon: LucideIcon;
}

export function GameSelect({ label, value, options, onChange, ariaLabel, Icon }: GameSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    // REFACTOR CLAVE: Cambiado de w-[165px] a w-full. Esto elimina los solapamientos.
    <div ref={containerRef} className="relative flex w-full min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80 pl-1">
        <Icon size={12} className="text-cyan-400" />
        {label}
      </span>

      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-cyan-500/40 bg-[linear-gradient(180deg,rgba(4,34,56,0.8),rgba(3,22,38,0.9))] px-3 py-2 text-xs font-bold text-cyan-50 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)] outline-none transition-all hover:border-cyan-300/80 focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] backdrop-blur-md"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <ChevronDown size={14} className="text-cyan-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="origin-top absolute top-full left-0 right-0 z-50 mt-2 max-h-48 overflow-y-auto rounded-xl border border-cyan-400/50 bg-[#020a14]/95 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(34,211,238,0.2)] backdrop-blur-xl custom-scrollbar"
            role="listbox"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`relative cursor-pointer px-3 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-cyan-900/50 text-cyan-100"
                      : "text-cyan-200/60 hover:bg-cyan-900/30 hover:text-cyan-100 hover:pl-4"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" />
                  )}
                  {option.label}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}