import { useState, useEffect, useRef } from "react";
import { ImportTypePicker } from "@/components/ImportTypePicker";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, 
  RefreshCw, 
  Film,
  HardDrive,
  ChevronRight,
  Folder,
  Search,
  Loader2,
  ArrowRight,
  FolderSearch
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

var SKIP_NAMING_TIP_KEY = 'obsidian_cinema_skip_naming_tip';

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

export default function LocalDirectoryBrowser({ onMoviesFound, label, testId }) {
  var [importType, setImportType] = useState(null);
  var [drives, setDrives] = useState([]);
  var [currentPath, setCurrentPath] = useState('');
  var [typedPath, setTypedPath] = useState('');
  var [listError, setListError] = useState('');
  var [items, setItems] = useState([]);
  var [loading, setLoading] = useState(false);
  var [isOpen, setIsOpen] = useState(false);
  var [scanning, setScanning] = useState(false);
  var [scanElapsed, setScanElapsed] = useState(0);
  var timerRef = useRef(null);
  var [showNamingTip, setShowNamingTip] = useState(false);
  var [namingTipDontShow, setNamingTipDontShow] = useState(false);

  var handleBrowseClick = function() {
    if (localStorage.getItem(SKIP_NAMING_TIP_KEY) === 'true') {
      setIsOpen(true);
    } else {
      setShowNamingTip(true);
    }
  };

  var confirmNamingTip = function() {
    if (namingTipDontShow) {
      localStorage.setItem(SKIP_NAMING_TIP_KEY, 'true');
    }
    setShowNamingTip(false);
    setNamingTipDontShow(false);
    setIsOpen(true);
  };

  useEffect(function() {
    if (isElectron() && isOpen) {
      loadDrives();
    }
  }, [isOpen]);

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
    var target = (navPath || '').trim().replace(/^"|"$/g, '');
    if (!target) { setCurrentPath(''); setTypedPath(''); setItems([]); setListError(''); return; }
    if (/^[a-zA-Z]:$/.test(target)) target += '\\';
    setLoading(true);
    setCurrentPath(target);
    setTypedPath(target);
    try {
      var contents = await window.electronAPI.listDirectory(target);
      setItems(contents);
      setListError('');
    } catch (err) {
      console.error('Failed to list directory:', err);
      var msg = String((err && err.message) || '').split('Error: ').pop() || 'Cannot open this folder';
      setItems([]);
      setListError(msg);
    } finally {
      setLoading(false);
    }
  };

  var chooseWithWindows = async function() {
    try {
      var res = await window.electronAPI.openFolderDialog({ title: 'Choose a folder with your movie files' });
      if (res && !res.canceled && res.filePaths && res.filePaths[0]) navigateTo(res.filePaths[0]);
    } catch (err) {
      toast.error('Could not open the Windows folder picker');
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
        onMoviesFound(movies, currentPath, importType);
      }

      setIsOpen(false);
      setImportType(null);
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error('Failed to scan folder');
    } finally {
      setScanning(false);
    }
  };

  var goUp = function() {
    if (!currentPath) return;
    var unc = /^[\\/]{2}/.test(currentPath);
    var parts = currentPath.split(/[/\\]/).filter(Boolean);
    // Network paths stop at \\server\share; drives stop at the drive list
    if (parts.length > (unc ? 2 : 1)) {
      parts.pop();
      navigateTo((unc ? '\\\\' : '') + parts.join('\\') + '\\');
    } else {
      navigateTo('');
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
        data-testid={'drive-' + drive.name.replace(':', '')}
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
        className={'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors min-w-0 ' + (item.isDirectory ? 'hover:bg-secondary cursor-pointer' : 'opacity-50 cursor-default')}
        disabled={!item.isDirectory}
      >
        {item.isDirectory ? (
          <Folder className="w-5 h-5 text-amber-400 shrink-0" />
        ) : (
          <Film className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <span className="truncate min-w-0">{item.name}</span>
        {item.isDirectory && (
          <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground shrink-0" />
        )}
      </button>
    );
  });

  return (
    <>
      <Button onClick={handleBrowseClick} className="oc-cta gap-2 h-9 rounded-full px-4 text-xs" data-testid={testId || "browse-local-drives-btn"} title="Browse local and network drives for a folder of your movie files">
        <FolderOpen className="w-4 h-4" />
        {label || 'Add Folder'}
      </Button>

      {/* Naming Convention Tip */}
      <AlertDialog open={showNamingTip} onOpenChange={function(open) { if (!open) { setShowNamingTip(false); setNamingTipDontShow(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Naming Tip for Best Results</AlertDialogTitle>
            <AlertDialogDescription>
              For the best title import and poster fetch results, name your movie files as:
              <code className="block mt-2 mb-1 px-3 py-2 bg-secondary rounded text-sm font-mono text-foreground">
                Movie Title (Year).ext
              </code>
              For example: <code className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono text-foreground">The Dark Knight (2008).mkv</code>
              <span className="block mt-2 text-muted-foreground">
                Including the year in parentheses helps TMDB match the correct movie, especially for remakes or common titles.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 cursor-pointer select-none px-6 pb-2">
            <input
              type="checkbox"
              checked={namingTipDontShow}
              onChange={function(e) { setNamingTipDontShow(e.target.checked); }}
              className="w-4 h-4 rounded border-border accent-primary"
              data-testid="skip-naming-tip-checkbox"
            />
            <span className="text-xs text-muted-foreground">Don't show this again</span>
          </label>
          <AlertDialogFooter>
            <AlertDialogAction onClick={confirmNamingTip} data-testid="confirm-naming-tip-btn">
              Got it, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={function(open) { if (!scanning) { setIsOpen(open); if (!open) setImportType(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Browse Local Drives
            </DialogTitle>
            <DialogDescription>
              Select a folder and what it contains, then scan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 relative flex-1 min-h-0 overflow-y-auto pr-1">
            {scanning && <ScanningOverlay path={currentPath} elapsed={scanElapsed} />}

            <div className={'rounded-lg p-3 border transition-colors ' + (importType ? 'border-border bg-secondary/30' : 'border-amber-500/50 bg-amber-500/5')} data-testid="scan-type-step">
              <p className="text-xs font-medium mb-2">{importType ? 'Step 1 · Folder type' : 'Step 1 · Choose what this folder contains'}</p>
              <ImportTypePicker value={importType} onChange={setImportType} testPrefix="scan-type" />
            </div>

            <p className="text-xs font-medium">Step 2 · Pick the folder</p>
            <form className="flex items-center gap-2 min-w-0" onSubmit={function(e) { e.preventDefault(); navigateTo(typedPath); }}>
              <Input
                value={typedPath}
                onChange={function(e) { setTypedPath(e.target.value); }}
                placeholder={"Type a path, e.g. E:\\TV Shows or \\\\NAS\\Media, then press Enter"}
                className="flex-1 font-mono text-sm min-w-0"
                disabled={scanning}
                data-testid="browse-path-input"
              />
              <Button type="submit" variant="outline" size="sm" disabled={!typedPath.trim() || scanning} data-testid="browse-path-go">
                Go <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={goUp} disabled={!currentPath || scanning} data-testid="browse-up-btn">
                Up
              </Button>
            </form>
            <Button type="button" variant="secondary" size="sm" className="w-full gap-2" onClick={chooseWithWindows} disabled={scanning} data-testid="choose-with-windows-btn">
              <FolderSearch className="w-4 h-4" /> Choose with Windows…
            </Button>

            <ScrollArea className="h-[220px] border rounded-lg p-2">
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
                  {listError ? (
                    <div className="text-center py-8 space-y-1" data-testid="browse-error">
                      <p className="text-sm text-destructive">{listError}: <span className="font-mono">{currentPath}</span></p>
                      <p className="text-xs text-muted-foreground">Check the path, or use Choose with Windows… Network drives may not show when the app runs as administrator.</p>
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" data-testid="browse-empty">
                      This folder is empty
                    </p>
                  ) : itemButtons}
                </div>
              )}
            </ScrollArea>

            {currentPath && !scanning && !listError && (
              <div className="p-2 bg-secondary/50 rounded-lg overflow-hidden" data-testid="browse-selected">
                <p className="text-xs text-muted-foreground">Selected folder:</p>
                <p className="font-mono text-xs truncate" title={currentPath}>{currentPath}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">All subfolders (seasons, extras…) will be included in this scan.</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 shrink-0">
            <Button variant="outline" onClick={function() { setIsOpen(false); setImportType(null); }} disabled={scanning} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={scanCurrentFolder}
              disabled={!currentPath || !!listError || !importType || scanning}
              data-testid="scan-folder-btn"
              className="gap-2 w-full sm:w-auto"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  {!importType ? 'Choose a type first' : importType !== 'movies' ? 'Scan for Shows' : 'Scan for Movies'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
