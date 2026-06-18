"use client";

import { DuckCommandStrip, useDuckViewport } from "@/components/soledash/duck-command-strip";
import { GuillotineSurface } from "@/components/soledash/guillotine-surface";
import type { ComponentProps } from "react";

type SharedProps = ComponentProps<typeof GuillotineSurface> & {
  frontierCode: string;
  frontierTitle: string;
};

export function SoleDashHome(props: SharedProps) {
  const duck = useDuckViewport();
  const { frontierCode, frontierTitle, ...guillotineProps } = props;

  if (duck) {
    return (
      <div className="mw-shell sd-duck-shell">
        <DuckCommandStrip
          {...guillotineProps}
          frontierCode={frontierCode}
          frontierTitle={frontierTitle}
        />
      </div>
    );
  }

  return (
    <div className="mw-shell sd-guillotine-shell">
      <GuillotineSurface {...guillotineProps} />
    </div>
  );
}
