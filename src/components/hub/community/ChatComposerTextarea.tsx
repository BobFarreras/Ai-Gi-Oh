// src/components/hub/community/ChatComposerTextarea.tsx - Campo de escritura del chat estilo WhatsApp:
// multilínea con auto-crecimiento, y Enter=enviar en escritorio / Shift+Enter (y Enter en táctil) = salto de línea.
"use client";

import { forwardRef, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/core/services/chat/validate-chat-message";

/** Alto máximo antes de hacer scroll interno (~6 líneas): evita que el composer se coma la conversación. */
const MAX_HEIGHT_PX = 140;

interface ChatComposerTextareaProps {
  value: string;
  onChange: (value: string) => void;
  /** Enviar el mensaje (mismo camino que el botón / submit del form). */
  onSubmit: () => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}

export const ChatComposerTextarea = forwardRef<HTMLTextAreaElement, ChatComposerTextareaProps>(
  function ChatComposerTextarea({ value, onChange, onSubmit, placeholder, ariaLabel, className }, forwardedRef) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (node: HTMLTextAreaElement | null): void => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    // Auto-crecimiento: se recalcula con cada cambio de `value` (también al vaciarse tras enviar).
    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [value]);

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
      // Shift+Enter y la composición IME siempre insertan salto de línea, no envían.
      if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
      // En pantallas táctiles (móvil, como WhatsApp) Enter hace salto de línea; el envío es por el botón.
      if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
      event.preventDefault();
      onSubmit();
    };

    return (
      <textarea
        ref={setRefs}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, CHAT_MESSAGE_MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        className={cn(
          "home-modern-scroll w-full resize-none overflow-y-auto rounded-lg border border-cyan-900/60 bg-[#020a14] px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none transition focus:border-cyan-400 placeholder:text-slate-600",
          className,
        )}
      />
    );
  },
);
