import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HardDrive, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Home,
  Film,
  Check,
  RefreshCw,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DirectoryBrowser({ isOpen, onClose, onSelect }) {
  const [drives, setDrives] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [items, setItems] = useState([]);
  const [parentPath, setParentPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("Unknown");
  const [pathHistory, setPathHistory] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDrives();
    }
  }, [isOpen]);

  const loadDrives = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/filesystem/drives`);
      setDrives(response.data.drives || []);
      setPlatform(response.data.platform || "Unknown");
      setCurrentPath(null);
      setItems([]);
      setPathHistory([]);
      setSelectedPath(null);
    } catch (err) {
      console.error("Failed to load drives:", err);
    } finally {
      setLoading(false);
    }
  };

  const browsePath = async (path) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/filesystem/browse`, {
        params: { path }
      });
      setCurrentPath(response.data.current_path);
      setItems(response.data.items || []);
      setParentPath(response.data.parent_path);
      setPathHistory(prev => [...prev, path]);
    } catch (err) {
      console.error("Failed to browse path:", err);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop(); // Remove current
      const previousPath = newHistory[newHistory.length - 1];
      setPathHistory(newHistory.slice(0, -1));
      browsePath(previousPath);
    } else {
      // Go back to drives list
      setCurrentPath(null);
      setItems([]);
      setParentPath(null);
      setPathHistory([]);
    }
  };

  const goToParent = () => {
    if (parentPath) {
      browsePath(parentPath);
    } else {
      // Go back to drives list
      setCurrentPath(null);
      setItems([]);
      setParentPath(null);
      setPathHistory([]);
    }
  };

  const handleSelect = () => {
    if (selectedPath) {
      onSelect(selectedPath);
      onClose();
    } else if (currentPath) {
      onSelect(currentPath);
      onClose();
    }
  };

  const formatSize = (gb) => {
    if (!gb) return "";
    return gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb} GB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col" data-testid="directory-browser">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Select Directory
          </DialogTitle>
          <DialogDescription>
            Browse and select a directory containing your movies
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb / Path Display */}
        <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={loadDrives}
            title="Go to drives"
          >
            <Home className="w-4 h-4" />
          </Button>
          
          {currentPath && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 text-sm font-mono truncate">
                {currentPath}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToParent}
                disabled={!parentPath && !currentPath}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Up
              </Button>
            </>
          )}
          
          {!currentPath && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Server className="w-4 h-4" />
              {platform} - Select a drive
            </span>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-[300px] border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !currentPath ? (
            /* Drives List */
            <div className="p-2 space-y-1">
              {drives.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No drives found</p>
                  <p className="text-xs mt-1">The server may not have access to local drives</p>
                </div>
              ) : (
                drives.map((drive, i) => (
                  <motion.div
                    key={drive.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPath === drive.path 
                        ? "bg-primary/20 border border-primary/50" 
                        : "hover:bg-secondary/50"
                    }`}
                    onClick={() => setSelectedPath(drive.path)}
                    onDoubleClick={() => browsePath(drive.path)}
                  >
                    <HardDrive className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{drive.name}</div>
                      <div className="text-xs text-muted-foreground">{drive.path}</div>
                    </div>
                    {drive.total_gb && (
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{formatSize(drive.free_gb)} free</div>
                        <div>of {formatSize(drive.total_gb)}</div>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            /* Directory Contents */
            <div className="p-2 space-y-1">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>This folder is empty</p>
                </div>
              ) : (
                items.map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedPath === item.path 
                        ? "bg-primary/20 border border-primary/50" 
                        : "hover:bg-secondary/50"
                    }`}
                    onClick={() => setSelectedPath(item.path)}
                    onDoubleClick={() => browsePath(item.path)}
                  >
                    {item.type === "directory" ? (
                      <FolderOpen className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Folder className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.subdir_count > 0 && (
                          <span>{item.subdir_count} folders</span>
                        )}
                        {item.video_count > 0 && (
                          <Badge variant="secondary" className="text-xs py-0 px-1.5">
                            <Film className="w-3 h-3 mr-1" />
                            {item.video_count} videos
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Selected Path Display */}
        {selectedPath && (
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Selected:</div>
            <div className="font-mono text-sm truncate">{selectedPath}</div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedPath && !currentPath}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Select {currentPath && !selectedPath ? "Current Folder" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
