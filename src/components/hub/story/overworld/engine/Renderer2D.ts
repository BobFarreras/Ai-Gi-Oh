// src/components/hub/story/overworld/engine/Renderer2D.ts - Render Canvas 2D cibernético del overworld (circuito neón + imágenes reales) con culling y DPR limitado.
import { IGridPosition, resolveDirectionDelta } from "@/core/services/story/overworld/overworld-types";
import { canWalkToTile } from "@/core/services/story/overworld/movement-rules";
import { IOverworldLight } from "@/core/services/story/overworld/lighting";
import { IOverworldTilemap, OverworldObjectKind } from "@/services/story/overworld/tilemap-schema";
import {
  GROUND_TILE,
  OVERLAY_TILE,
  resolveBeltDirection,
} from "@/services/story/overworld/overworld-tile-kinds";
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
  /** Luces activas (interruptores encendidos) para el pase de oscuridad en mapas DARK. */
  activeLights: ReadonlyArray<IOverworldLight>;
  /** Cajas empujables en su posición viva (interpolada en píxeles del mundo). */
  boxes: ReadonlyArray<{ id: string; pixelX: number; pixelY: number }>;
  /** Placas de presión actualmente pulsadas (una caja encima). */
  pressedPlateIds: ReadonlySet<string>;
  timeMs: number;
}

const OBJECT_LABELS: Record<OverworldObjectKind, string> = {
  DUEL: "Rival",
  BOSS: "Jefe",
  REWARD_CARD: "Carta",
  REWARD_NEXUS: "Nexus",
  REWARD_OBJECT: "Objeto",
  EVENT: "Evento",
  NPC: "Aliado",
  SUBMISSION: "Terminal",
  WARP: "Portal",
  GATE: "Puerta",
  MARKET: "Mercado",
  ARSENAL: "Arsenal",
  TELEPORT: "Salir",
  SWITCH: "Interruptor",
  BOX: "Caja",
  PLATE: "Placa",
  BOX_RESET: "Reiniciar caja",
};

const OBJECT_ACCENT: Record<OverworldObjectKind, string> = {
  DUEL: "#f43f5e",
  BOSS: "#c026d3",
  REWARD_CARD: "#f59e0b",
  REWARD_NEXUS: "#22d3ee",
  REWARD_OBJECT: "#fbbf24",
  EVENT: "#2dd4bf",
  NPC: "#38bdf8",
  SUBMISSION: "#fb7185",
  WARP: "#818cf8",
  GATE: "#eab308",
  MARKET: "#f59e0b",
  ARSENAL: "#06b6d4",
  TELEPORT: "#0ea5e9",
  SWITCH: "#fde047",
  BOX: "#d4a373",
  PLATE: "#38bdf8",
  BOX_RESET: "#f97316",
};

/** Radio (en celdas) de la luz que acompaña al jugador en mapas DARK. */
const DARK_PLAYER_LIGHT_TILES = 2.7;

/** Paleta del mundo por ambiente. El default es cian; TERMINAL (Acto 4) lo tiñe de verde fósforo. */
interface IAmbientPalette {
  background: string;
  gridLine: string;
  laneCore: string;
  laneGlow: string;
  /** Componentes "r, g, b" de la vena animada del circuito (alpha dinámico aparte). */
  veinRgb: string;
  /** Tinte de pantalla completa al final del frame (null = sin tinte). */
  tint: string | null;
}

const DEFAULT_PALETTE: IAmbientPalette = {
  background: "#05070f",
  gridLine: "rgba(56, 189, 248, 0.07)",
  laneCore: "#0e2a3d",
  laneGlow: "rgba(34, 211, 238, 0.55)",
  veinRgb: "34, 211, 238",
  tint: null,
};

/** Verde terminal ciberpunk (GenNvim ≈ Vim/Neovim): fondo casi negro, rejilla y lanes en verde neón. */
const TERMINAL_PALETTE: IAmbientPalette = {
  background: "#020a05",
  gridLine: "rgba(52, 211, 153, 0.11)",
  laneCore: "#0b3a1e",
  laneGlow: "rgba(74, 222, 128, 0.55)",
  veinRgb: "74, 222, 128",
  tint: "rgba(16, 90, 45, 0.12)",
};

