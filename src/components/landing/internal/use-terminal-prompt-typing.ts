// src/components/landing/internal/use-terminal-prompt-typing.ts - Hook de escritura progresiva para líneas y ayuda del prompt terminal.
"use client";

import { useEffect, useRef, useState } from "react";
import { TERMINAL_HELP_TEXT, TERMINAL_TEXT } from "@/components/landing/internal/terminal-prompt-copy";

export function useTerminalPromptTyping(isReadyForInput: boolean, onInputReady?: () => void) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isHelpTyping, setIsHelpTyping] = useState(false);
  const [helpCharIndex, setHelpCharIndex] = useState(0);
  const [isHelpCompleted, setIsHelpCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTyping = currentLineIndex < TERMINAL_TEXT.length;

  useEffect(() => {
    if (!isTyping) onInputReady?.();
  }, [isTyping, onInputReady]);

  useEffect(() => {
    if (isTyping || isHelpCompleted || isHelpTyping) return;
    const timeoutId = window.setTimeout(() => { setIsHelpTyping(true); setHelpCharIndex(0); }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [isHelpCompleted, isHelpTyping, isTyping]);

  useEffect(() => {
    if (!isHelpTyping || isHelpCompleted) return;
    if (helpCharIndex < TERMINAL_HELP_TEXT.length) {
      const timeoutId = window.setTimeout(() => setHelpCharIndex((previous) => previous + 1), Math.random() * 10 + 8);
      return () => window.clearTimeout(timeoutId);
    }
    const finalizeTimeout = window.setTimeout(() => {
      setDisplayedLines((previous) => [...previous, TERMINAL_HELP_TEXT]);
      setIsHelpTyping(false);
      setIsHelpCompleted(true);
    }, 120);
    return () => window.clearTimeout(finalizeTimeout);
  }, [helpCharIndex, isHelpCompleted, isHelpTyping]);

  useEffect(() => {
    if (!isTyping && isReadyForInput) {
      const focusTimeout = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(focusTimeout);
    }
    if (!isTyping) return;
    const currentFullLine = TERMINAL_TEXT[currentLineIndex];
    if (currentCharIndex < currentFullLine.length) {
      const timeout = window.setTimeout(() => setCurrentCharIndex((prev) => prev + 1), Math.random() * 10 + 5);
      return () => window.clearTimeout(timeout);
    }
    const timeout = window.setTimeout(() => {
      setDisplayedLines((prev) => [...prev, currentFullLine]);
      setCurrentLineIndex((prev) => prev + 1);
      setCurrentCharIndex(0);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [currentLineIndex, currentCharIndex, isReadyForInput, isTyping]);

  return { inputRef, isTyping, displayedLines, currentLineIndex, currentCharIndex, isHelpTyping, helpCharIndex };
}
