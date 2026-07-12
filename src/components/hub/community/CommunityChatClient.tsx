// src/components/hub/community/CommunityChatClient.tsx - UI del chat/foro de comunidad con el diseño HUD del juego.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CornerUpLeft, Layers, MessageSquare, Send, Swords, Users, X } from "lucide-react";
import { openDirectConversation } from "@/core/hooks/chat/direct-messages-api";
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatMessageReactionSummary } from "@/core/entities/chat/IChatMessageReaction";
import { ICard } from "@/core/entities/ICard";
import { IOnlinePlayer, OnlinePlayerStatus } from "@/core/entities/multiplayer/IOnlinePlayer";
import { CommunityChatMessage, IQuotedPreview } from "@/components/hub/community/CommunityChatMessage";
import { useOnlinePlayersContext } from "@/components/hub/multiplayer/MultiplayerPresenceProvider";
import { CommunityChatCardPicker } from "@/components/hub/community/CommunityChatCardPicker";
import { sendInvitation } from "@/app/hub/multiplayer/actions/send-invitation";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/core/services/chat/validate-chat-message";
import { CHAT_REACTION_EMOJIS } from "@/core/services/chat/chat-reactions";
import { useCommunityChat } from "@/core/hooks/chat/use-community-chat";

const NO_REACTIONS: IChatMessageReactionSummary[] = [];

/** Texto corto del mensaje citado para la vista previa de respuesta. */
function buildQuotedPreviewText(message: IChatMessage): string {
  if (message.kind === "CARD_SHARE") {
    const name = typeof message.metadata.name === "string" ? message.metadata.name : "una carta";
    return `🃏 ${name}`;
  }
  return message.content;
}

interface CommunityChatClientProps {
  room: string;
  localPlayerId: string;
  localNickname: string;
  activeDeckIds: string[];
  initialMessages: IChatMessage[];
  initialReactions: IChatMessageReactionSummary[];
}

const CLIP_PANEL = "polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)";
const CLIP_CHIP = "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)";

const STATUS_META: Record<OnlinePlayerStatus, { label: string; dot: string }> = {
  IDLE: { label: "En el hub", dot: "bg-emerald-400" },
  IN_LOBBY: { label: "En lobby", dot: "bg-cyan-400" },
  IN_MATCH: { label: "En partida", dot: "bg-amber-400" },
};

