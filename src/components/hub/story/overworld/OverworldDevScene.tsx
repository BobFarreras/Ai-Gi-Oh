// src/components/hub/story/overworld/OverworldDevScene.tsx - Escena del overworld: triggers de evento (vídeo terminal / narración BigLog), combate real y controles.
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { OverworldEngine } from "@/components/hub/story/overworld/engine/OverworldEngine";
import {
  IOverworldFocus,
  IOverworldIntent,
  OverworldCutsceneStep,
} from "@/components/hub/story/overworld/engine/engine-types";
import { OverworldTouchControls } from "@/components/hub/story/overworld/hud/OverworldTouchControls";
import { OverworldKeyboardHints } from "@/components/hub/story/overworld/hud/OverworldKeyboardHints";
import { OverworldMinimap } from "@/components/hub/story/overworld/hud/OverworldMinimap";
import { OverworldActBadge } from "@/components/hub/story/overworld/hud/OverworldActBadge";
import { buildStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { OverworldBattleTransition } from "@/components/hub/story/overworld/hud/OverworldBattleTransition";
import { OverworldCardPickup } from "@/components/hub/story/overworld/hud/OverworldCardPickup";
import { OverworldSubmissionDialog } from "@/components/hub/story/overworld/hud/OverworldSubmissionDialog";
import { resolveIntentPresentation } from "@/components/hub/story/overworld/hud/resolve-intent-presentation";
import {
  assertStoryNodeSubmissionRequirements,
  assertStoryNodeSubmissionValid,
  IStoryNodeSubmissionPrompt,
  resolveStoryNodeSubmissionPrompt,
} from "@/services/story/story-node-submission-rules";
import { StoryInteractionVideoOverlay } from "@/components/hub/story/internal/scene/dialog/StoryInteractionVideoOverlay";
import { StoryNodeInteractionDialog } from "@/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog";
import { useStorySceneSfx } from "@/components/hub/story/internal/scene/audio/use-story-scene-sfx";
import { useStoryMapSoundtrack } from "@/components/hub/story/internal/scene/audio/use-story-map-soundtrack";
import { Volume2, VolumeX } from "lucide-react";
import { buildAct1OverworldTilemap } from "@/services/story/overworld/act-1-overworld-tilemap";
import { buildOverworldTilemap, resolveOverworldActId } from "@/services/story/overworld/resolve-overworld-tilemap";
import { buildAct1EchoCutscene } from "@/services/story/overworld/act-1-echo-cutscene";
import { buildAct2BigLogCutscene } from "@/services/story/overworld/act-2-biglog-cutscene";
import { buildAct4HydraAmbushCutscene } from "@/services/story/overworld/act-4-hydra-cutscene";
import { buildAct4CardForgeCutscene } from "@/services/story/overworld/act-4-card-forge-cutscene";
import {
  CARD_FORGE_DUEL_ID,
  CARD_FORGE_SCENERY_GENNVIM_ID,
  CARD_FORGE_SCENERY_MIDUTECH_ID,
  CARD_FORGE_TRIGGER_ID,
  HYDRA_AMBUSH_DUEL_ID,
  HYDRA_AMBUSH_TRIGGER_ID,
} from "@/services/story/overworld/act-4-overworld-tilemap";
import { resolveOverworldEventDialogue } from "@/services/story/overworld/resolve-overworld-event-dialogue";
import { markOverworldEventInteracted } from "@/services/story/overworld/overworld-persistence-client";
import { IPlayerOverworldPosition } from "@/core/entities/story/IPlayerOverworldState";
import { ICard } from "@/core/entities/ICard";
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";
import {
  IStoryInteractionCinematicVideo,
  IStoryInteractionDialogueLine,
} from "@/services/story/story-node-interaction-dialogue-types";
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";

const ECHO_TRIGGER_NODE_ID = "story-a1-side-event-echo-fragment";
const PRECOMBAT_SOUND = "/audio/story/sonido-precombate.m4a";
// Consolas re-leíbles: eventos-nota (p. ej. el registro con el código del terminal) que se pueden
// volver a consultar siempre. Se marcan interactuados una vez (para satisfacer requisitos) pero
// NUNCA se ocultan ni se bloquean: si no apuntaste el código, vuelves y lo relees.
const REREADABLE_EVENT_IDS = new Set<string>(["story-ch3-event-corrupt-log"]);
// Evento de intro que se dispara al PRIMER paso del jugador en el acto (no por trigger de suelo).
const FIRST_STEP_INTRO_BY_MAP: Record<string, string> = {
  "act-3": "story-ch3-event-intro",
  "act-4": "story-ch4-event-intro",
};

function seenEventsStorageKey(playerId: string, mapId: string): string {
  return `overworld-seen-events-${playerId}-${mapId}`;
}

function loadSeenEvents(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    // localStorage no disponible: los eventos simplemente no persisten.
  }
  return new Set();
}

function persistSeenEvents(storageKey: string, seen: Set<string>): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...seen]));
  } catch {
    // Ignorar si no hay localStorage.
  }
}

