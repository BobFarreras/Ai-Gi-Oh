// src/components/hub/story/overworld/engine/OverworldEngine.ts - Game loop imperativo del overworld: timestep fijo, movimiento por celdas, interacción y render desacoplado.
import {
  IGridPosition,
  IOverworldProgressState,
  OverworldDirection,
  resolveDirectionDelta,
  toGridPositionKey,
} from "@/core/services/story/overworld/overworld-types";
import {
  canWalkToTile,
  resolveMovementContext,
  resolveStep,
} from "@/core/services/story/overworld/movement-rules";
import { isRequirementSatisfied } from "@/core/services/story/overworld/interaction-rules";
import {
  DEFAULT_SWITCH_LIGHT_RADIUS,
  IOverworldLight,
  ISwitchLightSource,
  resolveActiveLights,
} from "@/core/services/story/overworld/lighting";
import { resolvePush } from "@/core/services/story/overworld/push-rules";
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
import { invertBeltKind, resolveBeltDirection } from "@/services/story/overworld/overworld-tile-kinds";
import { resolveCameraOffset } from "@/components/hub/story/overworld/engine/camera-math";
import {
  DEFAULT_ENGINE_CONFIG,
  FIXED_TIMESTEP_MS,
  IEngineWorldState,
  IOverworldCollectEffectRender,
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
  /** Una placa de presión se acaba de pulsar con una caja (React puede sonar un "clunk"/abrir puerta). */
  onPlatePressed?: (plateId: string) => void;
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
  private readonly switchLightSources: ISwitchLightSource[];
  private activeLights: IOverworldLight[] = [];
  // Interruptores que INVIERTEN cintas: cada uno controla un rect de casillas-cinta. `baseBeltKinds` guarda el
  // sentido original de esas casillas para poder invertirlo/restaurarlo según si el interruptor está accionado.
  private readonly beltToggleControllers: Array<{ id: string; rect: { x0: number; y0: number; x1: number; y1: number } }>;
  private readonly baseBeltKinds: Map<string, number> = new Map();
  // Cajas empujables (sokoban): posición lógica viva + celdas que bloquean + animación de deslizado.
  private boxPositions = new Map<string, IGridPosition>();
  private boxHomePositions = new Map<string, IGridPosition>();
  private boxTileKeys: Set<string> = new Set();
  private boxActiveMoves = new Map<string, { from: IGridPosition; to: IGridPosition; progress: number }>();
  private plateObjects: IOverworldTilemapObject[] = [];
  private pressedPlateIds: Set<string> = new Set();
  private blockedObjectIds: Set<string> = new Set();
  private focusedObjectId: string | null = null;
  private blockedSightlineId: string | null = null;
  private readonly collectedObjectIds: Set<string>;
  private readonly bumpObjectByTileKey = new Map<string, string>();
  private bumpBlockedKeys: Set<string> = new Set();
  private collectEffect: {
    objectId: string;
    imageSrc?: string;
    fromTile: IGridPosition;
    floatingLabel: string | null;
    progress: number;
    onDone: () => void;
  } | null = null;

  // Animación de acercamiento de cámara al pulsar un nodo de servicio (market/arsenal/salida).
  private serviceZoom: {
    focusTile: IGridPosition;
    baseZoom: number;
    targetZoom: number;
    progress: number;
    phase: "IN" | "HELD" | "OUT";
    onArrived: (() => void) | null;
  } | null = null;
  private lastCameraOffset: { x: number; y: number } = { x: 0, y: 0 };

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
  // Pausado externo del bucle (p. ej. mientras se reproduce un vídeo): libera CPU/GPU para que el
  // vídeo vaya fluido en móvil, en vez de competir con el render del canvas a 60Hz.
  private isLoopSuspended = false;
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
    this.collectedObjectIds = new Set(this.config.collectedNodeIds ?? []);
    // Celdas bloqueadas por un pickup pendiente (se liberan al recogerlo):
    //  - BUMP: se coge automáticamente al chocar.
    //  - Recompensa de acción (REWARD_* con ADJACENT_ACTION): se coge pulsando el botón estando al
    //    lado. Bloquea su celda igual que un BUMP para que el jugador se pare enfrente (no la pisa).
    // El mapa `bumpObjectByTileKey` solo lista los BUMP (auto-cobro); las recompensas de acción se
    // resuelven por foco + botón, no por choque.
    const pickupBlockedKeys = new Set<string>();
    for (const object of init.tilemap.objects) {
      const tileKey = toGridPositionKey({ tileX: object.tileX, tileY: object.tileY });
      const isBump = object.trigger === "BUMP";
      const isActionReward =
        (object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD" || object.kind === "REWARD_OBJECT") &&
        object.trigger === "ADJACENT_ACTION";
      if (isBump) this.bumpObjectByTileKey.set(tileKey, object.id);
      if ((isBump || isActionReward) && !this.collectedObjectIds.has(object.id)) {
        pickupBlockedKeys.add(tileKey);
      }
    }
    this.bumpBlockedKeys = pickupBlockedKeys;
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
      .filter(
        (object) =>
          object.kind !== "DUEL" &&
          object.kind !== "BOSS" &&
          // Las cajas se empujan y las placas son pasivas: no son objetivos de foco/acción.
          object.kind !== "BOX" &&
          object.kind !== "PLATE" &&
          object.trigger !== "BUMP", // los BUMP se resuelven al chocar, no por foco
      )
      .map((object) => ({
        id: object.id,
        tileX: object.tileX,
        tileY: object.tileY,
        trigger: object.trigger === "STEP_ON" ? "STEP_ON" : "ADJACENT_ACTION",
        requiredNodeIds: object.gateRequiredNodeIds ?? [],
      }));
    this.actors = new OpponentActorManager(init.tilemap.objects, this.config.tilesPerSecond);
    this.switchLightSources = this.buildSwitchLightSources(init.tilemap.objects);
    this.recomputeLights();
    this.beltToggleControllers = init.tilemap.objects
      .filter((object) => (object.kind === "SWITCH" || object.kind === "PLATE") && object.beltToggleRect)
      .map((object) => ({ id: object.id, rect: object.beltToggleRect! }));
    this.initBoxesAndPlates(init.tilemap.objects);

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
        progress: this.buildAugmentedProgress(),
        blockedTileKeys: this.buildBlockedTileKeys(),
        openTileKeys: this.resolveFreedOpponentTileKeys(init.tilemap.objects, init.progress),
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
    // Belt-toggle: snapshot del sentido base + aplicar estado inicial. DESPUÉS de asignar this.world (ambos
    // métodos mutan/leen this.world.tilemap.layers.ground). El sentido de cinta no afecta al movementContext.
    this.snapshotBaseBeltKinds();
    this.applyBeltToggles();
    this.recomputeBlockedObjects();
  }

  /** Recalcula puertas y objetos bloqueados cuando cambia el progreso. */
  updateProgress(progress: IOverworldProgressState): void {
    this.progress = progress;
    this.rebuildMovementContext();
    this.recomputeBlockedObjects();
    this.recomputeLights();
    this.applyBeltToggles();
  }

  /** Construye las fuentes de luz de los interruptores del mapa (radio o sala). */
  private buildSwitchLightSources(
    objects: ReadonlyArray<IOverworldTilemapObject>,
  ): ISwitchLightSource[] {
    const sources: ISwitchLightSource[] = [];
    for (const object of objects) {
      if (object.kind !== "SWITCH") continue;
      if (object.lightRect) {
        sources.push({ id: object.id, light: { kind: "RECT", ...object.lightRect } });
      } else {
        sources.push({
          id: object.id,
          light: {
            kind: "RADIAL",
            tileX: object.tileX,
            tileY: object.tileY,
            radius: object.lightRadius ?? DEFAULT_SWITCH_LIGHT_RADIUS,
          },
        });
      }
    }
    return sources;
  }

  /** Recalcula las luces encendidas (interruptores ya accionados) tras un cambio de progreso. */
  private recomputeLights(): void {
    this.activeLights = resolveActiveLights(this.switchLightSources, this.progress.interactedNodeIds);
  }

  /** Guarda el sentido ORIGINAL de las casillas-cinta controladas por interruptores (para invertir/restaurar). */
  private snapshotBaseBeltKinds(): void {
    const ground = this.world.tilemap.layers.ground;
    for (const controller of this.beltToggleControllers) {
      for (let tileY = controller.rect.y0; tileY <= controller.rect.y1; tileY++) {
        for (let tileX = controller.rect.x0; tileX <= controller.rect.x1; tileX++) {
          if (resolveBeltDirection(ground[tileY]?.[tileX]) === null) continue;
          this.baseBeltKinds.set(`${tileX},${tileY}`, ground[tileY][tileX]);
        }
      }
    }
  }

  /**
   * Aplica el estado de los interruptores de cinta: una casilla se INVIERTE respecto a su sentido base si algún
   * interruptor que la controla está accionado (interacted); si no, vuelve a su sentido base. Muta la capa
   * ground, así que movimiento y render leen el sentido vigente sin fontanería extra.
   */
  private applyBeltToggles(): void {
    if (this.baseBeltKinds.size === 0) return;
    const ground = this.world.tilemap.layers.ground;
    const activeControllers = this.beltToggleControllers.filter((controller) =>
      this.progress.interactedNodeIds.has(controller.id),
    );
    for (const [key, baseKind] of this.baseBeltKinds) {
      const [tileX, tileY] = key.split(",").map(Number);
      const inverted = activeControllers.some(
        (controller) =>
          tileX >= controller.rect.x0 && tileX <= controller.rect.x1 && tileY >= controller.rect.y0 && tileY <= controller.rect.y1,
      );
      ground[tileY][tileX] = inverted ? invertBeltKind(baseKind) : baseKind;
    }
  }

  private rebuildMovementContext(): void {
    this.world.movementContext = resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(this.world.tilemap),
      gates: listGatesFromTilemap(this.world.tilemap),
      progress: this.buildAugmentedProgress(),
      blockedTileKeys: this.buildBlockedTileKeys(),
      openTileKeys: this.resolveFreedOpponentTileKeys(this.world.tilemap.objects, this.progress),
    });
  }

  /**
   * Progreso "aumentado" con las placas de presión pulsadas EN VIVO (tratadas como interacted),
   * de modo que un GATE con `requires: [plateId]` se abre mientras haya una caja encima, sin tocar
   * `isGateOpen`. Si no hay placas pulsadas, devuelve el progreso base (sin coste ni alocación).
   */
  private buildAugmentedProgress(): IOverworldProgressState {
    if (this.pressedPlateIds.size === 0) return this.progress;
    return {
      visitedNodeIds: this.progress.visitedNodeIds,
      completedNodeIds: this.progress.completedNodeIds,
      interactedNodeIds: new Set([...this.progress.interactedNodeIds, ...this.pressedPlateIds]),
    };
  }

  /** Celdas bloqueadas dinámicamente: pickups pendientes + cajas empujables en su posición viva. */
  private buildBlockedTileKeys(): Set<string> {
    if (this.boxTileKeys.size === 0) return this.bumpBlockedKeys;
    return new Set([...this.bumpBlockedKeys, ...this.boxTileKeys]);
  }

  private initBoxesAndPlates(objects: ReadonlyArray<IOverworldTilemapObject>): void {
    this.boxPositions = new Map();
    this.boxHomePositions = new Map();
    for (const object of objects) {
      if (object.kind === "BOX") {
        this.boxPositions.set(object.id, { tileX: object.tileX, tileY: object.tileY });
        this.boxHomePositions.set(object.id, { tileX: object.tileX, tileY: object.tileY });
      }
    }
    this.plateObjects = objects.filter((object) => object.kind === "PLATE");
    this.boxTileKeys = this.computeBoxTileKeys();
    this.pressedPlateIds = this.computePressedPlates();
  }

  /**
   * Devuelve todas las cajas a su posición inicial (botón anti soft-lock: si el jugador empotra una
   * caja contra una pared y no puede sacarla, la restaura). Reevalúa placas y puertas.
   */
  resetBoxes(): void {
    this.boxActiveMoves.clear();
    this.boxPositions = new Map();
    for (const [id, home] of this.boxHomePositions) {
      this.boxPositions.set(id, { tileX: home.tileX, tileY: home.tileY });
    }
    this.boxTileKeys = this.computeBoxTileKeys();
    this.updatePressedPlates();
    this.rebuildMovementContext();
    this.recomputeBlockedObjects();
  }

  private computeBoxTileKeys(): Set<string> {
    const keys = new Set<string>();
    for (const position of this.boxPositions.values()) keys.add(toGridPositionKey(position));
    return keys;
  }

  private computePressedPlates(): Set<string> {
    const pressed = new Set<string>();
    for (const plate of this.plateObjects) {
      if (this.boxTileKeys.has(toGridPositionKey({ tileX: plate.tileX, tileY: plate.tileY }))) {
        pressed.add(plate.id);
      }
    }
    return pressed;
  }

  private readonly isBoxAt = (position: IGridPosition): boolean =>
    this.boxTileKeys.has(toGridPositionKey(position));

  private findBoxIdAt(position: IGridPosition): string | null {
    const key = toGridPositionKey(position);
    for (const [id, pos] of this.boxPositions) {
      if (toGridPositionKey(pos) === key) return id;
    }
    return null;
  }

  /** Casillas de rivales derrotados: se "teletransportan" y liberan su casilla para dejar pasar a la llave. */
  private resolveFreedOpponentTileKeys(
    objects: ReadonlyArray<IOverworldTilemapObject>,
    progress: IOverworldProgressState,
  ): Set<string> {
    const keys = new Set<string>();
    for (const object of objects) {
      if ((object.kind === "DUEL" || object.kind === "BOSS") && progress.completedNodeIds.has(object.id)) {
        keys.add(toGridPositionKey({ tileX: object.tileX, tileY: object.tileY }));
      }
    }
    return keys;
  }

  /** Entrada direccional externa (D-pad táctil). `null` = sin dirección. */
  setExternalDirection(direction: OverworldDirection | null): void {
    this.externalDirection = direction;
  }

  /** Botón de acción externo (botón A táctil). */
  pressAction(): void {
    this.isActionQueued = true;
  }

  /**
   * Pausa/reanuda el bucle completo (update + render). Se usa mientras se reproduce un vídeo:
   * detener el render del canvas a 60Hz libera CPU/GPU y el vídeo va fluido en móvil. Respeta la
   * pausa por visibilidad (no reanuda si la pestaña está oculta).
   */
  setLoopSuspended(isSuspended: boolean): void {
    if (this.isLoopSuspended === isSuspended) return;
    this.isLoopSuspended = isSuspended;
    if (isSuspended) this.pause();
    else if (document.visibilityState !== "hidden") this.resume();
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

  /**
   * Anima un acercamiento cinemático de la cámara hacia un nodo de servicio y, al
   * llegar, ejecuta `onArrived` (abrir el panel). El mundo queda congelado durante la animación.
   */
  playServiceZoom(objectId: string, onArrived: () => void): void {
    const object = this.objectsById.get(objectId);
    if (!object) {
      onArrived();
      return;
    }
    this.serviceZoom = {
      focusTile: { tileX: object.tileX, tileY: object.tileY },
      baseZoom: this.config.zoom,
      targetZoom: this.config.zoom * 1.55,
      progress: 0,
      phase: "IN",
      onArrived,
    };
  }

  /** Revierte el acercamiento de cámara (al cancelar un panel de servicio). */
  releaseServiceZoom(): void {
    if (this.serviceZoom) this.serviceZoom.phase = "OUT";
  }

  private advanceServiceZoom(deltaSeconds: number): void {
    const zoom = this.serviceZoom;
    if (!zoom) return;
    if (zoom.phase === "IN") {
      zoom.progress = Math.min(1, zoom.progress + deltaSeconds / 0.42);
      if (zoom.progress >= 1) {
        zoom.phase = "HELD";
        const onArrived = zoom.onArrived;
        zoom.onArrived = null;
        onArrived?.();
      }
    } else if (zoom.phase === "OUT") {
      zoom.progress = Math.max(0, zoom.progress - deltaSeconds / 0.3);
      if (zoom.progress <= 0) this.serviceZoom = null;
    }
  }

  /**
   * Activación por clic/tap: si el jugador está en una casilla contigua a un nodo
   * interactuable, se orienta hacia él y lanza su acción (igual que pulsar espacio).
   */
  handlePointer(cssX: number, cssY: number): void {
    if (this.isInteractionSuspended || this.isCutsceneActive || this.serviceZoom) return;
    const { player } = this.world;
    if (player.activeMove) return;
    const tile = this.resolveTileFromScreen(cssX, cssY);
    if (!tile) return;
    const target = this.interactables.find(
      (candidate) => candidate.tileX === tile.tileX && candidate.tileY === tile.tileY,
    );
    if (!target) return;
    const distance =
      Math.abs(player.tile.tileX - target.tileX) + Math.abs(player.tile.tileY - target.tileY);
    if (distance !== 1) return;
    player.facing = this.resolveFacingTo(player.tile, target);
    this.activateFocusedInteractable();
  }

  private resolveTileFromScreen(cssX: number, cssY: number): IGridPosition | null {
    const { tilemap } = this.world;
    const zoom = this.renderer.getZoom();
    const worldX = cssX / zoom - this.lastCameraOffset.x;
    const worldY = cssY / zoom - this.lastCameraOffset.y;
    const tileX = Math.floor(worldX / tilemap.tileSize);
    const tileY = Math.floor(worldY / tilemap.tileSize);
    if (tileX < 0 || tileY < 0 || tileX >= tilemap.width || tileY >= tilemap.height) return null;
    return { tileX, tileY };
  }

  private resolveFacingTo(from: IGridPosition, to: IGridPosition): OverworldDirection {
    if (to.tileX > from.tileX) return "RIGHT";
    if (to.tileX < from.tileX) return "LEFT";
    if (to.tileY > from.tileY) return "DOWN";
    return "UP";
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

  /**
   * Anima la recogida de una recompensa: el objeto se encoge hacia el jugador y
   * (si es Nexus) sube un valor flotante. El objeto deja de dibujarse al instante.
   */
  collectReward(input: {
    objectId: string;
    imageSrc?: string;
    floatingLabel: string | null;
    onDone: () => void;
  }): void {
    const object = this.objectsById.get(input.objectId);
    this.collectedObjectIds.add(input.objectId);
    // Al recoger un objeto de choque, su celda queda libre para pasar.
    if (object) {
      this.bumpBlockedKeys.delete(toGridPositionKey({ tileX: object.tileX, tileY: object.tileY }));
      this.rebuildMovementContext();
    }
    this.collectEffect = {
      objectId: input.objectId,
      imageSrc: input.imageSrc,
      fromTile: object
        ? { tileX: object.tileX, tileY: object.tileY }
        : { tileX: this.world.player.tile.tileX, tileY: this.world.player.tile.tileY },
      floatingLabel: input.floatingLabel,
      progress: 0,
      onDone: input.onDone,
    };
  }

  /**
   * Marca un objeto como recogido SIN animación de canvas (la recogida la anima React, p. ej. el
   * revelado de carta). Oculta el nodo al instante y libera su celda para poder pasar.
   */
  markObjectCollected(objectId: string): void {
    const object = this.objectsById.get(objectId);
    this.collectedObjectIds.add(objectId);
    if (object) {
      this.bumpBlockedKeys.delete(toGridPositionKey({ tileX: object.tileX, tileY: object.tileY }));
      this.rebuildMovementContext();
    }
  }

  private advanceCollectEffect(deltaSeconds: number): void {
    if (!this.collectEffect) return;
    this.collectEffect.progress += deltaSeconds / 0.65;
    if (this.collectEffect.progress >= 1) {
      const onDone = this.collectEffect.onDone;
      this.collectEffect = null;
      onDone();
    }
  }

  private resolveCollectEffectRender(tileSize: number): IOverworldCollectEffectRender | null {
    const effect = this.collectEffect;
    if (!effect) return null;
    const progress = Math.max(0, Math.min(1, effect.progress));
    const eased = progress * progress;
    const fromCenterX = effect.fromTile.tileX * tileSize + tileSize / 2;
    const fromCenterY = effect.fromTile.tileY * tileSize + tileSize / 2;
    const playerCenterX = this.world.player.tile.tileX * tileSize + tileSize / 2;
    const playerCenterY = this.world.player.tile.tileY * tileSize + tileSize / 2;
    const size = tileSize * (0.84 - 0.68 * progress);
    const centerX = fromCenterX + (playerCenterX - fromCenterX) * eased;
    const centerY = fromCenterY + (playerCenterY - fromCenterY) * eased;
    const alpha = progress < 0.85 ? 1 : Math.max(0, 1 - (progress - 0.85) / 0.15);
    const labelAlpha =
      progress < 0.12 ? progress / 0.12 : Math.max(0, 1 - (progress - 0.12) / 0.88);
    return {
      imageSrc: effect.imageSrc,
      x: centerX - size / 2,
      y: centerY - size / 2,
      size,
      alpha,
      label: effect.floatingLabel,
      labelX: playerCenterX,
      labelY: this.world.player.tile.tileY * tileSize - tileSize * 0.2 - progress * tileSize * 0.9,
      labelAlpha,
    };
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
    const progress = this.buildAugmentedProgress();
    this.blockedObjectIds = new Set(
      this.interactables
        .filter(
          (target) =>
            target.requiredNodeIds.length > 0 &&
            target.requiredNodeIds.some((nodeId) => !isRequirementSatisfied(nodeId, progress)),
        )
        .map((target) => target.id),
    );
  }

  private isOpponentDefeated = (objectId: string): boolean => this.progress.completedNodeIds.has(objectId);

  /**
   * Reto por línea de visión (estilo Pokémon): si un rival activo ve al jugador,
   * el rival empieza a acercarse (no se emite el combate hasta que llega a su lado).
   */
  private resolveMissingRequirements(objectId: string): string[] {
    const object = this.objectsById.get(objectId);
    return (object?.gateRequiredNodeIds ?? []).filter(
      (nodeId) => !isRequirementSatisfied(nodeId, this.progress),
    );
  }

  private triggerSightline(): void {
    if (this.actors.isApproaching()) return;
    const triggered = resolveTriggeredSightline({
      playerTile: this.world.player.tile,
      sources: this.actors.buildSightlineSources(this.isOpponentDefeated),
      isTransparent: (tileX, tileY) => canWalkToTile({ tileX, tileY }, this.world.movementContext),
      isSourceActive: (sourceId) => !this.isOpponentDefeated(sourceId),
    });
    if (!triggered) {
      this.blockedSightlineId = null;
      return;
    }
    // Rival aún no desbloqueado (cadena de la BD): avisa una vez, sin acercarse ni combatir.
    if (this.resolveMissingRequirements(triggered.id).length > 0) {
      if (this.blockedSightlineId !== triggered.id) {
        this.blockedSightlineId = triggered.id;
        this.emitOpponentIntent(triggered.id);
      }
      return;
    }
    this.blockedSightlineId = null;
    this.actors.startApproach(triggered.id, this.world.player.tile, (tile) =>
      canWalkToTile(tile, this.world.movementContext),
    );
  }

  private emitOpponentIntent(objectId: string): void {
    const object = this.objectsById.get(objectId);
    if (!object) return;
    const missingRequirements = this.resolveMissingRequirements(objectId);
    this.hooks.onIntent?.({
      object,
      isBlocked: missingRequirements.length > 0,
      missingRequirements,
      source: "SIGHTLINE",
    });
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
    if (!this.isRunning || this.isDisposed || this.isLoopSuspended || this.animationFrameId !== null) return;
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
    this.advanceCollectEffect(deltaSeconds);
    this.advanceBoxes(deltaSeconds);
    // Acercamiento cinemático a un nodo de servicio: el mundo queda congelado.
    if (this.serviceZoom) {
      this.advanceServiceZoom(deltaSeconds);
      return;
    }
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
    const direction = this.resolveStepDirection();
    if (!direction) return;
    const { player } = this.world;
    const step = resolveStep(player.tile, direction, this.world.movementContext);
    player.facing = step.facing;
    if (!step.target) {
      const delta = resolveDirectionDelta(direction);
      const candidateKey = toGridPositionKey({
        tileX: player.tile.tileX + delta.tileX,
        tileY: player.tile.tileY + delta.tileY,
      });
      // ¿Caja empujable delante? Intenta desplazarla y avanza a su hueco.
      if (this.boxTileKeys.has(candidateKey)) {
        this.tryPushBox(direction, initialProgress);
        return;
      }
      // Bloqueado: ¿es un objeto que se coge al chocar?
      const bumpObjectId = this.bumpBlockedKeys.has(candidateKey)
        ? this.bumpObjectByTileKey.get(candidateKey)
        : undefined;
      if (bumpObjectId) this.emitObjectBump(bumpObjectId);
      return;
    }
    player.activeMove = { from: player.tile, to: step.target, progress: initialProgress };
  }

  /**
   * Dirección del próximo paso.
   * - Fuera de cinta: manda el input (D-pad/teclado).
   * - Sobre una cinta: te arrastra en su sentido y NO puedes ir en contra (el input opuesto se
   *   ignora). Un input perpendicular te deja salir por el lateral; sin input, la cinta empuja.
   */
  private resolveStepDirection(): OverworldDirection | null {
    const input = this.externalDirection ?? this.heldDirection;
    const { tile } = this.world.player;
    const beltDirection = resolveBeltDirection(this.world.tilemap.layers.ground[tile.tileY]?.[tile.tileX]);
    if (!beltDirection) return input;
    if (!input || isOppositeDirection(input, beltDirection)) return beltDirection;
    return input;
  }

  /**
   * Empuje de caja: si la caja de delante puede deslizarse una celda, la mueve (lógica + animación),
   * el jugador ocupa su hueco, y se reevalúan puertas y placas. No empuja mientras otra caja se desliza.
   */
  private tryPushBox(direction: OverworldDirection, initialProgress: number): void {
    if (this.boxActiveMoves.size > 0) return;
    const { player } = this.world;
    const push = resolvePush(player.tile, direction, this.world.movementContext, this.isBoxAt);
    if (!push) return;
    const boxId = this.findBoxIdAt(push.boxTile);
    if (!boxId) return;
    // Compromete la posición lógica de la caja de inmediato (las placas reflejan el estado final).
    this.boxPositions.set(boxId, push.boxDestination);
    this.boxTileKeys = this.computeBoxTileKeys();
    this.boxActiveMoves.set(boxId, { from: push.boxTile, to: push.boxDestination, progress: initialProgress });
    this.updatePressedPlates();
    this.rebuildMovementContext();
    this.recomputeBlockedObjects();
    // El jugador entra en la casilla que la caja acaba de dejar libre.
    player.activeMove = { from: player.tile, to: push.boxTile, progress: initialProgress };
  }

  /** Reevalúa placas pulsadas; dispara el hook por cada placa recién pulsada. */
  private updatePressedPlates(): void {
    const pressed = this.computePressedPlates();
    const newlyPressed: string[] = [];
    for (const id of pressed) if (!this.pressedPlateIds.has(id)) newlyPressed.push(id);
    this.pressedPlateIds = pressed;
    for (const id of newlyPressed) this.hooks.onPlatePressed?.(id);
  }

  private advanceBoxes(deltaSeconds: number): void {
    if (this.boxActiveMoves.size === 0) return;
    for (const [id, move] of this.boxActiveMoves) {
      move.progress += this.config.tilesPerSecond * deltaSeconds;
      if (move.progress >= 1) this.boxActiveMoves.delete(id);
    }
  }

  /** Datos de render de las cajas (posición interpolada en píxeles). */
  private resolveBoxRenderData(tileSize: number): Array<{ id: string; pixelX: number; pixelY: number }> {
    const data: Array<{ id: string; pixelX: number; pixelY: number }> = [];
    for (const [id, position] of this.boxPositions) {
      const move = this.boxActiveMoves.get(id);
      if (move) {
        const t = Math.min(1, move.progress);
        data.push({
          id,
          pixelX: (move.from.tileX + (move.to.tileX - move.from.tileX) * t) * tileSize,
          pixelY: (move.from.tileY + (move.to.tileY - move.from.tileY) * t) * tileSize,
        });
      } else {
        data.push({ id, pixelX: position.tileX * tileSize, pixelY: position.tileY * tileSize });
      }
    }
    return data;
  }

  private emitObjectBump(objectId: string): void {
    const object = this.objectsById.get(objectId);
    if (!object) return;
    this.hooks.onIntent?.({ object, isBlocked: false, missingRequirements: [], source: "BUMP" });
  }

  private consumeActionInput(): void {
    if (!this.isActionQueued) return;
    this.isActionQueued = false;
    if (this.world.player.activeMove) return;
    this.activateFocusedInteractable();
  }

  /** Resuelve el nodo enfocado (delante del jugador) y emite su intención de acción. */
  private activateFocusedInteractable(): void {
    const { player } = this.world;
    const focused = resolveFocusedInteractable({
      playerTile: player.tile,
      facing: player.facing,
      targets: this.interactables,
      progress: this.buildAugmentedProgress(),
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
      progress: this.buildAugmentedProgress(),
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
      progress: this.buildAugmentedProgress(),
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
    const playerFocus = resolvePlayerFocus(playerPixel, tilemap.tileSize);

    // Durante el acercamiento a un nodo de servicio, interpolamos zoom y foco hacia él.
    let focus = playerFocus;
    if (this.serviceZoom) {
      const eased = easeInOut(this.serviceZoom.progress);
      this.renderer.setZoom(
        this.serviceZoom.baseZoom + (this.serviceZoom.targetZoom - this.serviceZoom.baseZoom) * eased,
      );
      const nodeFocus = {
        x: this.serviceZoom.focusTile.tileX * tilemap.tileSize + tilemap.tileSize / 2,
        y: this.serviceZoom.focusTile.tileY * tilemap.tileSize + tilemap.tileSize / 2,
      };
      focus = {
        x: playerFocus.x + (nodeFocus.x - playerFocus.x) * eased,
        y: playerFocus.y + (nodeFocus.y - playerFocus.y) * eased,
      };
    } else {
      this.renderer.setZoom(this.config.zoom);
    }

    const worldViewport = this.renderer.getWorldViewportSize();
    const cameraOffset = resolveCameraOffset(
      focus,
      { width: worldViewport.cssWidth, height: worldViewport.cssHeight },
      { width: tilemap.width * tilemap.tileSize, height: tilemap.height * tilemap.tileSize },
    );
    this.lastCameraOffset = cameraOffset;
    this.renderer.render(this.world, playerPixel, cameraOffset, {
      focusedObjectId: this.focusedObjectId,
      blockedObjectIds: this.blockedObjectIds,
      opponentActors: this.actors.getRenderData(tilemap.tileSize, this.isOpponentDefeated),
      cutsceneNpc: this.resolveCutsceneNpcRender(tilemap.tileSize),
      collectedObjectIds: this.collectedObjectIds,
      collectEffect: this.resolveCollectEffectRender(tilemap.tileSize),
      activeLights: this.activeLights,
      boxes: this.resolveBoxRenderData(tilemap.tileSize),
      pressedPlateIds: this.pressedPlateIds,
      timeMs: this.lastFrameTimeMs ?? 0,
    });
  }
}

/** ¿Son dos direcciones opuestas (UP/DOWN o LEFT/RIGHT)? */
function isOppositeDirection(a: OverworldDirection, b: OverworldDirection): boolean {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

/** Suavizado ease-in-out para la animación de acercamiento de cámara. */
function easeInOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5 ? 2 * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
}
