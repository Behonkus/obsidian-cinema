import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEffectsPref, setEffectsPref, LITE_THRESHOLD } from "@/lib/effects";

const OPTIONS = [
  { id: 'auto', label: 'Auto', hint: `Full effects, lighter above ${LITE_THRESHOLD.toLocaleString()} titles` },
  { id: 'full', label: 'Full', hint: 'Always show tilt, glow and entrance animations' },
  { id: 'lite', label: 'Lite', hint: 'Simple hover only, smoothest on older PCs' },
];

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
      </CardContent>
    </Card>
  );
};
