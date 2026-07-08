// src/components/hub/story/overworld/engine/Renderer2D.ts - Render Canvas 2D cibernético del overworld (circuito neón + imágenes reales) con culling y DPR limitado.
import { IGridPosition, resolveDirectionDelta } from "@/core/services/story/overworld/overworld-types";
import { canWalkToTile } from "@/core/services/story/overworld/movement-rules";
import { IOverworldTilemap, OverworldObjectKind } from "@/services/story/overworld/tilemap-schema";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";
import {
  ICameraOffset,
  resolveVisibleTileRange,
} from "@/components/hub/story/overworld/engine/camera-math";
import {
  IEngineWorldState,
  IOverworldCollectEffectRender,
  IOverworldCutsceneNpcRender,
} from "@/components/hub/story/overworld/engine/engine-types";
import { SpriteCache } from "@/components/hub/story/overworld/engine/SpriteCache";
import { IOpponentActorRenderData } from "@/components/hub/story/overworld/engine/OpponentActorManager";

export interface IRendererViewportSize {
  cssWidth: number;
  cssHeight: number;
}

export interface IRenderOptions {
  focusedObjectId: string | null;
  blockedObjectIds: ReadonlySet<string>;
  /** Oponentes como entidades dinámicas (posición en vivo, haz de visión). */
  opponentActors: ReadonlyArray<IOpponentActorRenderData>;
  /** NPC de cutscene (p. ej. BigLog en la intro), o null. */
  cutsceneNpc: IOverworldCutsceneNpcRender | null;
  /** Objetos ya recogidos: no se dibujan. */
  collectedObjectIds: ReadonlySet<string>;
  /** Efecto de recolección en curso (objeto encogiéndose + valor flotante). */
  collectEffect: IOverworldCollectEffectRender | null;
  timeMs: number;
}

const OBJECT_LABELS: Record<OverworldObjectKind, string> = {
  DUEL: "Rival",
  BOSS: "Jefe",
  REWARD_CARD: "Carta",
  REWARD_NEXUS: "Nexus",
  EVENT: "Evento",
  NPC: "Aliado",
  SUBMISSION: "Terminal",
  WARP: "Portal",
  GATE: "Puerta",
  MARKET: "Mercado",
  ARSENAL: "Arsenal",
  TELEPORT: "Salir",
};

const OBJECT_ACCENT: Record<OverworldObjectKind, string> = {
  DUEL: "#f43f5e",
  BOSS: "#c026d3",
  REWARD_CARD: "#f59e0b",
  REWARD_NEXUS: "#22d3ee",
  EVENT: "#2dd4bf",
  NPC: "#38bdf8",
  SUBMISSION: "#fb7185",
  WARP: "#818cf8",
  GATE: "#eab308",
  MARKET: "#f59e0b",
  ARSENAL: "#06b6d4",
  TELEPORT: "#0ea5e9",
};

const BACKGROUND = "#05070f";
const GRID_LINE = "rgba(56, 189, 248, 0.07)";
const LANE_CORE = "#0e2a3d";
const LANE_GLOW = "rgba(34, 211, 238, 0.55)";

/**
 * Renderer imperativo cibernético: rejilla neón, lanes de circuito e imágenes reales.
 * No crea objetos por frame y solo dibuja el rango visible.
 */
