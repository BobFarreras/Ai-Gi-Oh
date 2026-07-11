// src/components/hub/HubChatButton.tsx - Botón flotante del hub para entrar al chat/foro de comunidad.
"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";

interface HubChatButtonProps {
  onActionSound?: () => void;
}

export function HubChatButton({ onActionSound }: HubChatButtonProps) {
  return (
    <Link
      href="/hub/chat"
      aria-label="Abrir el chat de comunidad"
      onClick={() => onActionSound?.()}
      className="flex h-12 items-center justify-center gap-2 border border-cyan-500/50 bg-[#030914]/85 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition-all hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] sm:text-xs"
      style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}
    >
      <MessagesSquare className="h-4 w-4" />
      <span className="hidden sm:inline">Chat</span>
    </Link>
  );
}
