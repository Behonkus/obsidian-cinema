import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { getEffectsPref, setEffectsPref, LITE_THRESHOLD, getGlowPref, setGlowPref } from "@/lib/effects";

const OPTIONS = [
  { id: 'auto', label: 'Auto', hint: `Full effects, lighter above ${LITE_THRESHOLD.toLocaleString()} titles` },
  { id: 'full', label: 'Full', hint: 'Always show tilt, glow and entrance animations' },
  { id: 'lite', label: 'Lite', hint: 'Simple hover only, smoothest on older PCs' },
];

const glowLabel = (v) => (v === 0 ? 'Off' : v < 35 ? 'Subtle' : v < 70 ? 'Soft' : 'Vivid');

const GlowSlider = () => {
  const [glow, setGlow] = useState(getGlowPref);
  const change = ([v]) => { setGlow(v); setGlowPref(v); };
  return (
    <div className="pt-2 space-y-2" data-testid="glow-setting">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">Poster glow</span>
        <span className="text-muted-foreground" data-testid="glow-value">{glowLabel(glow)} · {glow}%</span>
      </div>
      <Slider value={[glow]} onValueChange={change} min={0} max={100} step={5} className="max-w-xs" data-testid="glow-slider" aria-label="Poster glow strength" />
      <div className="flex justify-between max-w-xs text-[10px] text-muted-foreground"><span>Off</span><span>Subtle</span><span>Vivid</span></div>
      <p className="text-[11px] text-muted-foreground">How strongly the background takes on the colours of the poster you hover.</p>
    </div>
  );
};

export const EffectsSetting = () => {
  const [pref, setPref] = useState(getEffectsPref);
  const pick = (id) => { setEffectsPref(id); setPref(id); };
  const hint = OPTIONS.find(o => o.id === pref).hint;
  return (
    <Card className="bg-card border-border" data-testid="effects-setting-card">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Library Visual Effects
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <div className="inline-flex rounded-full border border-border p-0.5 bg-secondary/40">
          {OPTIONS.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o.id)}
              className={'px-4 h-7 rounded-full text-xs font-medium transition-colors ' + (pref === o.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              data-testid={`effects-option-${o.id}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground" data-testid="effects-hint">{hint}</p>
        <GlowSlider />
      </CardContent>
    </Card>
  );
};
