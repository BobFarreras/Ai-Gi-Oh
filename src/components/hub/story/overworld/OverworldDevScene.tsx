// src/components/hub/story/overworld/OverworldDevScene.tsx - Escena del overworld: triggers de evento (vídeo terminal / narración BigLog), combate real y controles.
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OverworldEngine } from "@/components/hub/story/overworld/engine/OverworldEngine";
import {
  IOverworldFocus,
  IOverworldIntent,
} from "@/components/hub/story/overworld/engine/engine-types";
import { OverworldTouchControls } from "@/components/hub/story/overworld/hud/OverworldTouchControls";
import { OverworldMinimap } from "@/components/hub/story/overworld/hud/OverworldMinimap";
import { OverworldBattleTransition } from "@/components/hub/story/overworld/hud/OverworldBattleTransition";
import { resolveIntentPresentation } from "@/components/hub/story/overworld/hud/resolve-intent-presentation";
import { StoryInteractionVideoOverlay } from "@/components/hub/story/internal/scene/dialog/StoryInteractionVideoOverlay";
import { StoryNodeInteractionDialog } from "@/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog";
import { useStorySceneSfx } from "@/components/hub/story/internal/scene/audio/use-story-scene-sfx";
import { useStoryMapSoundtrack } from "@/components/hub/story/internal/scene/audio/use-story-map-soundtrack";
import { Backpack, Volume2, VolumeX } from "lucide-react";
import { buildAct1OverworldTilemap } from "@/services/story/overworld/act-1-overworld-tilemap";
import { buildAct1EchoCutscene } from "@/services/story/overworld/act-1-echo-cutscene";
import { resolveOverworldEventDialogue } from "@/services/story/overworld/resolve-overworld-event-dialogue";
import { IPlayerOverworldPosition } from "@/core/entities/story/IPlayerOverworldState";
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";
import {
  IStoryInteractionCinematicVideo,
  IStoryInteractionDialogueLine,
} from "@/services/story/story-node-interaction-dialogue-types";
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";

const OVERWORLD_MAP_ID = "act-1";
const ACT_ID = 1;
const ECHO_TRIGGER_NODE_ID = "story-a1-side-event-echo-fragment";
const PRECOMBAT_SOUND = "/audio/story/sonido-precombate.m4a";
const SEEN_EVENTS_STORAGE_KEY = "overworld-seen-events-act-1";

function loadSeenEvents(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_EVENTS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    // localStorage no disponible: los eventos simplemente no persisten.
  }
  return new Set();
}

function persistSeenEvents(seen: Set<string>): void {
  try {
    window.localStorage.setItem(SEEN_EVENTS_STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // Ignorar si no hay localStorage.
  }
}

interface IOverworldDevSceneProps {
  completedNodeIds: string[];
  initialPosition: IPlayerOverworldPosition | null;
  interactedNodeIds: string[];
}

function buildProgress(completedIds: ReadonlySet<string>) {
  return {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(),
    completedNodeIds: new Set<string>(completedIds),
  };
}

/** Casilla contigua fuera del haz del rival (perpendicular a su orientación), para no re-activar el combate al volver. */
function resolveSafeReturnTile(
  playerTile: IPlayerOverworldPosition,
  facing: OverworldDirection | undefined,
  tilemap: IOverworldTilemap,
): IPlayerOverworldPosition {
  const perpendicular: Array<[number, number]> =
    facing === "LEFT" || facing === "RIGHT"
      ? [
          [0, -1],
          [0, 1],
        ]
      : [
          [-1, 0],
          [1, 0],
        ];
  for (const [dx, dy] of perpendicular) {
    const tileX = playerTile.tileX + dx;
    const tileY = playerTile.tileY + dy;
    if (tilemap.collision[tileY]?.[tileX] === 1) return { tileX, tileY };
  }
  return playerTile;
}

/** Bip electrónico procedural de "dispositivo" (sin asset). */
function playDeviceSound(): void {
  try {
    const AudioCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const beep = (freq: number, start: number, dur: number): void => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.02);
    };
    beep(760, 0, 0.08);
    beep(1240, 0.1, 0.14);
    window.setTimeout(() => void ctx.close(), 700);
  } catch {
    // El audio es un extra; si falla, la interacción continúa igual.
  }
}

