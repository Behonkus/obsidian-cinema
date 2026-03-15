import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Film, 
  Play, 
  Search, 
  FolderOpen,
  RefreshCw,
  Trash2,
  ExternalLink,
  Copy,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import LocalDirectoryBrowser from "@/components/LocalDirectoryBrowser";

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

// Local storage key for movies
const STORAGE_KEY = 'obsidian_cinema_local_movies';
const DIRS_KEY = 'obsidian_cinema_local_dirs';

export default function LocalLibraryPage() {
  const [movies, setMovies] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedMovies = localStorage.getItem(STORAGE_KEY);
    const savedDirs = localStorage.getItem(DIRS_KEY);
    
    if (savedMovies) {
      setMovies(JSON.parse(savedMovies));
    }
    if (savedDirs) {
      setDirectories(JSON.parse(savedDirs));
    }
  }, []);

  // Save to localStorage when movies change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    localStorage.setItem(DIRS_KEY, JSON.stringify(directories));
  }, [directories]);

  const handleMoviesFound = (newMovies, dirPath) => {
    // Add directory if not already added
    if (!directories.includes(dirPath)) {
      setDirectories([...directories, dirPath]);
    }

    // Merge movies, avoiding duplicates by file path
    const existingPaths = new Set(movies.map(m => m.file_path));
    const uniqueNewMovies = newMovies.filter(m => !existingPaths.has(m.file_path));
    
    setMovies([...movies, ...uniqueNewMovies]);
    toast.success(`Added ${uniqueNewMovies.length} new movies to library`);
  };

  const playMovie = (movie) => {
    if (isElectron()) {
      // Open with system default player
      if (window.electronAPI?.openPath) {
        window.electronAPI.openPath(movie.file_path);
      } else if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(movie.file_path);
      }
      toast.success(`Opening: ${movie.title}`);
    } else {
      // Fallback: copy path
      navigator.clipboard.writeText(movie.file_path);
      toast.info('Path copied - paste in your video player');
    }
  };

  const openInVLC = (movie) => {
    if (isElectron() && window.electronAPI?.openExternal) {
      // VLC command line format
      const vlcPath = `vlc://${movie.file_path}`;
      window.electronAPI.openExternal(vlcPath);
    }
  };

  const openFolder = (movie) => {
    if (isElectron()) {
      if (window.electronAPI?.showItemInFolder) {
        // This opens the folder AND selects the file
        window.electronAPI.showItemInFolder(movie.file_path);
      } else if (window.electronAPI?.openExternal) {
        const folderPath = movie.file_path.substring(0, movie.file_path.lastIndexOf('\\'));
        window.electronAPI.openExternal(folderPath);
      }
      toast.success('Opening folder');
    }
  };

  const copyPath = (path) => {
    navigator.clipboard.writeText(path);
    toast.success('Path copied to clipboard');
  };

  const removeMovie = (movieId) => {
    setMovies(movies.filter(m => m.id !== movieId));
    toast.success('Movie removed from library');
  };

  const clearLibrary = () => {
    if (confirm('Are you sure you want to clear your entire library?')) {
      setMovies([]);
      setDirectories([]);
      toast.success('Library cleared');
    }
  };

  const filteredMovies = movies.filter(movie => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return movie.title?.toLowerCase().includes(query) || 
           movie.file_name?.toLowerCase().includes(query);
  });

  if (!isElectron()) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Desktop Only Feature</h1>
        <p className="text-muted-foreground">
          Local library scanning is only available in the desktop app.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            Local Library
          </h1>
          <p className="text-muted-foreground">
            {movies.length} movies from {directories.length} folders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LocalDirectoryBrowser onMoviesFound={handleMoviesFound} />
          {movies.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearLibrary}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Scanned Directories */}
      {directories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {directories.map((dir, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              <HardDrive className="w-3 h-3" />
              {dir.length > 40 ? '...' + dir.slice(-40) : dir}
            </Badge>
          ))}
        </div>
      )}

      {/* Movies Grid */}
      {movies.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">No Movies Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Click "Browse Local Drives" above to scan a folder for video files. 
              The app will find all movies and add them to your library.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMovies.map((movie) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group"
            >
              <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}>
                <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-secondary relative flex items-center justify-center">
                  <Film className="w-12 h-12 text-primary/50" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); playMovie(movie); }}>
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium truncate text-sm">{movie.title}</h3>
                  {movie.year && (
                    <p className="text-xs text-muted-foreground">{movie.year}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
             onClick={() => setSelectedMovie(null)}>
          <Card className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{selectedMovie.title}</h2>
                {selectedMovie.year && (
                  <p className="text-muted-foreground">{selectedMovie.year}</p>
                )}
              </div>
              
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">File path:</p>
                <p className="font-mono text-sm break-all">{selectedMovie.file_path}</p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => playMovie(selectedMovie)}>
                  <Play className="w-4 h-4 mr-2" />
                  Play (Default Player)
                </Button>
                <Button variant="outline" onClick={() => copyPath(selectedMovie.file_path)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => openFolder(selectedMovie)}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open Folder
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedMovie(null)}
                >
                  Close
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => { removeMovie(selectedMovie.id); setSelectedMovie(null); }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
