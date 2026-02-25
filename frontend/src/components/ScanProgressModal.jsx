import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  RefreshCw, 
  Check, 
  FolderSearch,
  Film,
  AlertCircle,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ScanProgressModal({ isOpen, onClose, onComplete }) {
  const [status, setStatus] = useState("idle"); // idle, scanning, complete, error
  const [scanId, setScanId] = useState(null);
  const [progress, setProgress] = useState({
    directories_total: 0,
    directories_scanned: 0,
    current_directory: null,
    files_found: 0,
    movies_added: 0,
    skipped_due_to_limit: 0
  });
  const pollIntervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startScan = async () => {
    // Update status immediately
    setStatus("scanning");
    setProgress({
      directories_total: 0,
      directories_scanned: 0,
      current_directory: null,
      files_found: 0,
      movies_added: 0,
      skipped_due_to_limit: 0
    });

    try {
      const response = await axios.post(`${API}/scan/start?recursive=true`, {}, { 
        withCredentials: true 
      });
      
      const newScanId = response.data.scan_id;
      setScanId(newScanId);
      
      // Start polling for progress immediately
      const poll = async () => {
        try {
          const progressResponse = await axios.get(`${API}/scan/progress/${newScanId}`);
          const data = progressResponse.data;
          
          if (data.status === "not_found") {
            return;
          }
          
          setProgress({
            directories_total: data.directories_total || 0,
            directories_scanned: data.directories_scanned || 0,
            current_directory: data.current_directory,
            files_found: data.files_found || 0,
            movies_added: data.movies_added || 0,
            skipped_due_to_limit: data.skipped_due_to_limit || 0
          });
          
          if (data.status === "complete") {
            setStatus("complete");
            if (onComplete) onComplete();
          } else if (data.status === "error") {
            setStatus("error");
          } else {
            // Continue polling
            pollIntervalRef.current = setTimeout(poll, 500);
          }
        } catch (err) {
          console.error("Error polling progress:", err);
          // Continue polling even on error
          pollIntervalRef.current = setTimeout(poll, 500);
        }
      };
      
      // Start first poll immediately
      poll();
      
    } catch (err) {
      console.error("Failed to start scan:", err);
      setStatus("error");
    }
  };

  const pollProgress = async (id) => {
    // This function is now handled inline in startScan
  };
      
      if (data.status === "not_found") {
        return;
      }
      
      setProgress({
        directories_total: data.directories_total || 0,
        directories_scanned: data.directories_scanned || 0,
        current_directory: data.current_directory,
        files_found: data.files_found || 0,
        movies_added: data.movies_added || 0,
        skipped_due_to_limit: data.skipped_due_to_limit || 0
      });
      
      if (data.status === "complete") {
        setStatus("complete");
        clearInterval(pollIntervalRef.current);
        if (onComplete) onComplete();
      } else if (data.status === "error") {
        setStatus("error");
        clearInterval(pollIntervalRef.current);
      }
    } catch (err) {
      console.error("Error polling progress:", err);
    }
  };

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setStatus("idle");
    setScanId(null);
    onClose();
  };

  const progressPercent = progress.directories_total > 0 
    ? Math.round((progress.directories_scanned / progress.directories_total) * 100) 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="scan-progress-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderSearch className="w-5 h-5 text-primary" />
            Scan Directories
          </DialogTitle>
          <DialogDescription>
            Scanning your directories for movie files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === "idle" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FolderSearch className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                Ready to scan all directories for new movies.
              </p>
              <Button onClick={startScan} className="gap-2" data-testid="start-scan-btn">
                <RefreshCw className="w-4 h-4" />
                Start Scan
              </Button>
            </div>
          )}

          {status === "scanning" && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Directories</span>
                  <span className="font-medium">
                    {progress.directories_scanned} / {progress.directories_total}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {progress.current_directory && (
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                    <span className="text-sm truncate">
                      Scanning: {progress.current_directory}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {progress.files_found}
                  </div>
                  <div className="text-xs text-muted-foreground">Files Found</div>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {progress.movies_added}
                  </div>
                  <div className="text-xs text-muted-foreground">Movies Added</div>
                </div>
              </div>

              {progress.skipped_due_to_limit > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>{progress.skipped_due_to_limit} movies skipped (free tier limit)</span>
                  </div>
                </div>
              )}
            </>
          )}

          {status === "complete" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Scan Complete!</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <div className="text-2xl font-bold">{progress.files_found}</div>
                  <div className="text-xs text-muted-foreground">Files Found</div>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <div className="text-2xl font-bold text-green-400">{progress.movies_added}</div>
                  <div className="text-xs text-muted-foreground">New Movies</div>
                </div>
              </div>

              {progress.skipped_due_to_limit > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>{progress.skipped_due_to_limit} movies skipped due to free tier limit</span>
                  </div>
                  <Button 
                    variant="link" 
                    className="text-amber-400 h-auto p-0 mt-1"
                    onClick={() => navigate("/upgrade")}
                  >
                    Upgrade to Pro for unlimited movies →
                  </Button>
                </div>
              )}

              <Button onClick={handleClose} className="gap-2">
                <Check className="w-4 h-4" />
                Done
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 mb-4">An error occurred during the scan.</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleClose}>Close</Button>
                <Button onClick={startScan}>Retry</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
