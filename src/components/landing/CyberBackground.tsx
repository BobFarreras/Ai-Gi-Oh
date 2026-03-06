// src/components/landing/CyberBackground.tsx - Fondo animado futurista reutilizable para landing y páginas de autenticación.
"use client";

import { useEffect, useRef } from "react";

// --- CONFIGURACIÓN DEL MOTOR DE RED ---
const PARTICLE_COUNT = 100; // Número de nodos de IA
const CONNECTION_DISTANCE = 150; // Distancia máxima para conectar los nodos
const SPEED = 0.5; // Velocidad base de los nodos

// CLEAN CODE: Definimos la clase FUERA del componente React.
// Evita memory leaks y cumple con las reglas estrictas de ESLint.
class DataNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;

  // Pasamos el ancho y alto por inyección de dependencias en el constructor
  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * SPEED;
    this.vy = (Math.random() - 0.5) * SPEED;
    this.size = Math.random() * 1.5 + 0.5;
  }

  // Actualizamos la posición inyectando los límites actuales del canvas
  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
    if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;
  }

  // Dibujamos inyectando el contexto 2D (ya validado por TypeScript)
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
    ctx.fill();
  }
}

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Validación estricta para TypeScript

    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Validación estricta para TypeScript

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Instanciar todos los nodos con las medidas iniciales
    const nodes: DataNode[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      nodes.push(new DataNode(canvas.width, canvas.height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        // Pasamos las medidas actualizadas
        nodes[i].update(canvas.width, canvas.height);
        nodes[i].draw(ctx);

        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONNECTION_DISTANCE) {
            const opacity = 1 - distance / CONNECTION_DISTANCE;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
