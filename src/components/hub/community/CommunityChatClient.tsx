// src/components/hub/community/CommunityChatClient.tsx - UI del chat/foro de comunidad con el diseño HUD del juego.
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Layers, Send, Swords, Trash2, Users } from "lucide-react";
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { CardArchetype, CardType, Faction, ICard } from "@/core/entities/ICard";
import { IOnlinePlayer, OnlinePlayerStatus } from "@/core/entities/multiplayer/IOnlinePlayer";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { useOnlinePlayersContext } from "@/components/hub/multiplayer/MultiplayerPresenceProvider";
import { CommunityChatCardPicker } from "@/components/hub/community/CommunityChatCardPicker";
import { sendInvitation } from "@/app/hub/multiplayer/actions/send-invitation";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/core/services/chat/validate-chat-message";
import { useCommunityChat } from "@/core/hooks/chat/use-community-chat";

interface CommunityChatClientProps {
  room: string;
  localPlayerId: string;
  localNickname: string;
  activeDeckIds: string[];
  initialMessages: IChatMessage[];
}

const CLIP_PANEL = "polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)";
const CLIP_CHIP = "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)";

const STATUS_META: Record<OnlinePlayerStatus, { label: string; dot: string }> = {
  IDLE: { label: "En el hub", dot: "bg-emerald-400" },
  IN_LOBBY: { label: "En lobby", dot: "bg-cyan-400" },
  IN_MATCH: { label: "En partida", dot: "bg-amber-400" },
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Reconstruye una carta (para CardThumbnail) desde la metadata auto-contenida de un mensaje CARD_SHARE. */
function reconstructSharedCard(metadata: Record<string, unknown>): ICard | null {
  const cardId = typeof metadata.cardId === "string" ? metadata.cardId : null;
  if (!cardId) return null;
  return {
    id: cardId,
    name: typeof metadata.name === "string" ? metadata.name : "Carta",
    description: "",
    type: (typeof metadata.type === "string" ? metadata.type : "ENTITY") as CardType,
    faction: (typeof metadata.faction === "string" ? metadata.faction : "NEUTRAL") as Faction,
    cost: typeof metadata.cost === "number" ? metadata.cost : 0,
    attack: typeof metadata.attack === "number" ? metadata.attack : undefined,
    defense: typeof metadata.defense === "number" ? metadata.defense : undefined,
    archetype: typeof metadata.archetype === "string" ? (metadata.archetype as CardArchetype) : undefined,
    renderUrl: typeof metadata.renderUrl === "string" ? metadata.renderUrl : undefined,
    bgUrl: typeof metadata.bgUrl === "string" ? metadata.bgUrl : undefined,
    versionTier: typeof metadata.versionTier === "number" ? metadata.versionTier : 0,
    level: typeof metadata.level === "number" ? metadata.level : 0,
  };
}

export function CommunityChatClient({ room, localPlayerId, localNickname, activeDeckIds, initialMessages }: CommunityChatClientProps) {
  const { messages, isSending, error, send, remove, clearError } = useCommunityChat(room, initialMessages);
  const onlineOthers = useOnlinePlayersContext();
  const [draft, setDraft] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const canInvite = activeDeckIds.length > 0;

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

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;
    const ok = await send({ content });
    if (ok) setDraft("");
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
        <span className="flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-950/40 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300" style={{ clipPath: CLIP_CHIP }}>
          <Users className="h-3.5 w-3.5" /> {connected.length}
        </span>
      </header>

      {/* Tira de conectados en móvil */}
      <div className="home-modern-scroll flex shrink-0 gap-2 overflow-x-auto pb-1 lg:hidden">
        {connected.map((player) => (
          <span key={player.playerId} className="flex shrink-0 items-center gap-1.5 border border-cyan-900/60 bg-[#040d18]/80 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-cyan-100" style={{ clipPath: CLIP_CHIP }}>
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[player.status].dot}`} />
            {player.nickname}
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
              messages.map((message) => {
                const isOwn = message.userId === localPlayerId;
                const isSystem = message.kind === "SYSTEM";
                if (isSystem) {
                  return (
                    <p key={message.id} className="mx-auto rounded border border-fuchsia-500/40 bg-fuchsia-950/30 px-3 py-1 text-center font-mono text-[11px] uppercase tracking-widest text-fuchsia-200">
                      {message.content}
                    </p>
                  );
                }
                const sharedCard = message.kind === "CARD_SHARE" ? reconstructSharedCard(message.metadata) : null;
                return (
                  <div key={message.id} className={`group flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-mono text-[11px] font-black uppercase tracking-wider ${isOwn ? "text-amber-300" : "text-cyan-300"}`}>
                        {isOwn ? "Tú" : message.nickname}
                      </span>
                      <span className="font-mono text-[9px] text-slate-500">{formatTime(message.createdAtIso)}</span>
                      {isOwn ? (
                        <button
                          type="button"
                          aria-label="Borrar mensaje"
                          onClick={() => remove(message.id)}
                          className="text-slate-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                    {sharedCard ? (
                      <div className={`mt-1 w-[92px] rounded-lg border p-1 sm:w-[104px] ${isOwn ? "border-amber-500/30 bg-amber-950/20" : "border-cyan-800/40 bg-[#03141f]/80"}`}>
                        <div className="aspect-[13/19] w-full">
                          <CardThumbnail card={sharedCard} versionTier={sharedCard.versionTier ?? 0} level={sharedCard.level} showArtSkeleton />
                        </div>
                      </div>
                    ) : (
                      <p className={`mt-0.5 max-w-[85%] whitespace-pre-wrap break-words rounded-lg border px-3 py-1.5 text-sm ${isOwn ? "border-amber-500/25 bg-amber-950/25 text-amber-50" : "border-cyan-800/40 bg-[#03141f]/80 text-slate-100"}`}>
                        {message.content}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {error ? (
            <button type="button" onClick={clearError} className="mx-3 mb-2 shrink-0 rounded border border-rose-500/50 bg-rose-950/50 px-3 py-1.5 text-left text-xs font-semibold text-rose-200">
              {error} · (toca para cerrar)
            </button>
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
