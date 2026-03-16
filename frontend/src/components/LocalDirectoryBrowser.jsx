import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, 
  RefreshCw, 
  Film,
  HardDrive,
  ChevronRight,
  Folder,
  Search,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

var isElectron = function() {
  return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron && window.electronAPI.isElectron();
};

var SCAN_MESSAGES = [
  'Scanning directories for video files...',
  'Crawling through subfolders...',
  'This can take a while for large collections.',
  'Still working — scanning thousands of files...',
  'Processing video files found so far...',
  'Indexing file names and extracting metadata...',
  'Hang tight — almost there for this folder...',
  'Large directories may take several minutes.',
  'Still scanning — no need to worry, nothing is frozen.',
  'The more movies you have, the longer this takes!',
];

function ScanningOverlay({ path, elapsed }) {
  var msgIndex = Math.floor(elapsed / 4) % SCAN_MESSAGES.length;
  var mins = Math.floor(elapsed / 60);
  var secs = elapsed % 60;
  var timeStr = mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';

  return (
    <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-center rounded-lg">
      <div className="text-center space-y-4 px-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-primary mx-auto" />
        </motion.div>
        <div>
          <p className="font-medium text-foreground">Scanning in progress</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm text-muted-foreground mt-1"
            >
              {SCAN_MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>Elapsed: {timeStr}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span className="font-mono truncate max-w-[200px]">{path}</span>
        </div>
        <div className="flex gap-1 justify-center">
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-primary" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 rounded-full bg-primary" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }} className="w-2 h-2 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

export default function LocalDirectoryBrowser({ onMoviesFound }) {
  var [drives, setDrives] = useState([]);
  var [currentPath, setCurrentPath] = useState('');
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(false);
  var [isOpen, setIsOpen] = useState(false);
  var [scanning, setScanning] = useState(false);
  var [scanElapsed, setScanElapsed] = useState(0);
  var timerRef = useRef(null);

  useEffect(function() {
    if (isElectron()) {
      loadDrives();
    }
  }, []);

  // Scan elapsed timer
  useEffect(function() {
    if (scanning) {
      setScanElapsed(0);
      timerRef.current = setInterval(function() {
        setScanElapsed(function(prev) { return prev + 1; });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return function() {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scanning]);

  var loadDrives = async function() {
    try {
      var driveList = await window.electronAPI.getDrives();
      setDrives(driveList);
    } catch (err) {
      console.error('Failed to get drives:', err);
      toast.error('Failed to get drives');
    }
  };

  var navigateTo = async function(navPath) {
    setLoading(true);
    try {
      var contents = await window.electronAPI.listDirectory(navPath);
      setItems(contents);
      setCurrentPath(navPath);
    } catch (err) {
      console.error('Failed to list directory:', err);
      toast.error('Cannot access this folder');
    } finally {
      setLoading(false);
    }
  };

  var scanCurrentFolder = async function() {
    if (!currentPath) {
      toast.error('Please select a folder first');
      return;
    }

    setScanning(true);
    try {
      var movies = await window.electronAPI.scanForVideos(currentPath, true);

      if (movies.length > 0) {
        toast.success('Found ' + movies.length + ' video files in ' + scanElapsed + 's!');
      } else {
        toast.info('No video files found in this folder.');
      }

      if (onMoviesFound && movies.length > 0) {
        onMoviesFound(movies, currentPath);
      }

      setIsOpen(false);
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error('Failed to scan folder');
    } finally {
      setScanning(false);
    }
  };

  var goUp = function() {
    if (!currentPath) return;
    var parts = currentPath.split(/[/\\]/).filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      var newPath = parts.join('\\') + '\\';
      navigateTo(newPath);
    } else {
      setCurrentPath('');
      setItems([]);
    }
  };

  if (!isElectron()) {
    return null;
  }

  var driveButtons = drives.map(function(drive) {
    return (
      <button
        key={drive.path}
        onClick={function() { navigateTo(drive.path); }}
        className="w-full flex items-center gap-2 p-2 hover:bg-secondary rounded-lg text-left transition-colors"
      >
        <HardDrive className="w-5 h-5 text-blue-400" />
        <span className="font-medium">{drive.name}</span>
      </button>
    );
  });

  var itemButtons = items.map(function(item) {
    return (
      <button
        key={item.path}
        onClick={function() { if (item.isDirectory) navigateTo(item.path); }}
        className={'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ' + (item.isDirectory ? 'hover:bg-secondary cursor-pointer' : 'opacity-50 cursor-default')}
        disabled={!item.isDirectory}
      >
        {item.isDirectory ? (
          <Folder className="w-5 h-5 text-amber-400" />
        ) : (
          <Film className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="truncate">{item.name}</span>
        {item.isDirectory && (
          <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
        )}
      </button>
    );
  });

  return (
    <>
      <Button onClick={function() { setIsOpen(true); }} className="gap-2">
        <FolderOpen className="w-4 h-4" />
        Browse Local Drives
      </Button>

      <Dialog open={isOpen} onOpenChange={function(open) { if (!scanning) setIsOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Browse Local Drives
            </DialogTitle>
            <DialogDescription>
              Select a folder to scan for movies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 relative">
            {scanning && <ScanningOverlay path={currentPath} elapsed={scanElapsed} />}

            <div className="flex items-center gap-2">
              <Input 
                value={currentPath} 
                onChange={function(e) { setCurrentPath(e.target.value); }}
                placeholder="Path..."
                className="flex-1 font-mono text-sm"
                disabled={scanning}
              />
              <Button variant="outline" size="sm" onClick={goUp} disabled={!currentPath || scanning}>
                Up
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !currentPath ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground mb-2">Select a drive:</p>
                  {driveButtons}
                </div>
              ) : (
                <div className="space-y-1">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Folder is empty or cannot be accessed
                    </p>
                  ) : itemButtons}
                </div>
              )}
            </ScrollArea>

            {currentPath && !scanning && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Selected folder:</p>
                <p className="font-mono text-sm truncate">{currentPath}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">All subdirectories will be included in this scan.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={function() { setIsOpen(false); }} disabled={scanning}>
              Cancel
            </Button>
            <Button 
              onClick={scanCurrentFolder}
              disabled={!currentPath || scanning}
              className="gap-2"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Scan for Movies
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
