// src/components/hub/community/DirectConversationClient.tsx - Una conversación privada 1-a-1 (estilo
// WhatsApp): mensajes en vivo, responder arrastrando (burbuja reutilizada), borrar propios y cabecera
// con el otro participante.
"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CornerUpLeft, Send, X } from "lucide-react";
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IDirectMessage } from "@/core/entities/chat/IDirectMessage";
import { CommunityChatMessage, IQuotedPreview } from "@/components/hub/community/CommunityChatMessage";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/core/services/chat/validate-chat-message";
import { useDirectConversation } from "@/core/hooks/chat/use-direct-conversation";

interface DirectConversationClientProps {
  conversationId: string;
  localPlayerId: string;
  otherNickname: string;
  otherAvatarUrl: string | null;
  initialMessages: IDirectMessage[];
}

/** Adapta un mensaje privado a la forma que espera la burbuja compartida del chat. */
function toChatMessage(message: IDirectMessage, otherNickname: string): IChatMessage {
  return {
    id: message.id,
    room: message.conversationId,
    userId: message.senderId,
    nickname: otherNickname,
    content: message.content,
    kind: message.kind === "CARD_SHARE" ? "CARD_SHARE" : "TEXT",
    metadata: message.metadata,
    replyToMessageId: message.replyToMessageId,
    createdAtIso: message.createdAtIso,
  };
}

function previewText(message: IDirectMessage): string {
  if (message.kind === "CARD_SHARE") {
    const name = typeof message.metadata.name === "string" ? message.metadata.name : "una carta";
    return `🃏 ${name}`;
  }
  return message.content;
}

export function DirectConversationClient({ conversationId, localPlayerId, otherNickname, otherAvatarUrl, initialMessages }: DirectConversationClientProps) {
  const { messages, isSending, error, send, remove, clearError } = useDirectConversation(conversationId, initialMessages);
  const [draft, setDraft] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const messagesById = useMemo(() => {
    const map = new Map<string, IDirectMessage>();
    for (const message of messages) map.set(message.id, message);
    return map;
  }, [messages]);

  const quotedByMessage = useMemo(() => {
    const map = new Map<string, IQuotedPreview>();
    for (const message of messages) {
      if (!message.replyToMessageId) continue;
      const original = messagesById.get(message.replyToMessageId);
      if (!original) continue;
      map.set(message.id, {
        nickname: otherNickname,
        preview: previewText(original),
        isOwn: original.senderId === localPlayerId,
      });
    }
    return map;
  }, [messages, messagesById, otherNickname, localPlayerId]);

  const replyingTo = replyingToId ? messagesById.get(replyingToId) ?? null : null;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  const handleReply = useCallback((messageId: string) => {
    setReplyingToId(messageId);
    inputRef.current?.focus();
  }, []);

  const handleJumpToQuoted = useCallback((messageId: string) => {
    const original = messagesById.get(messageId)?.replyToMessageId;
    if (!original) return;
    const node = scrollRef.current?.querySelector(`[data-message-id="${original}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.classList.add("chat-quote-flash");
    window.setTimeout(() => node.classList.remove("chat-quote-flash"), 1200);
  }, [messagesById]);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;
    const ok = await send({ content, replyToMessageId: replyingToId });
    if (ok) {
      setDraft("");
      setReplyingToId(null);
    }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
      {/* Cabecera con el otro participante */}
      <header className="flex shrink-0 items-center gap-3 border border-cyan-500/40 bg-[#03101c]/90 px-3 py-2.5">
        <Link href="/hub/chat/dm" aria-label="Volver a mensajes" className="flex h-9 w-9 items-center justify-center border border-cyan-500/45 bg-[#03101c]/90 text-cyan-200 transition hover:border-cyan-300/90">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {otherAvatarUrl ? (
          <Image src={otherAvatarUrl} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full border border-cyan-800/50 object-cover" />
        ) : (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-800/50 bg-gradient-to-br text-sm font-black text-white ${getAvatarGradientClasses(conversationId).from} ${getAvatarGradientClasses(conversationId).to}`}>
            {getAvatarInitial(otherNickname)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-base uppercase tracking-[0.1em] text-cyan-50">{otherNickname}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/70">Mensaje privado</p>
        </div>
      </header>

      {/* Conversación */}
      <section className="relative flex min-h-0 flex-1 flex-col border border-cyan-900/45 bg-[#020a14]/85">
        <div ref={scrollRef} className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3 sm:p-4">
          {messages.length === 0 ? (
            <p className="m-auto max-w-xs text-center font-mono text-xs uppercase tracking-widest text-cyan-500/60">
              Escribe el primer mensaje.
            </p>
          ) : (
            messages.map((message) => (
              <div key={message.id} data-message-id={message.id} className="rounded transition-colors">
                <CommunityChatMessage
                  message={toChatMessage(message, otherNickname)}
                  isOwn={message.senderId === localPlayerId}
                  quoted={quotedByMessage.get(message.id) ?? null}
                  hideReactions
                  onRemove={remove}
                  onReply={handleReply}
                  onJumpToQuoted={handleJumpToQuoted}
                />
              </div>
            ))
          )}
        </div>

        {error ? (
          <button type="button" onClick={clearError} className="mx-3 mb-2 shrink-0 rounded border border-rose-500/50 bg-rose-950/50 px-3 py-1.5 text-left text-xs font-semibold text-rose-200">
            {error} · (toca para cerrar)
          </button>
        ) : null}

        {/* Vista previa de la respuesta */}
        {replyingTo ? (
          <div className="mx-2.5 mb-1 flex shrink-0 items-center gap-2 border-l-2 border-cyan-400/70 bg-cyan-950/30 px-2.5 py-1.5 sm:mx-3">
            <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] font-black uppercase tracking-wider text-cyan-300/90">
                Respondiendo a {replyingTo.senderId === localPlayerId ? "ti" : otherNickname}
              </p>
              <p className="truncate text-[11px] text-slate-300">{previewText(replyingTo)}</p>
            </div>
            <button type="button" aria-label="Cancelar respuesta" onClick={() => setReplyingToId(null)} className="shrink-0 text-slate-500 transition hover:text-rose-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t border-cyan-900/50 bg-[#03101c]/80 p-2.5 sm:p-3">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, CHAT_MESSAGE_MAX_LENGTH))}
            placeholder="Escribe un mensaje privado…"
            aria-label="Escribe un mensaje privado"
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            className="flex-1 rounded-lg border border-cyan-900/60 bg-[#020a14] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400 placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            aria-label="Enviar"
            className="flex h-[42px] items-center gap-1.5 border border-cyan-400/60 bg-cyan-500/15 px-4 font-mono text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </section>
    </div>
  );
}
