import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DIR_CATEGORIES } from "@/components/DirectoryDropdowns";

// Four type pills: Movies / TV Shows / Documentaries / Animations
export const ImportTypePicker = ({ value, onChange, testPrefix = "import-type" }) => (
  <div className="space-y-1.5" data-testid={testPrefix + "-picker"}>
    <p className="text-xs text-muted-foreground">What's in here? <span className="text-primary">*</span></p>
    <div className="flex flex-wrap gap-2">
      {DIR_CATEGORIES.map(cat => {
        const Icon = cat.icon;
        return (
          <Button
            key={cat.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(cat.id)}
            className={"h-8 rounded-full px-3 gap-1.5 bg-transparent transition-colors " + (value === cat.id ? cat.active : cat.cls)}
            data-testid={testPrefix + "-" + cat.id}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat.label}
          </Button>
        );
      })}
    </div>
    <p className="text-[10px] text-muted-foreground/70">TV Shows, Documentaries and Animations group each show folder into one card.</p>
  </div>
);

// Asks the type before picking individual files (or for files dropped on the library)
export const ImportTypeDialog = ({ open, onOpenChange, onPick, dropCount }) => {
  const [type, setType] = useState(null);
  const close = (o) => { if (!o) setType(null); onOpenChange(o); };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md" data-testid="files-type-dialog">
        <DialogHeader>
          <DialogTitle>Add files as…</DialogTitle>
          <DialogDescription>{dropCount ? `Choose the type for the ${dropCount} dropped ${dropCount === 1 ? 'item' : 'items'}.` : "Choose the type for the files you're about to pick."}</DialogDescription>
        </DialogHeader>
        <ImportTypePicker value={type} onChange={setType} testPrefix="files-type" />
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} data-testid="files-type-cancel">Cancel</Button>
          <Button disabled={!type} onClick={() => { const t = type; close(false); onPick(t); }} data-testid="files-type-continue">{dropCount ? 'Add to library' : 'Choose files'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
