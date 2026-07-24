import { useState } from "react";

export function InvalidConditionalHook({ enabled }: { enabled: boolean }) {
  if (enabled) {
    useState(0);
  }
  return null;
}
