// src/components/hub/home/layout/HomeResponsiveWorkspace.tsx - Router visual que delega layouts de Arsenal por breakpoint.
"use client";

import { HomeDesktopWorkspace } from "@/components/hub/home/layout/HomeDesktopWorkspace";
import { HomeMobileWorkspace } from "@/components/hub/home/layout/HomeMobileWorkspace";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";

export function HomeResponsiveWorkspace(props: IHomeWorkspaceProps) {
  return (
    <>
      <HomeDesktopWorkspace {...props} />
      <HomeMobileWorkspace {...props} />
    </>
  );
}