interface IOverworldDevSceneProps {
  /** Jugador actual: aísla el caché local de eventos vistos por cuenta (no se filtra entre jugadores). */
  playerId: string;
  /** Mapa/acto activo (p. ej. "act-1", "act-2"). Determina tilemap, soundtrack y persistencia. */
  mapId: string;
  completedNodeIds: string[];
  initialPosition: IPlayerOverworldPosition | null;
  interactedNodeIds: string[];
  /** Tras perder/abandonar un combate: se arranca en el spawn del acto y se persiste. */
  resetToActStart?: boolean;
  /** Nexus perdido por la derrota/abandono que trajo de vuelta al mapa (aviso transitorio). */
  penaltyNexus?: number;
}

function buildProgress(completedIds: ReadonlySet<string>, interactedIds: ReadonlySet<string> = new Set<string>()) {
  return {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(interactedIds),
    completedNodeIds: new Set<string>(completedIds),
  };
}

// Ids de las dos mitades de la llave del Acto 2 (nodos de recompensa reutilizados) y sus narraciones.
const ACT2_KEY_NODE_IDS = ["story-ch2-branch-center-a", "story-ch2-branch-bottom-c"];
const ACT2_FIRST_KEY_NARRATION = "story-ch2-branch-lower-up-event";
const ACT2_BOTH_KEYS_NARRATION = "story-ch2-link-recovered-event";
const ACT2_BIGLOG_DUEL_ID = "story-ch2-duel-8";
const ACT2_BIGLOG_TRIGGER_ID = "story-a2-biglog-trigger";
const ACT2_BRIDGE_EVENT_ID = "story-ch2-event-core";
const OPEN_DOOR_SOUND = "/audio/story/open-door-story.m4a";

/**
 * EMBOSCADAS: un trigger oculto (STEP_ON) lanza una cutscene de aparición del rival y, al cerrarse la
 * narración, arranca su combate. El rival NO está plantado en el mapa: aparece guionizado.
 * Se re-dispara mientras no lo venzas (se gatea por su duelo completado, no por "evento visto").
 */
interface IOverworldAmbush {
  duelId: string;
  /** Nodo del catálogo cuya narración se muestra al terminar la cutscene (antes del combate). */
  dialogueNodeId: string;
  buildCutscene: (tilemap: IOverworldTilemap, options: { isCompactViewport: boolean }) => OverworldCutsceneStep[];
  /**
   * Objetos de ATREZZO que representan a los rivales antes de la escena (para que no aparezcan de la nada):
   * se dejan de dibujar al arrancar la cutscene —los sustituyen los NPCs guionizados— y también de entrada si
   * el duelo ya está vencido.
   */
  sceneryNodeIds?: string[];
}
const AMBUSH_BY_TRIGGER_ID: Record<string, IOverworldAmbush> = {
  // Acto 2: BigLog sale del fondo del búnker al pisar su entrada.
  [ACT2_BIGLOG_TRIGGER_ID]: {
    duelId: ACT2_BIGLOG_DUEL_ID,
    dialogueNodeId: ACT2_BIGLOG_DUEL_ID,
    buildCutscene: () => buildAct2BigLogCutscene(),
  },
  // Acto 4: GenNvim corta la retirada dos casillas antes de la carta Hydra (teletransporte en desktop).
  [HYDRA_AMBUSH_TRIGGER_ID]: {
    duelId: HYDRA_AMBUSH_DUEL_ID,
    dialogueNodeId: HYDRA_AMBUSH_TRIGGER_ID,
    buildCutscene: buildAct4HydraAmbushCutscene,
  },
  // Acto 4: la FÁBRICA DE CARTAS. La cutscene ya narra las tres líneas de los villanos (paso EVENT); la
  // narración final de la emboscada es el desafío de GenNvim al girarse, keyed por el id del duelo.
  [CARD_FORGE_TRIGGER_ID]: {
    duelId: CARD_FORGE_DUEL_ID,
    dialogueNodeId: CARD_FORGE_DUEL_ID,
    buildCutscene: buildAct4CardForgeCutscene,
    // Los dos villanos ya están plantados ante la máquina (atrezzo). Al arrancar la escena se ocultan y toman
    // el relevo los NPCs guionizados, que sí se mueven; tras vencer el duelo no se vuelven a dibujar.
    sceneryNodeIds: [CARD_FORGE_SCENERY_GENNVIM_ID, CARD_FORGE_SCENERY_MIDUTECH_ID],
  },
};

