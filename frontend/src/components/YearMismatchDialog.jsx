import { useState } from "react";
import { AlertTriangle, FileEdit, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Review file names whose year differs from the found release year, and rename the ticked ones
export const YearMismatchDialog = ({ items, onClose, onRename, onIgnore, ignoredCount, onResetIgnored }) => {
  // Everything is ticked unless the user unticks it (survives items being removed from the list)
  const [unticked, setUnticked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  if (!items || items.length === 0) return null;
  const picked = new Set(items.filter(i => !unticked.has(i.id)).map(i => i.id));
  const toggle = (id) => setUnticked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const run = async () => {
    setBusy(true);
    await onRename(items.filter(i => picked.has(i.id)));
    setBusy(false);
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
      <DialogContent className="max-w-2xl" data-testid="year-mismatch-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileEdit className="w-4 h-4 text-primary" /> File names with a different year</DialogTitle>
          <DialogDescription>{items.length} {items.length === 1 ? 'file name has' : 'file names have'} a year that differs from the release year found online.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 p-3 rounded-md border border-amber-500/40 bg-amber-500/10 text-xs" data-testid="year-mismatch-notice">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>Renaming <strong>WILL change the file names on your disk</strong> — only the year in each name is replaced. It does not harm, move or delete the files, and your library keeps each title's metadata (no new lookup needed).</p>
        </div>
        <div className="max-h-[45vh] overflow-y-auto space-y-1 pr-1" data-testid="year-mismatch-list">
          {items.map((i, idx) => (
            <label key={i.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer" data-testid={'year-mismatch-' + idx}>
              <Checkbox checked={picked.has(i.id)} onCheckedChange={() => toggle(i.id)} className="mt-0.5" data-testid={'year-mismatch-check-' + idx} />
              <div className="min-w-0 flex-1 text-xs">
                <p className="text-sm font-medium truncate">{i.title} <span className="text-muted-foreground">· file {i.fileYear} → found {i.foundYear}</span></p>
                <p className="text-muted-foreground truncate line-through">{i.file_name}</p>
                <p className="text-foreground truncate">{i.newName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive shrink-0"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIgnore(i); }}
                title="Remove from this list and never suggest renaming this file again"
                data-testid={'year-mismatch-ignore-' + idx}
              >
                <Ban className="w-3 h-3 mr-1" /> Never rename
              </Button>
            </label>
          ))}
        </div>
        <DialogFooter className="sm:items-center">
          {ignoredCount > 0 && (
            <button type="button" onClick={onResetIgnored} className="mr-auto text-[11px] text-muted-foreground hover:text-foreground underline" data-testid="year-mismatch-reset-ignored">
              {ignoredCount} {ignoredCount === 1 ? 'file is' : 'files are'} set to never rename · Allow again
            </button>
          )}
          <Button variant="outline" onClick={onClose} disabled={busy} data-testid="year-mismatch-later">Not now</Button>
          <Button onClick={run} disabled={busy || picked.size === 0} data-testid="year-mismatch-rename">
            {busy ? 'Renaming…' : 'Rename ' + picked.size + (picked.size === 1 ? ' file' : ' files')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
