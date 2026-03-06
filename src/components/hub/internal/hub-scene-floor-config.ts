// src/components/hub/internal/hub-scene-floor-config.ts - Configuración visual centralizada del suelo 3D del Hub.
export interface IHubSceneFloorConfig {
  planeSize: number;
  planeColor: string;
  blur: [number, number];
  reflectionResolution: number;
  reflectionStrength: number;
  roughness: number;
  metalness: number;
  gridSize: number;
  gridDivisions: number;
  gridPrimaryColor: string;
  gridSecondaryColor: string;
}

export const HUB_SCENE_FLOOR_CONFIG: IHubSceneFloorConfig = {
  planeSize: 112,
  planeColor: "#10233a",
  blur: [220, 56],
  reflectionResolution: 512,
  reflectionStrength: 22,
  roughness: 0.2,
  metalness: 0.7,
  gridSize: 108,
  gridDivisions: 90,
  gridPrimaryColor: "#1a4b65",
  gridSecondaryColor: "#14364c",
};
