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
  HardDrive,
  Image,
  Settings,
  Key,
  Undo2,
  Clock,
  ArchiveRestore,
  LayoutGrid,
  Grid3X3,
  Grid2X2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import LocalDirectoryBrowser from "@/components/LocalDirectoryBrowser";

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

// Local storage keys
const STORAGE_KEY = 'obsidian_cinema_local_movies';
const DIRS_KEY = 'obsidian_cinema_local_dirs';
const TMDB_KEY = 'obsidian_cinema_tmdb_key';
const TRASH_KEY = 'obsidian_cinema_trash';
const GRID_SIZE_KEY = 'obsidian_cinema_grid_size';

// 30 days in milliseconds
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// Grid size configurations
const GRID_SIZES = {
  small:  { label: 'S', cols: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10', gap: 'gap-2' },
  medium: { label: 'M', cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7', gap: 'gap-3' },
  large:  { label: 'L', cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', gap: 'gap-4' },
};

// TMDB API base URL
const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

export default function LocalLibraryPage() {
  const [movies, setMovies] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [fetchingPosters, setFetchingPosters] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [trashedMovies, setTrashedMovies] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [gridSize, setGridSize] = useState(() => localStorage.getItem(GRID_SIZE_KEY) || 'medium');

  // Load from localStorage on mount
  useEffect(() => {
    const savedMovies = localStorage.getItem(STORAGE_KEY);
    const savedDirs = localStorage.getItem(DIRS_KEY);
    const savedTmdbKey = localStorage.getItem(TMDB_KEY);
    const savedTrash = localStorage.getItem(TRASH_KEY);
    
    if (savedMovies) {
      setMovies(JSON.parse(savedMovies));
    }
    if (savedDirs) {
      setDirectories(JSON.parse(savedDirs));
    }
    if (savedTmdbKey) {
      setTmdbApiKey(savedTmdbKey);
      setTempApiKey(savedTmdbKey);
    }
    if (savedTrash) {
      // Auto-purge items older than 30 days
      const now = Date.now();
      const filtered = JSON.parse(savedTrash).filter(
        m => now - m.deleted_at < TRASH_RETENTION_MS
      );
      setTrashedMovies(filtered);
    }
  }, []);

  // Save to localStorage when movies change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    localStorage.setItem(DIRS_KEY, JSON.stringify(directories));
  }, [directories]);

  // Save trash to localStorage
  useEffect(() => {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trashedMovies));
  }, [trashedMovies]);

  // Save grid size preference
  useEffect(() => {
    localStorage.setItem(GRID_SIZE_KEY, gridSize);
  }, [gridSize]);

  const saveTmdbKey = () => {
    localStorage.setItem(TMDB_KEY, tempApiKey);
    setTmdbApiKey(tempApiKey);
    setShowSettings(false);
    toast.success('TMDB API key saved!');
  };

  // Fetch poster from TMDB
  const fetchPosterForMovie = async (movie) => {
    if (!tmdbApiKey) return null;
    
    try {
      const query = encodeURIComponent(movie.title);
      const yearParam = movie.year ? `&year=${movie.year}` : '';
      const response = await fetch(
        `${TMDB_API}/search/movie?api_key=${tmdbApiKey}&query=${query}${yearParam}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          poster_path: result.poster_path ? `${TMDB_IMG}${result.poster_path}` : null,
          tmdb_id: result.id,
          overview: result.overview,
          rating: result.vote_average,
          release_date: result.release_date
        };
      }
    } catch (err) {
      console.error('TMDB fetch error:', err);
    }
    return null;
  };

  // Fetch posters for all movies without posters
  const fetchAllPosters = async () => {
    if (!tmdbApiKey) {
      toast.error('Please add your TMDB API key in settings first');
      setShowSettings(true);
      return;
    }

    const moviesNeedingPosters = movies.filter(m => !m.poster_path);
    if (moviesNeedingPosters.length === 0) {
      toast.info('All movies already have posters');
      return;
    }

    setFetchingPosters(true);
    setFetchProgress(0);

    const updatedMovies = [...movies];
    let fetched = 0;

    for (const movie of moviesNeedingPosters) {
      const tmdbData = await fetchPosterForMovie(movie);
      if (tmdbData) {
        const index = updatedMovies.findIndex(m => m.id === movie.id);
        if (index !== -1) {
          updatedMovies[index] = { ...updatedMovies[index], ...tmdbData };
        }
      }
      fetched++;
      setFetchProgress((fetched / moviesNeedingPosters.length) * 100);
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 250));
    }

    setMovies(updatedMovies);
    setFetchingPosters(false);
    toast.success(`Fetched posters for ${fetched} movies!`);
  };

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
    const movie = movies.find(m => m.id === movieId);
    if (movie) {
      setTrashedMovies(prev => [...prev, { ...movie, deleted_at: Date.now() }]);
    }
    setMovies(movies.filter(m => m.id !== movieId));
    setMovieToDelete(null);
    setSelectedMovie(null);
    toast.success('Movie moved to Recently Deleted', {
      description: 'You can restore it within 30 days',
      action: {
        label: "Undo",
        onClick: () => {
          if (movie) {
            setMovies(prev => [...prev, movie]);
            setTrashedMovies(prev => prev.filter(m => m.id !== movieId));
          }
        },
      },
    });
  };

  const clearLibrary = () => {
    const now = Date.now();
    const trashEntries = movies.map(m => ({ ...m, deleted_at: now }));
    setTrashedMovies(prev => [...prev, ...trashEntries]);
    setMovies([]);
    setDirectories([]);
    setShowClearConfirm(false);
    toast.success('Library cleared — movies moved to Recently Deleted');
  };

  const restoreMovie = (movieId) => {
    const movie = trashedMovies.find(m => m.id === movieId);
    if (movie) {
      const { deleted_at, ...cleanMovie } = movie;
      setMovies(prev => [...prev, cleanMovie]);
      setTrashedMovies(prev => prev.filter(m => m.id !== movieId));
      toast.success(`"${movie.title}" restored to library`);
    }
  };

  const restoreAllMovies = () => {
    const restored = trashedMovies.map(({ deleted_at, ...m }) => m);
    setMovies(prev => [...prev, ...restored]);
    setTrashedMovies([]);
    toast.success(`${restored.length} movies restored to library`);
  };

  const permanentlyDelete = (movieId) => {
    setTrashedMovies(prev => prev.filter(m => m.id !== movieId));
    toast.success('Movie permanently removed');
  };

  const emptyTrash = () => {
    setTrashedMovies([]);
    setShowEmptyTrashConfirm(false);
    toast.success('Trash emptied');
  };

  const getDaysRemaining = (deletedAt) => {
    const elapsed = Date.now() - deletedAt;
    const remaining = Math.ceil((TRASH_RETENTION_MS - elapsed) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
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
          {/* Grid Size Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden" data-testid="grid-size-toggle">
            {Object.entries(GRID_SIZES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setGridSize(key)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  gridSize === key 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-secondary text-muted-foreground'
                }`}
                data-testid={`grid-size-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
          {movies.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAllPosters}
              disabled={fetchingPosters}
              data-testid="fetch-posters-btn"
            >
              {fetchingPosters ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Image className="w-4 h-4 mr-2" />
              )}
              {fetchingPosters ? 'Fetching...' : 'Fetch Posters'}
            </Button>
          )}
          <Button 
            variant={showTrash ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowTrash(!showTrash)}
            data-testid="toggle-trash-btn"
            className={showTrash ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {trashedMovies.length > 0 && (
              <span className="text-xs">{trashedMovies.length}</span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setTempApiKey(tmdbApiKey); setShowSettings(true); }} data-testid="settings-btn">
            <Settings className="w-4 h-4" />
          </Button>
          {movies.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(true)} data-testid="clear-library-btn">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Poster Fetch Progress */}
      {fetchingPosters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Fetching posters from TMDB...</span>
            <span>{Math.round(fetchProgress)}%</span>
          </div>
          <Progress value={fetchProgress} />
        </div>
      )}

      {/* TMDB API Key Warning */}
      {!tmdbApiKey && movies.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span className="text-sm">Add your TMDB API key to fetch movie posters</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
            Add Key
          </Button>
        </div>
      )}

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

      {/* Movies Grid or Trash View */}
      {showTrash ? (
        /* Recently Deleted View */
        <div className="space-y-4" data-testid="trash-view">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold">Recently Deleted</h2>
              <Badge variant="secondary">{trashedMovies.length}</Badge>
            </div>
            {trashedMovies.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={restoreAllMovies} data-testid="restore-all-btn">
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Restore All
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowEmptyTrashConfirm(true)} data-testid="empty-trash-btn">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Empty Trash
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Movies here will be automatically removed after 30 days. No files are ever deleted from your system.
          </p>
          {trashedMovies.length === 0 ? (
            <Card className="p-8">
              <div className="text-center space-y-3">
                <Trash2 className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <h3 className="font-medium text-muted-foreground">Trash is empty</h3>
              </div>
            </Card>
          ) : (
        <div className={`grid ${GRID_SIZES[gridSize].cols} ${GRID_SIZES[gridSize].gap}`}>
              {trashedMovies.map((movie) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group"
                >
                  <Card className="overflow-hidden opacity-70 hover:opacity-100 transition-opacity" data-testid={`trash-movie-${movie.id}`}>
                    <div className="aspect-[2/3] bg-gradient-to-br from-destructive/10 to-secondary relative flex items-center justify-center overflow-hidden">
                      {movie.poster_path ? (
                        <img 
                          src={movie.poster_path} 
                          alt={movie.title}
                          className="w-full h-full object-cover grayscale"
                          loading="lazy"
                        />
                      ) : (
                        <Film className="w-12 h-12 text-muted-foreground/30" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => restoreMovie(movie.id)} data-testid={`restore-${movie.id}`}>
                          <Undo2 className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                    <CardContent className={gridSize === 'small' ? 'p-2' : 'p-3'}>
                      <h3 className={`font-medium truncate ${gridSize === 'small' ? 'text-xs' : 'text-sm'}`}>{movie.title}</h3>
                      {gridSize !== 'small' && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getDaysRemaining(movie.deleted_at)}d left
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-destructive hover:text-destructive"
                            onClick={() => permanentlyDelete(movie.id)}
                            data-testid={`perm-delete-${movie.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : movies.length === 0 ? (
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
        <div className={`grid ${GRID_SIZES[gridSize].cols} ${GRID_SIZES[gridSize].gap}`}>
          {filteredMovies.map((movie) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group"
            >
              <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}>
                <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-secondary relative flex items-center justify-center overflow-hidden">
                  {movie.poster_path ? (
                    <img 
                      src={movie.poster_path} 
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Film className="w-12 h-12 text-primary/50" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); playMovie(movie); }}>
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
                <CardContent className={gridSize === 'small' ? 'p-2' : 'p-3'}>
                  <h3 className={`font-medium truncate ${gridSize === 'small' ? 'text-xs' : 'text-sm'}`}>{movie.title}</h3>
                  {gridSize !== 'small' && (
                    <div className="flex items-center justify-between">
                      {movie.year && (
                        <p className="text-xs text-muted-foreground">{movie.year}</p>
                      )}
                      {movie.rating && (
                        <p className="text-xs text-amber-400">★ {movie.rating.toFixed(1)}</p>
                      )}
                    </div>
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
              <div className="flex gap-4">
                {selectedMovie.poster_path && (
                  <img 
                    src={selectedMovie.poster_path} 
                    alt={selectedMovie.title}
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedMovie.title}</h2>
                  {selectedMovie.year && (
                    <p className="text-muted-foreground">{selectedMovie.year}</p>
                  )}
                  {selectedMovie.rating && (
                    <p className="text-amber-400">★ {selectedMovie.rating.toFixed(1)}</p>
                  )}
                </div>
              </div>

              {selectedMovie.overview && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedMovie.overview}
                </p>
              )}
              
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
                  onClick={() => setMovieToDelete(selectedMovie)}
                  data-testid="remove-movie-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your TMDB API key to fetch movie posters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">TMDB API Key</label>
              <Input
                type="password"
                placeholder="Enter your TMDB API key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get a free API key at{' '}
                <a 
                  href="https://www.themoviedb.org/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isElectron() && window.electronAPI?.openExternal) {
                      window.electronAPI.openExternal('https://www.themoviedb.org/settings/api');
                    }
                  }}
                >
                  themoviedb.org
                </a>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={saveTmdbKey} disabled={!tempApiKey}>
              Save Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Movie Confirmation */}
      <AlertDialog open={!!movieToDelete} onOpenChange={(open) => !open && setMovieToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{movieToDelete?.title}" from library?</AlertDialogTitle>
            <AlertDialogDescription>
              This movie will be moved to Recently Deleted where you can restore it within 30 days.
              <span className="block mt-2 font-medium text-foreground">
                No files will be deleted from your system. Your actual movie file will remain untouched.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeMovie(movieToDelete?.id)}
              data-testid="confirm-remove-movie-btn"
            >
              Remove from Library
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Library Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear entire library?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move all movies to Recently Deleted where you can restore them within 30 days.
              <span className="block mt-2 font-medium text-foreground">
                No files will be deleted from your system. All your actual movie files will remain untouched.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={clearLibrary}
              data-testid="confirm-clear-library-btn"
            >
              Clear Library
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Trash Confirmation */}
      <AlertDialog open={showEmptyTrashConfirm} onOpenChange={setShowEmptyTrashConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty trash permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {trashedMovies.length} movie{trashedMovies.length !== 1 ? 's' : ''} from your Recently Deleted list. This cannot be undone.
              <span className="block mt-2 font-medium text-foreground">
                No files will be deleted from your system. Your actual movie files will remain untouched.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={emptyTrash}
              data-testid="confirm-empty-trash-btn"
            >
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
