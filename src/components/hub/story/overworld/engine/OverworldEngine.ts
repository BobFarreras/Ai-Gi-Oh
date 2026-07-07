// src/components/hub/story/overworld/engine/OverworldEngine.ts - Game loop imperativo del overworld: timestep fijo, movimiento por celdas, interacción y render desacoplado.
import {
  IGridPosition,
  IOverworldProgressState,
  OverworldDirection,
} from "@/core/services/story/overworld/overworld-types";
import {
  canWalkToTile,
  resolveMovementContext,
  resolveStep,
} from "@/core/services/story/overworld/movement-rules";
import { isRequirementSatisfied } from "@/core/services/story/overworld/interaction-rules";
import {
  IInteractableTarget,
  resolveFocusedInteractable,
  resolveSteppedInteractable,
} from "@/core/services/story/overworld/interaction-focus";
import { resolveTriggeredSightline } from "@/core/services/story/overworld/sightline";
import { IOverworldTilemap, IOverworldTilemapObject } from "@/services/story/overworld/tilemap-schema";
import { OpponentActorManager } from "@/components/hub/story/overworld/engine/OpponentActorManager";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveCameraOffset } from "@/components/hub/story/overworld/engine/camera-math";
import {
  DEFAULT_ENGINE_CONFIG,
  FIXED_TIMESTEP_MS,
  IEngineWorldState,
  IOverworldCutsceneNpcRender,
  IOverworldEngineConfig,
  IOverworldFocus,
  IOverworldIntent,
  MAX_ACCUMULATED_MS,
  OverworldCutsceneStep,
} from "@/components/hub/story/overworld/engine/engine-types";
import {
  Renderer2D,
  resolvePlayerFocus,
  resolvePlayerPixelPosition,
} from "@/components/hub/story/overworld/engine/Renderer2D";
import { SpriteCache } from "@/components/hub/story/overworld/engine/SpriteCache";

export interface IOverworldEngineHooks {
  /** Se dispara al completar cada paso; costura para persistir posición (Fase 3). */
  onPlayerTileChanged?: (tile: IGridPosition) => void;
  /** Objeto enfocado (o null) para el prompt contextual. */
  onFocusChanged?: (focus: IOverworldFocus | null) => void;
  /** Interacción disparada (acción adyacente o pisada): React decide qué hacer. */
  onIntent?: (intent: IOverworldIntent) => void;
  /** Paso EVENT de una cutscene: React muestra el diálogo/vídeo y luego llama a resumeCutscene(). */
  onCutsceneEvent?: (nodeId: string) => void;
  /** La cutscene ha terminado (se devuelve el control al jugador). */
  onCutsceneEnd?: () => void;
}

interface IOverworldEngineInit {
  canvas: HTMLCanvasElement;
  tilemap: IOverworldTilemap;
  progress: IOverworldProgressState;
  hooks?: IOverworldEngineHooks;
  config?: Partial<IOverworldEngineConfig>;
}

/**
 * Motor del overworld. Vive fuera del ciclo de render de React: React lo monta,
 * le envía entrada externa (móvil) y escucha hooks; el motor no toca DOM de React ni la BD.
 */
