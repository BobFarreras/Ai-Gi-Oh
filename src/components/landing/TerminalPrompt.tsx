// src/components/landing/TerminalPrompt.tsx - Prompt inicial de acceso que valida entrada y desbloquea el flujo narrativo.
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TERMINAL_HELP_TEXT, TERMINAL_TEXT } from "@/components/landing/internal/terminal-prompt-copy";
import { useTerminalPromptTyping } from "@/components/landing/internal/use-terminal-prompt-typing";

interface ITerminalPromptProps {
  onComplete: (code: string) => void;
  onAction?: () => void;
  onInputReady?: () => void;
}

export function TerminalPrompt({ onComplete, onAction, onInputReady }: ITerminalPromptProps) {
  const [inputValue, setInputValue] = useState("");
  const {
    inputRef,
    isTyping,
    displayedLines,
    currentLineIndex,
    currentCharIndex,
    isHelpTyping,
    helpCharIndex,
  } = useTerminalPromptTyping(true, onInputReady);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      onAction?.();
      onComplete(inputValue.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
      className="relative z-40 flex min-h-[350px] w-full max-w-2xl flex-col rounded-sm border border-cyan-500/30 bg-black/80 p-6 font-mono shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-md sm:p-10"
    >
      <div className="mb-4 flex flex-shrink-0 items-center gap-2 border-b border-cyan-900/50 pb-2 text-xs text-cyan-600">
        <div className="h-2 w-2 animate-pulse bg-red-500" />
        <span>SYS_TERMINAL // SECURE_CHANNEL_430</span>
      </div>

      <div className="flex-1 space-y-2 text-sm text-cyan-400 sm:text-base">
        {displayedLines.map((line, i) => (
          <div key={i}>{"> "}{line}</div>
        ))}
        {!isTyping && isHelpTyping ? (
          <div>
            {"> "}
            {TERMINAL_HELP_TEXT.substring(0, helpCharIndex)}
            <span className="animate-pulse bg-cyan-400 text-cyan-400">|</span>
          </div>
        ) : null}
        
        {isTyping && (
          <div>
            {"> "}{TERMINAL_TEXT[currentLineIndex].substring(0, currentCharIndex)}
            <span className="animate-pulse bg-cyan-400 text-cyan-400">|</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex-shrink-0 min-h-[40px]">
        <AnimatePresence>
          {!isTyping && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
              onSubmit={handleSubmit}
            >
              <span className="text-cyan-500">_ACCESS_CODE:</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-700"
                placeholder="Escribe aquí..."
                autoComplete="off"
              />
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
