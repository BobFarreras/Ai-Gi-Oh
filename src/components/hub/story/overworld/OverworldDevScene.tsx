// src/components/hub/story/overworld/OverworldDevScene.tsx - Escena del overworld: intro cutscene, eventos con vídeo, combate real y controles.
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { OverworldEngine } from "@/components/hub/story/overworld/engine/OverworldEngine";
import {
  IOverworldFocus,
  IOverworldIntent,
} from "@/components/hub/story/overworld/engine/engine-types";
import { OverworldTouchControls } from "@/components/hub/story/overworld/hud/OverworldTouchControls";
import { OverworldMinimap } from "@/components/hub/story/overworld/hud/OverworldMinimap";
import { OverworldBattleTransition } from "@/components/hub/story/overworld/hud/OverworldBattleTransition";
import { OverworldEventDialog } from "@/components/hub/story/overworld/hud/OverworldEventDialog";
import { resolveIntentPresentation } from "@/components/hub/story/overworld/hud/resolve-intent-presentation";
import { buildAct1OverworldTilemap } from "@/services/story/overworld/act-1-overworld-tilemap";
import { buildAct1IntroCutscene } from "@/services/story/overworld/act-1-intro-cutscene";
import { resolveOverworldEventDialogue } from "@/services/story/overworld/resolve-overworld-event-dialogue";
import { IPlayerOverworldPosition } from "@/core/entities/story/IPlayerOverworldState";
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";
import { IStoryNodeInteractionDialogue } from "@/services/story/story-node-interaction-dialogue-types";
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";

const OVERWORLD_MAP_ID = "act-1";

interface IOverworldDevSceneProps {
  completedNodeIds: string[];
  initialPosition: IPlayerOverworldPosition | null;
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

interface IPendingBattle {
  duelHref: string;
  duelNodeId: string;
  imageSrc?: string;
  opponentFacing?: OverworldDirection;
}

export function OverworldDevScene({ completedNodeIds, initialPosition }: IOverworldDevSceneProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OverworldEngine | null>(null);
  const tilemap = useMemo(() => buildAct1OverworldTilemap(), []);
  const spawn = tilemap.spawns.find((entry) => entry.id === tilemap.defaultSpawnId) ?? tilemap.spawns[0];
  const initialCompleted = useMemo(() => new Set(completedNodeIds), [completedNodeIds]);

  const [focus, setFocus] = useState<IOverworldFocus | null>(null);
  const [activeIntent, setActiveIntent] = useState<IOverworldIntent | null>(null);
  const [pendingBattle, setPendingBattle] = useState<IPendingBattle | null>(null);
  const [eventDialogue, setEventDialogue] = useState<{ dialogue: IStoryNodeInteractionDialogue; isCutscene: boolean } | null>(null);
  const [playerTile, setPlayerTile] = useState(
    initialPosition ?? { tileX: spawn.tileX, tileY: spawn.tileY },
  );
  const playerTileRef = useRef(playerTile);
  const [completedIds] = useState<ReadonlySet<string>>(initialCompleted);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const startBattle = (object: IOverworldIntent["object"]): void => {
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
      // La intro solo se reproduce en una entrada fresca (no al volver de un duelo).
      config: { initialPosition, introCutscene: initialPosition ? null : buildAct1IntroCutscene() },
      hooks: {
        onFocusChanged: setFocus,
        onPlayerTileChanged: (tile) => {
          playerTileRef.current = { tileX: tile.tileX, tileY: tile.tileY };
          setPlayerTile({ tileX: tile.tileX, tileY: tile.tileY });
        },
        onCutsceneEvent: (nodeId) => {
          const dialogue = resolveOverworldEventDialogue(nodeId);
          if (dialogue) setEventDialogue({ dialogue, isCutscene: true });
          else engine.resumeCutscene();
        },
        onIntent: (intent) => {
          engine.setInteractionSuspended(true);
          const isCombat =
            !intent.isBlocked &&
            (intent.object.kind === "DUEL" || intent.object.kind === "BOSS") &&
            Boolean(intent.object.duelHref);
          if (isCombat && intent.source === "SIGHTLINE") {
            startBattle(intent.object);
            return;
          }
          if (!intent.isBlocked && (intent.object.kind === "EVENT" || intent.object.kind === "NPC")) {
            const dialogue = resolveOverworldEventDialogue(intent.object.id);
            if (dialogue) {
              setEventDialogue({ dialogue, isCutscene: false });
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
  }, [tilemap, initialCompleted, initialPosition]);

  const closeIntent = (): void => {
    setActiveIntent(null);
    engineRef.current?.setInteractionSuspended(false);
  };

  const closeEventDialogue = (): void => {
    const wasCutscene = eventDialogue?.isCutscene ?? false;
    setEventDialogue(null);
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
    // Guardamos una casilla fuera del radar para no re-activar el combate al volver.
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

      <OverworldMinimap tilemap={tilemap} playerTile={playerTile} defeatedIds={completedIds} />

      <div className="absolute left-3 top-24 z-20">
        <Link
          href="/hub/story"
          className="pointer-events-auto rounded-md border border-cyan-300/35 bg-slate-950/80 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-cyan-200 backdrop-blur-sm transition hover:bg-cyan-400/10"
        >
          Salir
        </Link>
      </div>

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

      {eventDialogue ? (
        <OverworldEventDialog dialogue={eventDialogue.dialogue} onClose={closeEventDialogue} />
      ) : null}

      {pendingBattle ? (
        <OverworldBattleTransition
          opponentImageSrc={pendingBattle.imageSrc}
          onComplete={() => void launchPendingBattle()}
        />
      ) : null}

      {activeIntent && !pendingBattle && !eventDialogue ? (
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
              <p className="mt-3 text-sm text-slate-200">
                Está bloqueado. Requisitos pendientes:{" "}
                <span className="font-semibold text-amber-200">
                  {activeIntent.missingRequirements.join(", ") || "—"}
                </span>
                .
              </p>
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
