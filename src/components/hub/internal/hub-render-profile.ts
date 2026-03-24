// src/components/hub/internal/hub-render-profile.ts - Perfil adaptativo de render para equilibrar calidad y rendimiento según viewport.
import { IHubSceneFloorConfig } from "@/components/hub/internal/hub-scene-floor-config";

export interface IHubRenderProfile {
  dpr: [number, number];
  floorBlur: [number, number];
  floorReflectionResolution: number;
  floorReflectionStrength: number;
  gridDivisions: number;
}

export interface IHubRenderCapabilityInput {
  prefersReducedMotion?: boolean;
  isConstrainedDevice?: boolean;
}

const MOBILE_PROFILE: IHubRenderProfile = {
  dpr: [1, 1.2],
  floorBlur: [120, 28],
  floorReflectionResolution: 256,
  floorReflectionStrength: 14,
  gridDivisions: 64,
};

const DESKTOP_CONSTRAINED_PROFILE: IHubRenderProfile = {
  dpr: [1, 1.2],
  floorBlur: [160, 36],
  floorReflectionResolution: 256,
  floorReflectionStrength: 16,
  gridDivisions: 72,
};

const DESKTOP_PROFILE: IHubRenderProfile = {
  dpr: [1, 1.5],
  floorBlur: [220, 56],
  floorReflectionResolution: 512,
  floorReflectionStrength: 22,
  gridDivisions: 90,
};

export function resolveHubRenderProfile(
  viewportWidth: number,
  capability: IHubRenderCapabilityInput = {},
): IHubRenderProfile {
  if (viewportWidth < 640) return MOBILE_PROFILE;
  if (capability.prefersReducedMotion || capability.isConstrainedDevice) return DESKTOP_CONSTRAINED_PROFILE;
  return DESKTOP_PROFILE;
}

export function resolveFloorConfigForProfile(
  baseConfig: IHubSceneFloorConfig,
  profile: IHubRenderProfile,
): IHubSceneFloorConfig {
  return {
    ...baseConfig,
    blur: profile.floorBlur,
    reflectionResolution: profile.floorReflectionResolution,
    reflectionStrength: profile.floorReflectionStrength,
    gridDivisions: profile.gridDivisions,
  };
}