export function CommunityChatClient({ room, localPlayerId, localNickname, activeDeckIds, initialMessages, initialReactions }: CommunityChatClientProps) {
  const { messages, reactions, isSending, error, send, remove, toggleReaction, clearError } = useCommunityChat(room, initialMessages, initialReactions);
  const onlineOthers = useOnlinePlayersContext();
  const [draft, setDraft] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [paletteFor, setPaletteFor] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [openingDmFor, setOpeningDmFor] = useState<string | null>(null);
  const canInvite = activeDeckIds.length > 0;

  // Abre (o recupera) la conversación privada con un jugador y navega a ella.
  const handleOpenDm = useCallback(
    async (playerId: string) => {
      if (openingDmFor) return;
      setOpeningDmFor(playerId);
      try {
        const conversationId = await openDirectConversation(playerId);
        router.push(`/hub/chat/dm/${conversationId}`);
      } catch {
        setOpeningDmFor(null);
      }
    },
    [openingDmFor, router],
  );

  // Reacciones agrupadas por mensaje para render rápido.
  const reactionsByMessage = useMemo(() => {
    const grouped = new Map<string, IChatMessageReactionSummary[]>();
    for (const reaction of reactions) {
      const list = grouped.get(reaction.messageId) ?? [];
      list.push(reaction);
      grouped.set(reaction.messageId, list);
    }
    return grouped;
  }, [reactions]);

  const messagesById = useMemo(() => {
    const map = new Map<string, IChatMessage>();
    for (const message of messages) map.set(message.id, message);
    return map;
  }, [messages]);

  // Vista previa del mensaje citado por cada respuesta (autor + extracto), resuelta una vez por lote.
  const quotedByMessage = useMemo(() => {
    const map = new Map<string, IQuotedPreview>();
    for (const message of messages) {
      if (!message.replyToMessageId) continue;
      const original = messagesById.get(message.replyToMessageId);
      if (!original) continue;
      map.set(message.id, {
        nickname: original.nickname,
        preview: buildQuotedPreviewText(original),
        isOwn: original.userId === localPlayerId,
      });
    }
    return map;
  }, [messages, messagesById, localPlayerId]);

  const replyingTo = replyingToId ? messagesById.get(replyingToId) ?? null : null;

  const handleToggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      setPaletteFor(null);
      void toggleReaction(messageId, emoji);
    },
    [toggleReaction],
  );

  const handleOpenPalette = useCallback((messageId: string) => {
    setPaletteFor((current) => (current === messageId ? null : messageId));
  }, []);

  const handleReply = useCallback((messageId: string) => {
    setReplyingToId(messageId);
    inputRef.current?.focus();
  }, []);

  // Al pulsar una cita se hace scroll al mensaje original y se resalta un instante.
  const handleJumpToQuoted = useCallback((messageId: string) => {
    const original = messagesById.get(messageId)?.replyToMessageId;
    if (!original) return;
    const node = scrollRef.current?.querySelector(`[data-message-id="${original}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.classList.add("chat-quote-flash");
    window.setTimeout(() => node.classList.remove("chat-quote-flash"), 1200);
  }, [messagesById]);

  const handleShareCard = useCallback(
    async (card: ICard) => {
      setIsPickerOpen(false);
      await send({
        content: `Comparte su ${card.name}`,
        kind: "CARD_SHARE",
        metadata: {
          cardId: card.id,
          name: card.name,
          type: card.type,
          faction: card.faction,
          cost: card.cost,
          attack: card.attack ?? null,
          defense: card.defense ?? null,
          archetype: card.archetype ?? null,
          renderUrl: card.renderUrl ?? null,
          bgUrl: card.bgUrl ?? null,
          versionTier: card.versionTier ?? 0,
          level: card.level ?? 0,
        },
      });
    },
    [send],
  );

  // Retar a duelo: reutiliza el sistema de invitaciones (el retado recibe el banner y ambos entran a la
  // partida al aceptar, gestionado por el MultiplayerPresenceProvider que envuelve el hub).
  const handleInvite = useCallback(
    async (player: IOnlinePlayer) => {
      if (!canInvite || player.status === "IN_MATCH" || invitedIds.has(player.playerId)) return;
      setInvitedIds((current) => new Set(current).add(player.playerId));
      const result = await sendInvitation(player.playerId, activeDeckIds);
      if (!result.ok) {
        setInvitedIds((current) => {
          const next = new Set(current);
          next.delete(player.playerId);
          return next;
        });
      }
    },
    [activeDeckIds, canInvite, invitedIds],
  );

  // Lista de conectados incluyendo al jugador local (la presencia solo devuelve a los demás).
  const connected = useMemo<IOnlinePlayer[]>(() => {
    const self: IOnlinePlayer = { playerId: localPlayerId, nickname: `${localNickname} (tú)`, status: "IDLE" };
    return [self, ...onlineOthers.filter((player) => player.playerId !== localPlayerId)];
  }, [onlineOthers, localPlayerId, localNickname]);

  // Auto-scroll al final cuando llegan mensajes (el chat "vive" en el borde inferior).
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  const challengeButton = (player: IOnlinePlayer, variant: "chip" | "row") => {
    if (player.playerId === localPlayerId) return null;
    const invited = invitedIds.has(player.playerId);
    const disabled = !canInvite || player.status === "IN_MATCH" || invited;
    return (
      <button
        type="button"
        aria-label={`Retar a duelo a ${player.nickname}`}
        title={!canInvite ? "Necesitas un deck activo para retar" : player.status === "IN_MATCH" ? "En partida" : "Retar a duelo"}
        onClick={() => handleInvite(player)}
        disabled={disabled}
        className={`flex shrink-0 items-center justify-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide transition ${
          invited
            ? "border-emerald-400/60 bg-emerald-950/50 text-emerald-300"
            : disabled
              ? "cursor-not-allowed border-slate-700/50 bg-slate-900/40 text-slate-600"
              : "border-rose-400/60 bg-rose-950/40 text-rose-200 hover:bg-rose-900/60"
        }`}
      >
        {invited ? <Check className="h-3 w-3" /> : <Swords className="h-3 w-3" />}
        {variant === "row" ? <span>{invited ? "Enviado" : "Retar"}</span> : null}
      </button>
    );
  };

  const dmButton = (player: IOnlinePlayer, variant: "chip" | "row") => {
    if (player.playerId === localPlayerId) return null;
    return (
      <button
        type="button"
        aria-label={`Enviar mensaje privado a ${player.nickname}`}
        title="Mensaje privado"
        onClick={() => handleOpenDm(player.playerId)}
        disabled={openingDmFor === player.playerId}
        className="flex shrink-0 items-center justify-center gap-1 rounded border border-cyan-400/60 bg-cyan-950/40 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-900/60 disabled:opacity-50"
      >
        <MessageSquare className="h-3 w-3" />
        {variant === "row" ? <span>Mensaje</span> : null}
      </button>
    );
  };

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
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto flex h-dvh w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5"
    >
      {/* Cabecera */}
      <header
        className="flex shrink-0 items-center justify-between gap-3 border border-cyan-500/40 bg-[#03101c]/90 px-3 py-2.5 sm:px-4"
        style={{ clipPath: CLIP_CHIP }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/hub"
            aria-label="Volver al hub"
            className="flex h-9 w-9 items-center justify-center border border-cyan-500/45 bg-[#03101c]/90 text-cyan-200 transition hover:border-cyan-300/90 hover:text-cyan-50"
            style={{ clipPath: CLIP_CHIP }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300/80">Canal de comunidad</p>
            <p className="font-display text-lg uppercase tracking-[0.14em] text-cyan-50">{"//"} {room}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/hub/chat/dm"
            aria-label="Ver mensajes privados"
            className="flex items-center gap-1.5 border border-cyan-500/45 bg-cyan-950/30 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200 transition hover:border-cyan-300/80 hover:text-cyan-50"
            style={{ clipPath: CLIP_CHIP }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mensajes</span>
          </Link>
          <span className="flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-950/40 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300" style={{ clipPath: CLIP_CHIP }}>
            <Users className="h-3.5 w-3.5" /> {connected.length}
          </span>
        </div>
      </header>

      {/* Tira de conectados en móvil */}
      <div className="home-modern-scroll flex shrink-0 gap-2 overflow-x-auto pb-1 lg:hidden">
        {connected.map((player) => (
          <span key={player.playerId} className="flex shrink-0 items-center gap-1.5 border border-cyan-900/60 bg-[#040d18]/80 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-cyan-100" style={{ clipPath: CLIP_CHIP }}>
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[player.status].dot}`} />
            {player.nickname}
            {dmButton(player, "chip")}
            {challengeButton(player, "chip")}
          </span>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_240px]">
        {/* Conversación */}
        <section className="relative flex min-h-0 flex-col border border-cyan-900/45 bg-[#020a14]/85" style={{ clipPath: CLIP_PANEL }}>
          <div ref={scrollRef} className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3 sm:p-4">
            {messages.length === 0 ? (
              <p className="m-auto max-w-xs text-center font-mono text-xs uppercase tracking-widest text-cyan-500/60">
                Sé el primero en escribir en el canal.
              </p>
            ) : (
              messages.map((message) => (
                <div key={message.id} data-message-id={message.id} className="rounded transition-colors">
                  <CommunityChatMessage
                    message={message}
                    isOwn={message.userId === localPlayerId}
                    reactions={reactionsByMessage.get(message.id) ?? NO_REACTIONS}
                    quoted={quotedByMessage.get(message.id) ?? null}
                    isPaletteOpen={paletteFor === message.id}
                    reactionEmojis={CHAT_REACTION_EMOJIS}
                    onOpenPalette={handleOpenPalette}
                    onToggleReaction={handleToggleReaction}
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

          {/* Vista previa de la respuesta (mensaje citado) */}
          {replyingTo ? (
            <div className="mx-2.5 mb-1 flex shrink-0 items-center gap-2 border-l-2 border-cyan-400/70 bg-cyan-950/30 px-2.5 py-1.5 sm:mx-3">
              <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] font-black uppercase tracking-wider text-cyan-300/90">
                  Respondiendo a {replyingTo.userId === localPlayerId ? "ti" : replyingTo.nickname}
                </p>
                <p className="truncate text-[11px] text-slate-300">{buildQuotedPreviewText(replyingTo)}</p>
              </div>
              <button
                type="button"
                aria-label="Cancelar respuesta"
                onClick={() => setReplyingToId(null)}
                className="shrink-0 text-slate-500 transition hover:text-rose-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t border-cyan-900/50 bg-[#03101c]/80 p-2.5 sm:p-3">
            <button
              type="button"
              aria-label="Compartir una carta"
              title="Compartir una carta tuya"
              onClick={() => setIsPickerOpen(true)}
              disabled={isSending}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 transition hover:border-cyan-300/70 hover:text-cyan-100 disabled:opacity-40"
              style={{ clipPath: CLIP_CHIP }}
            >
              <Layers className="h-4 w-4" />
            </button>
            <div className="flex flex-1 flex-col">
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, CHAT_MESSAGE_MAX_LENGTH))}
                placeholder="Escribe un mensaje…"
                aria-label="Escribe un mensaje"
                maxLength={CHAT_MESSAGE_MAX_LENGTH}
                className="w-full rounded-lg border border-cyan-900/60 bg-[#020a14] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400 placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              aria-label="Enviar"
              className="flex h-[42px] items-center gap-1.5 border border-cyan-400/60 bg-cyan-500/15 px-4 font-mono text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ clipPath: CLIP_CHIP }}
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </section>

        {/* Conectados (desktop) */}
        <aside className="relative hidden min-h-0 flex-col border border-cyan-900/45 bg-[#020a14]/85 lg:flex" style={{ clipPath: CLIP_PANEL }}>
          <p className="shrink-0 border-b border-cyan-900/45 px-3 py-2.5 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300/80">
            Conectados · {connected.length}
          </p>
          <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2.5">
            {connected.map((player) => (
              <div key={player.playerId} className="flex items-center gap-2 rounded-md border border-cyan-900/40 bg-[#03141f]/70 px-2 py-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_META[player.status].dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-cyan-100">{player.nickname}</p>
                  <p className="font-mono text-[8px] uppercase tracking-wide text-slate-500">{STATUS_META[player.status].label}</p>
                </div>
                {dmButton(player, "row")}
                {challengeButton(player, "row")}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <CommunityChatCardPicker key={isPickerOpen ? "open" : "closed"} isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={handleShareCard} />
    </motion.div>
  );
}
