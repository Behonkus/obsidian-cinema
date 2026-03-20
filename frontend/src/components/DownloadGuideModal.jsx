import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FolderOpen, MousePointer, Shield, CheckCircle2, X } from "lucide-react";

export function DownloadGuideModal({ open, onClose, onDownload }) {
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const handleDownload = () => {
    setDownloading(true);
    onDownload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="download-guide-modal">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {downloading ? "Download Started!" : "Download Obsidian Cinema"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {downloading
                ? "Your installer is downloading now. Here's how to install it:"
                : "One-click installer for Windows 10/11"
              }
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 -mr-2 -mt-2" data-testid="close-download-guide">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!downloading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Direct .exe Installer</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No extraction needed — just download, double-click, and follow the setup wizard.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white gap-2"
              onClick={handleDownload}
              data-testid="download-start-btn"
            >
              <Download className="w-5 h-5" />
              Download Installer (.exe)
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Windows 10/11 required · ~85 MB
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            <Step
              number="1"
              icon={FolderOpen}
              title="Find the downloaded file"
              desc="Check your Downloads folder (usually C:\Users\You\Downloads). The file is named Obsidian-Cinema-Setup.exe"
              active
            />
            <Step
              number="2"
              icon={MousePointer}
              title="Double-click to install"
              desc="Double-click the .exe file. If Windows shows a SmartScreen warning, click 'More info' then 'Run anyway' — the app is safe."
            />
            <Step
              number="3"
              icon={Shield}
              title="Follow the setup wizard"
              desc="Click 'Install' and wait a few seconds. The app will launch automatically when done."
            />
            <Step
              number="4"
              icon={CheckCircle2}
              title="You're all set!"
              desc="Obsidian Cinema will appear on your desktop and Start menu. Open it and add your movie folders to get started."
              last
            />
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={onClose} data-testid="download-guide-done-btn">
                Got it
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ number, icon: Icon, title, desc, active, last }) {
  return (
    <div className="flex items-start gap-3" data-testid={'download-step-' + number}>
      <div className="flex flex-col items-center">
        <div className={
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold " +
          (active
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground"
          )
        }>
          {number}
        </div>
        {!last && <div className="w-px h-6 bg-border mt-1" />}
      </div>
      <div className="pb-2">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" /> {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
