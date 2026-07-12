// src/components/hub/HubChatButton.tsx - Botón flotante del hub para entrar al chat/foro de comunidad.
// Muestra un badge con los mensajes privados no leídos (en vivo).
"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { useUnreadDirectMessages } from "@/core/hooks/chat/use-unread-direct-messages";

interface HubChatButtonProps {
  onActionSound?: () => void;
}

export function HubChatButton({ onActionSound }: HubChatButtonProps) {
  const unread = useUnreadDirectMessages();
  // El badge va FUERA del Link porque su clip-path octagonal recortaría cualquier hijo que sobresalga.
  return (
    <div className="relative inline-flex">
      <Link
        href="/hub/chat"
        aria-label={unread > 0 ? `Abrir el chat (${unread} mensajes privados sin leer)` : "Abrir el chat de comunidad"}
        onClick={() => onActionSound?.()}
        className="flex h-12 items-center justify-center gap-2 border border-cyan-500/50 bg-[#030914]/85 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition-all hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] sm:text-xs"
        style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}
      >
        <MessagesSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Chat</span>
      </Link>
      {unread > 0 ? (
        <span className="pointer-events-none absolute -right-2 -top-2 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.7)] ring-2 ring-[#030914]">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </div>
  );
}
