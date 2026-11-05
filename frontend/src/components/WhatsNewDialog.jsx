import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { ReleaseHighlights } from "./ReleaseHighlights";
import { fetchChangelog, releasesBetween } from "@/lib/changelog";
import packageJson from "../../package.json";

const SEEN_KEY = "obsidian_cinema_last_seen_version";
const CURRENT = packageJson.version;
// Captured at load, before the EULA screen overwrites its key with the new version
const PREVIOUS = localStorage.getItem(SEEN_KEY) || localStorage.getItem("obsidian_cinema_eula_accepted");

export default function WhatsNewDialog() {
  const [open, setOpen] = useState(false);
  const [releases, setReleases] = useState([]);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) === CURRENT) return;
    if (!PREVIOUS) { localStorage.setItem(SEEN_KEY, CURRENT); return; }
    fetchChangelog().then((all) => {
      const list = releasesBetween(all, PREVIOUS, CURRENT);
      setReleases(list.length ? list : [{ version: CURRENT, highlights: ["Bug fixes and improvements"] }]);
      setOpen(true);
    });
  }, []);

  const close = () => {
    localStorage.setItem(SEEN_KEY, CURRENT);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-lg" data-testid="whats-new-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="whats-new-title">
            <PartyPopper className="w-5 h-5 text-primary" /> What's new in v{CURRENT}
          </DialogTitle>
          <DialogDescription>You've been updated. Here's what changed:</DialogDescription>
        </DialogHeader>
        <ReleaseHighlights releases={releases} testId="whats-new-highlights" />
        <DialogFooter>
          <Button onClick={close} data-testid="whats-new-close-btn">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
