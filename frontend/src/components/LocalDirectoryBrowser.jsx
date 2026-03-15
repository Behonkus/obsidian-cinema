import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Film,
  HardDrive,
  ChevronRight,
  ChevronDown,
  Folder,
  Search,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

export default function LocalDirectoryBrowser({ onMoviesFound }) {
  const [drives, setDrives] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedDirs, setSelectedDirs] = useState([]);

  useEffect(() => {
    if (isElectron()) {
      loadDrives();
    }
  }, []);

  const loadDrives = async () => {
    try {
      const driveList = await window.electronAPI.getDrives();
      setDrives(driveList);
    } catch (err) {
      console.error('Failed to get drives:', err);
      toast.error('Failed to get drives');
    }
  };

  const navigateTo = async (path) => {
    setLoading(true);
    try {
      const contents = await window.electronAPI.listDirectory(path);
      setItems(contents);
      setCurrentPath(path);
    } catch (err) {
      console.error('Failed to list directory:', err);
      toast.error('Cannot access this folder');
    } finally {
      setLoading(false);
    }
  };

  const scanCurrentFolder = async () => {
    if (!currentPath) {
      toast.error('Please select a folder first');
      return;
    }

    setScanning(true);
    try {
      const movies = await window.electronAPI.scanForVideos(currentPath, true);
      toast.success(`Found ${movies.length} video files!`);
      
      if (onMoviesFound) {
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

  const goUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split(/[/\\]/).filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      const newPath = parts.join('\\') + '\\';
      navigateTo(newPath);
    } else {
      setCurrentPath('');
      setItems([]);
    }
  };

  if (!isElectron()) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <FolderOpen className="w-4 h-4" />
        Browse Local Drives
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

          <div className="space-y-4">
            {/* Current Path */}
            <div className="flex items-center gap-2">
              <Input 
                value={currentPath} 
                onChange={(e) => setCurrentPath(e.target.value)}
                placeholder="Path..."
                className="flex-1 font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={goUp}
                disabled={!currentPath}
              >
                Up
              </Button>
            </div>

            {/* Drives or Directory Contents */}
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !currentPath ? (
                // Show drives
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground mb-2">Select a drive:</p>
                  {drives.map((drive) => (
                    <button
                      key={drive.path}
                      onClick={() => navigateTo(drive.path)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-secondary rounded-lg text-left transition-colors"
                    >
                      <HardDrive className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">{drive.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Show directory contents
                <div className="space-y-1">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Folder is empty or cannot be accessed
                    </p>
                  ) : (
                    items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => item.isDirectory && navigateTo(item.path)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          item.isDirectory 
                            ? 'hover:bg-secondary cursor-pointer' 
                            : 'opacity-50 cursor-default'
                        }`}
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
                    ))
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Selected Path Display */}
            {currentPath && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Selected folder:</p>
                <p className="font-mono text-sm truncate">{currentPath}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
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
