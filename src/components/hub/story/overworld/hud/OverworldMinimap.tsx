// src/components/hub/story/overworld/hud/OverworldMinimap.tsx - Minimapa de esquina que resume la facility y la posición del jugador.
"use client";

import { useEffect, useRef } from "react";
import { IGridPosition } from "@/core/services/story/overworld/overworld-types";
import { IOverworldTilemap, OverworldObjectKind } from "@/services/story/overworld/tilemap-schema";
import { GROUND_TILE } from "@/services/story/overworld/overworld-tile-kinds";

interface IOverworldMinimapProps {
  tilemap: IOverworldTilemap;
  playerTile: IGridPosition;
  defeatedIds: ReadonlySet<string>;
  /** Objetos recogidos/ocultos que no deben aparecer. */
  hiddenIds?: ReadonlySet<string>;
}

const CELL = 4;
const DOT: Partial<Record<OverworldObjectKind, string>> = {
  DUEL: "#f43f5e",
  BOSS: "#c026d3",
  REWARD_CARD: "#f59e0b",
  REWARD_NEXUS: "#22d3ee",
  EVENT: "#2dd4bf",
  WARP: "#818cf8",
  GATE: "#eab308",
};

/**
 * Minimapa fijo arriba a la derecha: da visión global mientras la cámara va
 * "por habitaciones". Se redibuja solo cuando el jugador cambia de celda.
 */
export function OverworldMinimap({ tilemap, playerTile, defeatedIds, hiddenIds }: IOverworldMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let tileY = 0; tileY < tilemap.height; tileY++) {
      for (let tileX = 0; tileX < tilemap.width; tileX++) {
        if (tilemap.collision[tileY][tileX] !== 1 && tilemap.layers.ground[tileY][tileX] === GROUND_TILE.GRASS) {
          continue;
        }
        const isCorridor = tilemap.layers.ground[tileY][tileX] === GROUND_TILE.PATH;
        context.fillStyle = isCorridor ? "rgba(34, 211, 238, 0.5)" : "rgba(56, 89, 130, 0.55)";
        context.fillRect(tileX * CELL, tileY * CELL, CELL, CELL);
      }
    }

    for (const object of tilemap.objects) {
      if (object.hidden || hiddenIds?.has(object.id)) continue;
      const color = DOT[object.kind];
      if (!color) continue;
      context.fillStyle = defeatedIds.has(object.id) ? "rgba(100,116,139,0.7)" : color;
      context.fillRect(object.tileX * CELL - 1, object.tileY * CELL - 1, CELL + 2, CELL + 2);
    }

    // Jugador.
    context.fillStyle = "#34d399";
    context.beginPath();
    context.arc(playerTile.tileX * CELL + CELL / 2, playerTile.tileY * CELL + CELL / 2, CELL, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#022c22";
    context.lineWidth = 1;
    context.stroke();
  }, [tilemap, playerTile, defeatedIds, hiddenIds]);

  return (
    <div className="pointer-events-none absolute right-3 top-14 z-20 rounded-lg border border-cyan-300/25 bg-slate-950/80 p-2 backdrop-blur-sm">
      <canvas ref={canvasRef} width={tilemap.width * CELL} height={tilemap.height * CELL} className="block" />
    </div>
  );
}
