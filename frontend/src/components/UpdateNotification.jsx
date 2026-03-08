import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, X, Sparkles, ArrowDownToLine, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

export default function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateData, setUpdateData] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');

  useEffect(() => {
    if (!isElectron()) return;

    // Get current version
    window.electronAPI.getAppVersion().then(version => {
      setCurrentVersion(version);
    });

    // Listen for update status changes
    window.electronAPI.onUpdateStatus(({ status, data }) => {
      setUpdateStatus(status);
      
      if (status === 'available') {
        setUpdateData(data);
        setDismissed(false); // Show notification when update is available
      } else if (status === 'downloading' && data) {
        setDownloadProgress(data.percent || 0);
      } else if (status === 'downloaded') {
        setUpdateData(data);
      }
    });

    // Check initial status
    window.electronAPI.getUpdateStatus().then(status => {
      if (status.updateAvailable) {
        setUpdateData(status.updateAvailable);
        setUpdateStatus('available');
      }
      if (status.isDownloading) {
        setUpdateStatus('downloading');
        setDownloadProgress(status.downloadProgress);
      }
    });

    return () => {
      if (isElectron()) {
        window.electronAPI.removeUpdateListener();
      }
    };
  }, []);

  const handleDownload = useCallback(async () => {
    if (!isElectron()) return;
    setUpdateStatus('downloading');
    await window.electronAPI.downloadUpdate();
  }, []);

  const handleInstall = useCallback(async () => {
    if (!isElectron()) return;
    window.electronAPI.installUpdate();
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    if (!isElectron()) return;
    setUpdateStatus('checking');
    await window.electronAPI.checkForUpdates();
  }, []);

  // Don't render if not in Electron or dismissed
  if (!isElectron() || dismissed) return null;

  // Don't show for non-actionable states
  if (!updateStatus || updateStatus === 'not-available' || updateStatus === 'dev-mode') {
    return null;
  }

  return (
    <AnimatePresence>
      {(updateStatus === 'available' || updateStatus === 'downloading' || updateStatus === 'downloaded') && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-sm">Update Available</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {updateStatus === 'available' && updateData && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">New version:</span>{' '}
                      <span className="font-medium text-purple-400">v{updateData.version}</span>
                    </p>
                    {currentVersion && (
                      <p className="text-xs text-muted-foreground">
                        Current: v{currentVersion}
                      </p>
                    )}
                  </div>
                  
                  {updateData.releaseNotes && (
                    <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg max-h-20 overflow-y-auto">
                      {typeof updateData.releaseNotes === 'string' 
                        ? updateData.releaseNotes.substring(0, 200)
                        : 'Bug fixes and improvements'}
                    </div>
                  )}

                  <Button 
                    onClick={handleDownload}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Update
                  </Button>
                </>
              )}

              {updateStatus === 'downloading' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Downloading...</span>
                      <span className="font-medium">{Math.round(downloadProgress)}%</span>
                    </div>
                    <Progress value={downloadProgress} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Please wait while the update downloads
                  </p>
                </>
              )}

              {updateStatus === 'downloaded' && (
                <>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Update Ready!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Restart the app to apply the update.
                  </p>
                  <Button 
                    onClick={handleInstall}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart & Update
                  </Button>
                </>
              )}

              {updateStatus === 'checking' && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Checking for updates...</span>
                </div>
              )}

              {updateStatus === 'error' && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">
                    Failed to check for updates
                  </p>
                  <Button 
                    onClick={handleCheckForUpdates}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            {updateStatus === 'available' && (
              <div className="px-4 py-2 bg-secondary/20 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  You can continue using the app while downloading
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