export class Renderer2D {
  private readonly context: CanvasRenderingContext2D;
  private cssWidth = 0;
  private cssHeight = 0;
  // Progreso de apertura animado por puerta/puente (0 cerrado → 1 abierto) y delta de frame.
  private readonly gateOpenProgress = new Map<string, number>();
  private lastRenderMs = 0;
  private frameDeltaMs = 16;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly maxDevicePixelRatio: number,
    private readonly sprites: SpriteCache,
    private readonly playerImageSrc: string,
    private zoom: number,
  ) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D no disponible en este dispositivo.");
    this.context = context;
  }

  /** Ajusta el zoom en vivo (usado por la animación de acercamiento a nodos de servicio). */
  setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  /** Zoom actual (para convertir coordenadas de pantalla a mundo). */
  getZoom(): number {
    return this.zoom;
  }

  /** Tamaño del viewport en unidades de mundo (dividido por el zoom). */
  getWorldViewportSize(): IRendererViewportSize {
    return { cssWidth: this.cssWidth / this.zoom, cssHeight: this.cssHeight / this.zoom };
  }

  resize(size: IRendererViewportSize, devicePixelRatio: number): void {
    const clampedRatio = Math.max(1, Math.min(devicePixelRatio, this.maxDevicePixelRatio));
    this.cssWidth = size.cssWidth;
    this.cssHeight = size.cssHeight;
    this.canvas.width = Math.max(1, Math.round(size.cssWidth * clampedRatio));
    this.canvas.height = Math.max(1, Math.round(size.cssHeight * clampedRatio));
    this.context.setTransform(clampedRatio, 0, 0, clampedRatio, 0, 0);
    this.context.textBaseline = "middle";
    this.context.textAlign = "center";
  }

  getViewportSize(): IRendererViewportSize {
    return { cssWidth: this.cssWidth, cssHeight: this.cssHeight };
  }

  render(
    world: IEngineWorldState,
    playerPixel: ICameraOffset,
    cameraOffset: ICameraOffset,
    options: IRenderOptions,
  ): void {
    const { tilemap } = world;
    // Delta de frame para animaciones basadas en estado (apertura de puertas/puente).
    this.frameDeltaMs = this.lastRenderMs === 0 ? 16 : Math.max(0, Math.min(120, options.timeMs - this.lastRenderMs));
    this.lastRenderMs = options.timeMs;
    const worldViewport = this.getWorldViewportSize();
    const range = resolveVisibleTileRange({
      cameraOffset,
      viewport: { width: worldViewport.cssWidth, height: worldViewport.cssHeight },
      tileSize: tilemap.tileSize,
      mapWidth: tilemap.width,
      mapHeight: tilemap.height,
    });

    const context = this.context;
    context.save();
    context.scale(this.zoom, this.zoom);
    this.drawBackground(tilemap.tileSize, cameraOffset, worldViewport);
    this.drawGroundPass(tilemap, cameraOffset, range, options.timeMs);
    this.drawSightBeams(world, cameraOffset, options);
    this.drawObjectsPass(world, cameraOffset, range, options);
    this.drawActorsPass(world, cameraOffset, options);
    this.drawCutsceneNpc(world, cameraOffset, options);
    this.drawPlayer(world, playerPixel, cameraOffset);
    this.drawOverlayPass(tilemap, cameraOffset, range, options.timeMs);
    this.drawCollectEffect(cameraOffset, options);
    this.drawFocusLabel(world, cameraOffset, options);
    context.restore();
    this.drawScanlinesAndVignette();
  }

  private drawBackground(tileSize: number, camera: ICameraOffset, viewport: IRendererViewportSize): void {
    const context = this.context;
    const viewW = viewport.cssWidth;
    const viewH = viewport.cssHeight;
    context.fillStyle = BACKGROUND;
    context.fillRect(0, 0, viewW, viewH);
    // Rejilla técnica alineada al mundo (se desplaza con la cámara).
    context.strokeStyle = GRID_LINE;
    context.lineWidth = 1;
    context.beginPath();
    const startX = camera.x % tileSize;
    const startY = camera.y % tileSize;
    for (let x = startX; x <= viewW; x += tileSize) {
      context.moveTo(x, 0);
      context.lineTo(x, viewH);
    }
    for (let y = startY; y <= viewH; y += tileSize) {
      context.moveTo(0, y);
      context.lineTo(viewW, y);
    }
    context.stroke();
  }

  private drawGroundPass(
    tilemap: IOverworldTilemap,
    camera: ICameraOffset,
    range: ReturnType<typeof resolveVisibleTileRange>,
    timeMs: number,
  ): void {
    const size = tilemap.tileSize;
    const ground = tilemap.layers.ground;
    const isInterior = (x: number, y: number): boolean => {
      const kind = ground[y]?.[x];
      return kind === GROUND_TILE.PATH || kind === GROUND_TILE.SAND;
    };
    for (let tileY = range.minTileY; tileY <= range.maxTileY; tileY++) {
      for (let tileX = range.minTileX; tileX <= range.maxTileX; tileX++) {
        const kind = ground[tileY]?.[tileX];
        if (kind === GROUND_TILE.PATH) this.drawLaneTile(tilemap, tileX, tileY, camera, timeMs);
        else if (kind === GROUND_TILE.SAND) {
          this.drawRoomFloorTile(camera.x + tileX * size, camera.y + tileY * size, size);
        }
      }
    }
    // Bordes de muro: donde el suelo/corredor limita con el vacío exterior.
    this.context.strokeStyle = "rgba(56, 189, 248, 0.4)";
    this.context.lineWidth = 2;
    for (let tileY = range.minTileY; tileY <= range.maxTileY; tileY++) {
      for (let tileX = range.minTileX; tileX <= range.maxTileX; tileX++) {
        if (!isInterior(tileX, tileY)) continue;
        this.drawWallEdges(tileX, tileY, size, camera, isInterior);
      }
    }
  }

  private drawWallEdges(
    tileX: number,
    tileY: number,
    size: number,
    camera: ICameraOffset,
    isInterior: (x: number, y: number) => boolean,
  ): void {
    const context = this.context;
    const left = camera.x + tileX * size;
    const top = camera.y + tileY * size;
    context.beginPath();
    if (!isInterior(tileX, tileY - 1)) {
      context.moveTo(left, top);
      context.lineTo(left + size, top);
    }
    if (!isInterior(tileX, tileY + 1)) {
      context.moveTo(left, top + size);
      context.lineTo(left + size, top + size);
    }
    if (!isInterior(tileX - 1, tileY)) {
      context.moveTo(left, top);
      context.lineTo(left, top + size);
    }
    if (!isInterior(tileX + 1, tileY)) {
      context.moveTo(left + size, top);
      context.lineTo(left + size, top + size);
    }
    context.stroke();
  }

  private drawRoomFloorTile(screenX: number, screenY: number, size: number): void {
    const context = this.context;
    context.fillStyle = "#0c1626";
    context.fillRect(screenX, screenY, size, size);
    context.strokeStyle = "rgba(30, 58, 92, 0.6)";
    context.lineWidth = 1;
    context.strokeRect(screenX + 3, screenY + 3, size - 6, size - 6);
  }

  private drawSightBeams(world: IEngineWorldState, camera: ICameraOffset, options: IRenderOptions): void {
    const context = this.context;
    const size = world.tilemap.tileSize;
    for (const actor of options.opponentActors) {
      if (!actor.showBeam) continue;
      const delta = resolveDirectionDelta(actor.facing);
      let tileX = actor.tileX;
      let tileY = actor.tileY;
      for (let distance = 1; distance <= actor.visionRange; distance++) {
        tileX += delta.tileX;
        tileY += delta.tileY;
        if (!canWalkToTile({ tileX, tileY }, world.movementContext)) break;
        const pulse = 0.18 + Math.sin(options.timeMs / 260 - distance) * 0.07;
        context.fillStyle = actor.accent;
        context.globalAlpha = Math.max(0.05, pulse * (1 - (distance - 1) / (actor.visionRange + 1)));
        context.fillRect(camera.x + tileX * size + 4, camera.y + tileY * size + 4, size - 8, size - 8);
      }
    }
    context.globalAlpha = 1;
  }

  private drawActorsPass(world: IEngineWorldState, camera: ICameraOffset, options: IRenderOptions): void {
    const context = this.context;
    const size = world.tilemap.tileSize;
    for (const actor of options.opponentActors) {
      const drawX = camera.x + actor.pixelX;
      const drawY = camera.y + actor.pixelY;
      const cx = drawX + size / 2;
      const cy = drawY + size / 2;
      const radius = size * 0.42;
      const accent = actor.isDefeated ? "#64748b" : actor.accent;
      const markColor = actor.isDefeated ? "#94a3b8" : actor.accent === "#c026d3" ? "#f5d0fe" : "#fecdd3";

      context.fillStyle = "rgba(0,0,0,0.4)";
      context.beginPath();
      context.ellipse(cx, drawY + size * 0.92, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = accent;
      context.globalAlpha = actor.isDefeated ? 0.25 : 0.5;
      context.beginPath();
      context.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;

      const image = this.sprites.get(actor.spriteSrc);
      if (image) this.drawImageCircle(image, cx, cy, radius, actor.isDefeated);
      else this.drawTokenPlaceholder(cx, cy, radius, accent);

      context.strokeStyle = accent;
      context.lineWidth = 2.5;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.stroke();

      // Marca de orientación (hacia dónde vigila).
      const delta = resolveDirectionDelta(actor.facing);
      context.fillStyle = markColor;
      context.beginPath();
      context.arc(cx + delta.tileX * radius, cy + delta.tileY * radius, size * 0.06, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawLaneTile(
    tilemap: IOverworldTilemap,
    tileX: number,
    tileY: number,
    camera: ICameraOffset,
    timeMs: number,
  ): void {
    const context = this.context;
    const size = tilemap.tileSize;
    const screenX = camera.x + tileX * size;
    const screenY = camera.y + tileY * size;
    context.fillStyle = LANE_CORE;
    context.fillRect(screenX + 2, screenY + 2, size - 4, size - 4);

    const ground = tilemap.layers.ground;
    const isLane = (x: number, y: number): boolean => ground[y]?.[x] === GROUND_TILE.PATH;
    // Vena de energía central que conecta lanes contiguas.
    const pulse = 0.55 + Math.sin(timeMs / 500 + (tileX + tileY) * 0.6) * 0.25;
    context.strokeStyle = `rgba(34, 211, 238, ${pulse})`;
    context.lineWidth = Math.max(2, size * 0.08);
    context.lineCap = "round";
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;
    context.beginPath();
    context.moveTo(cx, cy);
    if (isLane(tileX + 1, tileY)) context.lineTo(screenX + size, cy);
    context.moveTo(cx, cy);
    if (isLane(tileX - 1, tileY)) context.lineTo(screenX, cy);
    context.moveTo(cx, cy);
    if (isLane(tileX, tileY + 1)) context.lineTo(cx, screenY + size);
    context.moveTo(cx, cy);
    if (isLane(tileX, tileY - 1)) context.lineTo(cx, screenY);
    context.stroke();
    // Nodo central.
    context.fillStyle = LANE_GLOW;
    context.beginPath();
    context.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
    context.fill();
  }

  private drawObjectsPass(
    world: IEngineWorldState,
    camera: ICameraOffset,
    range: ReturnType<typeof resolveVisibleTileRange>,
    options: IRenderOptions,
  ): void {
    const size = world.tilemap.tileSize;
    for (const object of world.tilemap.objects) {
      // Los rivales se dibujan como actores dinámicos, no como token estático.
      if (object.kind === "DUEL" || object.kind === "BOSS") continue;
      // Triggers invisibles y objetos ya recogidos: no se dibujan.
      if (object.hidden || options.collectedObjectIds.has(object.id)) continue;
      if (
        object.tileX < range.minTileX - 1 ||
        object.tileX > range.maxTileX + 1 ||
        object.tileY < range.minTileY - 1 ||
        object.tileY > range.maxTileY + 1
      ) {
        continue;
      }
      const screenX = camera.x + object.tileX * size;
      const screenY = camera.y + object.tileY * size;
      const isBlocked = options.blockedObjectIds.has(object.id);
      const isFocused = options.focusedObjectId === object.id;
      this.drawObject(object.id, object.kind, object.imageSrc, screenX, screenY, size, isBlocked, isFocused, options.timeMs);
    }
  }

  private drawObject(
    objectId: string,
    kind: OverworldObjectKind,
    imageSrc: string | undefined,
    screenX: number,
    screenY: number,
    size: number,
    isBlocked: boolean,
    isFocused: boolean,
    timeMs: number,
  ): void {
    const context = this.context;
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;
    const accent = isBlocked ? "#64748b" : OBJECT_ACCENT[kind];

    // Sombra de contacto proyectada.
    context.fillStyle = "rgba(0,0,0,0.4)";
    context.beginPath();
    context.ellipse(cx, screenY + size * 0.92, size * 0.32, size * 0.1, 0, 0, Math.PI * 2);
    context.fill();

    if (kind === "GATE") {
      // Progreso de apertura animado (0 cerrado → 1 abierto) hacia el estado real de la puerta.
      const target = isBlocked ? 0 : 1;
      const prev = this.gateOpenProgress.get(objectId) ?? target;
      const step = this.frameDeltaMs / 420;
      const openProgress = prev < target ? Math.min(target, prev + step) : Math.max(target, prev - step);
      this.gateOpenProgress.set(objectId, openProgress);
      if (objectId.includes("bridge")) {
        this.drawDeployBridge(screenX, screenY, size, openProgress, timeMs);
      } else if (objectId.includes("door")) {
        this.drawSlidingDoor(screenX, screenY, size, openProgress, accent);
      } else {
        this.drawGate(screenX, screenY, size, accent, isBlocked, timeMs);
      }
    } else if (kind === "WARP") {
      this.drawPortal(cx, cy, size, accent, timeMs);
    } else if (kind === "MARKET" || kind === "ARSENAL" || kind === "TELEPORT") {
      this.drawHubNode(screenX, screenY, size, accent, kind, timeMs);
    } else {
      const image = this.sprites.get(imageSrc);
      const radius = size * 0.42;
      // Halo del token.
      context.fillStyle = accent;
      context.globalAlpha = isBlocked ? 0.25 : 0.5;
      context.beginPath();
      context.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      if (image) {
        this.drawImageCircle(image, cx, cy, radius, isBlocked);
      } else {
        this.drawTokenPlaceholder(cx, cy, radius, accent);
      }
      // Aro del token.
      context.strokeStyle = accent;
      context.lineWidth = 2.5;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.stroke();
    }

    if (isFocused) {
      const pulse = Math.sin(timeMs / 180) * 0.5 + 0.5;
      context.strokeStyle = isBlocked ? "rgba(148,163,184,0.9)" : "rgba(226,255,255,0.95)";
      context.lineWidth = 2 + pulse * 2.5;
      context.beginPath();
      context.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
      context.stroke();
      // Cursor flotante encima.
      context.fillStyle = context.strokeStyle;
      const bob = Math.sin(timeMs / 260) * size * 0.06;
      context.beginPath();
      context.moveTo(cx, screenY - size * 0.14 + bob);
      context.lineTo(cx - size * 0.1, screenY - size * 0.3 + bob);
      context.lineTo(cx + size * 0.1, screenY - size * 0.3 + bob);
      context.closePath();
      context.fill();
    }
  }

  private drawImageCircle(
    image: HTMLImageElement,
    cx: number,
    cy: number,
    radius: number,
    isBlocked: boolean,
  ): void {
    const context = this.context;
    context.save();
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.clip();
    // Cover-fit: rellena el círculo sin deformar la imagen.
    const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    if (isBlocked) context.filter = "grayscale(0.85) brightness(0.6)";
    context.drawImage(image, cx - drawWidth / 2, cy - drawHeight / 2, drawWidth, drawHeight);
    context.filter = "none";
    context.restore();
  }

  private drawTokenPlaceholder(cx: number, cy: number, radius: number, accent: string): void {
    const context = this.context;
    context.fillStyle = "#0b1220";
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = accent;
    context.beginPath();
    context.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
    context.fill();
  }

  private drawGate(
    screenX: number,
    screenY: number,
    size: number,
    accent: string,
    isBlocked: boolean,
    timeMs: number,
  ): void {
    const context = this.context;
    const flicker = 0.6 + Math.sin(timeMs / 140) * 0.2;
    context.globalAlpha = isBlocked ? flicker : 0.28;
    context.fillStyle = accent;
    for (let index = 0; index < 4; index++) {
      context.fillRect(screenX + size * (0.16 + index * 0.2), screenY + size * 0.12, size * 0.08, size * 0.76);
    }
    context.globalAlpha = isBlocked ? 0.9 : 0.3;
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.strokeRect(screenX + size * 0.1, screenY + size * 0.1, size * 0.8, size * 0.8);
    context.globalAlpha = 1;
  }

  /** Puente central que se DESPLIEGA: tablones que se extienden de abajo arriba al abrirse (0→1). */
  private drawDeployBridge(screenX: number, screenY: number, size: number, progress: number, timeMs: number): void {
    const context = this.context;
    const cx = screenX + size / 2;
    const planks = 6;
    const solid = Math.round(progress * planks);
    const halfW = size * 0.36;
    context.strokeStyle = "rgba(129,140,248,0.55)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(cx - halfW, screenY + size * 0.08);
    context.lineTo(cx - halfW, screenY + size * 0.92);
    context.moveTo(cx + halfW, screenY + size * 0.08);
    context.lineTo(cx + halfW, screenY + size * 0.92);
    context.stroke();
    for (let index = 0; index < planks; index++) {
      // index 0 abajo (entrada) → arriba (hacia el jefe): se despliega de abajo a arriba.
      const py = screenY + size * (0.86 - (index / (planks - 1)) * 0.72);
      if (index < solid) {
        context.globalAlpha = 0.92;
        context.fillStyle = "#818cf8";
        context.fillRect(cx - halfW, py - size * 0.04, halfW * 2, size * 0.08);
        context.fillStyle = "rgba(224,231,255,0.5)";
        context.fillRect(cx - halfW, py - size * 0.04, halfW * 2, size * 0.02);
      } else {
        context.globalAlpha = 0.16 + Math.sin(timeMs / 220 + index) * 0.08;
        context.strokeStyle = "#818cf8";
        context.setLineDash([5, 5]);
        context.strokeRect(cx - halfW, py - size * 0.04, halfW * 2, size * 0.08);
        context.setLineDash([]);
      }
    }
    context.globalAlpha = 1;
  }

  /** Puerta de sala: dos paneles que se retraen arriba/abajo al abrirse (0 cerrado → 1 abierto). */
  private drawSlidingDoor(screenX: number, screenY: number, size: number, progress: number, accent: string): void {
    const context = this.context;
    const x = screenX + size * 0.14;
    const w = size * 0.72;
    const panelH = size * 0.36 * (1 - progress);
    context.globalAlpha = 1;
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.strokeRect(screenX + size * 0.12, screenY + size * 0.1, size * 0.76, size * 0.8);
    if (panelH > 0.5) {
      context.fillStyle = accent;
      context.globalAlpha = 0.85;
      context.fillRect(x, screenY + size * 0.12, w, panelH);
      context.fillRect(x, screenY + size * 0.88 - panelH, w, panelH);
      context.fillStyle = "rgba(15,23,42,0.55)";
      context.fillRect(x, screenY + size * 0.12 + panelH - 2, w, 2);
      context.fillRect(x, screenY + size * 0.88 - panelH, w, 2);
    }
    if (progress > 0.35) {
      context.globalAlpha = 0.4 * progress;
      context.fillStyle = "rgba(226,232,255,0.9)";
      context.fillRect(x, screenY + size / 2 - 1.5, w, 3);
    }
    context.globalAlpha = 1;
  }

  /** Nodo de servicio con el estilo angular neón de los nodos del hub. */
  private drawHubNode(
    screenX: number,
    screenY: number,
    size: number,
    accent: string,
    kind: OverworldObjectKind,
    timeMs: number,
  ): void {
    const context = this.context;
    const pad = size * 0.14;
    const x = screenX + pad;
    const y = screenY + pad;
    const w = size - pad * 2;
    const h = size - pad * 2;
    const cut = size * 0.18;
    const tracePanel = (): void => {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + w - cut, y);
      context.lineTo(x + w, y + cut);
      context.lineTo(x + w, y + h);
      context.lineTo(x + cut, y + h);
      context.lineTo(x, y + h - cut);
      context.closePath();
    };
    // Resplandor exterior pulsante (estilo hub).
    const glow = 0.4 + Math.sin(timeMs / 320) * 0.25;
    context.strokeStyle = accent;
    context.globalAlpha = glow;
    context.lineWidth = 6;
    tracePanel();
    context.stroke();
    context.globalAlpha = 1;
    // Panel oscuro + borde neón.
    context.fillStyle = "#030914";
    tracePanel();
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 2;
    tracePanel();
    context.stroke();
    // Icono central según el nodo.
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;
    context.strokeStyle = accent;
    context.fillStyle = accent;
    context.lineWidth = 2;
    if (kind === "MARKET") this.drawCartIcon(cx, cy, size);
    else if (kind === "ARSENAL") this.drawCardsIcon(cx, cy, size);
    else this.drawTeleportIcon(cx, cy, size, timeMs);
  }

  private drawCartIcon(cx: number, cy: number, size: number): void {
    const context = this.context;
    const s = size * 0.16;
    context.beginPath();
    context.moveTo(cx - s * 1.2, cy - s);
    context.lineTo(cx - s * 0.7, cy - s);
    context.lineTo(cx - s * 0.4, cy + s * 0.4);
    context.lineTo(cx + s, cy + s * 0.4);
    context.lineTo(cx + s * 1.2, cy - s * 0.4);
    context.lineTo(cx - s * 0.4, cy - s * 0.4);
    context.stroke();
    context.beginPath();
    context.arc(cx - s * 0.2, cy + s, s * 0.22, 0, Math.PI * 2);
    context.arc(cx + s * 0.8, cy + s, s * 0.22, 0, Math.PI * 2);
    context.fill();
  }

  private drawCardsIcon(cx: number, cy: number, size: number): void {
    const context = this.context;
    const w = size * 0.2;
    const h = size * 0.28;
    context.save();
    context.translate(cx, cy);
    context.rotate(-0.18);
    context.strokeRect(-w * 0.7, -h / 2, w, h);
    context.restore();
    context.save();
    context.translate(cx, cy);
    context.rotate(0.18);
    context.fillStyle = "#030914";
    context.fillRect(-w * 0.1, -h / 2, w, h);
    context.strokeRect(-w * 0.1, -h / 2, w, h);
    context.restore();
  }

  private drawTeleportIcon(cx: number, cy: number, size: number, timeMs: number): void {
    const context = this.context;
    const spin = Math.sin(timeMs / 240) * 0.5 + 0.5;
    for (let ring = 0; ring < 3; ring++) {
      context.globalAlpha = 0.4 + spin * 0.5 - ring * 0.12;
      context.beginPath();
      context.arc(cx, cy, size * (0.08 + ring * 0.07), spin * Math.PI, spin * Math.PI + Math.PI * 1.4);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  private drawPortal(cx: number, cy: number, size: number, accent: string, timeMs: number): void {
    const context = this.context;
    const spin = Math.sin(timeMs / 240) * 0.5 + 0.5;
    for (let ring = 0; ring < 4; ring++) {
      context.strokeStyle = accent;
      context.globalAlpha = 0.3 + spin * 0.55 - ring * 0.1;
      context.lineWidth = size * 0.05;
      context.beginPath();
      context.arc(cx, cy, size * (0.1 + ring * 0.1), spin * Math.PI, spin * Math.PI + Math.PI * 1.5);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  private drawCutsceneNpc(world: IEngineWorldState, camera: ICameraOffset, options: IRenderOptions): void {
    const npc = options.cutsceneNpc;
    if (!npc) return;
    const context = this.context;
    const size = world.tilemap.tileSize;
    const drawX = camera.x + npc.pixelX;
    const drawY = camera.y + npc.pixelY;
    const cx = drawX + size / 2;
    const cy = drawY + size / 2;
    const radius = size * 0.42;

    context.fillStyle = "rgba(0,0,0,0.4)";
    context.beginPath();
    context.ellipse(cx, drawY + size * 0.92, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(34, 211, 238, 0.5)";
    context.beginPath();
    context.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    context.fill();

    const image = this.sprites.get(npc.spriteSrc);
    if (image) this.drawImageCircle(image, cx, cy, radius, false);
    else this.drawTokenPlaceholder(cx, cy, radius, "#22d3ee");

    context.strokeStyle = "#22d3ee";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();

    const delta = resolveDirectionDelta(npc.facing);
    context.fillStyle = "#cffafe";
    context.beginPath();
    context.arc(cx + delta.tileX * radius, cy + delta.tileY * radius, size * 0.06, 0, Math.PI * 2);
    context.fill();
  }

  private drawPlayer(world: IEngineWorldState, playerPixel: ICameraOffset, camera: ICameraOffset): void {
    const context = this.context;
    const size = world.tilemap.tileSize;
    const drawX = camera.x + playerPixel.x;
    const drawY = camera.y + playerPixel.y;
    const cx = drawX + size / 2;
    const cy = drawY + size / 2;
    const move = world.player.activeMove;
    const bob = move ? Math.sin(move.progress * Math.PI * 2) * size * 0.05 : 0;
    const radius = size * 0.4;

    context.fillStyle = "rgba(0,0,0,0.45)";
    context.beginPath();
    context.ellipse(cx, drawY + size * 0.9, size * 0.28, size * 0.09, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(16, 185, 129, 0.5)";
    context.beginPath();
    context.arc(cx, cy + bob, radius + 3, 0, Math.PI * 2);
    context.fill();

    const image = this.sprites.get(this.playerImageSrc);
    if (image) this.drawImageCircle(image, cx, cy + bob, radius, false);
    else this.drawTokenPlaceholder(cx, cy + bob, radius, "#10b981");

    context.strokeStyle = "#34d399";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(cx, cy + bob, radius, 0, Math.PI * 2);
    context.stroke();

    this.drawFacingArrow(world.player.facing, cx, cy + bob, radius, size);
  }

  private drawFacingArrow(
    facing: IEngineWorldState["player"]["facing"],
    cx: number,
    cy: number,
    radius: number,
    size: number,
  ): void {
    const context = this.context;
    const distance = radius + size * 0.12;
    const point = { x: cx, y: cy };
    switch (facing) {
      case "UP":
        point.y = cy - distance;
        break;
      case "DOWN":
        point.y = cy + distance;
        break;
      case "LEFT":
        point.x = cx - distance;
        break;
      case "RIGHT":
        point.x = cx + distance;
        break;
    }
    context.fillStyle = "#34d399";
    context.beginPath();
    context.arc(point.x, point.y, size * 0.05, 0, Math.PI * 2);
    context.fill();
  }

  private drawOverlayPass(
    tilemap: IOverworldTilemap,
    camera: ICameraOffset,
    range: ReturnType<typeof resolveVisibleTileRange>,
    timeMs: number,
  ): void {
    const size = tilemap.tileSize;
    for (let tileY = range.minTileY; tileY <= range.maxTileY; tileY++) {
      const overlayRow = tilemap.layers.overlay[tileY];
      for (let tileX = range.minTileX; tileX <= range.maxTileX; tileX++) {
        const kind = overlayRow?.[tileX] ?? 0;
        if (kind === 0) continue;
        const screenX = camera.x + tileX * size;
        const screenY = camera.y + tileY * size;
        if (kind === OVERLAY_TILE.SERVER_RACK) this.drawServerRack(screenX, screenY, size, timeMs, tileX + tileY);
        else if (kind === OVERLAY_TILE.HOLO_SCREEN) this.drawHoloScreen(screenX, screenY, size, timeMs);
        else if (kind === OVERLAY_TILE.CRATE) this.drawCrate(screenX, screenY, size);
        else this.drawPillar(screenX, screenY, size, timeMs, tileX);
      }
    }
  }

  private drawServerRack(screenX: number, screenY: number, size: number, timeMs: number, seed: number): void {
    const context = this.context;
    const rackX = screenX + size * 0.12;
    const rackW = size * 0.76;
    context.fillStyle = "rgba(0,0,0,0.35)";
    context.fillRect(screenX + size * 0.16, screenY + size * 0.9, size * 0.68, size * 0.1);
    context.fillStyle = "#0a1220";
    context.fillRect(rackX, screenY + size * 0.06, rackW, size * 0.86);
    context.strokeStyle = "rgba(56, 189, 248, 0.45)";
    context.lineWidth = 2;
    context.strokeRect(rackX, screenY + size * 0.06, rackW, size * 0.86);
    // Bahías con LEDs parpadeantes.
    for (let bay = 0; bay < 4; bay++) {
      const bayY = screenY + size * (0.14 + bay * 0.19);
      context.fillStyle = "#060c16";
      context.fillRect(rackX + size * 0.08, bayY, rackW - size * 0.16, size * 0.12);
      const blink = 0.35 + Math.sin(timeMs / 260 + seed + bay) * 0.4;
      context.fillStyle = `rgba(34, 211, 238, ${Math.max(0.15, blink)})`;
      context.fillRect(rackX + size * 0.12, bayY + size * 0.03, size * 0.06, size * 0.06);
      context.fillStyle = `rgba(52, 211, 153, ${Math.max(0.15, 0.7 - blink)})`;
      context.fillRect(rackX + size * 0.24, bayY + size * 0.03, size * 0.06, size * 0.06);
    }
  }

  private drawHoloScreen(screenX: number, screenY: number, size: number, timeMs: number): void {
    const context = this.context;
    context.fillStyle = "#08131f";
    context.fillRect(screenX + size * 0.1, screenY + size * 0.1, size * 0.8, size * 0.6);
    context.strokeStyle = "rgba(129, 140, 248, 0.6)";
    context.lineWidth = 2;
    context.strokeRect(screenX + size * 0.1, screenY + size * 0.1, size * 0.8, size * 0.6);
    context.strokeStyle = `rgba(129, 140, 248, ${0.35 + Math.sin(timeMs / 240) * 0.25})`;
    context.lineWidth = 1;
    for (let line = 0; line < 3; line++) {
      const y = screenY + size * (0.22 + line * 0.14);
      context.beginPath();
      context.moveTo(screenX + size * 0.18, y);
      context.lineTo(screenX + size * (0.5 + line * 0.1), y);
      context.stroke();
    }
    context.fillStyle = "#0a1220";
    context.fillRect(screenX + size * 0.44, screenY + size * 0.7, size * 0.12, size * 0.22);
  }

  private drawCrate(screenX: number, screenY: number, size: number): void {
    const context = this.context;
    context.fillStyle = "#13233a";
    context.fillRect(screenX + size * 0.2, screenY + size * 0.34, size * 0.6, size * 0.56);
    context.strokeStyle = "rgba(56, 189, 248, 0.5)";
    context.lineWidth = 2;
    context.strokeRect(screenX + size * 0.2, screenY + size * 0.34, size * 0.6, size * 0.56);
    context.beginPath();
    context.moveTo(screenX + size * 0.2, screenY + size * 0.34);
    context.lineTo(screenX + size * 0.8, screenY + size * 0.9);
    context.moveTo(screenX + size * 0.8, screenY + size * 0.34);
    context.lineTo(screenX + size * 0.2, screenY + size * 0.9);
    context.stroke();
  }

  private drawPillar(screenX: number, screenY: number, size: number, timeMs: number, seed: number): void {
    const context = this.context;
    const cx = screenX + size / 2;
    context.fillStyle = "#0a1526";
    context.fillRect(cx - size * 0.16, screenY, size * 0.32, size);
    context.strokeStyle = "rgba(56, 189, 248, 0.4)";
    context.lineWidth = 2;
    context.strokeRect(cx - size * 0.16, screenY, size * 0.32, size);
    const blink = 0.4 + Math.sin(timeMs / 300 + seed) * 0.4;
    context.fillStyle = `rgba(34, 211, 238, ${blink})`;
    context.beginPath();
    context.arc(cx, screenY + size * 0.16, size * 0.07, 0, Math.PI * 2);
    context.fill();
  }

  private drawCollectEffect(camera: ICameraOffset, options: IRenderOptions): void {
    const effect = options.collectEffect;
    if (!effect) return;
    const context = this.context;
    // Token encogiéndose hacia el jugador.
    if (effect.size > 1) {
      const cx = camera.x + effect.x + effect.size / 2;
      const cy = camera.y + effect.y + effect.size / 2;
      const radius = effect.size / 2;
      context.globalAlpha = effect.alpha;
      const image = this.sprites.get(effect.imageSrc);
      if (image) this.drawImageCircle(image, cx, cy, radius, false);
      else this.drawTokenPlaceholder(cx, cy, radius, "#fbbf24");
      context.strokeStyle = "rgba(251, 191, 36, 0.9)";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
    }
    // Valor flotante (p. ej. +180) subiendo sobre el jugador.
    if (effect.label) {
      context.globalAlpha = effect.labelAlpha;
      context.font = "900 22px system-ui, sans-serif";
      context.fillStyle = "#fde68a";
      context.strokeStyle = "rgba(2, 6, 23, 0.9)";
      context.lineWidth = 4;
      const labelX = camera.x + effect.labelX;
      const labelY = camera.y + effect.labelY;
      context.strokeText(effect.label, labelX, labelY);
      context.fillText(effect.label, labelX, labelY);
      context.globalAlpha = 1;
    }
  }

  private drawFocusLabel(
    world: IEngineWorldState,
    camera: ICameraOffset,
    options: IRenderOptions,
  ): void {
    if (!options.focusedObjectId) return;
    const object = world.tilemap.objects.find((entry) => entry.id === options.focusedObjectId);
    if (!object) return;
    const context = this.context;
    const size = world.tilemap.tileSize;
    const centerX = camera.x + object.tileX * size + size / 2;
    const labelY = camera.y + object.tileY * size - size * 0.42;
    const label = OBJECT_LABELS[object.kind];
    context.font = `600 ${Math.round(size * 0.24)}px system-ui, sans-serif`;
    const width = context.measureText(label).width + size * 0.4;
    context.fillStyle = "rgba(2, 6, 23, 0.9)";
    context.fillRect(centerX - width / 2, labelY - size * 0.18, width, size * 0.36);
    context.strokeStyle = options.blockedObjectIds.has(object.id) ? "#64748b" : "#22d3ee";
    context.lineWidth = 1;
    context.strokeRect(centerX - width / 2, labelY - size * 0.18, width, size * 0.36);
    context.fillStyle = options.blockedObjectIds.has(object.id) ? "#cbd5e1" : "#e0f7ff";
    context.fillText(label, centerX, labelY);
  }

  private drawScanlinesAndVignette(): void {
    const context = this.context;
    // Scanlines sutiles (una pasada barata cada 3px).
    context.strokeStyle = "rgba(0, 0, 0, 0.10)";
    context.lineWidth = 1;
    context.beginPath();
    for (let y = 0; y < this.cssHeight; y += 3) {
      context.moveTo(0, y);
      context.lineTo(this.cssWidth, y);
    }
    context.stroke();
    const gradient = context.createRadialGradient(
      this.cssWidth / 2,
      this.cssHeight / 2,
      Math.min(this.cssWidth, this.cssHeight) * 0.3,
      this.cssWidth / 2,
      this.cssHeight / 2,
      Math.max(this.cssWidth, this.cssHeight) * 0.75,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.5)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.cssWidth, this.cssHeight);
  }
}

/**
 * Posición visual del jugador en píxeles del mundo (interpolando el paso activo).
 */
export function resolvePlayerPixelPosition(
  player: IEngineWorldState["player"],
  tileSize: number,
): ICameraOffset {
  if (!player.activeMove) {
    return { x: player.tile.tileX * tileSize, y: player.tile.tileY * tileSize };
  }
  const { from, to, progress } = player.activeMove;
  return {
    x: (from.tileX + (to.tileX - from.tileX) * progress) * tileSize,
    y: (from.tileY + (to.tileY - from.tileY) * progress) * tileSize,
  };
}

/**
 * Centro del jugador en píxeles del mundo, usado como foco de cámara.
 */
export function resolvePlayerFocus(playerPixel: ICameraOffset, tileSize: number): ICameraOffset {
  return { x: playerPixel.x + tileSize / 2, y: playerPixel.y + tileSize / 2 };
}

/**
 * Celda que tiene delante el jugador según su orientación.
 */
export function resolveFacingTile(player: IEngineWorldState["player"]): IGridPosition {
  const { tile, facing } = player;
  switch (facing) {
    case "UP":
      return { tileX: tile.tileX, tileY: tile.tileY - 1 };
    case "DOWN":
      return { tileX: tile.tileX, tileY: tile.tileY + 1 };
    case "LEFT":
      return { tileX: tile.tileX - 1, tileY: tile.tileY };
    case "RIGHT":
      return { tileX: tile.tileX + 1, tileY: tile.tileY };
  }
}