export class OverworldEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer2D;
  private readonly config: IOverworldEngineConfig;
  private readonly hooks: IOverworldEngineHooks;
  private readonly world: IEngineWorldState;
  private readonly interactables: IInteractableTarget[];
  private readonly objectsById: Map<string, IOverworldTilemapObject>;
  private readonly actors: OpponentActorManager;
  private readonly sprites = new SpriteCache();

  private progress: IOverworldProgressState;
  private blockedObjectIds: Set<string> = new Set();
  private focusedObjectId: string | null = null;

  // Cutscene guionizada (intro, apariciones de NPC).
  private cutsceneSteps: OverworldCutsceneStep[] = [];
  private cutsceneIndex = 0;
  private isCutsceneActive = false;
  private isCutsceneStepStarted = false;
  private cutsceneWaitSeconds = 0;
  private isCutsceneAwaitingResume = false;
  private cutsceneNpc: {
    tile: IGridPosition;
    facing: OverworldDirection;
    spriteSrc: string;
    activeMove: { from: IGridPosition; to: IGridPosition; progress: number } | null;
    walkPath: IGridPosition[];
    walkIndex: number;
  } | null = null;

  private heldDirection: OverworldDirection | null = null;
  private externalDirection: OverworldDirection | null = null;
  private isActionQueued = false;
  private isInteractionSuspended = false;

  private animationFrameId: number | null = null;
  private lastFrameTimeMs: number | null = null;
  private accumulatedMs = 0;
  private isRunning = false;
  private isDisposed = false;
  private resizeObserver: ResizeObserver | null = null;

  private readonly keyToDirection: Record<string, OverworldDirection> = {
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    KeyW: "UP",
    KeyS: "DOWN",
    KeyA: "LEFT",
    KeyD: "RIGHT",
  };
  private readonly actionKeys = new Set(["Space", "Enter", "KeyE"]);
  private readonly heldKeyDirections: OverworldDirection[] = [];

  constructor(init: IOverworldEngineInit) {
    this.canvas = init.canvas;
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...init.config };
    this.hooks = init.hooks ?? {};
    this.progress = init.progress;
    this.renderer = new Renderer2D(
      init.canvas,
      this.config.maxDevicePixelRatio,
      this.sprites,
      this.config.playerImageSrc,
      this.config.zoom,
    );
    this.sprites.load(this.config.playerImageSrc);
    this.sprites.loadAll(init.tilemap.objects.map((object) => object.imageSrc));
    this.objectsById = new Map(init.tilemap.objects.map((object) => [object.id, object]));
    // Los rivales (DUEL/BOSS) son actores dinámicos con línea de visión, no objetos
    // de acción adyacente: se excluyen del foco de interacción.
    this.interactables = init.tilemap.objects
      .filter((object) => object.kind !== "DUEL" && object.kind !== "BOSS")
      .map((object) => ({
        id: object.id,
        tileX: object.tileX,
        tileY: object.tileY,
        trigger: object.trigger,
        requiredNodeIds: object.gateRequiredNodeIds ?? [],
      }));
    this.actors = new OpponentActorManager(init.tilemap.objects, this.config.tilesPerSecond);

    const spawn =
      init.tilemap.spawns.find((entry) => entry.id === init.tilemap.defaultSpawnId) ??
      init.tilemap.spawns[0];
    const collisionGrid = buildCollisionGridFromTilemap(init.tilemap);
    // Posición inicial restaurada (tras un duelo) si es válida y transitable; si no, el spawn del mapa.
    const restored = this.config.initialPosition;
    const useRestored = Boolean(
      restored &&
        restored.tileY >= 0 &&
        restored.tileY < init.tilemap.height &&
        restored.tileX >= 0 &&
        restored.tileX < init.tilemap.width &&
        collisionGrid.walkable[restored.tileY]?.[restored.tileX],
    );
    this.world = {
      tilemap: init.tilemap,
      movementContext: resolveMovementContext({
        collisionGrid,
        gates: listGatesFromTilemap(init.tilemap),
        progress: init.progress,
      }),
      player: {
        tile:
          useRestored && restored
            ? { tileX: restored.tileX, tileY: restored.tileY }
            : { tileX: spawn.tileX, tileY: spawn.tileY },
        facing: spawn.facing,
        activeMove: null,
      },
    };
    this.recomputeBlockedObjects();
  }

  /** Recalcula puertas y objetos bloqueados cuando cambia el progreso. */
  updateProgress(progress: IOverworldProgressState): void {
    this.progress = progress;
    this.world.movementContext = resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(this.world.tilemap),
      gates: listGatesFromTilemap(this.world.tilemap),
      progress,
    });
    this.recomputeBlockedObjects();
  }

  /** Entrada direccional externa (D-pad táctil). `null` = sin dirección. */
  setExternalDirection(direction: OverworldDirection | null): void {
    this.externalDirection = direction;
  }

  /** Botón de acción externo (botón A táctil). */
  pressAction(): void {
    this.isActionQueued = true;
  }

  /** Suspende movimiento/acción sin parar el render (mientras un panel está abierto). */
  setInteractionSuspended(isSuspended: boolean): void {
    this.isInteractionSuspended = isSuspended;
    if (isSuspended) {
      this.heldDirection = null;
      this.externalDirection = null;
      this.isActionQueued = false;
    }
  }

  start(): void {
    if (this.isDisposed || this.isRunning) return;
    this.isRunning = true;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleWindowBlur);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.observeCanvasSize();
    this.syncCanvasSize();
    if (this.config.introCutscene && this.config.introCutscene.length > 0) {
      this.startCutscene(this.config.introCutscene);
    }
    this.resume();
  }

  /** Arranca una cutscene guionizada (bloquea el control del jugador hasta terminar). */
  startCutscene(steps: OverworldCutsceneStep[]): void {
    this.cutsceneSteps = steps;
    this.cutsceneIndex = 0;
    this.isCutsceneActive = true;
    this.isCutsceneStepStarted = false;
    this.isCutsceneAwaitingResume = false;
    this.cutsceneNpc = null;
    this.focusedObjectId = null;
    this.hooks.onFocusChanged?.(null);
  }

  /** Reanuda la cutscene tras cerrar el diálogo/vídeo de un paso EVENT. */
  resumeCutscene(): void {
    if (!this.isCutsceneAwaitingResume) return;
    this.isCutsceneAwaitingResume = false;
    this.goToNextCutsceneStep();
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.pause();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.sprites.dispose();
    this.isRunning = false;
    this.isDisposed = true;
  }

  private recomputeBlockedObjects(): void {
    this.blockedObjectIds = new Set(
      this.interactables
        .filter(
          (target) =>
            target.requiredNodeIds.length > 0 &&
            target.requiredNodeIds.some((nodeId) => !isRequirementSatisfied(nodeId, this.progress)),
        )
        .map((target) => target.id),
    );
  }

  private isOpponentDefeated = (objectId: string): boolean => this.progress.completedNodeIds.has(objectId);

  /**
   * Reto por línea de visión (estilo Pokémon): si un rival activo ve al jugador,
   * el rival empieza a acercarse (no se emite el combate hasta que llega a su lado).
   */
  private triggerSightline(): void {
    if (this.actors.isApproaching()) return;
    const triggered = resolveTriggeredSightline({
      playerTile: this.world.player.tile,
      sources: this.actors.buildSightlineSources(this.isOpponentDefeated),
      isTransparent: (tileX, tileY) => canWalkToTile({ tileX, tileY }, this.world.movementContext),
      isSourceActive: (sourceId) => !this.isOpponentDefeated(sourceId),
    });
    if (!triggered) return;
    this.actors.startApproach(triggered.id, this.world.player.tile, (tile) =>
      canWalkToTile(tile, this.world.movementContext),
    );
  }

  private emitOpponentIntent(objectId: string): void {
    const object = this.objectsById.get(objectId);
    if (!object) return;
    this.hooks.onIntent?.({ object, isBlocked: false, missingRequirements: [], source: "SIGHTLINE" });
  }

  private goToNextCutsceneStep(): void {
    this.cutsceneIndex += 1;
    this.isCutsceneStepStarted = false;
    this.cutsceneWaitSeconds = 0;
    if (this.cutsceneIndex >= this.cutsceneSteps.length) {
      this.isCutsceneActive = false;
      this.cutsceneNpc = null;
      this.hooks.onCutsceneEnd?.();
    }
  }

  private advanceCutscene(deltaSeconds: number): void {
    const step = this.cutsceneSteps[this.cutsceneIndex];
    if (!step) {
      this.isCutsceneActive = false;
      return;
    }
    switch (step.kind) {
      case "WAIT":
        if (!this.isCutsceneStepStarted) {
          this.cutsceneWaitSeconds = step.seconds;
          this.isCutsceneStepStarted = true;
        }
        this.cutsceneWaitSeconds -= deltaSeconds;
        if (this.cutsceneWaitSeconds <= 0) this.goToNextCutsceneStep();
        break;
      case "PLAYER_STEP":
        this.advanceCutscenePlayerStep(step.direction, deltaSeconds);
        break;
      case "SPAWN_NPC":
        this.sprites.load(step.spriteSrc);
        this.cutsceneNpc = {
          tile: { tileX: step.tileX, tileY: step.tileY },
          facing: step.facing,
          spriteSrc: step.spriteSrc,
          activeMove: null,
          walkPath: [],
          walkIndex: 0,
        };
        this.goToNextCutsceneStep();
        break;
      case "NPC_WALK_TO":
        this.advanceCutsceneNpcWalk(step.tileX, step.tileY, deltaSeconds);
        break;
      case "EVENT":
        if (!this.isCutsceneStepStarted) {
          this.isCutsceneStepStarted = true;
          this.isCutsceneAwaitingResume = true;
          this.hooks.onCutsceneEvent?.(step.nodeId);
        }
        break;
      case "DESPAWN_NPC":
        this.cutsceneNpc = null;
        this.goToNextCutsceneStep();
        break;
    }
  }

  private advanceCutscenePlayerStep(direction: OverworldDirection, deltaSeconds: number): void {
    const { player } = this.world;
    if (!this.isCutsceneStepStarted) {
      this.isCutsceneStepStarted = true;
      const step = resolveStep(player.tile, direction, this.world.movementContext);
      player.facing = step.facing;
      if (!step.target) {
        this.goToNextCutsceneStep();
        return;
      }
      player.activeMove = { from: player.tile, to: step.target, progress: 0 };
    }
    if (!player.activeMove) return;
    player.activeMove.progress += this.config.tilesPerSecond * deltaSeconds;
    if (player.activeMove.progress >= 1) {
      player.tile = player.activeMove.to;
      player.activeMove = null;
      this.hooks.onPlayerTileChanged?.(player.tile);
      this.goToNextCutsceneStep();
    }
  }

  private advanceCutsceneNpcWalk(targetX: number, targetY: number, deltaSeconds: number): void {
    const npc = this.cutsceneNpc;
    if (!npc) {
      this.goToNextCutsceneStep();
      return;
    }
    if (!this.isCutsceneStepStarted) {
      this.isCutsceneStepStarted = true;
      npc.walkPath = this.buildStraightPath(npc.tile, { tileX: targetX, tileY: targetY });
      npc.walkIndex = 0;
    }
    if (npc.activeMove) {
      npc.activeMove.progress += this.config.tilesPerSecond * deltaSeconds;
      if (npc.activeMove.progress >= 1) {
        npc.tile = npc.activeMove.to;
        npc.activeMove = null;
        npc.walkIndex += 1;
      }
      return;
    }
    if (npc.walkIndex >= npc.walkPath.length) {
      this.goToNextCutsceneStep();
      return;
    }
    const next = npc.walkPath[npc.walkIndex];
    npc.facing = this.resolveNpcFacing(npc.tile, next);
    npc.activeMove = { from: npc.tile, to: next, progress: 0 };
  }

  private buildStraightPath(from: IGridPosition, to: IGridPosition): IGridPosition[] {
    const path: IGridPosition[] = [];
    const cursor = { ...from };
    while (cursor.tileX !== to.tileX) {
      cursor.tileX += cursor.tileX < to.tileX ? 1 : -1;
      path.push({ ...cursor });
    }
    while (cursor.tileY !== to.tileY) {
      cursor.tileY += cursor.tileY < to.tileY ? 1 : -1;
      path.push({ ...cursor });
    }
    return path;
  }

  private resolveNpcFacing(from: IGridPosition, to: IGridPosition): OverworldDirection {
    if (to.tileX > from.tileX) return "RIGHT";
    if (to.tileX < from.tileX) return "LEFT";
    if (to.tileY > from.tileY) return "DOWN";
    return "UP";
  }

  private resolveCutsceneNpcRender(tileSize: number): IOverworldCutsceneNpcRender | null {
    const npc = this.cutsceneNpc;
    if (!npc) return null;
    const pixel = npc.activeMove
      ? {
          x:
            (npc.activeMove.from.tileX +
              (npc.activeMove.to.tileX - npc.activeMove.from.tileX) * npc.activeMove.progress) *
            tileSize,
          y:
            (npc.activeMove.from.tileY +
              (npc.activeMove.to.tileY - npc.activeMove.from.tileY) * npc.activeMove.progress) *
            tileSize,
        }
      : { x: npc.tile.tileX * tileSize, y: npc.tile.tileY * tileSize };
    return { pixelX: pixel.x, pixelY: pixel.y, facing: npc.facing, spriteSrc: npc.spriteSrc };
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const direction = this.keyToDirection[event.code];
    if (direction) {
      event.preventDefault();
      if (!this.heldKeyDirections.includes(direction)) this.heldKeyDirections.push(direction);
      this.heldDirection = this.heldKeyDirections[this.heldKeyDirections.length - 1];
      return;
    }
    if (this.actionKeys.has(event.code)) {
      event.preventDefault();
      if (!event.repeat) this.isActionQueued = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const direction = this.keyToDirection[event.code];
    if (!direction) return;
    const index = this.heldKeyDirections.indexOf(direction);
    if (index !== -1) this.heldKeyDirections.splice(index, 1);
    this.heldDirection = this.heldKeyDirections[this.heldKeyDirections.length - 1] ?? null;
  };

  private readonly handleWindowBlur = (): void => {
    this.heldKeyDirections.length = 0;
    this.heldDirection = null;
    this.isActionQueued = false;
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") this.pause();
    else this.resume();
  };

  private observeCanvasSize(): void {
    this.resizeObserver = new ResizeObserver(() => this.syncCanvasSize());
    if (this.canvas.parentElement) this.resizeObserver.observe(this.canvas.parentElement);
  }

  private syncCanvasSize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.renderer.resize({ cssWidth: rect.width, cssHeight: rect.height }, window.devicePixelRatio || 1);
    this.renderFrame();
  }

  private pause(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.lastFrameTimeMs = null;
    this.accumulatedMs = 0;
  }

  private resume(): void {
    if (!this.isRunning || this.isDisposed || this.animationFrameId !== null) return;
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private readonly loop = (frameTimeMs: number): void => {
    this.animationFrameId = null;
    if (!this.isRunning || this.isDisposed) return;

    if (this.lastFrameTimeMs !== null) {
      this.accumulatedMs = Math.min(
        this.accumulatedMs + (frameTimeMs - this.lastFrameTimeMs),
        MAX_ACCUMULATED_MS,
      );
      while (this.accumulatedMs >= FIXED_TIMESTEP_MS) {
        this.update(FIXED_TIMESTEP_MS / 1000);
        this.accumulatedMs -= FIXED_TIMESTEP_MS;
      }
    }
    this.lastFrameTimeMs = frameTimeMs;

    this.renderFrame();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaSeconds: number): void {
    if (this.isCutsceneActive) {
      this.advanceCutscene(deltaSeconds);
      this.actors.update({
        deltaSeconds,
        canEnter: (tile) => canWalkToTile(tile, this.world.movementContext),
        isDefeated: this.isOpponentDefeated,
        isGlobalCutscene: true,
      });
      return;
    }
    const isApproachCutscene = this.actors.isApproaching();
    if (!isApproachCutscene && !this.isInteractionSuspended) this.consumeActionInput();
    if (!isApproachCutscene) this.advanceMovement(deltaSeconds);

    // Actores (patrulla + acercamiento). Las patrullas se congelan si hay un panel
    // abierto o un acercamiento en curso (foco cinemático).
    const finishedApproachId = this.actors.update({
      deltaSeconds,
      canEnter: (tile) => canWalkToTile(tile, this.world.movementContext),
      isDefeated: this.isOpponentDefeated,
      isGlobalCutscene: this.isInteractionSuspended,
    });
    if (finishedApproachId) this.emitOpponentIntent(finishedApproachId);
    else if (!this.actors.isApproaching() && !this.isInteractionSuspended) this.triggerSightline();

    this.refreshFocus();
  }

  private advanceMovement(deltaSeconds: number): void {
    const { player } = this.world;
    if (player.activeMove) {
      player.activeMove.progress += this.config.tilesPerSecond * deltaSeconds;
      if (player.activeMove.progress >= 1) {
        const overflow = player.activeMove.progress - 1;
        player.tile = player.activeMove.to;
        player.activeMove = null;
        this.hooks.onPlayerTileChanged?.(player.tile);
        this.triggerStepOnInteractable();
        if (!this.isInteractionSuspended) this.tryStartStep(overflow);
      }
      return;
    }
    if (!this.isInteractionSuspended) this.tryStartStep(0);
  }

  private tryStartStep(initialProgress: number): void {
    const direction = this.externalDirection ?? this.heldDirection;
    if (!direction) return;
    const { player } = this.world;
    const step = resolveStep(player.tile, direction, this.world.movementContext);
    player.facing = step.facing;
    if (!step.target) return;
    player.activeMove = { from: player.tile, to: step.target, progress: initialProgress };
  }

  private consumeActionInput(): void {
    if (!this.isActionQueued) return;
    this.isActionQueued = false;
    const { player } = this.world;
    if (player.activeMove) return;
    const focused = resolveFocusedInteractable({
      playerTile: player.tile,
      facing: player.facing,
      targets: this.interactables,
      progress: this.progress,
    });
    if (!focused) return;
    const object = this.objectsById.get(focused.target.id);
    if (!object) return;
    this.hooks.onIntent?.({
      object,
      isBlocked: focused.isBlocked,
      missingRequirements: focused.missingRequirements,
      source: "ACTION",
    });
  }

  private triggerStepOnInteractable(): void {
    const stepped = resolveSteppedInteractable({
      playerTile: this.world.player.tile,
      targets: this.interactables,
      progress: this.progress,
    });
    if (!stepped) return;
    const object = this.objectsById.get(stepped.target.id);
    if (!object) return;
    this.hooks.onIntent?.({
      object,
      isBlocked: stepped.isBlocked,
      missingRequirements: stepped.missingRequirements,
      source: "STEP_ON",
    });
  }

  private refreshFocus(): void {
    const { player } = this.world;
    const focused = resolveFocusedInteractable({
      playerTile: player.tile,
      facing: player.facing,
      targets: this.interactables,
      progress: this.progress,
    });
    const nextFocusId = focused?.target.id ?? null;
    if (nextFocusId === this.focusedObjectId) return;
    this.focusedObjectId = nextFocusId;
    if (!focused) {
      this.hooks.onFocusChanged?.(null);
      return;
    }
    const object = this.objectsById.get(focused.target.id);
    if (object) this.hooks.onFocusChanged?.({ object, isBlocked: focused.isBlocked });
  }

  private renderFrame(): void {
    const { tilemap, player } = this.world;
    const playerPixel = resolvePlayerPixelPosition(player, tilemap.tileSize);
    const worldViewport = this.renderer.getWorldViewportSize();
    const cameraOffset = resolveCameraOffset(
      resolvePlayerFocus(playerPixel, tilemap.tileSize),
      { width: worldViewport.cssWidth, height: worldViewport.cssHeight },
      { width: tilemap.width * tilemap.tileSize, height: tilemap.height * tilemap.tileSize },
    );
    this.renderer.render(this.world, playerPixel, cameraOffset, {
      focusedObjectId: this.focusedObjectId,
      blockedObjectIds: this.blockedObjectIds,
      opponentActors: this.actors.getRenderData(tilemap.tileSize, this.isOpponentDefeated),
      cutsceneNpc: this.resolveCutsceneNpcRender(tilemap.tileSize),
      timeMs: this.lastFrameTimeMs ?? 0,
    });
  }
}
