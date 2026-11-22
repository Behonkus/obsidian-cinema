import { AlertTriangle, FolderX, ExternalLink, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { HelpLink } from "@/components/HelpLink";

const REASONS = {
  EPERM: "Access denied — Windows won't let apps open this folder",
  EACCES: "Access denied — Windows won't let apps open this folder",
  ENOENT: "Not found — the folder was moved, renamed or the drive isn't connected",
  ENOTDIR: "Not a folder any more",
  EBUSY: "Busy — another program is using it",
  EIO: "Read error — the drive or network connection had a problem",
  ETIMEDOUT: "Timed out — the network drive didn't respond",
  EHOSTUNREACH: "Network drive not reachable",
};
const reasonOf = (i) => REASONS[i.code] || (i.root ? "Couldn't be opened — is the drive connected?" : "Couldn't be read");

const IssueRow = ({ i, onSkip }) => (
  <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-1" data-testid="scan-issue-row">
    <div className="flex items-start gap-2 min-w-0">
      {i.root ? <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <FolderX className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
      <p className="font-mono text-xs break-all flex-1" data-testid="scan-issue-path">{i.path}</p>
      {window.electronAPI?.showItemInFolder && (
        <button type="button" onClick={() => window.electronAPI.showItemInFolder(i.path)} className="text-[11px] text-muted-foreground hover:text-primary shrink-0 flex items-center gap-1" data-testid="scan-issue-show">
          <ExternalLink className="w-3 h-3" /> Show
        </button>
      )}
    </div>
    <p className="text-xs text-muted-foreground pl-6">{reasonOf(i)}</p>
    <div className="flex items-center justify-between gap-2 pl-6">
      <p className="text-[11px] text-muted-foreground/80">{i.kept ? `${i.kept} ${i.kept === 1 ? 'file' : 'files'} from here kept in your library` : 'No library titles inside — safe to ignore if it holds no media'}</p>
      {!i.root && (
        <button type="button" onClick={() => onSkip(i.path)} className="text-[11px] text-amber-300 hover:text-amber-200 shrink-0 underline-offset-2 hover:underline" title="Never scan this folder again (undo in Manage Directories)" data-testid="scan-issue-skip">
          Always skip this folder
        </button>
      )}
    </div>
  </div>
);

// Lists the folders the last Update Library couldn't open, with the reason for each
export const ScanIssuesDialog = ({ open, onClose, issues, onDismiss, onSkip }) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-w-xl max-h-[85vh] flex flex-col" data-testid="scan-issues-dialog">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" /> Folders Update Library couldn't open <HelpLink chapter="troubleshooting" label="Troubleshooting" /></DialogTitle>
        <DialogDescription>Your drives can be connected and still have folders Windows won't let apps read. Nothing was removed from your library because of these.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2 overflow-y-auto min-h-0 pr-1">
        {issues.length === 0 && <p className="text-sm text-muted-foreground text-center py-6" data-testid="scan-issues-empty">All sorted — nothing left to look at.</p>}
        {issues.map(i => <IssueRow key={i.path} i={i} onSkip={onSkip} />)}
      </div>
      <div className="text-xs text-muted-foreground space-y-1 border-t border-border/50 pt-3">
        <p><b className="text-foreground">Access denied:</b> if the folder holds media, right-click it in Windows Explorer › Properties › Security and give your user account Read access. Otherwise it's safe to ignore.</p>
        <p><b className="text-foreground">Always skip:</b> stops scanning a folder you don't need, so it never shows here again. Undo it in Manage Directories.</p>
        <p><b className="text-foreground">Not found / not reachable:</b> connect the drive or wake your NAS, then run Update Library again.</p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDismiss} data-testid="scan-issues-dismiss">Dismiss</Button>
        <Button onClick={onClose} data-testid="scan-issues-close">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
