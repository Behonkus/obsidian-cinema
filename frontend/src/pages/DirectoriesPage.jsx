import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Film,
  Clock,
  AlertCircle,
  Upload,
  FileVideo,
  HardDrive,
  Network,
  FolderSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Common video extensions
const VIDEO_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v',
  '.mpg', '.mpeg', '.m2v', '.ts', '.mts', '.m2ts', '.vob', '.ogv',
  '.3gp', '.3g2', '.divx', '.xvid', '.rm', '.rmvb', '.asf'
];

export default function DirectoriesPage() {
  const [directories, setDirectories] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newDirPath, setNewDirPath] = useState("");
  const [newDirName, setNewDirName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [scanningDirId, setScanningDirId] = useState(null);
  const [isScanningAll, setIsScanningAll] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dirsRes, moviesRes] = await Promise.all([
        axios.get(`${API}/directories`),
        axios.get(`${API}/movies`),
      ]);
      setDirectories(dirsRes.data);
      setMovies(moviesRes.data);
    } catch (err) {
      console.error("Failed to load directories:", err);
      toast.error("Failed to load directories");
    } finally {
      setLoading(false);
    }
  };

  const handleScanDirectory = async (dirId) => {
    setScanningDirId(dirId);
    try {
      const response = await axios.post(`${API}/directories/${dirId}/scan?recursive=true`);
      toast.success(`Scan complete! Found ${response.data.total_files} files, added ${response.data.new_movies} new movies`);
      loadData();
    } catch (err) {
      toast.error("Failed to scan directory. Make sure the path is accessible.");
    } finally {
      setScanningDirId(null);
    }
  };

  const handleScanAll = async () => {
    setIsScanningAll(true);
    try {
      const response = await axios.post(`${API}/scan?recursive=true`);
      toast.success(`Scan complete! Found ${response.data.total_files} files, added ${response.data.new_movies} new movies from ${response.data.directories_scanned} directories`);
      loadData();
    } catch (err) {
      toast.error("Failed to scan directories");
    } finally {
      setIsScanningAll(false);
    }
  };

  const handleValidatePath = async (path) => {
    try {
      const response = await axios.post(`${API}/directories/validate?path=${encodeURIComponent(path)}`);
      return response.data;
    } catch (err) {
      return { valid: false, error: "Failed to validate path" };
    }
  };

  const handleAddDirectory = async () => {
    if (!newDirPath.trim()) {
      toast.error("Please enter a directory path");
      return;
    }

    setIsAdding(true);
    try {
      await axios.post(`${API}/directories`, {
        path: newDirPath.trim(),
        name: newDirName.trim() || undefined,
      });
      toast.success("Directory added successfully");
      setNewDirPath("");
      setNewDirName("");
      setIsAddDialogOpen(false);
      loadData();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("Directory already exists");
      } else {
        toast.error("Failed to add directory");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDirectory = async (id) => {
    try {
      await axios.delete(`${API}/directories/${id}`);
      toast.success("Directory deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete directory");
    }
  };

  const handleImportMovies = async () => {
    if (!importText.trim()) {
      toast.error("Please enter movie file paths");
      return;
    }

    // Parse the input - expect format: directory_id|file_path or just file_paths
    const lines = importText.trim().split('\n').filter(line => line.trim());
    
    if (directories.length === 0) {
      toast.error("Please add a directory first");
      return;
    }

    const defaultDirId = directories[0].id;
    const moviesToAdd = [];

    for (const line of lines) {
      const parts = line.split('|');
      let dirId, filePath;
      
      if (parts.length === 2) {
        dirId = parts[0].trim();
        filePath = parts[1].trim();
      } else {
        dirId = defaultDirId;
        filePath = parts[0].trim();
      }

      // Check if it's a valid video file
      const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
      if (!VIDEO_EXTENSIONS.includes(ext)) {
        continue;
      }

      const fileName = filePath.split(/[/\\]/).pop();
      
      moviesToAdd.push({
        file_path: filePath,
        file_name: fileName,
        directory_id: dirId,
      });
    }

    if (moviesToAdd.length === 0) {
      toast.error("No valid video files found in input");
      return;
    }

    setIsImporting(true);
    try {
      const response = await axios.post(`${API}/movies/bulk-add`, moviesToAdd);
      toast.success(`Added ${response.data.added} movies`);
      setImportText("");
      setIsImportDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Failed to import movies");
    } finally {
      setIsImporting(false);
    }
  };

  const getMovieCountForDirectory = (dirId) => {
    return movies.filter((m) => m.directory_id === dirId).length;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10" data-testid="directories-page">
      {/* Hero glow effect */}
      <div className="hero-glow-bg" />
      
      {/* Header */}
      <div className="relative z-10 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-[Outfit] tracking-tight text-foreground">
              Directories
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your movie directories (local & network)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Scan All Button */}
            {directories.length > 0 && (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={handleScanAll}
                disabled={isScanningAll}
                data-testid="scan-all-btn"
              >
                <FolderSearch className={`w-4 h-4 mr-2 ${isScanningAll ? "animate-spin" : ""}`} />
                {isScanningAll ? "Scanning..." : "Scan All"}
              </Button>
            )}
            
            {/* Import Movies Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full"
                  data-testid="import-movies-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Movies
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Movie Files</DialogTitle>
                  <DialogDescription>
                    Paste file paths (one per line). Since this is a web app, enter the full paths to your movie files.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>File Paths</Label>
                    <Textarea
                      placeholder={`C:\\Movies\\Inception (2010).mkv\nD:\\Films\\The Matrix.mp4\n/home/user/movies/Avatar.mkv`}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="h-48 font-mono text-sm"
                      data-testid="import-textarea"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: {VIDEO_EXTENSIONS.slice(0, 8).join(', ')}...
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsImportDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportMovies}
                    disabled={isImporting}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="confirm-import-btn"
                  >
                    {isImporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Directory Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 rounded-full px-6 glow-primary"
                  data-testid="add-directory-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Directory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Directory</DialogTitle>
                  <DialogDescription>
                    Enter the path to a directory containing movie files.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="path">Directory Path</Label>
                    <Input
                      id="path"
                      placeholder="C:\Movies or /home/user/movies"
                      value={newDirPath}
                      onChange={(e) => setNewDirPath(e.target.value)}
                      className="mt-1.5"
                      data-testid="directory-path-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Display Name (optional)</Label>
                    <Input
                      id="name"
                      placeholder="My Movies"
                      value={newDirName}
                      onChange={(e) => setNewDirName(e.target.value)}
                      className="mt-1.5"
                      data-testid="directory-name-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddDirectory}
                    disabled={isAdding}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="confirm-add-btn"
                  >
                    {isAdding ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>
      </div>
      
      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
      >
        <div className="flex items-start gap-3">
          <Network className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-200">
              <strong>Network & Local Scanning:</strong> Add directories using local paths (C:\Movies) or network shares 
              (\\server\share\movies). Click "Scan" to automatically discover movie files. The server will recursively 
              scan all subdirectories.
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Directories list */}
      {directories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Directories
          </h3>
          <p className="text-muted-foreground max-w-md">
            Add your first directory to start organizing your movie collection.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {directories.map((dir, index) => (
              <motion.div
                key={dir.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-card border-border hover:border-border/80 transition-colors" data-testid={`directory-card-${dir.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {dir.path.startsWith('\\\\') || dir.path.startsWith('//') ? (
                            <Network className="w-5 h-5 text-primary" />
                          ) : (
                            <HardDrive className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dir.name}</CardTitle>
                          <CardDescription className="text-xs font-mono truncate max-w-[200px]">
                            {dir.path}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => handleScanDirectory(dir.id)}
                          disabled={scanningDirId === dir.id}
                          data-testid={`scan-dir-btn-${dir.id}`}
                        >
                          <FolderSearch className={`w-4 h-4 ${scanningDirId === dir.id ? "animate-spin" : ""}`} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              data-testid={`delete-dir-btn-${dir.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Directory?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the directory and all associated movies from your library.
                                The actual files will not be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDirectory(dir.id)}
                                className="bg-destructive hover:bg-destructive/90"
                                data-testid={`confirm-delete-btn-${dir.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          {getMovieCountForDirectory(dir.id)} movies
                        </Badge>
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(dir.last_scanned)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => handleScanDirectory(dir.id)}
                        disabled={scanningDirId === dir.id}
                        data-testid={`scan-btn-${dir.id}`}
                      >
                        {scanningDirId === dir.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <FolderSearch className="w-3 h-3 mr-1" />
                            Scan
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Movies in library summary */}
      {movies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Movies</h2>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {movies.slice(0, 20).map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <FileVideo className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{movie.title || movie.file_name}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {movie.file_path}
                    </p>
                  </div>
                  {movie.metadata_fetched ? (
                    <Badge variant="secondary" className="text-green-400">
                      Has metadata
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-400">
                      No metadata
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </div>
  );
}
