import { glowFactor } from "@/lib/effects";

const RGB = [236, 72, 153];

// Made-up sample poster that glows at the chosen strength
export const GlowPreview = ({ glow }) => (
  <div className="relative w-36 h-36 shrink-0 rounded-xl overflow-hidden border border-border bg-background flex items-center justify-center" data-testid="glow-preview">
    <div
      aria-hidden="true"
      className="oc-backdrop absolute inset-0"
      style={{ '--oc-r': RGB[0], '--oc-g': RGB[1], '--oc-b': RGB[2], '--oc-k': glowFactor(glow) * 1.6, opacity: glow > 0 ? 1 : 0 }}
      data-testid="glow-preview-wash"
    />
    <div
      className="relative w-16 h-24 rounded-md overflow-hidden shadow-lg"
      style={{
        background: 'linear-gradient(160deg, #f472b6 0%, #db2777 35%, #7c3aed 70%, #1e1b4b 100%)',
        boxShadow: glow > 0 ? `0 0 ${10 + glow * 0.3}px rgb(236 72 153 / ${glowFactor(glow) * 0.5})` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
      data-testid="glow-preview-poster"
    >
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full" style={{ background: 'radial-gradient(circle, #fde68a, #f97316 70%)' }} />
      <div className="absolute bottom-0 inset-x-0 h-8" style={{ background: 'linear-gradient(0deg, #0f172a, transparent)' }} />
      <p className="absolute bottom-1.5 inset-x-0 text-center text-[7px] font-bold tracking-[0.2em] text-white">NEON TIDE</p>
    </div>
  </div>
);