/** Atrezzo que hay que dejar de dibujar de entrada porque su escena ya está resuelta. */
function resolveResolvedSceneryIds(completedNodeIds: ReadonlySet<string>): string[] {
  return Object.values(AMBUSH_BY_TRIGGER_ID)
    .filter((ambush) => completedNodeIds.has(ambush.duelId))
    .flatMap((ambush) => ambush.sceneryNodeIds ?? []);
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

export function OverworldDevScene({ playerId, mapId, completedNodeIds, initialPosition, interactedNodeIds, resetToActStart, penaltyNexus = 0 }: IOverworldDevSceneProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OverworldEngine | null>(null);
  const tilemap = useMemo(() => buildOverworldTilemap(mapId) ?? buildAct1OverworldTilemap(), [mapId]);
  const actId = useMemo(() => resolveOverworldActId(mapId), [mapId]);
  const actArcTitle = useMemo(() => buildStoryChapterBriefing(actId).arcTitle, [actId]);
  const storageKey = useMemo(() => seenEventsStorageKey(playerId, mapId), [playerId, mapId]);
  const initialCompleted = useMemo(() => new Set(completedNodeIds), [completedNodeIds]);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  // Recompensas cuya reclamación está en vuelo (fetch en curso): impide dobles cobros/etiquetas
  // "+N" si el jugador vuelve a pulsar antes de que el servidor responda.
  const claimingRewardIdsRef = useRef<Set<string>>(new Set());

  const [focus, setFocus] = useState<IOverworldFocus | null>(null);
  const [activeIntent, setActiveIntent] = useState<IOverworldIntent | null>(null);
  const [pendingBattle, setPendingBattle] = useState<IPendingBattle | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ video: IStoryInteractionCinematicVideo; isCutscene: boolean; nodeId?: string } | null>(null);
  const [narration, setNarration] = useState<IActiveNarration | null>(null);
  // Terminal de código (SUBMISSION): nodo activo + prompt + error de la última validación.
  const [submission, setSubmission] = useState<{ objectId: string; prompt: IStoryNodeSubmissionPrompt } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  // Carta en proceso de revelado tras recogerla (overlay React): congela la escena hasta terminar.
  const [cardPickup, setCardPickup] = useState<ICard | null>(null);
  const initialInteracted = useMemo(() => new Set(interactedNodeIds), [interactedNodeIds]);
  const [collectedRewardIds, setCollectedRewardIds] = useState<ReadonlySet<string>>(initialInteracted);
  const [playerTile, setPlayerTile] = useState(
    initialPosition ?? { tileX: tilemap.spawns[0].tileX, tileY: tilemap.spawns[0].tileY },
  );
  const playerTileRef = useRef(playerTile);
  const [completedIds] = useState<ReadonlySet<string>>(initialCompleted);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);
  const [penaltyToast, setPenaltyToast] = useState<number>(penaltyNexus);
  // El aviso "-N Nexus" (penalización por derrota/abandono) se desvanece solo tras unos segundos.
  useEffect(() => {
    if (penaltyToast <= 0) return;
    const timer = window.setTimeout(() => setPenaltyToast(0), 3800);
    return () => window.clearTimeout(timer);
  }, [penaltyToast]);

  // Altura visible REAL del móvil. El overworld debe ocupar exactamente el viewport visible
  // (restando la barra del navegador/sistema), no `100dvh` ni el wrapper `min-h-dvh` del hub,
  // que se extienden por debajo de la barra y cortan los controles. `visualViewport` da el alto
  // exacto y se actualiza al mostrarse/ocultarse la barra; se aplica como px fijos al contenedor.
  const [viewportHeightPx, setViewportHeightPx] = useState<number | null>(null);
  useEffect(() => {
    const measure = (): void => setViewportHeightPx(window.visualViewport?.height ?? window.innerHeight);
    measure();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  // Mientras se reproduce un vídeo, pausamos el bucle del engine (update + render del canvas): así el
  // vídeo no compite con el render a 60Hz y va fluido en móvil. Se reanuda al cerrarlo.
  useEffect(() => {
    engineRef.current?.setLoopSuspended(activeVideo !== null);
  }, [activeVideo]);

  // Audio: SFX de Story + soundtrack del acto (reutilizados del modo Story clásico).
  const sfx = useStorySceneSfx();
  const sfxRef = useRef(sfx);
  useEffect(() => {
    sfxRef.current = sfx;
  });
  const { isMuted, toggleMute } = useStoryMapSoundtrack(actId);
  const precombatRef = useRef<HTMLAudioElement | null>(null);
  const doorSoundRef = useRef<HTMLAudioElement | null>(null);
  // Emboscada en curso: rival pendiente de combate tras su cutscene de aparición (+ narración a mostrar).
  const ambushPendingRef = useRef<{ duel: IOverworldIntent["object"]; dialogueNodeId: string } | null>(null);
  useEffect(() => {
    if (typeof Audio === "undefined") return;
    const precombat = new Audio(PRECOMBAT_SOUND);
    precombat.preload = "auto";
    precombat.volume = 0.55;
    precombatRef.current = precombat;
    const door = new Audio(OPEN_DOOR_SOUND);
    door.preload = "auto";
    door.volume = 0.6;
    doorSoundRef.current = door;
    return () => {
      precombat.pause();
      door.pause();
      precombatRef.current = null;
      doorSoundRef.current = null;
    };
  }, []);

  const saveOverworldPosition = useCallback(async (): Promise<void> => {
    const tile = playerTileRef.current;
    try {
      await fetch("/api/story/overworld/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mapId, tileX: tile.tileX, tileY: tile.tileY }),
      });
    } catch {
      // Si falla, se pierde solo la posición restaurada; no bloquea la navegación.
    }
  }, [mapId]);

  const openArsenal = useCallback(async (): Promise<void> => {
    sfxRef.current?.playButtonClick();
    await saveOverworldPosition();
    router.push("/hub/arsenal?from=overworld");
  }, [saveOverworldPosition, router]);

  // Flujo directo: al activar Mercado/Salida se hace el zoom al nodo y se navega (sin diálogo).
  const enterMarket = useCallback(async (): Promise<void> => {
    sfxRef.current?.playButtonClick();
    await saveOverworldPosition();
    router.push("/hub/market?from=overworld");
  }, [saveOverworldPosition, router]);

  const exitToHub = useCallback((): void => {
    sfxRef.current?.playButtonClick();
    router.push("/hub");
  }, [router]);

  // Portal entre actos: el servidor valida el acceso (gate del mapa) y persiste el nuevo mapa;
  // recargamos el overworld, que carga el mapa destino. Si el destino aún no existe, avisamos.
  const warpToMap = useCallback(async (nodeId: string): Promise<void> => {
    try {
      const res = await fetch("/api/story/overworld/warp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fromMapId: mapId, nodeId }),
      });
      const data = (await res.json()) as { available?: boolean };
      if (res.ok && data.available) {
        sfxRef.current?.playButtonClick();
        window.location.assign("/hub/story/overworld");
        return;
      }
    } catch {
      // Cae al aviso de "no disponible".
    }
    setPortalNotice("El siguiente acto aún no está disponible. ¡Muy pronto!");
    engineRef.current?.releaseServiceZoom();
    engineRef.current?.setInteractionSuspended(false);
  }, [mapId]);

  // Tras perder/abandonar: la escena ya arranca en el spawn (initialPosition=null); persistimos
  // esa posición para que un refresco no restaure la última casilla previa al combate.
  useEffect(() => {
    if (resetToActStart) void saveOverworldPosition();
  }, [resetToActStart, saveOverworldPosition]);

  // Sincroniza los nodos interactuados (eventos/recompensas/llaves vistos) al motor, para que las
  // puertas (evento del puente) y el puente central (2 llaves) se abran EN VIVO al conseguirlos.
  const syncEngineProgress = useCallback((): void => {
    engineRef.current?.updateProgress(buildProgress(initialCompleted, seenEventIdsRef.current));
  }, [initialCompleted]);

  // Nodo de carta cuyo aviso narrativo debe saltar al terminar el revelado (p.ej. Antigrabity -> BigLog).
  const pendingCardNarrationRef = useRef<string | null>(null);
  // Fin del revelado de carta: reevalúa el progreso (por si desbloquea algo) y devuelve el control. Si la carta
  // lleva narración asociada (mismo id de nodo), la muestra antes de devolver el control.
  const completeCardPickup = useCallback((): void => {
    setCardPickup(null);
    engineRef.current?.updateProgress(buildProgress(initialCompleted, seenEventIdsRef.current));
    const cardNodeId = pendingCardNarrationRef.current;
    pendingCardNarrationRef.current = null;
    if (cardNodeId) {
      const dialogue = resolveOverworldEventDialogue(cardNodeId);
      if (dialogue && dialogue.lines.length > 0) {
        engineRef.current?.setInteractionSuspended(true);
        setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: false });
        return;
      }
    }
    engineRef.current?.setInteractionSuspended(false);
  }, [initialCompleted]);

  // Combate diferido tras una narración (BigLog: aparece, narra y arranca el combate).
  const pendingNarrationBattleRef = useRef<IOverworldIntent["object"] | null>(null);
  const launchPendingNarrationBattle = useCallback((): boolean => {
    const object = pendingNarrationBattleRef.current;
    if (!object?.duelHref) return false;
    pendingNarrationBattleRef.current = null;
    const precombat = precombatRef.current;
    if (precombat) {
      precombat.currentTime = 0;
      void precombat.play().catch(() => undefined);
    }
    setPendingBattle({ duelHref: object.duelHref, duelNodeId: object.id, imageSrc: object.imageSrc, opponentFacing: object.facing });
    return true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const firstStepIntroId = FIRST_STEP_INTRO_BY_MAP[mapId];
    // Los eventos/recompensas ya vistos no se repiten (persisten entre recargas + servidor).
    loadSeenEvents(storageKey).forEach((id) => seenEventIdsRef.current.add(id));
    initialInteracted.forEach((id) => seenEventIdsRef.current.add(id));
    const markEventSeen = (nodeId: string): void => {
      seenEventIdsRef.current.add(nodeId);
      persistSeenEvents(storageKey, seenEventIdsRef.current);
    };
    const claimReward = async (object: IOverworldIntent["object"]): Promise<void> => {
      // Guard anti-duplicado: si ya se está reclamando (o ya está visto) no se relanza. Evita varias
      // etiquetas "+N" y SFX cuando se pulsa rápido antes de que el servidor confirme el cobro.
      if (claimingRewardIdsRef.current.has(object.id) || seenEventIdsRef.current.has(object.id)) return;
      claimingRewardIdsRef.current.add(object.id);
      try {
        const res = await fetch("/api/story/overworld/claim-reward", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ nodeId: object.id, mapId }),
        });
        const data = (await res.json()) as {
          alreadyClaimed?: boolean;
          rewardNexus?: number;
          rewardCardId?: string | null;
          rewardCard?: ICard | null;
          rewardObject?: { name: string; quantity: number } | null;
        };
        if (res.ok) {
          markEventSeen(object.id);
          setCollectedRewardIds((prev) => new Set(prev).add(object.id));
          // Las llaves son objetos de story (no Nexus): siempre animan la recogida SIN valor flotante.
          const isKey = ACT2_KEY_NODE_IDS.includes(object.id);
          // Recompensa de carta: se revela con la Card real (overlay React) y luego se encoge hacia el
          // jugador. El nodo se oculta y su celda se libera sin la animación de canvas (la hace React).
          if (!isKey && object.kind === "REWARD_CARD" && data.rewardCard) {
            sfxRef.current?.playRewardCard();
            engine.setInteractionSuspended(true);
            engine.markObjectCollected(object.id);
            // Si la carta tiene aviso narrativo (p.ej. Antigrabity -> BigLog), saltará al cerrar el revelado.
            pendingCardNarrationRef.current = resolveOverworldEventDialogue(object.id) ? object.id : null;
            setCardPickup(data.rewardCard);
            return;
          }
          if (isKey || (!data.alreadyClaimed && ((data.rewardNexus ?? 0) > 0 || data.rewardCardId || data.rewardObject))) {
            if (!isKey && (data.rewardNexus ?? 0) > 0) sfxRef.current?.playRewardNexus();
            else sfxRef.current?.playRewardCard();
            // El objeto se encoge hacia el jugador; si es Nexus u objeto (no llave), sube la etiqueta flotante.
            engine.collectReward({
              objectId: object.id,
              imageSrc: object.imageSrc,
              floatingLabel: !isKey && (data.rewardNexus ?? 0) > 0
                ? `+${data.rewardNexus}`
                : !isKey && data.rewardObject
                  ? `+${data.rewardObject.name}`
                  : null,
              onDone: () => {
                // Puertas/puente reevalúan sus requisitos con el nodo recién interactuado.
                engine.updateProgress(buildProgress(initialCompleted, seenEventIdsRef.current));
                // Al coger una mitad de la llave: narración (primera mitad, o "link recuperado" si ya tienes las dos).
                if (ACT2_KEY_NODE_IDS.includes(object.id)) {
                  const hasBothKeys = ACT2_KEY_NODE_IDS.every((id) => seenEventIdsRef.current.has(id));
                  const dialogue = resolveOverworldEventDialogue(hasBothKeys ? ACT2_BOTH_KEYS_NARRATION : ACT2_FIRST_KEY_NARRATION);
                  if (dialogue && dialogue.lines.length > 0) {
                    setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: false });
                    return;
                  }
                }
                engine.setInteractionSuspended(false);
              },
            });
            return;
          }
        }
      } catch {
        // Si falla la red, no marcamos como visto: se puede reintentar al volver a pisar.
      } finally {
        claimingRewardIdsRef.current.delete(object.id);
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
    // En pantallas compactas (móvil) alejamos la cámara para ver más mapa de una vez.
    const isCompactViewport =
      typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;
    const initialZoom = isCompactViewport ? 1.35 : 1.85;
    const engine = new OverworldEngine({
      canvas,
      tilemap,
      progress: buildProgress(initialCompleted, initialInteracted),
      config: {
        initialPosition,
        // Las consolas re-leíbles no se ocultan aunque estén interactuadas (siguen consultables). El atrezzo de
        // una escena ya resuelta (los villanos de la Fábrica tras vencerla) tampoco se vuelve a dibujar.
        collectedNodeIds: [
          ...[...initialInteracted].filter((id) => !REREADABLE_EVENT_IDS.has(id)),
          ...resolveResolvedSceneryIds(initialCompleted),
        ],
        zoom: initialZoom,
      },
      hooks: {
        onFocusChanged: setFocus,
        onPlayerTileChanged: (tile) => {
          playerTileRef.current = { tileX: tile.tileX, tileY: tile.tileY };
          setPlayerTile({ tileX: tile.tileX, tileY: tile.tileY });
          // Intro del acto al PRIMER paso (una sola vez): cinemática si el acto la tiene, si no narración.
          if (firstStepIntroId && !seenEventIdsRef.current.has(firstStepIntroId)) {
            markEventSeen(firstStepIntroId);
            void markOverworldEventInteracted(firstStepIntroId);
            const dialogue = resolveOverworldEventDialogue(firstStepIntroId);
            // Intro con VÍDEO (Acto 4): mismo overlay de terminal que las intros de los Actos 1 y 2 (se abre,
            // reproduce y se cierra). El vídeo ES la intro: sustituye a la narración, no se encadena detrás.
            if (dialogue?.cinematicVideo) {
              engine.setInteractionSuspended(true);
              playDeviceSound();
              setActiveVideo({ video: dialogue.cinematicVideo, isCutscene: false, nodeId: firstStepIntroId });
              return;
            }
            if (dialogue && dialogue.lines.length > 0) {
              engine.setInteractionSuspended(true);
              setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: false });
            }
          }
        },
        onCutsceneEvent: (nodeId) => {
          const dialogue = resolveOverworldEventDialogue(nodeId);
          if (dialogue && dialogue.lines.length > 0) {
            setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: true });
          } else {
            engine.resumeCutscene();
          }
        },
        onPlatePressed: (plateId) => {
          // Una caja pisó una placa: suena el "clunk" de puerta que se abre.
          if (doorSoundRef.current) {
            doorSoundRef.current.currentTime = 0;
            void doorSoundRef.current.play().catch(() => undefined);
          }
          // Enclavamos la placa: se persiste como evento interactuado (una sola vez) para que la
          // compuerta a la caché siga abierta tras el duelo obligatorio de la sala. Sin esto, la caja
          // vuelve a su origen al regresar del combate, la placa se despresuriza y el jugador queda
          // atrapado dentro (soft-lock del Acto 3).
          if (!seenEventIdsRef.current.has(plateId)) {
            markEventSeen(plateId);
            void markOverworldEventInteracted(plateId);
            engine.updateProgress(buildProgress(initialCompleted, seenEventIdsRef.current));
            // Si la placa es una "ranura" con narración (p.ej. el módulo que invierte la pasarela), la muestra.
            const slotDialogue = resolveOverworldEventDialogue(plateId);
            if (slotDialogue && slotDialogue.lines.length > 0) {
              engine.setInteractionSuspended(true);
              setNarration({ title: slotDialogue.title, lines: slotDialogue.lines, lineIndex: 0, isCutscene: false });
            }
          }
        },
        onCutsceneEnd: () => {
          // Fin de una cutscene de emboscada: narra el reto y (al cerrarla) arranca el combate.
          const ambush = ambushPendingRef.current;
          if (ambush) {
            ambushPendingRef.current = null;
            pendingNarrationBattleRef.current = ambush.duel;
            const dialogue = resolveOverworldEventDialogue(ambush.dialogueNodeId);
            if (dialogue && dialogue.lines.length > 0) {
              setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: false });
              return;
            }
            // Sin narración configurada: al combate directo (si no, el rival se quedaría plantado ahí).
            if (launchPendingNarrationBattle()) return;
          }
          engine.setInteractionSuspended(false);
        },
        onIntent: (intent) => {
          // Importante: NO suspendemos por defecto. Solo se congela el movimiento cuando el intent
          // abre algo que bloquea (combate, nodo de servicio, cutscene, vídeo, narración o panel).
          // Los pasos "sin acción" (evento/recompensa ya vistos, o recompensa normal que se coge al
          // vuelo) NO frenan al jugador → se acabó el tirón al cruzar la casilla.
          const { object } = intent;
          const isCombat =
            !intent.isBlocked &&
            (object.kind === "DUEL" || object.kind === "BOSS") &&
            Boolean(object.duelHref);
          if (isCombat && intent.source === "SIGHTLINE") {
            engine.setInteractionSuspended(true);
            startBattle(object);
            return;
          }
          // Nodos de servicio: acercamiento de cámara al nodo y navegación directa (sin diálogo).
          if (object.kind === "MARKET") {
            engine.setInteractionSuspended(true);
            engine.playServiceZoom(object.id, () => void enterMarket());
            return;
          }
          if (object.kind === "ARSENAL") {
            engine.setInteractionSuspended(true);
            engine.playServiceZoom(object.id, () => void openArsenal());
            return;
          }
          if (object.kind === "TELEPORT") {
            engine.setInteractionSuspended(true);
            engine.playServiceZoom(object.id, () => exitToHub());
            return;
          }
          // Portal de acto: zoom al portal y salto de mapa validado en servidor. Un portal SIN destino es un
          // acto anunciado pero aún no construido (el del Acto 5): en vez de saltar, cuenta su narración —y no
          // se marca como visto, para poder volver a leerla cada vez que se pulse.
          if (!intent.isBlocked && object.kind === "WARP") {
            if (!object.warp) {
              const pendingDialogue = resolveOverworldEventDialogue(object.id);
              if (!pendingDialogue || pendingDialogue.lines.length === 0) return;
              engine.setInteractionSuspended(true);
              playDeviceSound();
              setNarration({ title: pendingDialogue.title, lines: pendingDialogue.lines, lineIndex: 0, isCutscene: false });
              return;
            }
            engine.setInteractionSuspended(true);
            engine.playServiceZoom(object.id, () => void warpToMap(object.id));
            return;
          }
          // Recompensas: se otorgan en servidor (una sola vez) al pulsar el botón estando al lado
          // (ADJACENT_ACTION). Su celda está bloqueada, así que el jugador se para enfrente y decide;
          // solo las mitades de la llave congelan la escena porque después narran.
          if (!intent.isBlocked && (object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD" || object.kind === "REWARD_OBJECT")) {
            if (seenEventIdsRef.current.has(object.id)) return;
            if (ACT2_KEY_NODE_IDS.includes(object.id)) engine.setInteractionSuspended(true);
            void claimReward(object);
            return;
          }
          if (!intent.isBlocked && (object.kind === "EVENT" || object.kind === "NPC")) {
            // EMBOSCADAS (BigLog en el búnker del Acto 2, GenNvim en el pasillo de la Hydra del Acto 4): al
            // PISAR el trigger salta la cutscene de aparición; al terminar se narra el reto y arranca el
            // combate. Se re-dispara mientras no lo venzas (se gatea por su duelo completado, no por
            // "visto"), y por eso NO se marca como visto.
            const ambush = AMBUSH_BY_TRIGGER_ID[object.id];
            if (ambush) {
              if (initialCompleted.has(ambush.duelId)) return;
              const ambushDuel = tilemap.objects.find((entry) => entry.id === ambush.duelId);
              if (ambushDuel) {
                engine.setInteractionSuspended(true);
                ambushPendingRef.current = { duel: ambushDuel, dialogueNodeId: ambush.dialogueNodeId };
                // El atrezzo deja paso a los NPCs guionizados (mismas casillas, pero estos sí se mueven).
                const sceneryIds = ambush.sceneryNodeIds ?? [];
                for (const sceneryId of sceneryIds) engine.markObjectCollected(sceneryId);
                if (sceneryIds.length > 0) {
                  setCollectedRewardIds((current) => new Set([...current, ...sceneryIds]));
                }
                engine.startCutscene(ambush.buildCutscene(tilemap, { isCompactViewport }));
                return;
              }
            }
            const isReReadable = REREADABLE_EVENT_IDS.has(object.id);
            // Las consolas re-leíbles no se bloquean: siempre reabren su diálogo. El resto, una vez.
            if (!isReReadable && seenEventIdsRef.current.has(object.id)) return;
            if (!seenEventIdsRef.current.has(object.id)) {
              markEventSeen(object.id);
              // Persistimos el evento en BD (no solo en localStorage): así no reaparece al
              // iniciar sesión en otro navegador/dispositivo. Best-effort: si falla, el caché
              // local cubre la sesión actual y se reintenta al volver a activarlo.
              void markOverworldEventInteracted(object.id);
            }
            // Subruta difícil: aparece BigLog (cutscene) y narra el aviso.
            if (object.id === ECHO_TRIGGER_NODE_ID) {
              engine.setInteractionSuspended(true);
              engine.startCutscene(buildAct1EchoCutscene());
              return;
            }
            const dialogue = resolveOverworldEventDialogue(object.id);
            if (dialogue?.cinematicVideo) {
              engine.setInteractionSuspended(true);
              playDeviceSound();
              setActiveVideo({ video: dialogue.cinematicVideo, isCutscene: false, nodeId: object.id });
              return;
            }
            if (dialogue && dialogue.lines.length > 0) {
              engine.setInteractionSuspended(true);
              setNarration({ title: dialogue.title, lines: dialogue.lines, lineIndex: 0, isCutscene: false });
              return;
            }
            // Evento sin diálogo configurado: nada que abrir → no frena.
            return;
          }
          // Terminal de código (SUBMISSION): abre el diálogo de introducción de clave. La validación
          // (código + requisitos) la hace el padre con las reglas de submission existentes.
          if (!intent.isBlocked && object.kind === "SUBMISSION") {
            if (seenEventIdsRef.current.has(object.id)) return;
            const prompt = resolveStoryNodeSubmissionPrompt(object.id);
            if (!prompt) return;
            engine.setInteractionSuspended(true);
            playDeviceSound();
            setSubmissionError(null);
            setSubmission({ objectId: object.id, prompt });
            return;
          }
          // Botón de reinicio: devuelve las cajas a su sitio (rescate anti soft-lock). Sin panel.
          if (!intent.isBlocked && object.kind === "BOX_RESET") {
            engine.resetBoxes();
            playDeviceSound();
            return;
          }
          if (!intent.isBlocked && object.kind === "SWITCH") {
            // Interruptor de CINTA (belt-toggle): REVERSIBLE y SIN narración. Cada interruptor manda una
            // posición del puente y se dibuja encendido/apagado, así que la propia palanca ya cuenta el estado
            // (pulsar el que ya manda no hace nada). No se persiste: resetea al sentido base al recargar.
            if (object.beltToggleRect) {
              playDeviceSound();
              engine.toggleBelt(object.id);
              return;
            }
            // Interruptor de luz (mapas oscuros): enciende la sala al instante, sin panel. De un solo uso: se
            // marca como interactuado (persistido) para que siga encendido tras un combate/refresco.
            if (seenEventIdsRef.current.has(object.id)) return;
            markEventSeen(object.id);
            void markOverworldEventInteracted(object.id);
            playDeviceSound();
            engine.updateProgress(buildProgress(initialCompleted, seenEventIdsRef.current));
            const switchDialogue = resolveOverworldEventDialogue(object.id);
            if (switchDialogue && switchDialogue.lines.length > 0) {
              engine.setInteractionSuspended(true);
              setNarration({ title: switchDialogue.title, lines: switchDialogue.lines, lineIndex: 0, isCutscene: false });
            }
            return;
          }
          // Acción adyacente (pulsar A frente a un nodo): abre el panel → congela mientras esté abierto.
          engine.setInteractionSuspended(true);
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
  }, [mapId, storageKey, tilemap, initialCompleted, initialPosition, initialInteracted, openArsenal, enterMarket, exitToHub, warpToMap, launchPendingNarrationBattle]);

  const closeIntent = (): void => {
    setActiveIntent(null);
    engineRef.current?.setInteractionSuspended(false);
  };

  const closeVideo = (): void => {
    const wasCutscene = activeVideo?.isCutscene ?? false;
    const wasBridgeVideo = activeVideo?.nodeId === ACT2_BRIDGE_EVENT_ID;
    sfxRef.current?.playEventFinish();
    setActiveVideo(null);
    syncEngineProgress(); // el vídeo del diagnóstico abre las 2 puertas de las ramas.
    if (wasBridgeVideo) {
      if (doorSoundRef.current) {
        doorSoundRef.current.currentTime = 0;
        void doorSoundRef.current.play().catch(() => undefined);
      }
      // Persistimos el evento en servidor: las puertas siguen abiertas tras un combate/refresco.
      void fetch("/api/story/overworld/mark-interacted", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nodeId: ACT2_BRIDGE_EVENT_ID }),
      }).catch(() => undefined);
    }
    if (wasCutscene) engineRef.current?.resumeCutscene();
    else engineRef.current?.setInteractionSuspended(false);
  };

  const advanceNarration = useCallback((): void => {
    setNarration((current) => {
      if (!current) return null;
      if (current.lineIndex < current.lines.length - 1) {
        return { ...current, lineIndex: current.lineIndex + 1 };
      }
      // Narración terminada. Si hay un combate diferido (BigLog), se deja suspendido y lo lanza
      // el efecto de abajo; si no, se sincroniza el progreso (la 2ª llave despliega el puente).
      if (!pendingNarrationBattleRef.current) {
        syncEngineProgress();
        if (current.isCutscene) engineRef.current?.resumeCutscene();
        else engineRef.current?.setInteractionSuspended(false);
      }
      return null;
    });
  }, [syncEngineProgress]);

  // Al cerrarse una narración con combate diferido (BigLog), arranca la animación de combate.
  useEffect(() => {
    if (narration === null && pendingNarrationBattleRef.current) launchPendingNarrationBattle();
  }, [narration, launchPendingNarrationBattle]);

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
    // Si hay combate diferido (BigLog), lo lanza el efecto al pasar narration a null.
    if (pendingNarrationBattleRef.current) return;
    syncEngineProgress();
    if (wasCutscene) engineRef.current?.resumeCutscene();
    else engineRef.current?.setInteractionSuspended(false);
  };

  const closeSubmission = useCallback((): void => {
    setSubmission(null);
    setSubmissionError(null);
    engineRef.current?.setInteractionSuspended(false);
  }, []);

  const submitSubmission = useCallback(
    (code: string): void => {
      const active = submission;
      if (!active) return;
      try {
        assertStoryNodeSubmissionRequirements({
          nodeId: active.objectId,
          completedNodeIds: [...initialCompleted],
          interactedNodeIds: [...seenEventIdsRef.current],
        });
        assertStoryNodeSubmissionValid(active.objectId, code);
      } catch (error) {
        setSubmissionError(error instanceof Error ? error.message : "Código inválido.");
        return;
      }
      // Código correcto: marca el terminal como resuelto (persistido) → abre la puerta enlazada.
      seenEventIdsRef.current.add(active.objectId);
      persistSeenEvents(storageKey, seenEventIdsRef.current);
      void markOverworldEventInteracted(active.objectId);
      engineRef.current?.updateProgress(buildProgress(initialCompleted, seenEventIdsRef.current));
      if (doorSoundRef.current) {
        doorSoundRef.current.currentTime = 0;
        void doorSoundRef.current.play().catch(() => undefined);
      }
      sfxRef.current?.playEventFinish();
      setSubmission(null);
      setSubmissionError(null);
      engineRef.current?.setInteractionSuspended(false);
    },
    [submission, initialCompleted, storageKey],
  );

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
          mapId,
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

  const handleCanvasClick = (event: ReactMouseEvent<HTMLCanvasElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    engineRef.current?.handlePointer(event.clientX - rect.left, event.clientY - rect.top);
  };

  return (
    <div
      className="fixed left-0 top-0 w-full overflow-hidden bg-slate-950"
      style={{ height: viewportHeightPx ? `${viewportHeightPx}px` : "100svh" }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block h-full w-full"
        aria-label="Mundo Story"
      />

      <OverworldMinimap tilemap={tilemap} playerTile={playerTile} defeatedIds={completedIds} hiddenIds={collectedRewardIds} />

      <OverworldActBadge mapId={mapId} arcTitle={actArcTitle} />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? "Activar música" : "Silenciar música"}
        className="pointer-events-auto absolute left-3 top-3 z-20 rounded-md border border-cyan-300/30 bg-slate-950/80 p-2 text-cyan-200 backdrop-blur-sm transition hover:bg-cyan-400/10"
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

      <OverworldKeyboardHints />

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

      {portalNotice ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4" onClick={() => setPortalNotice(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-indigo-300/30 bg-slate-950/95 p-5 text-indigo-50 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-300">Portal de acto</p>
            <p className="mt-3 text-sm text-slate-200">{portalNotice}</p>
            <button
              type="button"
              onClick={() => setPortalNotice(null)}
              className="mt-4 w-full rounded-lg border border-indigo-300/40 bg-indigo-500/15 py-2 text-xs font-bold uppercase tracking-widest text-indigo-100 transition hover:bg-indigo-400/25"
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}

      {penaltyToast > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-40 flex justify-center px-4">
          <div className="animate-pulse rounded-full border border-rose-400/40 bg-rose-950/85 px-5 py-2 text-sm font-black uppercase tracking-widest text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.35)]">
            −{penaltyToast} Nexus
          </div>
        </div>
      ) : null}

      {cardPickup ? <OverworldCardPickup card={cardPickup} onComplete={completeCardPickup} /> : null}

      {submission ? (
        <OverworldSubmissionDialog
          prompt={submission.prompt}
          errorText={submissionError}
          onSubmit={submitSubmission}
          onClose={closeSubmission}
        />
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
              ) : activeIntent.object.kind === "REWARD_CARD" ||
                activeIntent.object.kind === "REWARD_NEXUS" ||
                activeIntent.object.kind === "REWARD_OBJECT" ? (
                // Recompensa custodiada (p. ej. la carta Hydra hasta vencer a GenNvim): mensaje de juego,
                // no el id crudo del nodo.
                <p className="mt-3 text-sm text-slate-200">
                  Sigue protegida: no podrás llevártela hasta vencer a quien la custodia.
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