interface IPendingBattle {
  duelHref: string;
  duelNodeId: string;
  imageSrc?: string;
  opponentFacing?: OverworldDirection;
}

interface IActiveNarration {
  title: string;
  lines: IStoryInteractionDialogueLine[];
  lineIndex: number;
  isCutscene: boolean;
}

export function OverworldDevScene({ completedNodeIds, initialPosition, interactedNodeIds }: IOverworldDevSceneProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OverworldEngine | null>(null);
  const tilemap = useMemo(() => buildAct1OverworldTilemap(), []);
  const initialCompleted = useMemo(() => new Set(completedNodeIds), [completedNodeIds]);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  const [focus, setFocus] = useState<IOverworldFocus | null>(null);
  const [activeIntent, setActiveIntent] = useState<IOverworldIntent | null>(null);
  const [pendingBattle, setPendingBattle] = useState<IPendingBattle | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ video: IStoryInteractionCinematicVideo; isCutscene: boolean } | null>(null);
  const [narration, setNarration] = useState<IActiveNarration | null>(null);
  const initialInteracted = useMemo(() => new Set(interactedNodeIds), [interactedNodeIds]);
  const [collectedRewardIds, setCollectedRewardIds] = useState<ReadonlySet<string>>(initialInteracted);
  const [playerTile, setPlayerTile] = useState(
    initialPosition ?? { tileX: tilemap.spawns[0].tileX, tileY: tilemap.spawns[0].tileY },
  );
  const playerTileRef = useRef(playerTile);
  const [completedIds] = useState<ReadonlySet<string>>(initialCompleted);
  const [isMarketPromptOpen, setIsMarketPromptOpen] = useState(false);

  // Audio: SFX de Story + soundtrack del acto (reutilizados del modo Story clásico).
  const sfx = useStorySceneSfx();
  const sfxRef = useRef(sfx);
  useEffect(() => {
    sfxRef.current = sfx;
  });
  const { isMuted, toggleMute } = useStoryMapSoundtrack(ACT_ID);
  const precombatRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof Audio === "undefined") return;
    const audio = new Audio(PRECOMBAT_SOUND);
    audio.preload = "auto";
    audio.volume = 0.55;
    precombatRef.current = audio;
    return () => {
      audio.pause();
      precombatRef.current = null;
    };
  }, []);

  const saveOverworldPosition = async (): Promise<void> => {
    const tile = playerTileRef.current;
    try {
      await fetch("/api/story/overworld/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mapId: OVERWORLD_MAP_ID, tileX: tile.tileX, tileY: tile.tileY }),
      });
    } catch {
      // Si falla, se pierde solo la posición restaurada; no bloquea la navegación.
    }
  };

  const openArsenal = async (): Promise<void> => {
    sfxRef.current?.playButtonClick();
    await saveOverworldPosition();
    router.push("/hub/arsenal?from=overworld");
  };

  const enterMarket = async (): Promise<void> => {
    sfxRef.current?.playButtonClick();
    setIsMarketPromptOpen(false);
    await saveOverworldPosition();
    router.push("/hub/market?from=overworld");
  };

  const closeMarketPrompt = (): void => {
    setIsMarketPromptOpen(false);
    engineRef.current?.setInteractionSuspended(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Los eventos/recompensas ya vistos no se repiten (persisten entre recargas + servidor).
    loadSeenEvents().forEach((id) => seenEventIdsRef.current.add(id));
    initialInteracted.forEach((id) => seenEventIdsRef.current.add(id));
    const markEventSeen = (nodeId: string): void => {
      seenEventIdsRef.current.add(nodeId);
      persistSeenEvents(seenEventIdsRef.current);
    };
    const claimReward = async (object: IOverworldIntent["object"]): Promise<void> => {
      try {
        const res = await fetch("/api/story/overworld/claim-reward", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ nodeId: object.id, mapId: OVERWORLD_MAP_ID }),
        });
        const data = (await res.json()) as { alreadyClaimed?: boolean; rewardNexus?: number; rewardCardId?: string | null };
        if (res.ok) {
          markEventSeen(object.id);
          setCollectedRewardIds((prev) => new Set(prev).add(object.id));
          if (!data.alreadyClaimed && ((data.rewardNexus ?? 0) > 0 || data.rewardCardId)) {
            if ((data.rewardNexus ?? 0) > 0) sfxRef.current?.playRewardNexus();
            else sfxRef.current?.playRewardCard();
            // El objeto se encoge hacia el jugador; si es Nexus, sube el valor flotante.
            engine.collectReward({
              objectId: object.id,
              imageSrc: object.imageSrc,
              floatingLabel: (data.rewardNexus ?? 0) > 0 ? `+${data.rewardNexus}` : null,
              onDone: () => engine.setInteractionSuspended(false),
            });
            return;
          }
        }
      } catch {
        // Si falla la red, no marcamos como visto: se puede reintentar al volver a pisar.
      }
      engine.setInteractionSuspended(false);
    };
    const startBattle = (object: IOverworldIntent["object"]): void => {
      // Sonido de pre-combate al arrancar la animación de vibración.
      const precombat = precombatRef.current;
      if (precombat) {
        precombat.currentTime = 0;
        void precombat.play().catch(() => undefined);
      }
      setActiveIntent(null);
      setPendingBattle({
        duelHref: object.duelHref!,
        duelNodeId: object.id,
        imageSrc: object.imageSrc,
        opponentFacing: object.facing,
      });
    };
    const engine = new OverworldEngine({
      canvas,
      tilemap,
      progress: buildProgress(initialCompleted),
      config: { initialPosition, collectedNodeIds: [...initialInteracted] },
      hooks: {
        onFocusChanged: setFocus,
        onPlayerTileChanged: (tile) => {
          playerTileRef.current = { tileX: tile.tileX, tileY: tile.tileY };
          setPlayerTile({ tileX: tile.tileX, tileY: tile.tileY });
        },
        onCutsceneEvent: (nodeId) => {
          const dialogue = resolveOverworldEventDialogue(nodeId);
          if (dialogue && dialogue.lines.length > 0) {
            setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: true });
          } else {
            engine.resumeCutscene();
          }
        },
        onCutsceneEnd: () => engine.setInteractionSuspended(false),
        onIntent: (intent) => {
          engine.setInteractionSuspended(true);
          const { object } = intent;
          const isCombat =
            !intent.isBlocked &&
            (object.kind === "DUEL" || object.kind === "BOSS") &&
            Boolean(object.duelHref);
          if (isCombat && intent.source === "SIGHTLINE") {
            startBattle(object);
            return;
          }
          // Mercado: diálogo de confirmación antes de abrir la página del market.
          if (object.kind === "MARKET") {
            setIsMarketPromptOpen(true);
            return;
          }
          // Recompensas: se otorgan en servidor (una sola vez) al pisarlas.
          if (!intent.isBlocked && (object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD")) {
            if (seenEventIdsRef.current.has(object.id)) {
              engine.setInteractionSuspended(false);
              return;
            }
            void claimReward(object);
            return;
          }
          if (!intent.isBlocked && (object.kind === "EVENT" || object.kind === "NPC")) {
            if (seenEventIdsRef.current.has(object.id)) {
              engine.setInteractionSuspended(false);
              return;
            }
            markEventSeen(object.id);
            // Subruta difícil: aparece BigLog (cutscene) y narra el aviso.
            if (object.id === ECHO_TRIGGER_NODE_ID) {
              engine.startCutscene(buildAct1EchoCutscene());
              return;
            }
            const dialogue = resolveOverworldEventDialogue(object.id);
            if (dialogue?.cinematicVideo) {
              playDeviceSound();
              setActiveVideo({ video: dialogue.cinematicVideo, isCutscene: false });
              return;
            }
            if (dialogue && dialogue.lines.length > 0) {
              setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: false });
              return;
            }
          }
          setActiveIntent(intent);
        },
      },
    });
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [tilemap, initialCompleted, initialPosition, initialInteracted]);

  const closeIntent = (): void => {
    setActiveIntent(null);
    engineRef.current?.setInteractionSuspended(false);
  };

  const closeVideo = (): void => {
    const wasCutscene = activeVideo?.isCutscene ?? false;
    sfxRef.current?.playEventFinish();
    setActiveVideo(null);
    if (wasCutscene) engineRef.current?.resumeCutscene();
    else engineRef.current?.setInteractionSuspended(false);
  };

  const advanceNarration = useCallback((): void => {
    setNarration((current) => {
      if (!current) return null;
      if (current.lineIndex < current.lines.length - 1) {
        return { ...current, lineIndex: current.lineIndex + 1 };
      }
      if (current.isCutscene) engineRef.current?.resumeCutscene();
      else engineRef.current?.setInteractionSuspended(false);
      return null;
    });
  }, []);

  // Espacio/Enter avanzan la narración (además del botón y el D-pad "A").
  useEffect(() => {
    if (!narration) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        advanceNarration();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [narration, advanceNarration]);

  const closeNarration = (): void => {
    const wasCutscene = narration?.isCutscene ?? false;
    sfxRef.current?.playEventFinish();
    setNarration(null);
    if (wasCutscene) engineRef.current?.resumeCutscene();
    else engineRef.current?.setInteractionSuspended(false);
  };

  const beginBattleFromPanel = (): void => {
    if (!activeIntent) return;
    setPendingBattle({
      duelHref: activeIntent.object.duelHref!,
      duelNodeId: activeIntent.object.id,
      imageSrc: activeIntent.object.imageSrc,
      opponentFacing: activeIntent.object.facing,
    });
    setActiveIntent(null);
  };

  const launchPendingBattle = async (): Promise<void> => {
    const battle = pendingBattle;
    if (!battle) return;
    const safeTile = resolveSafeReturnTile(playerTileRef.current, battle.opponentFacing, tilemap);
    try {
      await fetch("/api/story/overworld/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentNodeId: battle.duelNodeId,
          mapId: OVERWORLD_MAP_ID,
          tileX: safeTile.tileX,
          tileY: safeTile.tileY,
        }),
      });
    } catch {
      // Si falla el guardado, seguimos al duelo (el acceso se revalida en servidor).
    }
    router.push(`${battle.duelHref}?from=overworld`);
  };

  const isCombatIntent =
    activeIntent !== null &&
    !activeIntent.isBlocked &&
    (activeIntent.object.kind === "DUEL" || activeIntent.object.kind === "BOSS") &&
    Boolean(activeIntent.object.duelHref);

  const promptText = focus
    ? focus.isBlocked
      ? "Bloqueado — completa su requisito"
      : resolveIntentPresentation(focus.object.kind).actionVerb
    : null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Mundo Story" />

      <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-cyan-300/25 bg-slate-950/80 px-3 py-2 text-[11px] leading-relaxed text-cyan-100 backdrop-blur-sm">
        <p className="font-black uppercase tracking-widest text-cyan-300">Acto 1 · facility</p>
        <p>Muévete: flechas/WASD o el D-pad.</p>
        <p>Pisa nexus/cartas/eventos; ¡cuidado con la visión de los rivales!</p>
      </div>

      <OverworldMinimap tilemap={tilemap} playerTile={playerTile} defeatedIds={completedIds} hiddenIds={collectedRewardIds} />

      <div className="absolute left-3 top-24 z-20 flex flex-col gap-2">
        <Link
          href="/hub/story"
          className="pointer-events-auto rounded-md border border-cyan-300/35 bg-slate-950/80 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-cyan-200 backdrop-blur-sm transition hover:bg-cyan-400/10"
        >
          Salir
        </Link>
        <button
          type="button"
          onClick={() => void openArsenal()}
          aria-label="Abrir Arsenal (editar deck)"
          className="pointer-events-auto group flex items-center gap-2 overflow-hidden rounded-md border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-950/70 to-slate-950/80 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-fuchsia-100 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-sm transition hover:border-fuchsia-300/80 hover:shadow-[0_0_15px_rgba(232,121,249,0.35)]"
        >
          <Backpack size={16} className="text-fuchsia-300 transition group-hover:scale-110" />
          Mochila
        </button>
      </div>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? "Activar música" : "Silenciar música"}
        className="pointer-events-auto absolute right-3 top-40 z-20 rounded-md border border-cyan-300/30 bg-slate-950/80 p-2 text-cyan-200 backdrop-blur-sm transition hover:bg-cyan-400/10"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {promptText ? (
        <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full border border-white/20 bg-slate-950/85 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          {promptText}
        </div>
      ) : null}

      <OverworldTouchControls
        onDirectionDown={(direction) => engineRef.current?.setExternalDirection(direction)}
        onDirectionUp={() => engineRef.current?.setExternalDirection(null)}
        onAction={() => engineRef.current?.pressAction()}
      />

      <StoryInteractionVideoOverlay
        isOpen={Boolean(activeVideo)}
        cinematicVideo={activeVideo?.video ?? null}
        onClose={closeVideo}
      />

      {narration ? (
        <StoryNodeInteractionDialog
          isOpen
          title={narration.title}
          cinematicVideo={null}
          line={narration.lines[narration.lineIndex] ?? null}
          onNext={advanceNarration}
          onClose={closeNarration}
          centerNextButton
        />
      ) : null}

      {isMarketPromptOpen ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4" onClick={closeMarketPrompt}>
          <div
            className="w-full max-w-sm rounded-2xl border border-emerald-300/30 bg-slate-950/95 p-5 text-emerald-50 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">Mercado</p>
            <p className="mt-3 text-sm text-slate-200">
              ¿Quieres entrar al mercado a comprar sobres, cartas y recursos? Volverás aquí mismo al salir.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => void enterMarket()}
                className="flex-1 rounded-lg border border-emerald-300/50 bg-emerald-500/20 py-2 text-xs font-black uppercase tracking-widest text-emerald-100 transition hover:bg-emerald-400/30"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={closeMarketPrompt}
                className="rounded-lg border border-slate-400/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:bg-white/5"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingBattle ? (
        <OverworldBattleTransition
          opponentImageSrc={pendingBattle.imageSrc}
          onComplete={() => void launchPendingBattle()}
        />
      ) : null}

      {activeIntent && !pendingBattle && !activeVideo && !narration ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4" onClick={closeIntent}>
          <div
            className="w-full max-w-sm rounded-2xl border border-cyan-300/30 bg-slate-950/95 p-5 text-cyan-50 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {activeIntent.object.imageSrc ? (
                <Image
                  src={activeIntent.object.imageSrc}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-full border border-cyan-300/40 object-cover"
                />
              ) : null}
              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">
                {resolveIntentPresentation(activeIntent.object.kind).title}
              </p>
            </div>

            {activeIntent.isBlocked ? (
              activeIntent.object.kind === "DUEL" || activeIntent.object.kind === "BOSS" ? (
                <p className="mt-3 text-sm text-slate-200">
                  Este rival aún no te reconoce como rival. Vence antes a los oponentes anteriores del sector.
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-200">
                  Está bloqueado. Requisitos pendientes:{" "}
                  <span className="font-semibold text-amber-200">
                    {activeIntent.missingRequirements.join(", ") || "—"}
                  </span>
                  .
                </p>
              )
            ) : (
              <p className="mt-3 text-sm text-slate-200">
                {resolveIntentPresentation(activeIntent.object.kind).body}
              </p>
            )}

            {isCombatIntent ? (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={beginBattleFromPanel}
                  className="flex-1 rounded-lg border border-rose-300/50 bg-rose-500/20 py-2 text-xs font-black uppercase tracking-widest text-rose-100 transition hover:bg-rose-400/30"
                >
                  ¡Combatir!
                </button>
                <button
                  type="button"
                  onClick={closeIntent}
                  className="rounded-lg border border-slate-400/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:bg-white/5"
                >
                  Ahora no
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={closeIntent}
                className="mt-4 w-full rounded-lg border border-cyan-300/40 bg-cyan-500/15 py-2 text-xs font-bold uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/25"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
