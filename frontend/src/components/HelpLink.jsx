import { HelpCircle } from "lucide-react";
import { openUserGuide } from "@/lib/userGuide";

// Small "?" that opens the User Guide at the matching chapter
export const HelpLink = ({ chapter, label = "Help", className = "" }) => (
  <button
    type="button"
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openUserGuide(chapter); }}
    className={'inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors align-middle ' + className}
    title={label + ' — open the User Guide'}
    aria-label={label + ' — open the User Guide'}
    data-testid={`help-${chapter}`}
  >
    <HelpCircle className="w-3.5 h-3.5" />
  </button>
);
