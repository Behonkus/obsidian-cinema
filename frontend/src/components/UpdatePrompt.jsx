import { useEffect, useState } from "react";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ReleaseHighlights } from "./ReleaseHighlights";
import { fetchChangelog, notesToList, releasesBetween } from "@/lib/changelog";

const DISMISS_KEY = "obsidian_cinema_update_prompt_dismissed";
let startupChecked = false;

const isElectron = () => typeof window !== "undefined" && window.electronAPI?.isElectron?.();

const buildReleases = async (current, info) => {
  const fromServer = releasesBetween(await fetchChangelog(), current, info.version);
  if (fromServer.length) return fromServer;
  const notes = notesToList(info.releaseNotes);
  return [{ version: info.version, highlights: notes.length ? notes : ["Bug fixes and improvements"] }];
};

export default function UpdatePrompt() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [current, setCurrent] = useState("");
  const [releases, setReleases] = useState([]);
  const [phase, setPhase] = useState("available");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isElectron()) return;
    const api = window.electronAPI;
    api.getAppVersion().then(setCurrent);
    const show = (data) => {
      setInfo(data);
      if (sessionStorage.getItem(DISMISS_KEY) !== data.version) setOpen(true);
    };
    const unsubscribe = api.onUpdateStatus(({ status, data }) => {
      if (status === "available" && data) { setPhase("available"); show(data); }
      else if (status === "downloading") { setPhase("downloading"); setProgress(data?.percent || 0); }
      else if (status === "downloaded") setPhase("downloaded");
    });
    api.getUpdateStatus().then((s) => {
      if (!s?.updateAvailable) return;
      setPhase(s.isDownloaded ? "downloaded" : s.isDownloading ? "downloading" : "available");
      setProgress(s.downloadProgress || 0);
      show(s.updateAvailable);
    });
    if (!startupChecked) {
      startupChecked = true;
      setTimeout(() => api.checkForUpdates().catch(() => {}), 5000);
    }
    return () => typeof unsubscribe === "function" && unsubscribe();
  }, []);

  useEffect(() => {
    if (info && current) buildReleases(current, info).then(setReleases);
  }, [info, current]);

  const later = () => {
    if (info) sessionStorage.setItem(DISMISS_KEY, info.version);
    setOpen(false);
  };

  if (!info) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : later())}>
      <DialogContent className="sm:max-w-lg" data-testid="update-prompt-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="update-prompt-title">
            <Sparkles className="w-5 h-5 text-primary" /> A new version is available
          </DialogTitle>
          <DialogDescription data-testid="update-prompt-versions">
            v{info.version} is ready{current ? ` — you're on v${current}` : ""}. Here's what's new:
          </DialogDescription>
        </DialogHeader>
        <ReleaseHighlights releases={releases} testId="update-prompt-highlights" />
        {phase === "downloading" && (
          <div className="space-y-1" data-testid="update-prompt-progress">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={later} data-testid="update-prompt-later-btn">Later</Button>
          {phase === "available" && (
            <Button onClick={() => { setPhase("downloading"); window.electronAPI.downloadUpdate(); }} data-testid="update-prompt-download-btn">
              <Download className="w-4 h-4 mr-2" /> Download update
            </Button>
          )}
          {phase === "downloading" && (
            <Button disabled data-testid="update-prompt-downloading-btn">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Downloading…
            </Button>
          )}
          {phase === "downloaded" && (
            <Button onClick={() => window.electronAPI.installUpdate()} data-testid="update-prompt-install-btn">
              <RefreshCw className="w-4 h-4 mr-2" /> Restart & update
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
