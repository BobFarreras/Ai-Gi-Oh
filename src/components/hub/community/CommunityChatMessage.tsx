// src/components/hub/community/CommunityChatMessage.tsx - Una burbuja del chat de comunidad: soporta
// arrastrar-para-responder (estilo WhatsApp) con fallback accesible, bloque citado, compartir carta y
// reacciones. Memoizada: escribir en el input o abrir la paleta de otro mensaje no la re-renderiza.
"use client";

import { memo, useRef, useState } from "react";
import { CornerUpLeft, SmilePlus, Trash2 } from "lucide-react";
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatMessageReactionSummary } from "@/core/entities/chat/IChatMessageReaction";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { reconstructSharedCard } from "@/components/hub/community/reconstruct-shared-card";

/** Vista previa del mensaje citado (autor + extracto), resuelta por el contenedor. */
export interface IQuotedPreview {
  nickname: string;
  preview: string;
  isOwn: boolean;
}

interface CommunityChatMessageProps {
  message: IChatMessage;
  isOwn: boolean;
  reactions: IChatMessageReactionSummary[];
  quoted: IQuotedPreview | null;
  isPaletteOpen: boolean;
  reactionEmojis: readonly string[];
  onOpenPalette: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onRemove: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onJumpToQuoted: (messageId: string) => void;
}

const DRAG_TRIGGER_PX = 48;
const DRAG_MAX_PX = 72;

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function CommunityChatMessageBase({
  message,
  isOwn,
  reactions,
  quoted,
  isPaletteOpen,
  reactionEmojis,
  onOpenPalette,
  onToggleReaction,
  onRemove,
  onReply,
  onJumpToQuoted,
}: CommunityChatMessageProps) {
  // Gesto de arrastre horizontal para responder. `touch-action: pan-y` deja el scroll vertical intacto.
  const [dragX, setDragX] = useState(0);
  const dragState = useRef<{ startX: number; startY: number; axis: "none" | "x" | "y" } | null>(null);

  if (message.kind === "SYSTEM") {
    return (
      <p className="mx-auto rounded border border-fuchsia-500/40 bg-fuchsia-950/30 px-3 py-1 text-center font-mono text-[11px] uppercase tracking-widest text-fuchsia-200">
        {message.content}
      </p>
    );
  }

  const sharedCard = message.kind === "CARD_SHARE" ? reconstructSharedCard(message.metadata) : null;

  const handlePointerDown = (event: React.PointerEvent): void => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragState.current = { startX: event.clientX, startY: event.clientY, axis: "none" };
  };

  const handlePointerMove = (event: React.PointerEvent): void => {
    const state = dragState.current;
    if (!state) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (state.axis === "none") {
      if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
        // Movimiento vertical: es scroll, no un swipe. Se cancela el gesto.
        dragState.current = null;
        return;
      }
      if (Math.abs(dx) > 8) state.axis = "x";
    }
    if (state.axis === "x") setDragX(Math.max(0, Math.min(dx, DRAG_MAX_PX)));
  };

  const endDrag = (): void => {
    if (dragX >= DRAG_TRIGGER_PX) onReply(message.id);
    dragState.current = null;
    setDragX(0);
  };

  return (
    <div className={`group relative flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      {/* Indicador de "responder" que se revela al arrastrar. */}
      <div
        className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 items-center text-cyan-300"
        style={{ opacity: Math.min(dragX / DRAG_TRIGGER_PX, 1) }}
        aria-hidden
      >
        <CornerUpLeft className="h-4 w-4" />
      </div>

      <div
        className="flex max-w-full flex-col"
        style={{ transform: dragX ? `translateX(${dragX}px)` : undefined, touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className={`flex items-baseline gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span className={`font-mono text-[11px] font-black uppercase tracking-wider ${isOwn ? "text-amber-300" : "text-cyan-300"}`}>
            {isOwn ? "Tú" : message.nickname}
          </span>
          <span className="font-mono text-[9px] text-slate-500">{formatTime(message.createdAtIso)}</span>
          <button
            type="button"
            aria-label="Responder a este mensaje"
            onClick={() => onReply(message.id)}
            className="text-slate-600 opacity-0 transition hover:text-cyan-300 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <CornerUpLeft className="h-3 w-3" />
          </button>
          {isOwn ? (
            <button
              type="button"
              aria-label="Borrar mensaje"
              onClick={() => onRemove(message.id)}
              className="text-slate-600 opacity-0 transition hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          ) : null}
        </div>

        {/* Bloque citado (si este mensaje responde a otro). */}
        {quoted ? (
          <button
            type="button"
            onClick={() => onJumpToQuoted(message.id)}
            className={`mt-1 flex max-w-[85%] flex-col gap-0.5 border-l-2 px-2 py-1 text-left ${
              isOwn ? "self-end border-amber-400/60 bg-amber-950/20" : "border-cyan-400/60 bg-cyan-950/20"
            }`}
          >
            <span className="font-mono text-[9px] font-black uppercase tracking-wider text-cyan-300/90">
              {quoted.isOwn ? "Tú" : quoted.nickname}
            </span>
            <span className="truncate text-[11px] text-slate-300">{quoted.preview}</span>
          </button>
        ) : null}

        {sharedCard ? (
          <div className={`mt-1 w-[92px] rounded-lg border p-1 sm:w-[104px] ${isOwn ? "self-end border-amber-500/30 bg-amber-950/20" : "border-cyan-800/40 bg-[#03141f]/80"}`}>
            <div className="aspect-[13/19] w-full">
              <CardThumbnail card={sharedCard} versionTier={sharedCard.versionTier ?? 0} level={sharedCard.level} showArtSkeleton />
            </div>
          </div>
        ) : (
          <p className={`mt-0.5 max-w-[85%] whitespace-pre-wrap break-words rounded-lg border px-3 py-1.5 text-sm ${isOwn ? "self-end border-amber-500/25 bg-amber-950/25 text-amber-50" : "border-cyan-800/40 bg-[#03141f]/80 text-slate-100"}`}>
            {message.content}
          </p>
        )}
      </div>

      <div className={`mt-1 flex flex-wrap items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            aria-label={`${reaction.emoji} (${reaction.count})`}
            onClick={() => onToggleReaction(message.id, reaction.emoji)}
            className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition ${reaction.reactedByMe ? "border-cyan-400/70 bg-cyan-950/50 text-cyan-100" : "border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-cyan-500/50"}`}
          >
            <span>{reaction.emoji}</span>
            <span className="font-mono text-[10px] font-bold">{reaction.count}</span>
          </button>
        ))}
        <div className="relative">
          <button
            type="button"
            aria-label="Reaccionar"
            onClick={() => onOpenPalette(message.id)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700/50 text-slate-500 opacity-100 transition hover:text-cyan-300 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </button>
          {isPaletteOpen ? (
            <div className={`absolute bottom-full z-20 mb-1 flex gap-0.5 border border-cyan-500/50 bg-[#040d18] p-1 shadow-[0_0_18px_rgba(0,0,0,0.6)] ${isOwn ? "right-0" : "left-0"}`}>
              {reactionEmojis.map((emoji) => (
                <button key={emoji} type="button" aria-label={`Reaccionar ${emoji}`} onClick={() => onToggleReaction(message.id, emoji)} className="flex h-7 w-7 items-center justify-center rounded text-base transition hover:bg-cyan-500/20">
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const CommunityChatMessage = memo(CommunityChatMessageBase);
