// src/components/hub/story/overworld/hud/OverworldBattleTransition.tsx - Transición de encuentro estilo Pokémon (parpadeos/turbulencia + retrato) antes del combate.
"use client";

import Image from "next/image";
import { useEffect } from "react";

interface IOverworldBattleTransitionProps {
  opponentImageSrc?: string;
  onComplete: () => void;
}

const DURATION_MS = 1500;

/**
 * Cubre la pantalla con destellos y turbulencia mientras el retrato del rival
 * irrumpe; al terminar dispara `onComplete` (que lanza el duelo real).
 */
export function OverworldBattleTransition({ opponentImageSrc, onComplete }: IOverworldBattleTransitionProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="ow-battle-overlay" role="presentation" aria-hidden="true">
      <div className="ow-battle-flash" />
      <div className="ow-battle-bars" />
      {opponentImageSrc ? (
        <div className="ow-battle-portrait">
          <Image src={opponentImageSrc} alt="" width={220} height={220} className="h-full w-full object-cover" priority />
        </div>
      ) : null}
      <p className="ow-battle-label">¡Combate!</p>
      <style jsx>{`
        .ow-battle-overlay {
          position: absolute;
          inset: 0;
          z-index: 50;
          overflow: hidden;
          background: #020617;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ow-turbulence 0.28s steps(2) infinite;
        }
        .ow-battle-flash {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, #22d3ee, #a855f7, #f43f5e);
          mix-blend-mode: screen;
          animation: ow-flash 0.18s steps(1) infinite;
        }
        .ow-battle-bars {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.55) 0px,
            rgba(0, 0, 0, 0.55) 8px,
            transparent 8px,
            transparent 16px
          );
          animation: ow-bars 1.5s ease-in forwards;
        }
        .ow-battle-portrait {
          position: relative;
          height: 220px;
          width: 220px;
          border-radius: 9999px;
          overflow: hidden;
          border: 4px solid rgba(226, 255, 255, 0.9);
          box-shadow: 0 0 60px rgba(244, 63, 94, 0.8);
          animation: ow-rush 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .ow-battle-label {
          position: absolute;
          bottom: 18%;
          z-index: 2;
          font-weight: 900;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #f8fafc;
          text-shadow: 0 0 14px rgba(244, 63, 94, 0.9);
          animation: ow-label 1.5s ease-out forwards;
        }
        @keyframes ow-flash {
          0% { opacity: 0.15; }
          50% { opacity: 0.5; }
          100% { opacity: 0.15; }
        }
        @keyframes ow-turbulence {
          0% { transform: translate(0, 0) skewX(0deg); }
          25% { transform: translate(-4px, 2px) skewX(1.5deg); }
          50% { transform: translate(3px, -3px) skewX(-1.5deg); }
          75% { transform: translate(-2px, 3px) skewX(1deg); }
          100% { transform: translate(0, 0) skewX(0deg); }
        }
        @keyframes ow-bars {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 1; background-size: 100% 400%; }
        }
        @keyframes ow-rush {
          0% { transform: scale(0.1) rotate(-12deg); opacity: 0; }
          45% { transform: scale(1.05) rotate(3deg); opacity: 1; }
          70% { transform: scale(0.98) rotate(-2deg); }
          100% { transform: scale(6) rotate(0deg); opacity: 0; }
        }
        @keyframes ow-label {
          0%, 40% { opacity: 0; transform: translateY(10px); }
          55% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
