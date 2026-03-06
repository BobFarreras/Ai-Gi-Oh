// src/components/hub/HubSceneCameraControls.tsx - Encapsula OrbitControls y permite recolar cámara con una señal externa.
"use client";

import { type ElementRef, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { HUB_CAMERA_DEFAULT_POSITION, HUB_CAMERA_DEFAULT_TARGET } from "@/components/hub/internal/hub-camera-config";

interface HubSceneCameraControlsProps {
  resetSignal: number;
  desiredPosition?: [number, number, number];
  desiredTarget?: [number, number, number];
}

const CAMERA_RESET_DURATION_SECONDS = 0.45;
type OrbitControlsRef = ElementRef<typeof OrbitControls>;

interface ICameraResetAnimationState {
  active: boolean;
  elapsed: number;
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
}

function easeOutCubic(t: number): number {
  const inverse = 1 - t;
  return 1 - inverse * inverse * inverse;
}

export function HubSceneCameraControls({
  resetSignal,
  desiredPosition = HUB_CAMERA_DEFAULT_POSITION,
  desiredTarget = HUB_CAMERA_DEFAULT_TARGET,
}: HubSceneCameraControlsProps) {
  const controlsRef = useRef<OrbitControlsRef | null>(null);
  const animationStateRef = useRef<ICameraResetAnimationState>({
    active: false,
    elapsed: 0,
    fromPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toPosition: new THREE.Vector3(...desiredPosition),
    toTarget: new THREE.Vector3(...desiredTarget),
  });
  const nextPositionRef = useRef(new THREE.Vector3());
  const nextTargetRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    animationStateRef.current = {
      ...animationStateRef.current,
      active: true,
      elapsed: 0,
      fromPosition: controls.object.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition: new THREE.Vector3(...desiredPosition),
      toTarget: new THREE.Vector3(...desiredTarget),
    };
  }, [desiredPosition, desiredTarget, resetSignal]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const animation = animationStateRef.current;
    if (!animation.active) return;

    animation.elapsed = Math.min(animation.elapsed + delta, CAMERA_RESET_DURATION_SECONDS);
    const progress = animation.elapsed / CAMERA_RESET_DURATION_SECONDS;
    const easedProgress = easeOutCubic(progress);
    nextPositionRef.current.lerpVectors(animation.fromPosition, animation.toPosition, easedProgress);
    nextTargetRef.current.lerpVectors(animation.fromTarget, animation.toTarget, easedProgress);
    controls.object.position.copy(nextPositionRef.current);
    controls.target.copy(nextTargetRef.current);
    controls.update();

    if (progress >= 1) {
      animation.active = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      enableRotate
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0}
      maxDistance={40}
      minDistance={10}
    />
  );
}
