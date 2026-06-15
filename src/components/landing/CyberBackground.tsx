// src/components/landing/CyberBackground.tsx - Fondo animado futurista optimizado con delta-time, DPR adaptativo, skip-frames, visibilidad y sparse connections.
"use client";

import { useCallback, useEffect, useRef } from "react";

// --- CONFIGURACIÓN DEL MOTOR DE RED ---
const DESKTOP_PARTICLE_COUNT = 80;
const MOBILE_PARTICLE_COUNT = 35;
const CONNECTION_DISTANCE = 150;
const CONNECTION_DISTANCE_SQ = CONNECTION_DISTANCE * CONNECTION_DISTANCE;
const BASE_SPEED = 0.5;
const MAX_DPR = 2;

interface CyberBackgroundProps {
  /** Reduce partículas y conexiones cuando comparte pantalla con WebGL (Hub 3D). */
  lightweight?: boolean;
}

/** Detecta si el dispositivo es móvil por CSS media query. */
function isMobileBreakpoint(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
}

/** Detecta preferencia de movimiento reducido. */
function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Clase DataNode con delta-time para movimiento consistente entre dispositivos.
class DataNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;

  constructor(canvasWidth: number, canvasHeight: number, isMobile: boolean) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    const speed = isMobile ? BASE_SPEED * 0.7 : BASE_SPEED;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
    this.size = Math.random() * 1.5 + 0.5;
  }

  update(dt: number, canvasWidth: number, canvasHeight: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
    if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;

    // Clampear posición dentro de límites para evitar drift por dt variable.
    this.x = Math.max(0, Math.min(canvasWidth, this.x));
    this.y = Math.max(0, Math.min(canvasHeight, this.y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
    ctx.fill();
  }
}

export function CyberBackground({ lightweight = false }: CyberBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const animateRef = useCallback(() => {
    if (typeof window === "undefined") return;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    // Perfil de rendimiento según dispositivo y modo.
    const isMobile = isMobileBreakpoint();
    const reducedMotionActive = prefersReducedMotion();

    if (reducedMotionActive) {
      // Movimiento reducido: dibujar un frame estático y parar.
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;
      const staticCount = Math.min(DESKTOP_PARTICLE_COUNT, lightweight ? 20 : 40);
      for (let i = 0; i < staticCount; i++) {
        const x = Math.random() * logicalWidth;
        const y = Math.random() * logicalHeight;
        const size = Math.random() * 1.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6, 182, 212, 0.5)";
        ctx.fill();
      }
      return;
    }

    // Número de partículas según dispositivo y modo lightweight.
    const particleCount = isMobile
      ? (lightweight ? 15 : MOBILE_PARTICLE_COUNT)
      : (lightweight ? 30 : DESKTOP_PARTICLE_COUNT);

    // Skip-frames: en móvil o lightweight, saltar frames para reducir carga de GPU.
    const skipFrames = isMobile ? 2 : (lightweight ? 1 : 0);

    // DPR adaptativo para nitidez sin sobrecarga en pantallas de alta densidad.
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const resizeCanvas = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Crear nodos.
    const logicalWidth = window.innerWidth;
    const logicalHeight = window.innerHeight;
    const nodes: DataNode[] = [];
    for (let i = 0; i < particleCount; i++) {
      nodes.push(new DataNode(logicalWidth, logicalHeight, isMobile));
    }

    resizeCanvas();

    let lastTime = performance.now();
    let frameCount = 0;
    let isVisible = !document.hidden;
    let animationFrameId: number;

    // Pausar animación cuando la pestaña no es visible.
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Debounce de resize con rAF para evitar layout thrashing.
    let resizeRafId: number | null = null;
    const debouncedResize = () => {
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        resizeCanvas();
        // Reposicionar nodos dentro de nuevos límites.
        for (const node of nodes) {
          node.x = Math.min(node.x, window.innerWidth);
          node.y = Math.min(node.y, window.innerHeight);
        }
      });
    };
    window.addEventListener("resize", debouncedResize);

    const animate = (now: number) => {
      if (!isVisible) return;

      const rawDt = now - lastTime;
      lastTime = now;
      // Clampear delta-time para evitar saltos grandes tras tab oculta o lag.
      const dt = Math.min(rawDt, 100) / 16.67; // Normalizar a ~60fps.

      frameCount++;

      // Skip-frames: si skipFrames > 0, solo dibujar cada N frames.
      if (skipFrames > 0 && frameCount % (skipFrames + 1) !== 0) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx!.clearRect(0, 0, w, h);

      // Actualizar nodos con delta-time.
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].update(dt, w, h);
        nodes[i].draw(ctx!);
      }

      // Dibujar conexiones con distancia al cuadrado (evitar Math.sqrt).
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < CONNECTION_DISTANCE_SQ) {
            const dist = Math.sqrt(distSq);
            const opacity = 1 - dist / CONNECTION_DISTANCE;
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(6, 182, 212, ${(opacity * 0.4).toFixed(2)})`;
            ctx!.lineWidth = 1;
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", debouncedResize);
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [lightweight]);

  useEffect(() => {
    const cleanup = animateRef();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [animateRef]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#010308] pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-cyan-900/15 blur-[120px] rounded-full mix-blend-screen" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#010308_95%)]" />
    </div>
  );
}