// src/components/hub/nodes/HubNodeDecorStory.tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function StoryCore3D() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Rotación exclusiva en el eje Y (izquierda a derecha)
      // Ajusta el 0.25 si quieres que el giro sea más o menos "snappy"
      meshRef.current.rotation.y += delta * 0.25;
      
      // Eliminamos la línea: meshRef.current.rotation.x += delta * 0.1;
      // Esto detiene el "volteo" de la esfera.
    }
  });

  return (
    <group scale={1.8} position={[0, -0.2, 0]}>
      {/* Iluminación Neon Cían para la estética Cyberpunk */}
      <pointLight position={[2, 2, 2]} color="#0284c7" intensity={2} />
      
      {/* Mantenemos el rotation=[0.2, 0, 0] inicial para alinear 
          con la perspectiva isométrica del tablero, pero el giro dinámico es solo en Y */}
      <mesh ref={meshRef} rotation={[0.2, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#0284c7"
          wireframe={true}
          emissive="#10b981"
          emissiveIntensity={1.5}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}