// src/components/hub/internal/use-hub-node-navigation.ts - Hook que orquesta navegación de nodos Hub usando la máquina de estado y timers controlados.
"use client";

import { useEffect, useRef, useState } from "react";
import {
  createIdleHubNavigationState,
  IHubNodeNavigationState,
  reduceHubNodeNavigation,
} from "@/components/hub/internal/hub-node-navigation-flow";
import { HUB_NODE_ROUTE_TIMEOUT_MS, HUB_NODE_TARGETING_MS } from "@/components/hub/internal/hub-node-navigation-timings";

interface UseHubNodeNavigationInput {
  router: { push: (href: string) => void };
}

export function useHubNodeNavigation({ router }: UseHubNodeNavigationInput) {
  const [navigationState, setNavigationState] = useState<IHubNodeNavigationState>(createIdleHubNavigationState);
  const transitionTimerRef = useRef<number | null>(null);
  const timeoutTimerRef = useRef<number | null>(null);
  const timeoutResetTimerRef = useRef<number | null>(null);
  const didPushRef = useRef(false);

  useEffect(
    () => () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (timeoutTimerRef.current !== null) window.clearTimeout(timeoutTimerRef.current);
      if (timeoutResetTimerRef.current !== null) window.clearTimeout(timeoutResetTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (navigationState.status !== "targeting") return;
    const targetHref = navigationState.targetHref;
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      setNavigationState((current) => reduceHubNodeNavigation(current, { type: "CAMERA_ARRIVED" }));
      if (!targetHref || didPushRef.current) return;
      didPushRef.current = true;
      if (timeoutTimerRef.current !== null) window.clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = window.setTimeout(() => {
        setNavigationState((current) => reduceHubNodeNavigation(current, { type: "ROUTE_TIMEOUT" }));
        timeoutTimerRef.current = null;
        if (timeoutResetTimerRef.current !== null) window.clearTimeout(timeoutResetTimerRef.current);
        timeoutResetTimerRef.current = window.setTimeout(() => {
          setNavigationState((current) => reduceHubNodeNavigation(current, { type: "RESET" }));
          didPushRef.current = false;
          timeoutResetTimerRef.current = null;
        }, 1500);
      }, HUB_NODE_ROUTE_TIMEOUT_MS);
      router.push(targetHref);
      transitionTimerRef.current = null;
    }, HUB_NODE_TARGETING_MS);
  }, [navigationState.status, navigationState.targetHref, router]);

  const requestNavigation = (nodeId: string, href: string) => {
    if (timeoutResetTimerRef.current !== null) {
      window.clearTimeout(timeoutResetTimerRef.current);
      timeoutResetTimerRef.current = null;
    }
    didPushRef.current = false;
    setNavigationState((current) => reduceHubNodeNavigation(current, { type: "NODE_SELECTED", nodeId, href }));
  };

  return {
    navigationState,
    isNavigationBusy: navigationState.status !== "idle",
    isRouteSlow: navigationState.status === "timeout",
    requestNavigation,
  };
}
