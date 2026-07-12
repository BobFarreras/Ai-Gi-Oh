// src/components/hub/community/DirectConversationsClient.tsx - Lista de conversaciones privadas (estilo
// bandeja de WhatsApp): avatar, último mensaje, hora y contador de no-leídos. Tocar abre la conversación.
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { IDirectConversation } from "@/core/entities/chat/IDirectMessage";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { useDirectConversationsLive } from "@/core/hooks/chat/use-direct-conversations-live";

interface DirectConversationsClientProps {
  conversations: IDirectConversation[];
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function DirectConversationsClient({ conversations: initialConversations }: DirectConversationsClientProps) {
  const conversations = useDirectConversationsLive(initialConversations);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
      <header className="flex shrink-0 items-center gap-3 border border-cyan-500/40 bg-[#03101c]/90 px-3 py-2.5">
        <Link href="/hub/chat" aria-label="Volver al canal" className="flex h-9 w-9 items-center justify-center border border-cyan-500/45 bg-[#03101c]/90 text-cyan-200 transition hover:border-cyan-300/90">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300/80">Mensajes privados</p>
          <p className="font-display text-lg uppercase tracking-[0.14em] text-cyan-50">Bandeja</p>
        </div>
      </header>

      <section className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto border border-cyan-900/45 bg-[#020a14]/85 p-2.5">
        {conversations.length === 0 ? (
          <div className="m-auto flex max-w-xs flex-col items-center gap-2 text-center">
            <MessageSquarePlus className="h-8 w-8 text-cyan-600" />
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-500/70">
              Aún no tienes conversaciones. Ábrelas desde el canal de comunidad tocando “Mensaje” junto a un jugador conectado.
            </p>
            <Link href="/hub/chat" className="mt-1 rounded border border-cyan-500/50 bg-cyan-950/30 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-900/40">
              Ir al canal
            </Link>
          </div>
        ) : (
          conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/hub/chat/dm/${conversation.id}`}
              className="flex items-center gap-3 rounded-lg border border-cyan-900/40 bg-[#03141f]/70 px-3 py-2.5 transition hover:border-cyan-600/50 hover:bg-[#04202f]/80"
            >
              {conversation.otherAvatarUrl ? (
                <Image src={conversation.otherAvatarUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full border border-cyan-800/50 object-cover" />
              ) : (
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-800/50 bg-gradient-to-br text-sm font-black text-white ${getAvatarGradientClasses(conversation.otherPlayerId).from} ${getAvatarGradientClasses(conversation.otherPlayerId).to}`}>
                  {getAvatarInitial(conversation.otherNickname)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold text-cyan-100">{conversation.otherNickname}</p>
                  <span className="shrink-0 font-mono text-[9px] text-slate-500">{formatWhen(conversation.lastMessageAtIso)}</span>
                </div>
                <p className="truncate text-xs text-slate-400">{conversation.lastMessagePreview || "Sin mensajes todavía"}</p>
              </div>
              {conversation.unreadCount > 0 ? (
                <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-black text-[#02120a]">
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                </span>
              ) : null}
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
