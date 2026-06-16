// src/components/hub/internal/hub-node-base-materials.ts - Materiales compartidos de la base de los nodos 3D del hub.
import * as THREE from "three";

export function createNodeBaseMaterials(baseColor: string) {
  return {
    circle: new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.03, depthWrite: false }),
    outerRing: new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.4, depthWrite: false }),
    innerRing: new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.15, wireframe: true, depthWrite: false }),
    spoke: new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.6, depthWrite: false }),
  };
}
