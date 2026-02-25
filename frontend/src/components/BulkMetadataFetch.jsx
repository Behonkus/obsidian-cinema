import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, 
  Check, 
  X, 
  ImageIcon,
  AlertCircle,
  Sparkles
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
import { ScrollArea } from "@/components/ui/scroll-area";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BulkMetadataFetch({ isOpen, onClose, onComplete }) {
  const [status, setStatus] = useState("idle"); // idle, running, complete, error
  const [progress, setProgress] = useState({ current: 0, total: 0, updated: 0 });
  const [currentMovie, setCurrentMovie] = useState("");
  const [logs, setLogs] = useState([]);
  const eventSourceRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startFetch = () => {
    setStatus("running");
    setProgress({ current: 0, total: 0, updated: 0 });
    setLogs([]);
    setCurrentMovie("");

    // Use EventSource for SSE
    const eventSource = new EventSource(`${API}/movies/fetch-all-metadata/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "start":
            setProgress(prev => ({ ...prev, total: data.total }));
            addLog("info", data.message);
            break;
          case "progress":
            setProgress(prev => ({ 
              ...prev, 
              current: data.current, 
              updated: data.updated 
            }));
            setCurrentMovie(data.movie);
            break;
          case "found":
            setProgress(prev => ({ ...prev, updated: data.updated }));
            addLog("success", `✓ Found metadata for "${data.movie}"`);
            break;
          case "error":
            addLog("error", `✗ Failed: ${data.movie}`);
            break;
          case "complete":
            setStatus("complete");
            setProgress(prev => ({ 
              ...prev, 
              current: data.total,
              updated: data.updated 
            }));
            addLog("info", data.message);
            eventSource.close();
            if (onComplete) onComplete();
            break;
          default:
            break;
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      setStatus("error");
      addLog("error", "Connection lost. Please try again.");
      eventSource.close();
    };
  };

  const addLog = (type, message) => {
    setLogs(prev => [...prev.slice(-50), { type, message, time: new Date() }]);
  };

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setStatus("idle");
    onClose();
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="bulk-metadata-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Bulk Fetch Metadata
          </DialogTitle>
          <DialogDescription>
            Automatically find posters and metadata for all movies in your library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === "idle" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                This will search TMDB for all movies that don't have metadata yet.
              </p>
              <Button onClick={startFetch} className="gap-2" data-testid="start-bulk-fetch-btn">
                <RefreshCw className="w-4 h-4" />
                Start Fetching
              </Button>
            </div>
          )}

          {(status === "running" || status === "complete") && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress.current} / {progress.total}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressPercent}% complete</span>
                  <span className="text-green-400">{progress.updated} updated</span>
                </div>
              </div>

              {currentMovie && status === "running" && (
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm truncate">Searching: {currentMovie}</span>
                  </div>
                </div>
              )}

              <ScrollArea className="h-48 rounded-lg border border-border bg-background/50 p-3">
                <div className="space-y-1 text-xs font-mono">
                  {logs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`${
                        log.type === "success" ? "text-green-400" : 
                        log.type === "error" ? "text-red-400" : 
                        "text-muted-foreground"
                      }`}
                    >
                      {log.message}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>

              {status === "complete" && (
                <div className="flex justify-end gap-2">
                  <Button onClick={handleClose} className="gap-2">
                    <Check className="w-4 h-4" />
                    Done
                  </Button>
                </div>
              )}
            </>
          )}

          {status === "error" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 mb-4">An error occurred while fetching metadata.</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleClose}>Close</Button>
                <Button onClick={startFetch}>Retry</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
