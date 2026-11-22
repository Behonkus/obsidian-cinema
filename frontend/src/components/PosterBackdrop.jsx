import { useState } from "react";
import { getGlowPref, glowFactor } from "@/lib/effects";

// Soft colour wash behind the library, tinted by the hovered poster
export const PosterBackdrop = ({ rgb }) => {
  const [glow] = useState(getGlowPref);
  const on = rgb && glow > 0;
  return (
    <div
      aria-hidden="true"
      className="oc-backdrop fixed inset-0 -z-10 pointer-events-none"
      style={on ? { '--oc-r': rgb[0], '--oc-g': rgb[1], '--oc-b': rgb[2], '--oc-k': glowFactor(glow), opacity: 1 } : { opacity: 0 }}
      data-testid="poster-backdrop"
      data-rgb={on ? rgb.join(',') : ''}
      data-glow={glow}
    />
  );
};