function resolveAmbientPalette(ambient: IOverworldTilemap["ambient"]): IAmbientPalette {
  return ambient === "TERMINAL" ? TERMINAL_PALETTE : DEFAULT_PALETTE;
}

/**
 * Renderer imperativo cibernético: rejilla neón, lanes de circuito e imágenes reales.
 * No crea objetos por frame y solo dibuja el rango visible.
 */
export class Renderer2D {
  private readonly context: CanvasRenderingContext2D;
  private cssWidth = 0;
  private cssHeight = 0;
  // Máscara de oscuridad reutilizada entre frames (se perforan gradientes de luz sobre ella
  // y se blitea sobre el mundo). Fuera de pantalla para no repintar la escena bajo la sombra.
  private darknessCanvas: HTMLCanvasElement | null = null;
  private darknessCtx: CanvasRenderingContext2D | null = null;
  // Progreso de apertura animado por puerta/puente (0 cerrado → 1 abierto) y delta de frame.
  private readonly gateOpenProgress = new Map<string, number>();
  private lastRenderMs = 0;
  private frameDeltaMs = 16;
  /** Paleta activa (por ambiente), resuelta al inicio de cada render. */
  private palette: IAmbientPalette = DEFAULT_PALETTE;

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
    this.palette = resolveAmbientPalette(tilemap.ambient);
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
    this.drawPlatesPass(world, cameraOffset, options);
    this.drawSightBeams(world, cameraOffset, options);
    this.drawObjectsPass(world, cameraOffset, range, options);
    this.drawBoxesPass(world, cameraOffset, options);
    this.drawActorsPass(world, cameraOffset, options);
    this.drawCutsceneNpc(world, cameraOffset, options);
    this.drawPlayer(world, playerPixel, cameraOffset);
    this.drawOverlayPass(tilemap, cameraOffset, range, options.timeMs);
    this.drawCollectEffect(cameraOffset, options);
    this.drawFocusLabel(world, cameraOffset, options);
    context.restore();
    this.drawDarknessPass(world, playerPixel, cameraOffset, options);
    this.drawScanlinesAndVignette();
  }

  /**
   * Mapas DARK: cubre el mundo con una capa de oscuridad y "perfora" gradientes de luz
   * en el jugador y en los interruptores encendidos. Un fill + pocos gradientes + un blit:
   * barato en móvil. La escena ya está pintada debajo, así que solo se revela lo iluminado.
   */
  private drawDarknessPass(
    world: IEngineWorldState,
    playerPixel: ICameraOffset,
    camera: ICameraOffset,
    options: IRenderOptions,
  ): void {
    if (world.tilemap.ambient !== "DARK") return;
    const w = Math.max(1, Math.round(this.cssWidth));
    const h = Math.max(1, Math.round(this.cssHeight));
    if (!this.darknessCanvas) {
      this.darknessCanvas = document.createElement("canvas");
      this.darknessCtx = this.darknessCanvas.getContext("2d");
    }
    const mask = this.darknessCtx;
    if (!mask || !this.darknessCanvas) return;
    if (this.darknessCanvas.width !== w || this.darknessCanvas.height !== h) {
      this.darknessCanvas.width = w;
      this.darknessCanvas.height = h;
    }
    const zoom = this.zoom;
    const size = world.tilemap.tileSize;
    // worldPoint -> pantalla: (camera + world) * zoom (mismo mapeo que el pase escalado).
    const toScreenX = (worldX: number): number => (camera.x + worldX) * zoom;
    const toScreenY = (worldY: number): number => (camera.y + worldY) * zoom;

    mask.setTransform(1, 0, 0, 1, 0, 0);
    mask.clearRect(0, 0, w, h);
    mask.globalCompositeOperation = "source-over";
    mask.fillStyle = "rgba(2, 4, 10, 0.95)";
    mask.fillRect(0, 0, w, h);

    // Perforado: lo que dibujemos ahora RESTA oscuridad (alpha alto = totalmente iluminado).
    mask.globalCompositeOperation = "destination-out";
    // Luz del jugador (siempre lo acompaña en la oscuridad).
    this.punchRadialLight(
      mask,
      toScreenX(playerPixel.x + size / 2),
      toScreenY(playerPixel.y + size / 2),
      DARK_PLAYER_LIGHT_TILES * size * zoom,
    );
    // Luces de interruptores encendidos.
    for (const light of options.activeLights) {
      if (light.kind === "RECT") {
        const x = toScreenX(light.x0 * size);
        const y = toScreenY(light.y0 * size);
        const rw = (light.x1 - light.x0 + 1) * size * zoom;
        const rh = (light.y1 - light.y0 + 1) * size * zoom;
        this.punchRectLight(mask, x, y, rw, rh);
      } else {
        this.punchRadialLight(
          mask,
          toScreenX(light.tileX * size + size / 2),
          toScreenY(light.tileY * size + size / 2),
          light.radius * size * zoom,
        );
      }
    }
    mask.globalCompositeOperation = "source-over";
    this.context.drawImage(this.darknessCanvas, 0, 0, this.cssWidth, this.cssHeight);
  }

  private punchRadialLight(
    mask: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
  ): void {
    if (radius <= 0) return;
    const gradient = mask.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius);
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(0.62, "rgba(0, 0, 0, 0.82)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    mask.fillStyle = gradient;
    mask.beginPath();
    mask.arc(cx, cy, radius, 0, Math.PI * 2);
    mask.fill();
  }

  /** Sala encendida: se despeja el rect con un pequeño degradado de borde para que no corte a pico. */
  private punchRectLight(
    mask: CanvasRenderingContext2D,
    x: number,
    y: number,
    rw: number,
    rh: number,
  ): void {
    const feather = Math.min(rw, rh) * 0.18;
    mask.fillStyle = "rgba(0, 0, 0, 0.96)";
    mask.fillRect(x + feather, y + feather, rw - feather * 2, rh - feather * 2);
    // Borde difuminado con sombra para suavizar la transición sala↔oscuridad.
    mask.save();
    mask.shadowColor = "rgba(0, 0, 0, 0.96)";
    mask.shadowBlur = feather;
    mask.fillStyle = "rgba(0, 0, 0, 0.96)";
    mask.fillRect(x + feather, y + feather, rw - feather * 2, rh - feather * 2);
    mask.restore();
  }

  private drawBackground(tileSize: number, camera: ICameraOffset, viewport: IRendererViewportSize): void {
    const context = this.context;
    const viewW = viewport.cssWidth;
    const viewH = viewport.cssHeight;
    context.fillStyle = this.palette.background;
    context.fillRect(0, 0, viewW, viewH);
    // Rejilla técnica alineada al mundo (se desplaza con la cámara).
    context.strokeStyle = this.palette.gridLine;
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
      return kind === GROUND_TILE.PATH || kind === GROUND_TILE.SAND || resolveBeltDirection(kind) !== null;
    };
    for (let tileY = range.minTileY; tileY <= range.maxTileY; tileY++) {
      for (let tileX = range.minTileX; tileX <= range.maxTileX; tileX++) {
        const kind = ground[tileY]?.[tileX];
        if (kind === GROUND_TILE.PATH) this.drawLaneTile(tilemap, tileX, tileY, camera, timeMs);
        else if (kind === GROUND_TILE.SAND) {
          this.drawRoomFloorTile(camera.x + tileX * size, camera.y + tileY * size, size);
        } else {
          const belt = resolveBeltDirection(kind);
          if (belt) this.drawBeltTile(camera.x + tileX * size, camera.y + tileY * size, size, belt, timeMs);
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

  /** Cinta transportadora: suelo metálico con chevrones que fluyen en la dirección de arrastre. */
  private drawBeltTile(
    screenX: number,
    screenY: number,
    size: number,
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
    timeMs: number,
  ): void {
    const context = this.context;
    context.fillStyle = "#111d2e";
    context.fillRect(screenX, screenY, size, size);
    context.strokeStyle = "rgba(56, 189, 248, 0.35)";
    context.lineWidth = 1;
    context.strokeRect(screenX + 2, screenY + 2, size - 4, size - 4);

    const cx = screenX + size / 2;
    const cy = screenY + size / 2;
    const flow = ((timeMs / 520) % 1 + 1) % 1; // 0..1 en bucle, para el desplazamiento del patrón.
    context.save();
    context.translate(cx, cy);
    switch (direction) {
      case "UP":
        break;
      case "DOWN":
        context.rotate(Math.PI);
        break;
      case "LEFT":
        context.rotate(-Math.PI / 2);
        break;
      case "RIGHT":
        context.rotate(Math.PI / 2);
        break;
    }
    // Tres chevrones apuntando "arriba" en el marco rotado; fluyen hacia la dirección.
    context.strokeStyle = "rgba(34, 211, 238, 0.75)";
    context.lineWidth = Math.max(2, size * 0.06);
    context.lineCap = "round";
    const span = size * 0.3;
    for (let index = 0; index < 3; index++) {
      const offset = (index - flow) * (size * 0.32);
      const y = offset;
      context.beginPath();
      context.moveTo(-span, y + span * 0.6);
      context.lineTo(0, y - span * 0.6);
      context.lineTo(span, y + span * 0.6);
      context.globalAlpha = 0.35 + 0.4 * (1 - Math.abs(index - 1) / 2);
      context.stroke();
    }
    context.globalAlpha = 1;
    context.restore();
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
    context.fillStyle = this.palette.laneCore;
    context.fillRect(screenX + 2, screenY + 2, size - 4, size - 4);

    const ground = tilemap.layers.ground;
    const isLane = (x: number, y: number): boolean => ground[y]?.[x] === GROUND_TILE.PATH;
    // Vena de energía central que conecta lanes contiguas.
    const pulse = 0.55 + Math.sin(timeMs / 500 + (tileX + tileY) * 0.6) * 0.25;
    context.strokeStyle = `rgba(${this.palette.veinRgb}, ${pulse})`;
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
    context.fillStyle = this.palette.laneGlow;
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
      // Cajas (posición viva) y placas (marca de suelo) tienen su propio pase.
      if (object.kind === "BOX" || object.kind === "PLATE") continue;
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
    } else if (kind === "SWITCH") {
      this.drawSwitch(screenX, screenY, size, accent, timeMs);
    } else if (kind === "BOX_RESET") {
      this.drawResetButton(screenX, screenY, size, accent, timeMs);
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

  /** Interruptor de pared: caja con palanca y bombilla que late (llama la atención en la oscuridad). */
  private drawSwitch(screenX: number, screenY: number, size: number, accent: string, timeMs: number): void {
    const context = this.context;
    const x = screenX + size * 0.3;
    const y = screenY + size * 0.24;
    const w = size * 0.4;
    const h = size * 0.52;
    // Placa.
    context.fillStyle = "#0b1220";
    context.fillRect(x, y, w, h);
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.strokeRect(x, y, w, h);
    // Palanca.
    context.strokeStyle = accent;
    context.lineWidth = Math.max(2, size * 0.05);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x + w / 2, y + h * 0.72);
    context.lineTo(x + w * 0.68, y + h * 0.32);
    context.stroke();
    // Bombilla pulsante encima.
    const pulse = 0.5 + Math.sin(timeMs / 220) * 0.5;
    context.globalAlpha = 0.35 + pulse * 0.55;
    context.fillStyle = accent;
    context.beginPath();
    context.arc(screenX + size / 2, y - size * 0.06, size * 0.08, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  /** Botón de reinicio de cajas: consola con una flecha circular de "reset". */
  private drawResetButton(screenX: number, screenY: number, size: number, accent: string, timeMs: number): void {
    const context = this.context;
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;
    // Base de consola.
    context.fillStyle = "#0b1220";
    context.fillRect(screenX + size * 0.24, screenY + size * 0.24, size * 0.52, size * 0.52);
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.strokeRect(screenX + size * 0.24, screenY + size * 0.24, size * 0.52, size * 0.52);
    // Flecha circular (reset).
    const pulse = 0.55 + Math.sin(timeMs / 260) * 0.35;
    context.strokeStyle = accent;
    context.globalAlpha = pulse;
    context.lineWidth = Math.max(2, size * 0.05);
    context.beginPath();
    context.arc(cx, cy, size * 0.16, Math.PI * 0.35, Math.PI * 1.9);
    context.stroke();
    // Punta de la flecha.
    const tipX = cx + Math.cos(Math.PI * 0.35) * size * 0.16;
    const tipY = cy + Math.sin(Math.PI * 0.35) * size * 0.16;
    context.fillStyle = accent;
    context.beginPath();
    context.moveTo(tipX, tipY);
    context.lineTo(tipX - size * 0.02, tipY - size * 0.09);
    context.lineTo(tipX + size * 0.09, tipY - size * 0.04);
    context.closePath();
    context.fill();
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
    // Materialización (TELEPORT): el token nace transparente y "cuaja" mientras un anillo se cierra.
    const spawn = Math.max(0, Math.min(1, npc.spawnProgress));

    context.save();
    if (spawn < 1) context.globalAlpha = spawn;

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
    context.restore();

    if (spawn < 1) this.drawTeleportBurst(cx, cy, size, spawn);
  }

  /**
   * Estallido de teletransporte del Núcleo (verde terminal): anillo que se cierra sobre la casilla
   * + rebanadas de glitch horizontales. Se dibuja mientras el NPC aún se está materializando.
   */
  private drawTeleportBurst(cx: number, cy: number, size: number, progress: number): void {
    const context = this.context;
    context.save();
    // Anillo exterior que colapsa hacia el token.
    const ringRadius = size * (1.1 - 0.6 * progress);
    context.strokeStyle = "#4ade80";
    context.globalAlpha = 0.25 + (1 - progress) * 0.6;
    context.lineWidth = size * 0.06;
    context.beginPath();
    context.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    context.stroke();
    // Columna de luz + rebanadas de glitch (scanlines desplazadas) sobre el token.
    context.globalAlpha = (1 - progress) * 0.5;
    context.fillStyle = "#bbf7d0";
    context.fillRect(cx - size * 0.06, cy - size * 0.95, size * 0.12, size * 1.9);
    context.globalAlpha = (1 - progress) * 0.75;
    context.fillStyle = "#22c55e";
    for (let slice = 0; slice < 5; slice++) {
      const offset = ((slice * 7 + Math.round(progress * 23)) % 11) - 5;
      const sliceY = cy - size * 0.45 + slice * size * 0.2;
      context.fillRect(cx - size * 0.42 + offset * 2, sliceY, size * 0.84, size * 0.045);
    }
    context.restore();
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
        else if (kind === OVERLAY_TILE.COOLING_UNIT) this.drawCoolingUnit(screenX, screenY, size, timeMs, tileX + tileY);
        else if (kind === OVERLAY_TILE.DATA_PYLON) this.drawDataPylon(screenX, screenY, size, timeMs);
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

  /** Unidad de refrigeración: caja con rejillas de ventilación y un ventilador giratorio. */
  private drawCoolingUnit(screenX: number, screenY: number, size: number, timeMs: number, seed: number): void {
    const context = this.context;
    const x = screenX + size * 0.14;
    const y = screenY + size * 0.2;
    const w = size * 0.72;
    const h = size * 0.66;
    context.fillStyle = "rgba(0,0,0,0.35)";
    context.fillRect(screenX + size * 0.18, screenY + size * 0.86, size * 0.64, size * 0.1);
    context.fillStyle = "#0c1626";
    context.fillRect(x, y, w, h);
    context.strokeStyle = "rgba(52, 211, 153, 0.5)";
    context.lineWidth = 2;
    context.strokeRect(x, y, w, h);
    // Rejillas de ventilación (mitad izquierda).
    context.strokeStyle = "rgba(148, 163, 184, 0.4)";
    context.lineWidth = 1;
    for (let slat = 0; slat < 4; slat++) {
      const slatY = y + h * (0.2 + slat * 0.2);
      context.beginPath();
      context.moveTo(x + w * 0.1, slatY);
      context.lineTo(x + w * 0.58, slatY);
      context.stroke();
    }
    // Ventilador (derecha), gira con el tiempo.
    const fanX = x + w * 0.78;
    const fanY = y + h * 0.5;
    const radius = Math.min(w, h) * 0.22;
    const spin = timeMs / 400 + seed;
    context.strokeStyle = `rgba(34, 211, 238, ${0.4 + Math.sin(timeMs / 300) * 0.2})`;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(fanX, fanY, radius, 0, Math.PI * 2);
    context.stroke();
    for (let blade = 0; blade < 3; blade++) {
      const angle = spin + blade * ((Math.PI * 2) / 3);
      context.beginPath();
      context.moveTo(fanX, fanY);
      context.lineTo(fanX + Math.cos(angle) * radius, fanY + Math.sin(angle) * radius);
      context.stroke();
    }
  }

  /** Pilón de datos: mástil delgado con struts y una baliza verde pulsante en la punta. */
  private drawDataPylon(screenX: number, screenY: number, size: number, timeMs: number): void {
    const context = this.context;
    const cx = screenX + size * 0.5;
    context.fillStyle = "rgba(0,0,0,0.3)";
    context.fillRect(screenX + size * 0.34, screenY + size * 0.88, size * 0.32, size * 0.08);
    context.fillStyle = "#0a1526";
    context.fillRect(cx - size * 0.06, screenY + size * 0.14, size * 0.12, size * 0.76);
    context.strokeStyle = "rgba(52, 211, 153, 0.45)";
    context.lineWidth = 2;
    context.strokeRect(cx - size * 0.06, screenY + size * 0.14, size * 0.12, size * 0.76);
    // Struts diagonales hasta la base.
    context.strokeStyle = "rgba(148, 163, 184, 0.35)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(cx - size * 0.2, screenY + size * 0.86);
    context.lineTo(cx, screenY + size * 0.5);
    context.lineTo(cx + size * 0.2, screenY + size * 0.86);
    context.stroke();
    // Baliza pulsante.
    const glow = 0.5 + Math.sin(timeMs / 300) * 0.4;
    context.fillStyle = `rgba(74, 222, 128, ${glow})`;
    context.beginPath();
    context.arc(cx, screenY + size * 0.12, size * 0.1, 0, Math.PI * 2);
    context.fill();
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

  /** Placas de presión: marca de suelo que se ilumina al pisarse con una caja. */
  private drawPlatesPass(world: IEngineWorldState, camera: ICameraOffset, options: IRenderOptions): void {
    const size = world.tilemap.tileSize;
    for (const object of world.tilemap.objects) {
      if (object.kind !== "PLATE") continue;
      const screenX = camera.x + object.tileX * size;
      const screenY = camera.y + object.tileY * size;
      this.drawPlate(screenX, screenY, size, options.pressedPlateIds.has(object.id), options.timeMs);
    }
  }

  private drawPlate(
    screenX: number,
    screenY: number,
    size: number,
    pressed: boolean,
    timeMs: number,
  ): void {
    const context = this.context;
    const inset = size * 0.16;
    const x = screenX + inset;
    const y = screenY + inset;
    const s = size - inset * 2;
    const accent = pressed ? "#22d3ee" : "#38618c";
    context.fillStyle = pressed ? "rgba(34, 211, 238, 0.22)" : "rgba(56, 97, 140, 0.14)";
    context.fillRect(x, y, s, s);
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.strokeRect(x, y, s, s);
    // Cruz central; late cuando está pulsada.
    const glow = pressed ? 0.6 + Math.sin(timeMs / 200) * 0.35 : 0.4;
    context.globalAlpha = glow;
    context.strokeStyle = accent;
    context.beginPath();
    context.moveTo(x + s * 0.3, y + s * 0.5);
    context.lineTo(x + s * 0.7, y + s * 0.5);
    context.moveTo(x + s * 0.5, y + s * 0.3);
    context.lineTo(x + s * 0.5, y + s * 0.7);
    context.stroke();
    context.globalAlpha = 1;
  }

  /** Cajas empujables: se dibujan en su posición viva (interpolada) con sombra de contacto. */
  private drawBoxesPass(world: IEngineWorldState, camera: ICameraOffset, options: IRenderOptions): void {
    const size = world.tilemap.tileSize;
    for (const box of options.boxes) {
      const screenX = camera.x + box.pixelX;
      const screenY = camera.y + box.pixelY;
      // Sombra de contacto.
      const context = this.context;
      context.fillStyle = "rgba(0,0,0,0.4)";
      context.beginPath();
      context.ellipse(screenX + size / 2, screenY + size * 0.9, size * 0.32, size * 0.1, 0, 0, Math.PI * 2);
      context.fill();
      this.drawCrate(screenX, screenY, size);
    }
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
    // Tinte de ambiente (TERMINAL): un velo verde a pantalla completa que armoniza los acentos cian
    // restantes hacia el look de terminal. Un solo fillRect: coste despreciable.
    if (this.palette.tint) {
      context.fillStyle = this.palette.tint;
      context.fillRect(0, 0, this.cssWidth, this.cssHeight);
    }
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
