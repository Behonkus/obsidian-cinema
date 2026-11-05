import { Check } from "lucide-react";

export const ReleaseHighlights = ({ releases, testId }) => (
  <div className="max-h-72 overflow-y-auto space-y-4 pr-1" data-testid={testId}>
    {releases.map((r) => (
      <div key={r.version}>
        {releases.length > 1 && (
          <p className="text-xs font-semibold text-muted-foreground mb-2">v{r.version}</p>
        )}
        <ul className="space-y-2">
          {r.highlights.map((h, i) => (
            <li key={i} className="flex gap-2 text-sm leading-snug">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);
