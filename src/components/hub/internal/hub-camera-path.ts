// src/components/hub/internal/hub-camera-path.ts - Calcula una trayectoria curva para movimientos de cámara del Hub.
import * as THREE from "three";

function createControlPoint(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
  const midpoint = from.clone().add(to).multiplyScalar(0.5);
  const travel = to.clone().sub(from);
  const planarDistance = Math.hypot(travel.x, travel.z);
  const lift = Math.min(2.4, Math.max(0.65, planarDistance * 0.08));
  const lateral = Math.min(1.4, Math.max(0.2, planarDistance * 0.04));
  const planarDir = new THREE.Vector3(travel.x, 0, travel.z);
  if (planarDir.lengthSq() < 0.0001) return midpoint.add(new THREE.Vector3(0, lift, 0));
  planarDir.normalize();
  const perpendicular = new THREE.Vector3(-planarDir.z, 0, planarDir.x).multiplyScalar(lateral);
  return midpoint.add(perpendicular).add(new THREE.Vector3(0, lift, 0));
}

export function sampleHubCameraArc(from: THREE.Vector3, to: THREE.Vector3, progress: number): THREE.Vector3 {
  const t = Math.min(1, Math.max(0, progress));
  const control = createControlPoint(from, to);
  const p0 = from.clone().multiplyScalar((1 - t) * (1 - t));
  const p1 = control.multiplyScalar(2 * (1 - t) * t);
  const p2 = to.clone().multiplyScalar(t * t);
  return p0.add(p1).add(p2);
}
