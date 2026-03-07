// src/components/hub/internal/hub-camera-path.test.ts - Valida que la trayectoria curva de cámara respeta origen/destino y eleva el arco.
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { sampleHubCameraArc } from "@/components/hub/internal/hub-camera-path";

describe("hub-camera-path", () => {
  it("mantiene exactamente origen y destino en los extremos", () => {
    const from = new THREE.Vector3(0, 10, 20);
    const to = new THREE.Vector3(4, 8, 12);
    const start = sampleHubCameraArc(from, to, 0);
    const end = sampleHubCameraArc(from, to, 1);
    expect(start.x).toBeCloseTo(from.x, 6);
    expect(start.y).toBeCloseTo(from.y, 6);
    expect(start.z).toBeCloseTo(from.z, 6);
    expect(end.x).toBeCloseTo(to.x, 6);
    expect(end.y).toBeCloseTo(to.y, 6);
    expect(end.z).toBeCloseTo(to.z, 6);
  });

  it("eleva el punto medio para crear sensación cinematográfica", () => {
    const from = new THREE.Vector3(-6, 7, 10);
    const to = new THREE.Vector3(6, 7, 0);
    const mid = sampleHubCameraArc(from, to, 0.5);
    expect(mid.y).toBeGreaterThan(from.y);
    expect(mid.y).toBeGreaterThan(to.y);
  });
});
