import { useEffect, useRef, useState } from "react";

export const EFFECTS_KEY = 'obsidian_cinema_effects';
export const LITE_THRESHOLD = 3000;

export const getEffectsPref = () => localStorage.getItem(EFFECTS_KEY) || 'auto';
export const setEffectsPref = (v) => localStorage.setItem(EFFECTS_KEY, v);

export const GLOW_KEY = 'obsidian_cinema_glow';
export const GLOW_DEFAULT = 50;
export const getGlowPref = () => { const v = Number(localStorage.getItem(GLOW_KEY)); return localStorage.getItem(GLOW_KEY) === null || Number.isNaN(v) ? GLOW_DEFAULT : v; };
export const setGlowPref = (v) => localStorage.setItem(GLOW_KEY, String(v));
// 0 = off, 50 = soft, 100 = vivid (1.5x the 1.7.4 glow)
export const glowFactor = (v) => (v / 100) * 1.5;

// 'full' or 'lite'; auto turns effects down on big libraries
export function useEffectsLevel(count) {
  const [pref] = useState(getEffectsPref);
  const latched = useRef(null);
  if (pref === 'full' || pref === 'lite') return pref;
  // Decide once per visit so cards don't switch style mid-scan
  if (!latched.current && count > 0) latched.current = count > LITE_THRESHOLD ? 'lite' : 'full';
  return latched.current || 'full';
}

// Animates from the previous value to the new one
export function useCountUp(value, enabled, ms = 700) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (!enabled) { setShown(value); from.current = value; return undefined; }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (value - a) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, enabled, ms]);
  return shown;
}
