// src/components/hub/HubProgressSection.tsx - Widget HUD con métricas de progreso del arquitecto en el hub.
"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

// (Tus 3 funciones 3D se quedan igual)
function Medal3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (meshRef.current) meshRef.current.rotation.z -= delta * 1.5; });
  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} scale={1.8}>
      <cylinderGeometry args={[1, 1, 0.2, 6]} />
      <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={1} wireframe={true} />
    </mesh>
  );
}

function Chapter3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) { meshRef.current.rotation.x += delta * 0.8; meshRef.current.rotation.y += delta * 1.2; }
  });
  return (
    <mesh ref={meshRef} scale={1.4}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.5} wireframe={true} />
    </mesh>
  );
}

function Tutorial3D({ isCompleted }: { isCompleted: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = isCompleted ? "#10b981" : "#f97316";
  useFrame((state, delta) => {
    if (groupRef.current) { groupRef.current.rotation.y += delta * 2; groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.5; }
  });
  return (
    <group ref={groupRef} scale={1.5}>
      <mesh><sphereGeometry args={[0.4, 16, 16]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={isCompleted ? 1 : 2} wireframe={!isCompleted} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.8, 0.05, 16, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} /></mesh>
    </group>
  );
}

// --- EL COMPONENTE PRINCIPAL MÁS COMPACTO ---
export function HubProgressSection({ progress }: { progress: IPlayerHubProgress }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      // Reducimos el padding vertical (py-2) para hacerlo más delgado
      className="group relative flex w-[95%] sm:w-[600px] max-w-[640px] flex-col items-center justify-center border border-cyan-500/40 bg-[#010a14]/90 px-2 py-2 sm:px-4 shadow-[0_15px_40px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all hover:border-cyan-400/80 hover:bg-[#021224]/95 mx-auto"
      style={{ clipPath: "polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-40" />
      <div className="absolute top-0 left-1/2 h-1 w-24 sm:w-32 -translate-x-1/2 bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,1)]" />

      {/* CABECERA MÁS FINA */}
      <div className="relative z-10 flex w-full items-center justify-between border-b border-cyan-900/60 px-2 pb-1">
        <div className="flex gap-1"><div className="h-1 w-3 sm:w-4 bg-cyan-500/50" /><div className="h-1 w-1 bg-cyan-500/50" /></div>
        <p className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">Estado del Arquitecto</p>
        <div className="flex gap-1"><div className="h-1 w-1 bg-cyan-500/50" /><div className="h-1 w-3 sm:w-4 bg-cyan-500/50" /></div>
      </div>

      {/* DATA BLOCKS HORIZONTALES (La clave de la compactación) */}
      <div className="relative z-10 mt-1.5 grid w-full grid-cols-3 gap-2 px-1">
        
        {/* BLOQUE 1 */}
        <div className="flex items-center gap-2 rounded-sm border border-amber-500/30 bg-amber-950/20 px-2 py-1 shadow-[inset_0_0_15px_rgba(245,158,11,0.05)]">
          <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 4] }}><ambientLight intensity={2} /><Medal3D /></Canvas>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest text-amber-500/70 leading-none">Medallas</span>
            <span className="font-mono text-sm sm:text-base font-black text-amber-300 leading-tight drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">{progress.medals}</span>
          </div>
        </div>

        {/* BLOQUE 2 */}
        <div className="flex items-center gap-2 rounded-sm border border-cyan-500/30 bg-cyan-950/20 px-2 py-1 shadow-[inset_0_0_15px_rgba(6,182,212,0.05)]">
          <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 4] }}><ambientLight intensity={2} /><Chapter3D /></Canvas>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest text-cyan-500/70 leading-none">Capítulo</span>
            <span className="font-mono text-sm sm:text-base font-black text-cyan-200 leading-tight drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">{progress.storyChapter}</span>
          </div>
        </div>

        {/* BLOQUE 3 */}
        <div className={`flex items-center gap-2 rounded-sm border px-2 py-1 shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] ${progress.hasCompletedTutorial ? "border-emerald-500/30 bg-emerald-950/20" : "border-orange-500/30 bg-orange-950/20"}`}>
          <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 4] }}><ambientLight intensity={2} /><Tutorial3D isCompleted={progress.hasCompletedTutorial} /></Canvas>
          </div>
          <div className="flex flex-col text-left">
            <span className={`font-mono text-[7px] sm:text-[8px] uppercase tracking-widest leading-none ${progress.hasCompletedTutorial ? 'text-emerald-500/70' : 'text-orange-500/70'}`}>Tutorial</span>
            <span className={`font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-widest leading-tight ${progress.hasCompletedTutorial ? 'text-emerald-300' : 'text-orange-300'}`}>
              {progress.hasCompletedTutorial ? "Listo" : "Pendiente"}
            </span>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
