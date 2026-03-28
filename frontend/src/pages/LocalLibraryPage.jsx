import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Grid2X2,
  ArrowUpDown,
  ChevronDown,
  FolderHeart,
  Plus,
  Check,
  ArrowUp,
  FilePlus2,
  Edit2,
  Sparkles,
  Wand2,
  Users,
  RotateCcw,
  X,
  Star
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import LocalDirectoryBrowser from "@/components/LocalDirectoryBrowser";
import { CollectionAssigner } from "@/components/CollectionAssigner";
import { PopcornAnimation, ClapperAnimation, FireworksOverlay, useMilestone } from "@/components/FunEffects";

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
const SORT_KEY = 'obsidian_cinema_sort';
const COLLECTIONS_KEY = 'obsidian_cinema_collections';
const SKIP_REMOVE_CONFIRM_KEY = 'obsidian_cinema_skip_remove_confirm';
const SKIP_POSTER_TIP_KEY = 'obsidian_cinema_skip_poster_tip';
const SKIP_NAMING_TIP_KEY = 'obsidian_cinema_skip_naming_tip';
const ACTIVITY_KEY = 'obsidian_cinema_activity';
const FAVORITES_KEY = 'obsidian_cinema_favorites';

// 30 days in milliseconds
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// Sort options
const SORT_OPTIONS = {
  'title-asc':      { label: 'Title A → Z',         group: 'title' },
  'title-desc':     { label: 'Title Z → A',         group: 'title' },
  'year-desc':      { label: 'Year (Newest)',        group: 'year' },
  'year-asc':       { label: 'Year (Oldest)',        group: 'year' },
  'rating-desc':    { label: 'Rating (Highest)',     group: 'rating' },
  'rating-asc':     { label: 'Rating (Lowest)',      group: 'rating' },
  'added-desc':     { label: 'Recently Added',       group: 'added' },
  'added-asc':      { label: 'First Added',          group: 'added' },
  'directory':      { label: 'By Directory',         group: 'directory' },
  'filename-asc':   { label: 'Filename A → Z',      group: 'filename' },
  'filename-desc':  { label: 'Filename Z → A',      group: 'filename' },
  'has-poster':     { label: 'Has Poster First',     group: 'misc' },
  'no-poster':      { label: 'Missing Poster First', group: 'misc' },
};

// Grid size configurations
const GRID_SIZES = {
  small:  { label: 'S', cols: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10', gap: 'gap-2' },
  medium: { label: 'M', cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7', gap: 'gap-3' },
  large:  { label: 'L', cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', gap: 'gap-4' },
};

// Reusable movie card component
function MovieCard({ movie, gridSize, onClick, onPlay, isFavorite, onToggleFavorite }) {
  var [showConfetti, setShowConfetti] = useState(false);
  var [showShimmer, setShowShimmer] = useState(false);

  var handleFavorite = function(e) {
    if (!isFavorite) {
      setShowConfetti(true);
      setTimeout(function() { setShowConfetti(false); }, 1000);
    }
    onToggleFavorite(e);
  };

  var handlePosterLoad = function() {
    var key = 'oc_shimmer_' + movie.id;
    if (!sessionStorage.getItem(key)) {
      setShowShimmer(true);
      sessionStorage.setItem(key, '1');
      setTimeout(function() { setShowShimmer(false); }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative"
    >
      {showConfetti && (
        <div className="fav-confetti" style={{ position: 'absolute', top: '0.75rem', right: '1rem', zIndex: 50 }}>
          <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      )}
      <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
        <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-secondary relative flex items-center justify-center overflow-hidden">
          {movie.poster_path ? (
            <img src={movie.poster_path} alt={movie.title} className="w-full h-full object-cover" loading="lazy" onLoad={handlePosterLoad} />
          ) : (
            <Film className="w-12 h-12 text-primary/50" />
          )}
          {showShimmer && <div className="poster-shimmer" />}
          {/* Favorite star - top right */}
          <button
            className={'absolute top-1.5 right-1.5 z-10 p-1 rounded-full backdrop-blur-sm transition-all ' + (isFavorite ? 'bg-amber-500/20 animate-[favGlow_2s_ease-in-out_infinite]' : 'bg-black/40 hover:bg-black/60')}
            onClick={handleFavorite}
            data-testid={`fav-star-${movie.id}`}
          >
            <Star
              className={`w-4 h-4 transition-all duration-300 ${
                isFavorite 
                  ? 'text-amber-400 fill-amber-400 scale-110 animate-[favSpin_0.7s_ease-out]' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            />
          </button>
          {/* Play button - center */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button size="sm" onClick={onPlay}>
              <Play className="w-4 h-4 mr-1" /> Play
            </Button>
          </div>
          {/* Synopsis - bottom, only on hover */}
          {movie.overview && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-black/85 backdrop-blur-sm p-2 pointer-events-none">
              <p className="text-[10px] leading-snug text-gray-200 line-clamp-4">{movie.overview}</p>
            </div>
          )}
        </div>
        <CardContent className={gridSize === 'small' ? 'p-2' : 'p-3'}>
          <h3 className={`font-medium truncate ${gridSize === 'small' ? 'text-xs' : 'text-sm'}`}>{movie.title}</h3>
          {gridSize !== 'small' && (
            <div className="flex items-center justify-between">
              {movie.year && <p className="text-xs text-muted-foreground">{movie.year}</p>}
              {movie.rating && <p className="text-xs text-amber-400">★ {movie.rating.toFixed(1)}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CastRow({ cast, onClear }) {
  return (
    <div className="space-y-2" data-testid="cast-section">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Cast
        </p>
        {onClear && (
          <button
            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
            onClick={onClear}
            data-testid="clear-cast-btn"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {cast.map(function(actor, idx) {
          return (
            <div key={idx} className="flex flex-col items-center shrink-0 w-20" data-testid={'cast-member-' + idx}>
              {actor.profile_path ? (
                <img src={actor.profile_path} alt={actor.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
              <p className="text-[10px] font-medium text-center mt-1.5 leading-tight w-full">{actor.name}</p>
              <p className="text-[9px] text-muted-foreground text-center leading-tight w-full">{actor.character}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// TMDB API base URL
const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const TMDB_PROFILE = 'https://image.tmdb.org/t/p/w185';
const BACKEND_API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function LocalLibraryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState(() => searchParams.get('qf') || null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [fetchingPosters, setFetchingPosters] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [trashedMovies, setTrashedMovies] = useState([]);
  const [showTrash, setShowTrash] = useState(() => searchParams.get('view') === 'trash');
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [gridSize, setGridSize] = useState(() => localStorage.getItem(GRID_SIZE_KEY) || 'medium');
  const [sortBy, setSortBy] = useState(() => localStorage.getItem(SORT_KEY) || 'added-desc');
  const [posterMode, setPosterMode] = useState(null); // 'search' | 'url' | null
  const [posterSearch, setPosterSearch] = useState('');
  const [posterResults, setPosterResults] = useState([]);
  const [posterSearching, setPosterSearching] = useState(false);
  const [posterUrl, setPosterUrl] = useState('');
  const [editingYear, setEditingYear] = useState(false);
  const [yearInput, setYearInput] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisInput, setSynopsisInput] = useState('');
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [skipRemoveConfirm, setSkipRemoveConfirm] = useState(() => localStorage.getItem(SKIP_REMOVE_CONFIRM_KEY) === 'true');
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false);
  const [activeDirectory, setActiveDirectory] = useState(null);
  const [dirToRemove, setDirToRemove] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; }
  });
  const [dirToRename, setDirToRename] = useState(null);
  const [dirNewPath, setDirNewPath] = useState('');
  const [showDirManager, setShowDirManager] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const fetchAbortRef = useRef(false);
  const fetchCountRef = useRef({ fetched: 0, found: 0, total: 0 });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showPosterTip, setShowPosterTip] = useState(false);
  const [skipPosterTip, setSkipPosterTip] = useState(() => localStorage.getItem(SKIP_POSTER_TIP_KEY) === 'true');
  const [posterTipDontShow, setPosterTipDontShow] = useState(false);
  const [showNamingTip, setShowNamingTip] = useState(false);
  const [namingTipDontShow, setNamingTipDontShow] = useState(false);
  const [fetchingCast, setFetchingCast] = useState(false);
  const [castFetchProgress, setCastFetchProgress] = useState(0);
  const [milestone, dismissMilestone] = useMilestone(movies.length);

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
    }
    if (savedTrash) {
      // Auto-purge items older than 30 days
      const now = Date.now();
      const filtered = JSON.parse(savedTrash).filter(
        m => now - m.deleted_at < TRASH_RETENTION_MS
      );
      setTrashedMovies(filtered);
    }
    const savedCollections = localStorage.getItem(COLLECTIONS_KEY);
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
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

  // Save collections to localStorage
  useEffect(() => {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  }, [collections]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (movieId, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setFavorites(prev => {
      if (prev.includes(movieId)) {
        return prev.filter(id => id !== movieId);
      }
      return [...prev, movieId];
    });
  };

  // Save grid size preference
  useEffect(() => {
    localStorage.setItem(GRID_SIZE_KEY, gridSize);
    window.dispatchEvent(new Event('storage'));
  }, [gridSize]);

  // Sync grid size from StatusBar changes
  useEffect(() => {
    const onStorage = () => {
      const stored = localStorage.getItem(GRID_SIZE_KEY);
      if (stored && stored !== gridSize) setGridSize(stored);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [gridSize]);

  // Save sort preference
  useEffect(() => {
    localStorage.setItem(SORT_KEY, sortBy);
    window.dispatchEvent(new Event('storage'));
  }, [sortBy]);

  // Show scroll-to-top button after scrolling down
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Collection helpers
  const createCollection = (name) => {
    if (!name.trim()) return;
    const col = { id: Date.now().toString(), name: name.trim(), movie_ids: [], created_at: Date.now() };
    setCollections(prev => [...prev, col]);
    setNewCollectionName('');
    setShowNewCollectionInput(false);
    toast.success(`Collection "${col.name}" created`);
  };

  const toggleMovieInCollection = (collectionId, movieId) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c;
      const has = c.movie_ids.includes(movieId);
      return { ...c, movie_ids: has ? c.movie_ids.filter(id => id !== movieId) : [...c.movie_ids, movieId] };
    }));
  };

  const deleteCollection = (collectionId) => {
    setCollections(prev => prev.filter(c => c.id !== collectionId));
    if (activeCollection === collectionId) setActiveCollection(null);
    toast.success('Collection deleted');
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
        const movieData = {
          poster_path: result.poster_path ? `${TMDB_IMG}${result.poster_path}` : null,
          tmdb_id: result.id,
          overview: result.overview,
          rating: result.vote_average,
          release_date: result.release_date
        };
        // Also fetch cast
        try {
          const credResp = await fetch(`${TMDB_API}/movie/${result.id}/credits?api_key=${tmdbApiKey}`);
          const credData = await credResp.json();
          if (credData.cast) {
            movieData.cast = credData.cast.slice(0, 5).map(c => ({
              name: c.name,
              character: c.character,
              profile_path: c.profile_path ? TMDB_PROFILE + c.profile_path : null,
            }));
          }
        } catch (_) { /* cast fetch is optional */ }
        return movieData;
      }
    } catch (err) {
      console.error('TMDB fetch error:', err);
    }
    return null;
  };

  // Fetch cast only for a movie that already has tmdb_id
  const fetchCastForMovie = async (movie) => {
    if (!tmdbApiKey || !movie.tmdb_id) return null;
    try {
      const resp = await fetch(`${TMDB_API}/movie/${movie.tmdb_id}/credits?api_key=${tmdbApiKey}`);
      const data = await resp.json();
      if (data.cast) {
        return data.cast.slice(0, 5).map(c => ({
          name: c.name,
          character: c.character,
          profile_path: c.profile_path ? TMDB_PROFILE + c.profile_path : null,
        }));
      }
    } catch (_) {}
    return null;
  };

  // Update a single movie's poster
  const updateMoviePoster = (movieId, posterPath, metadata) => {
    setMovies(prev => prev.map(m => {
      if (m.id !== movieId) return m;
      const updated = { ...m, poster_path: posterPath };
      if (metadata) {
        if (metadata.overview) updated.overview = metadata.overview;
        if (metadata.rating) updated.rating = metadata.rating;
        if (metadata.year) updated.year = parseInt(metadata.year, 10) || m.year;
        if (metadata.genres) updated.genres = metadata.genres;
      }
      return updated;
    }));
    if (selectedMovie && selectedMovie.id === movieId) {
      const updated = { ...selectedMovie, poster_path: posterPath };
      if (metadata) {
        if (metadata.overview) updated.overview = metadata.overview;
        if (metadata.rating) updated.rating = metadata.rating;
        if (metadata.year) updated.year = parseInt(metadata.year, 10) || selectedMovie.year;
        if (metadata.genres) updated.genres = metadata.genres;
      }
      setSelectedMovie(updated);
    }
    setPosterMode(null);
    setPosterSearch('');
    setPosterResults([]);
    setPosterUrl('');
    toast.success('Poster updated!');
  };

  // Search TMDB for poster options
  const searchPosters = async (queryOverride) => {
    if (!tmdbApiKey) {
      toast.error('Add your TMDB API key in settings first');
      return;
    }
    const searchText = queryOverride || posterSearch;
    if (!searchText.trim()) return;

    setPosterSearching(true);
    try {
      const query = encodeURIComponent(searchText.trim());
      const resp = await fetch(TMDB_API + '/search/movie?api_key=' + tmdbApiKey + '&query=' + query);
      const data = await resp.json();
      var results = [];
      if (data.results) {
        for (var i = 0; i < Math.min(data.results.length, 8); i++) {
          var r = data.results[i];
          if (r.poster_path) {
            results.push({
              id: r.id,
              title: r.title,
              year: r.release_date ? r.release_date.substring(0, 4) : '',
              poster: TMDB_IMG + r.poster_path,
              overview: r.overview,
              rating: r.vote_average,
            });
          }
        }
      }
      setPosterResults(results);
      if (results.length === 0) toast.info('No posters found for that search');
    } catch (err) {
      toast.error('Search failed');
    }
    setPosterSearching(false);
  };

  // Browse for local image (Electron only)
  const browseLocalImage = async () => {
    if (isElectron() && window.electronAPI && window.electronAPI.openFileDialog) {
      try {
        var result = await window.electronAPI.openFileDialog({
          filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
          properties: ['openFile']
        });
        if (result && !result.canceled && result.filePaths && result.filePaths.length > 0 && selectedMovie) {
          updateMoviePoster(selectedMovie.id, 'file://' + result.filePaths[0]);
        }
      } catch (err) {
        toast.error('Could not open file browser');
      }
    }
  };

  // Apply URL as poster
  const applyPosterUrl = () => {
    if (!posterUrl.trim()) return;
    if (selectedMovie) {
      updateMoviePoster(selectedMovie.id, posterUrl.trim());
    }
  };

  // Remove poster
  const removePoster = () => {
    if (selectedMovie) {
      updateMoviePoster(selectedMovie.id, null);
    }
  };

  // Track movie activity (views and plays)
  const trackActivity = (movieId, type) => {
    try {
      var saved = localStorage.getItem(ACTIVITY_KEY);
      var activity = saved ? JSON.parse(saved) : {};
      if (!activity[movieId]) activity[movieId] = { views: 0, plays: 0, lastView: 0 };
      if (type === 'view') { activity[movieId].views++; activity[movieId].lastView = Date.now(); }
      if (type === 'play') { activity[movieId].plays++; }
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    } catch (e) {}
  };

  // Open movie detail with tracking
  const openMovieDetail = (movie) => {
    setSelectedMovie(movie);
    trackActivity(movie.id, 'view');
  };

  // Reset poster state when closing modal
  const closeDetail = () => {
    setSelectedMovie(null);
    setPosterMode(null);
    setPosterSearch('');
    setPosterResults([]);
    setPosterUrl('');
    setEditingYear(false);
    setEditingTitle(false);
    setEditingSynopsis(false);
    setAiSuggestions([]);
    setAiError(null);
  };

  // Reset movie metadata (poster, cast, synopsis, rating, tmdb_id)
  const resetMetadata = (movie) => {
    const cleaned = {
      ...movie,
      poster_path: null,
      cast: null,
      overview: null,
      rating: null,
      tmdb_id: null,
      genres: null,
    };
    setMovies(prev => prev.map(m => m.id === movie.id ? cleaned : m));
    setSelectedMovie(cleaned);
    toast.success('Metadata cleared for "' + (movie.title || movie.file_name) + '". You can now re-fetch from TMDB.');
  };

  // Remove a directory and all its movies
  const removeDirectory = (dirPath) => {
    const count = movies.filter(m => m.file_path && m.file_path.startsWith(dirPath)).length;
    setMovies(prev => prev.filter(m => !m.file_path || !m.file_path.startsWith(dirPath)));
    setDirectories(prev => prev.filter(d => d !== dirPath));
    if (activeDirectory === dirPath) setActiveDirectory(null);
    setDirToRemove(null);
    toast.success('Removed directory and ' + count + ' movies');
  };

  // Rename a directory — updates directory list and all movie file_paths
  const renameDirectory = () => {
    if (!dirToRename || !dirNewPath.trim()) return;
    const oldPath = dirToRename;
    const newPath = dirNewPath.trim();
    if (oldPath === newPath) { setDirToRename(null); return; }
    setDirectories(prev => prev.map(d => d === oldPath ? newPath : d));
    setMovies(prev => prev.map(m => {
      if (m.file_path && m.file_path.startsWith(oldPath)) {
        return { ...m, file_path: newPath + m.file_path.substring(oldPath.length) };
      }
      return m;
    }));
    if (activeDirectory === oldPath) setActiveDirectory(newPath);
    setDirToRename(null);
    setDirNewPath('');
    toast.success('Directory path updated');
  };

  // AI Movie Suggestions
  const fetchAiSuggestions = async (movie) => {
    setAiLoading(true);
    setAiError(null);
    setAiSuggestions([]);
    try {
      const toGenreStrings = (genres) => (genres || []).map(g => typeof g === 'object' && g.name ? g.name : String(g));
      const libraryMovies = movies.map(m => ({
        id: m.id,
        title: m.title || m.file_name,
        year: m.year || null,
        genres: toGenreStrings(m.genres),
        overview: m.overview ? m.overview.substring(0, 100) : null,
        rating: m.rating || null,
      }));
      const resp = await fetch(BACKEND_API + '/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_movie: {
            id: movie.id,
            title: movie.title || movie.file_name,
            year: movie.year || null,
            genres: toGenreStrings(movie.genres),
            overview: movie.overview || null,
            rating: movie.rating || null,
          },
          library_movies: libraryMovies,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to get suggestions');
      }
      const data = await resp.json();
      setAiSuggestions(data.suggestions || []);
      if (!data.suggestions || data.suggestions.length === 0) {
        setAiError('No similar movies found in your library');
      }
    } catch (e) {
      setAiError(e.message || 'Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  // Bulk fetch cast for movies that have tmdb_id but no cast data
  const fetchAllCast = async () => {
    if (!tmdbApiKey) {
      toast.error('Please add your TMDB API key in Settings first');
      return;
    }
    const needCast = movies.filter(m => m.tmdb_id && (!m.cast || m.cast.length === 0));
    if (needCast.length === 0) {
      toast.info('All movies with TMDB data already have cast info');
      return;
    }
    setFetchingCast(true);
    setCastFetchProgress(0);
    let fetched = 0;
    for (let i = 0; i < needCast.length; i++) {
      const movie = needCast[i];
      const cast = await fetchCastForMovie(movie);
      if (cast) {
        setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, cast } : m));
      }
      fetched++;
      setCastFetchProgress(Math.round((fetched / needCast.length) * 100));
      // Small delay to avoid rate limiting
      if (i < needCast.length - 1) await new Promise(r => setTimeout(r, 250));
    }
    setFetchingCast(false);
    toast.success('Cast data fetched for ' + fetched + ' movies');
  };

  // Fetch posters for all movies without posters
  const startFetchPosters = () => {
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
    if (!skipPosterTip) {
      setShowPosterTip(true);
      return;
    }
    fetchAllPosters();
  };

  const confirmPosterTip = () => {
    if (posterTipDontShow) {
      setSkipPosterTip(true);
      localStorage.setItem(SKIP_POSTER_TIP_KEY, 'true');
    }
    setShowPosterTip(false);
    setPosterTipDontShow(false);
    fetchAllPosters();
  };

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

    fetchAbortRef.current = false;
    fetchCountRef.current = { fetched: 0, found: 0, total: moviesNeedingPosters.length };
    setFetchingPosters(true);
    setFetchProgress(0);

    let fetched = 0;
    let found = 0;

    for (var i = 0; i < moviesNeedingPosters.length; i++) {
      // Check abort
      if (fetchAbortRef.current) {
        toast.info('Poster fetch paused — ' + found + ' of ' + fetched + ' processed saved. Click "Fetch Posters" to continue where you left off.');
        break;
      }

      const movie = moviesNeedingPosters[i];
      const tmdbData = await fetchPosterForMovie(movie);

      if (tmdbData) {
        // Save each poster immediately so progress is never lost
        setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, ...tmdbData } : m));
        found++;
      }

      fetched++;
      fetchCountRef.current = { fetched: fetched, found: found, total: moviesNeedingPosters.length };
      setFetchProgress((fetched / moviesNeedingPosters.length) * 100);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 250));
    }

    setFetchingPosters(false);
    if (!fetchAbortRef.current) {
      toast.success('Done! Found posters for ' + found + ' of ' + fetched + ' movies.');
    }
  };

  const abortFetch = () => {
    fetchAbortRef.current = true;
  };

  const handleMoviesFound = (newMovies, dirPath) => {
    // Add directory if not already added
    if (!directories.includes(dirPath)) {
      setDirectories([...directories, dirPath]);
    }

    // Merge movies, avoiding duplicates by file path
    const existingPaths = new Set(movies.map(m => m.file_path));
    const now = Date.now();
    const uniqueNewMovies = newMovies
      .filter(m => !existingPaths.has(m.file_path))
      .map(m => ({ ...m, added_at: now }));
    
    setMovies([...movies, ...uniqueNewMovies]);
    toast.success(`Added ${uniqueNewMovies.length} new movies to library`);
  };

  const handleAddFiles = () => {
    if (localStorage.getItem(SKIP_NAMING_TIP_KEY) === 'true') {
      addIndividualFiles();
    } else {
      setShowNamingTip(true);
    }
  };

  const confirmNamingTip = () => {
    if (namingTipDontShow) {
      localStorage.setItem(SKIP_NAMING_TIP_KEY, 'true');
    }
    setShowNamingTip(false);
    setNamingTipDontShow(false);
    addIndividualFiles();
  };

  const addIndividualFiles = async () => {
    if (!isElectron() || !window.electronAPI?.openFileDialog) return;
    try {
      const result = await window.electronAPI.openFileDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Video Files', extensions: ['mp4','mkv','avi','mov','wmv','flv','webm','m4v','mpg','mpeg','3gp','ts'] }],
        title: 'Select movie files to add'
      });
      if (result.canceled || !result.filePaths?.length) return;

      const existingPaths = new Set(movies.map(m => m.file_path));
      const now = Date.now();
      const newMovies = result.filePaths
        .filter(fp => !existingPaths.has(fp))
        .map(fp => {
          const fileName = fp.split(/[\\/]/).pop();
          const ext = '.' + fileName.split('.').pop().toLowerCase();
          const nameWithoutExt = fileName.replace(new RegExp(ext.replace('.', '\\.') + '$', 'i'), '');
          const yearMatch = nameWithoutExt.match(/[\(\[\s]*(19|20)\d{2}[\)\]\s]*/);
          const year = yearMatch ? parseInt(yearMatch[0].replace(/[\(\[\]\)\s]/g, '')) : null;
          const title = nameWithoutExt
            .replace(/[\(\[\s]*(19|20)\d{2}[\)\]\s]*/g, '')
            .replace(/\./g, ' ')
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          return { id: Date.now().toString() + Math.random().toString(36).slice(2, 8), file_path: fp, file_name: fileName, title, year, added_at: now };
        });

      if (newMovies.length > 0) {
        setMovies(prev => [...prev, ...newMovies]);
        toast.success(`Added ${newMovies.length} movie${newMovies.length > 1 ? 's' : ''} to library`);
      } else {
        toast.info('Selected files are already in your library');
      }
    } catch (err) {
      console.error('File selection failed:', err);
      toast.error('Failed to add files');
    }
  };

  const [isRescanning, setIsRescanning] = useState(false);

  const rescanDirectory = async (dirPath) => {
    if (!isElectron() || !window.electronAPI?.scanForVideos) return;
    setIsRescanning(true);
    try {
      const scannedFiles = await window.electronAPI.scanForVideos(dirPath, true);
      const scannedPaths = new Set(scannedFiles.map(f => f.file_path));
      const existingPaths = new Set(movies.filter(m => m.file_path.startsWith(dirPath)).map(m => m.file_path));

      // Find new files (in scan but not in library)
      const now = Date.now();
      const newMovies = scannedFiles
        .filter(f => !existingPaths.has(f.file_path))
        .map(f => ({ ...f, added_at: now }));

      // Find removed files (in library but no longer on disk)
      const removedPaths = [...existingPaths].filter(p => !scannedPaths.has(p));

      let updated = movies;
      if (removedPaths.length > 0) {
        const removedSet = new Set(removedPaths);
        updated = updated.filter(m => !removedSet.has(m.file_path));
      }
      if (newMovies.length > 0) {
        updated = [...updated, ...newMovies];
      }

      setMovies(updated);

      const parts = [];
      if (newMovies.length > 0) parts.push(`${newMovies.length} added`);
      if (removedPaths.length > 0) parts.push(`${removedPaths.length} removed`);
      if (parts.length === 0) {
        toast.info('Directory is up to date — no changes found');
      } else {
        toast.success(`Directory updated: ${parts.join(', ')}`);
      }
    } catch (err) {
      console.error('Rescan failed:', err);
      toast.error('Failed to rescan directory');
    } finally {
      setIsRescanning(false);
    }
  };

  const rescanAllDirectories = async () => {
    if (!isElectron() || !window.electronAPI?.scanForVideos || directories.length === 0) return;
    setIsRescanning(true);
    try {
      let allScanned = [];
      for (const dir of directories) {
        try {
          const files = await window.electronAPI.scanForVideos(dir, true);
          allScanned = allScanned.concat(files);
        } catch (e) {
          console.error('Failed to scan:', dir, e);
        }
      }

      const scannedPaths = new Set(allScanned.map(f => f.file_path));
      const dirSet = new Set(directories);
      const existingInDirs = movies.filter(m => {
        return directories.some(d => m.file_path.startsWith(d));
      });
      const existingPaths = new Set(existingInDirs.map(m => m.file_path));

      const now = Date.now();
      const newMovies = allScanned
        .filter(f => !existingPaths.has(f.file_path))
        .map(f => ({ ...f, added_at: now }));

      const removedPaths = [...existingPaths].filter(p => !scannedPaths.has(p));

      let updated = movies;
      if (removedPaths.length > 0) {
        const removedSet = new Set(removedPaths);
        updated = updated.filter(m => !removedSet.has(m.file_path));
      }
      if (newMovies.length > 0) {
        updated = [...updated, ...newMovies];
      }

      setMovies(updated);

      const parts = [];
      if (newMovies.length > 0) parts.push(`${newMovies.length} added`);
      if (removedPaths.length > 0) parts.push(`${removedPaths.length} removed`);
      if (parts.length === 0) {
        toast.info('All directories are up to date — no changes found');
      } else {
        toast.success(`Library updated: ${parts.join(', ')}`);
      }
    } catch (err) {
      console.error('Rescan all failed:', err);
      toast.error('Failed to update library');
    } finally {
      setIsRescanning(false);
    }
  };

  const playMovie = (movie) => {
    trackActivity(movie.id, 'play');
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

  // Helper: extract directory from file path
  const getDirectory = (filePath) => {
    if (!filePath) return '';
    const sep = filePath.includes('/') ? '/' : '\\';
    return filePath.substring(0, filePath.lastIndexOf(sep));
  };

  // Sort function
  const sortMovies = (movieList) => {
    const sorted = [...movieList];
    switch (sortBy) {
      case 'title-asc':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'title-desc':
        return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      case 'year-desc':
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'year-asc':
        return sorted.sort((a, b) => (a.year || 9999) - (b.year || 9999));
      case 'rating-desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'rating-asc':
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'added-desc':
        return sorted.sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
      case 'added-asc':
        return sorted.sort((a, b) => (a.added_at || 0) - (b.added_at || 0));
      case 'directory':
        return sorted.sort((a, b) => {
          const dirA = getDirectory(a.file_path);
          const dirB = getDirectory(b.file_path);
          const dirCompare = dirA.localeCompare(dirB);
          return dirCompare !== 0 ? dirCompare : (a.title || '').localeCompare(b.title || '');
        });
      case 'filename-asc':
        return sorted.sort((a, b) => (a.file_name || '').localeCompare(b.file_name || ''));
      case 'filename-desc':
        return sorted.sort((a, b) => (b.file_name || '').localeCompare(a.file_name || ''));
      case 'has-poster':
        return sorted.sort((a, b) => (b.poster_path ? 1 : 0) - (a.poster_path ? 1 : 0));
      case 'no-poster':
        return sorted.sort((a, b) => (a.poster_path ? 1 : 0) - (b.poster_path ? 1 : 0));
      default:
        return sorted;
    }
  };

  // Pre-compute recent movie IDs once (not per-movie)
  var recentIds = null;
  if (quickFilter === 'recent') {
    var recentSorted = movies.filter(function(m) { return m.added_at; }).sort(function(a, b) { return (b.added_at || 0) - (a.added_at || 0); });
    recentIds = new Set(recentSorted.slice(0, 100).map(function(m) { return m.id; }));
  }

  const filteredMovies = sortMovies(
    movies.filter(movie => {
      // Quick filter
      if (quickFilter === 'no-poster' && movie.poster_path) return false;
      if (quickFilter === 'no-rating' && movie.rating) return false;
      if (quickFilter === 'no-year' && movie.year) return false;
      if (quickFilter === 'favorites' && !favorites.includes(movie.id)) return false;
      if (quickFilter === 'recent' && !recentIds.has(movie.id)) return false;
      // Directory filter
      if (activeDirectory) {
        if (!movie.file_path?.startsWith(activeDirectory)) return false;
      }
      // Collection filter
      if (activeCollection) {
        const col = collections.find(c => c.id === activeCollection);
        if (col && !col.movie_ids.includes(movie.id)) return false;
      }
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return movie.title?.toLowerCase().includes(query) || 
             movie.file_name?.toLowerCase().includes(query);
    })
  );

  const displayedMovies = filteredMovies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMovies.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(100);
  }, [activeDirectory, activeCollection, searchQuery, sortBy, quickFilter]);

  // Sync quickFilter with URL search params
  useEffect(() => {
    const qf = searchParams.get('qf');
    if (qf !== quickFilter) setQuickFilter(qf);
  }, [searchParams]);

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
      {/* Milestone fireworks */}
      {milestone && <FireworksOverlay onComplete={dismissMilestone} />}
      {milestone && (
        <div className="milestone-banner" onClick={dismissMilestone}>
          {milestone.toLocaleString()} movies in your library! 
        </div>
      )}
      {/* Header */}
      <div className="space-y-3">
        {/* Row 1: Title + Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Film className="w-6 h-6 text-primary" />
              Local Library
            </h1>
            <p className="text-muted-foreground">
              {movies.length} movies from {directories.length} folders
            </p>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search movies, genres, years..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-12 h-9 text-sm"
              data-testid="movie-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="movie-search-clear-btn"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {/* Row 2: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <LocalDirectoryBrowser onMoviesFound={handleMoviesFound} />
          <Button variant="outline" size="sm" onClick={handleAddFiles} data-testid="add-files-btn" title="Add individual movie files">
            <FilePlus2 className="w-4 h-4 mr-1" />
            <span className="text-xs">Add Files</span>
          </Button>
          {directories.length > 0 && (
            <Button variant="outline" size="sm" onClick={rescanAllDirectories} disabled={isRescanning} data-testid="update-library-btn" title="Rescan all directories for changes">
              <RefreshCw className={`w-4 h-4 mr-1 ${isRescanning ? 'animate-spin' : ''}`} />
              <span className="text-xs">{isRescanning ? 'Scanning...' : 'Update Library'}</span>
            </Button>
          )}
          <div className="flex-1" />
          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="sort-dropdown">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-xs">{SORT_OPTIONS[sortBy]?.label}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('title-asc')} className={sortBy === 'title-asc' ? 'bg-accent' : ''}>
                Title A → Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title-desc')} className={sortBy === 'title-desc' ? 'bg-accent' : ''}>
                Title Z → A
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('year-desc')} className={sortBy === 'year-desc' ? 'bg-accent' : ''}>
                Year (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('year-asc')} className={sortBy === 'year-asc' ? 'bg-accent' : ''}>
                Year (Oldest)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('rating-desc')} className={sortBy === 'rating-desc' ? 'bg-accent' : ''}>
                Rating (Highest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('rating-asc')} className={sortBy === 'rating-asc' ? 'bg-accent' : ''}>
                Rating (Lowest)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('added-desc')} className={sortBy === 'added-desc' ? 'bg-accent' : ''}>
                Recently Added
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('added-asc')} className={sortBy === 'added-asc' ? 'bg-accent' : ''}>
                First Added
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('directory')} className={sortBy === 'directory' ? 'bg-accent' : ''}>
                By Directory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('filename-asc')} className={sortBy === 'filename-asc' ? 'bg-accent' : ''}>
                Filename A → Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('filename-desc')} className={sortBy === 'filename-desc' ? 'bg-accent' : ''}>
                Filename Z → A
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('has-poster')} className={sortBy === 'has-poster' ? 'bg-accent' : ''}>
                Has Poster First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('no-poster')} className={sortBy === 'no-poster' ? 'bg-accent' : ''}>
                Missing Poster First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {movies.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startFetchPosters}
              disabled={fetchingPosters}
              data-testid="fetch-posters-btn"
            >
              {fetchingPosters ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Image className="w-4 h-4 mr-2" />
              )}
              {fetchingPosters 
                ? 'Fetching...' 
                : (function() {
                    var missing = movies.filter(function(m) { return !m.poster_path; }).length;
                    return missing > 0 ? 'Fetch Posters (' + missing + ')' : 'Fetch Posters';
                  })()
              }
            </Button>
          )}
        </div>
      </div>

      {/* Poster Fetch Progress */}
      {fetchingPosters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Fetching posters from TMDB...</span>
            <span>{fetchCountRef.current.found} found / {fetchCountRef.current.fetched} of {fetchCountRef.current.total} checked ({Math.round(fetchProgress)}%)</span>
          </div>
          <Progress value={fetchProgress} />
          <Button
            variant="outline"
            size="sm"
            onClick={abortFetch}
            className="text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
            data-testid="abort-fetch-btn"
          >
            Pause — Save Progress
          </Button>
        </div>
      )}

      {/* TMDB API Key Warning */}
      {!tmdbApiKey && movies.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span className="text-sm">Add your TMDB API key to fetch movie posters</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
            Add Key
          </Button>
        </div>
      )}

      {/* Directory Filter */}
      {directories.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="directory-filter">
          <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
          <Button
            variant={activeDirectory === null ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs rounded-full px-3"
            onClick={() => setActiveDirectory(null)}
            data-testid="dir-filter-all"
          >
            All Directories
            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">{movies.length}</Badge>
          </Button>
          {directories.map((dir, i) => {
            const count = movies.filter(m => m.file_path?.startsWith(dir)).length;
            const label = dir.split(/[\\/]/).pop() || dir;
            return (
              <Button
                key={i}
                variant={activeDirectory === dir ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs rounded-full px-3 gap-1"
                onClick={() => setActiveDirectory(activeDirectory === dir ? null : dir)}
                title={dir}
                data-testid={`dir-filter-${i}`}
              >
                {label}
                <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{count}</Badge>
              </Button>
            );
          })}
          {directories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setShowDirManager(true)}
              title="Manage directories"
              data-testid="manage-dirs-btn"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Collections Filter */}
      {collections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="collections-filter">
          <FolderHeart className="w-4 h-4 text-muted-foreground" />
          <Button
            variant={activeCollection === null ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs rounded-full px-3"
            onClick={() => setActiveCollection(null)}
            data-testid="collection-filter-all"
          >
            All Movies
          </Button>
          {collections.map(col => (
            <Button
              key={col.id}
              variant={activeCollection === col.id ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-full px-3 gap-1.5"
              onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
              data-testid={`collection-filter-${col.id}`}
            >
              {col.name}
              <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{col.movie_ids.length}</Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Scanned Directories */}
      {directories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {directories.map((dir, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => rescanDirectory(dir)}
              title={`Click to rescan: ${dir}`}
              data-testid={`rescan-dir-${i}`}
            >
              <HardDrive className="w-3 h-3" />
              {dir.length > 40 ? '...' + dir.slice(-40) : dir}
              <RefreshCw className={`w-3 h-3 ml-0.5 ${isRescanning ? 'animate-spin' : 'opacity-50'}`} />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowTrash(false); navigate('/'); }}
                data-testid="trash-back-btn"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                Back
              </Button>
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
            <PopcornAnimation size="lg" />
            <h2 className="text-xl font-semibold">No Movies Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Click "Browse Local Drives" above to scan a folder for video files. 
              The app will find all movies and add them to your library.
            </p>
          </div>
        </Card>
      ) : (
        sortBy === 'directory' ? (
          /* Grouped by directory view */
          <div className="space-y-6">
            {Object.entries(
              displayedMovies.reduce((groups, movie) => {
                const dir = getDirectory(movie.file_path) || 'Unknown';
                if (!groups[dir]) groups[dir] = [];
                groups[dir].push(movie);
                return groups;
              }, {})
            ).map(([dir, dirMovies]) => (
              <div key={dir}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-medium text-muted-foreground truncate">{dir}</h3>
                  <Badge variant="secondary" className="text-xs">{dirMovies.length}</Badge>
                </div>
                <div className={`grid ${GRID_SIZES[gridSize].cols} ${GRID_SIZES[gridSize].gap}`}>
                  {dirMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} gridSize={gridSize} onClick={() => openMovieDetail(movie)} onPlay={(e) => { e.stopPropagation(); playMovie(movie); }} isFavorite={favorites.includes(movie.id)} onToggleFavorite={(e) => toggleFavorite(movie.id, e)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className={`grid ${GRID_SIZES[gridSize].cols} ${GRID_SIZES[gridSize].gap}`}>
          {displayedMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} gridSize={gridSize} onClick={() => openMovieDetail(movie)} onPlay={(e) => { e.stopPropagation(); playMovie(movie); }} isFavorite={favorites.includes(movie.id)} onToggleFavorite={(e) => toggleFavorite(movie.id, e)} />
          ))}
        </div>
        )
      )}

      {/* Load More */}
      {hasMore && !showTrash && (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-xs text-muted-foreground">
            Showing {displayedMovies.length} of {filteredMovies.length} movies
          </p>
          <Button
            variant="outline"
            onClick={() => setVisibleCount(prev => prev + 100)}
            data-testid="load-more-btn"
          >
            Load More
          </Button>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <Button
          className="fixed bottom-12 right-6 z-40 rounded-full px-4 h-10 shadow-lg bg-primary hover:bg-primary/90 flex items-center gap-2"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          data-testid="scroll-to-top-btn"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="text-sm font-medium">Back to top</span>
        </Button>
      )}

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
             onClick={closeDetail}>
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <div 
                  className="w-24 h-36 rounded-lg overflow-hidden bg-secondary flex items-center justify-center cursor-pointer group relative shrink-0"
                  onClick={() => { if (posterMode) { setPosterMode(null); } else { setPosterMode('search'); setPosterSearch(selectedMovie.title || ''); searchPosters(selectedMovie.title || ''); } }}
                  data-testid="poster-change-trigger"
                >
                  {selectedMovie.poster_path ? (
                    <>
                      <img src={selectedMovie.poster_path} alt={selectedMovie.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Image className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Image className="w-6 h-6 mx-auto text-muted-foreground/50 mb-1" />
                      <p className="text-[10px] text-muted-foreground">Click to add poster</p>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {editingTitle ? (
                    <div className="flex items-center gap-1.5" data-testid="edit-title-input-wrapper">
                      <Input
                        className="text-lg font-bold h-8"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = titleInput.trim();
                            if (val) {
                              setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, title: val } : m));
                              setSelectedMovie(prev => ({ ...prev, title: val }));
                              toast.success('Title updated');
                            }
                            setEditingTitle(false);
                          }
                          if (e.key === 'Escape') setEditingTitle(false);
                        }}
                        onBlur={() => {
                          const val = titleInput.trim();
                          if (val && val !== selectedMovie.title) {
                            setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, title: val } : m));
                            setSelectedMovie(prev => ({ ...prev, title: val }));
                            toast.success('Title updated');
                          }
                          setEditingTitle(false);
                        }}
                        autoFocus
                        data-testid="edit-title-input"
                      />
                    </div>
                  ) : (
                    <h2
                      className="text-xl font-bold cursor-pointer hover:text-primary transition-colors group flex items-center gap-1.5"
                      onClick={() => { setEditingTitle(true); setTitleInput(selectedMovie.title || selectedMovie.file_name || ''); }}
                      title="Click to edit title"
                      data-testid="movie-title-editable"
                    >
                      {selectedMovie.title}
                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 text-muted-foreground" />
                    </h2>
                  )}
                  {editingYear ? (
                    <div className="flex items-center gap-1.5" data-testid="edit-year-input-wrapper">
                      <Input
                        type="number"
                        min="1888"
                        max="2099"
                        value={yearInput}
                        onChange={(e) => setYearInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = yearInput.trim();
                            const parsed = val === '' ? null : parseInt(val, 10);
                            if (val !== '' && (isNaN(parsed) || parsed < 1888 || parsed > 2099)) {
                              toast.error('Please enter a valid year (1888–2099)');
                              return;
                            }
                            setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, year: parsed } : m));
                            setSelectedMovie(prev => ({ ...prev, year: parsed }));
                            setEditingYear(false);
                            toast.success(parsed ? `Year updated to ${parsed}` : 'Year removed');
                          }
                          if (e.key === 'Escape') setEditingYear(false);
                        }}
                        className="h-7 w-24 text-sm"
                        autoFocus
                        placeholder="Year"
                        data-testid="edit-year-input"
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          const val = yearInput.trim();
                          const parsed = val === '' ? null : parseInt(val, 10);
                          if (val !== '' && (isNaN(parsed) || parsed < 1888 || parsed > 2099)) {
                            toast.error('Please enter a valid year (1888–2099)');
                            return;
                          }
                          setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, year: parsed } : m));
                          setSelectedMovie(prev => ({ ...prev, year: parsed }));
                          setEditingYear(false);
                          toast.success(parsed ? `Year updated to ${parsed}` : 'Year removed');
                        }}
                        data-testid="confirm-year-btn"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="group flex items-center gap-1.5 cursor-pointer"
                      onClick={() => {
                        setYearInput(selectedMovie.year ? String(selectedMovie.year) : '');
                        setEditingYear(true);
                      }}
                      data-testid="edit-year-btn"
                    >
                      <p className="text-muted-foreground">
                        {selectedMovie.year || 'No year'}
                      </p>
                      <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {selectedMovie.rating && (
                    <p className="text-amber-400">★ {selectedMovie.rating.toFixed(1)}</p>
                  )}
                </div>
              </div>

              {editingSynopsis ? (
                <div className="space-y-2" data-testid="edit-synopsis-wrapper">
                  <textarea
                    className="w-full min-h-[80px] p-2 text-sm bg-secondary border border-border rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    value={synopsisInput}
                    onChange={(e) => setSynopsisInput(e.target.value)}
                    placeholder="Enter or paste a synopsis..."
                    autoFocus
                    data-testid="edit-synopsis-input"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="text-xs h-7" onClick={() => {
                      var val = synopsisInput.trim();
                      setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, overview: val || null } : m));
                      setSelectedMovie(prev => ({ ...prev, overview: val || null }));
                      setEditingSynopsis(false);
                      toast.success(val ? 'Synopsis updated' : 'Synopsis cleared');
                    }} data-testid="save-synopsis-btn">Save</Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingSynopsis(false)}>Cancel</Button>
                    <span className="ml-auto text-[10px] text-muted-foreground/50">Ctrl+V to paste</span>
                  </div>
                </div>
              ) : selectedMovie.overview ? (
                <p
                  className="text-sm text-muted-foreground line-clamp-3 cursor-pointer hover:text-foreground transition-colors group flex items-start gap-1"
                  onClick={() => { setEditingSynopsis(true); setSynopsisInput(selectedMovie.overview); }}
                  title="Click to edit synopsis"
                  data-testid="synopsis-editable"
                >
                  <span className="flex-1">{selectedMovie.overview}</span>
                  <Edit2 className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-50 text-muted-foreground shrink-0" />
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      if (!tmdbApiKey) { toast.error('Add your TMDB API key in Settings first'); return; }
                      try {
                        const query = encodeURIComponent(selectedMovie.title);
                        const resp = await fetch(TMDB_API + '/search/movie?api_key=' + tmdbApiKey + '&query=' + query);
                        const data = await resp.json();
                        if (data.results && data.results.length > 0) {
                          const best = data.results[0];
                          const meta = {};
                          if (best.overview) meta.overview = best.overview;
                          if (best.vote_average) meta.rating = best.vote_average;
                          if (best.release_date) meta.year = best.release_date.substring(0, 4);
                          if (best.poster_path && !selectedMovie.poster_path) meta.poster_path = TMDB_IMG + best.poster_path;
                          meta.tmdb_id = best.id;
                          try {
                            const credResp = await fetch(TMDB_API + '/movie/' + best.id + '/credits?api_key=' + tmdbApiKey);
                            const credData = await credResp.json();
                            if (credData.cast) {
                              meta.cast = credData.cast.slice(0, 5).map(function(c) {
                                return { name: c.name, character: c.character, profile_path: c.profile_path ? TMDB_PROFILE + c.profile_path : null };
                              });
                            }
                          } catch (_) {}
                          setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, ...meta } : m));
                          setSelectedMovie(prev => ({ ...prev, ...meta }));
                          toast.success('Metadata updated from TMDB');
                        } else {
                          toast.info('No results found on TMDB for "' + selectedMovie.title + '"');
                        }
                      } catch (e) {
                        toast.error('Failed to fetch metadata');
                      }
                    }}
                    data-testid="fetch-metadata-btn"
                  >
                    <Search className="w-3 h-3 mr-1.5" />
                    Fetch from TMDB
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => { setEditingSynopsis(true); setSynopsisInput(''); }}
                    data-testid="add-synopsis-manual-btn"
                  >
                    <Edit2 className="w-3 h-3 mr-1.5" />
                    Add manually
                  </Button>
                </div>
              )}

              {/* Cast Section */}
              {selectedMovie.cast && selectedMovie.cast.length > 0 ? (
                <CastRow cast={selectedMovie.cast} onClear={() => {
                  setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, cast: null } : m));
                  setSelectedMovie(prev => ({ ...prev, cast: null }));
                  toast.success('Cast cleared');
                }} />
              ) : selectedMovie.tmdb_id && tmdbApiKey ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground w-full"
                  onClick={async () => {
                    var castData = await fetchCastForMovie(selectedMovie);
                    if (castData) {
                      setMovies(function(prev) { return prev.map(function(m) { return m.id === selectedMovie.id ? Object.assign({}, m, { cast: castData }) : m; }); });
                      setSelectedMovie(function(prev) { return Object.assign({}, prev, { cast: castData }); });
                      toast.success('Cast loaded');
                    } else {
                      toast.info('No cast data found');
                    }
                  }}
                  data-testid="fetch-cast-single-btn"
                >
                  <Users className="w-3 h-3 mr-1.5" /> Load cast from TMDB
                </Button>
              ) : null}

              {/* Poster Management */}
              {posterMode && (
                <div className="space-y-3 p-3 border border-border rounded-lg bg-secondary/30" data-testid="poster-editor">
                  {/* Mode Tabs */}
                  <div className="flex gap-1">
                    <Button
                      variant={posterMode === 'search' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => { setPosterMode('search'); if (posterSearch.trim()) searchPosters(posterSearch); }}
                      className="text-xs flex-1"
                    >
                      <Search className="w-3 h-3 mr-1" /> Search TMDB
                    </Button>
                    <Button
                      variant={posterMode === 'url' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPosterMode('url')}
                      className="text-xs flex-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Image URL
                    </Button>
                    {isElectron() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={browseLocalImage}
                        className="text-xs flex-1"
                      >
                        <FolderOpen className="w-3 h-3 mr-1" /> Local File
                      </Button>
                    )}
                  </div>

                  {/* TMDB Search */}
                  {posterMode === 'search' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search movie title..."
                          value={posterSearch}
                          onChange={(e) => setPosterSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchPosters()}
                          className="text-sm h-8"
                          data-testid="poster-search-input"
                        />
                        <Button size="sm" onClick={searchPosters} disabled={posterSearching} className="h-8">
                          {posterSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        </Button>
                      </div>
                      {posterResults.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                          {posterResults.map(function(result) {
                            return (
                              <div
                                key={result.id}
                                className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                                onClick={() => updateMoviePoster(selectedMovie.id, result.poster, { overview: result.overview, rating: result.rating, year: result.year })}
                                data-testid={'poster-result-' + result.id}
                              >
                                <img src={result.poster} alt={result.title} className="w-full aspect-[2/3] object-cover" />
                                {result.year && (
                                  <span className="absolute top-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                    {result.year}
                                  </span>
                                )}
                                <p className="text-xs p-1.5 truncate font-medium">{result.title}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* URL Input */}
                  {posterMode === 'url' && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/poster.jpg"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyPosterUrl()}
                        className="text-sm h-8"
                        data-testid="poster-url-input"
                      />
                      <Button size="sm" onClick={applyPosterUrl} className="h-8">Apply</Button>
                    </div>
                  )}

                  {/* Remove poster option */}
                  {selectedMovie.poster_path && (
                    <Button variant="ghost" size="sm" onClick={removePoster} className="text-xs text-destructive hover:text-destructive w-full">
                      Remove current poster
                    </Button>
                  )}

                  {/* Local file tip */}
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Store local poster images in a dedicated folder like <code className="px-1 py-0.5 bg-secondary rounded font-mono">C:\Users\YourName\Pictures\MoviePosters</code> so they aren't accidentally moved or deleted.
                  </p>
                </div>
              )}
              
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">File path:</p>
                <p className="font-mono text-sm break-all">{selectedMovie.file_path}</p>
              </div>

              {/* Add to Collection */}
              <CollectionAssigner
                movieId={selectedMovie.id}
                collections={collections}
                toggleMovieInCollection={toggleMovieInCollection}
                createCollection={createCollection}
              />

              {/* AI Movie Suggestions */}
              {movies.length > 1 && (
                <div className="space-y-2" data-testid="ai-suggestions-section">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" /> AI Suggestions
                    </p>
                  </div>
                  {aiSuggestions.length === 0 && !aiLoading && !aiError && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={() => fetchAiSuggestions(selectedMovie)}
                      data-testid="get-ai-suggestions-btn"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      If you liked this, you might also enjoy...
                    </Button>
                  )}
                  {aiLoading && (
                    <div className="py-4" data-testid="ai-loading">
                      <ClapperAnimation text="Finding similar movies..." />
                    </div>
                  )}
                  {aiError && !aiLoading && (
                    <p className="text-xs text-muted-foreground text-center py-2" data-testid="ai-error">{aiError}</p>
                  )}
                  {aiSuggestions.length > 0 && (
                    <div className="space-y-1.5" data-testid="ai-suggestions-list">
                      {aiSuggestions.map(function(suggestion) {
                        const match = movies.find(m => m.id === suggestion.id);
                        return (
                          <div
                            key={suggestion.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                            onClick={() => {
                              if (match) {
                                setAiSuggestions([]);
                                setAiError(null);
                                setSelectedMovie(match);
                              }
                            }}
                            data-testid={'ai-suggestion-' + suggestion.id}
                          >
                            {match?.poster_path ? (
                              <img src={match.poster_path} alt="" className="w-8 h-12 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center shrink-0">
                                <Film className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{suggestion.title}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">{suggestion.reason}</p>
                            </div>
                            {match?.rating && (
                              <span className="text-xs text-amber-400 shrink-0">★ {match.rating.toFixed(1)}</span>
                            )}
                          </div>
                        );
                      })}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => fetchAiSuggestions(selectedMovie)}
                        data-testid="refresh-ai-suggestions-btn"
                      >
                        <RefreshCw className="w-3 h-3 mr-1.5" /> Get new suggestions
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => resetMetadata(selectedMovie)}
                  data-testid="reset-metadata-btn"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Metadata
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeDetail}
                >
                  Close
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (skipRemoveConfirm) {
                      removeMovie(selectedMovie.id);
                    } else {
                      setMovieToDelete(selectedMovie);
                    }
                  }}
                  data-testid="remove-movie-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove from Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Movie Confirmation */}
      <AlertDialog open={!!movieToDelete} onOpenChange={(open) => { if (!open) { setMovieToDelete(null); setDontShowAgainChecked(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{movieToDelete?.title}" from library?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will only affect the movie database. Your physical movie files will remain unchanged.
              <span className="block mt-2 text-muted-foreground">
                The movie will be moved to Recently Deleted where you can restore it within 30 days.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 cursor-pointer select-none" data-testid="dont-show-again-label">
            <input
              type="checkbox"
              checked={dontShowAgainChecked}
              onChange={(e) => setDontShowAgainChecked(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
              data-testid="dont-show-again-checkbox"
            />
            <span className="text-xs text-muted-foreground">Don't show this message again</span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (dontShowAgainChecked) {
                  setSkipRemoveConfirm(true);
                  localStorage.setItem(SKIP_REMOVE_CONFIRM_KEY, 'true');
                }
                setDontShowAgainChecked(false);
                removeMovie(movieToDelete?.id);
              }}
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

      {/* Directory Manager Dialog */}
      <AlertDialog open={showDirManager} onOpenChange={(open) => { if (!open) setShowDirManager(false); }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Manage Directories</AlertDialogTitle>
            <AlertDialogDescription>
              Rename directory paths or remove directories from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto px-1">
            {directories.map(function(dir, i) {
              var count = movies.filter(function(m) { return m.file_path && m.file_path.startsWith(dir); }).length;
              var label = dir.split(/[\\/]/).pop() || dir;
              return (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50" data-testid={'dir-manage-' + i}>
                  <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{dir}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{count} movies</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => { setShowDirManager(false); setDirToRename(dir); setDirNewPath(dir); }}
                    title="Rename"
                    data-testid={'dir-mgr-rename-' + i}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => { setShowDirManager(false); setDirToRemove(dir); }}
                    title="Remove"
                    data-testid={'dir-mgr-remove-' + i}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Directory Confirmation */}
      <AlertDialog open={!!dirToRemove} onOpenChange={(open) => { if (!open) setDirToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove directory?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong className="text-foreground">{dirToRemove && (dirToRemove.split(/[\\/]/).pop() || dirToRemove)}</strong> and all {dirToRemove ? movies.filter(m => m.file_path && m.file_path.startsWith(dirToRemove)).length : 0} of its movies from your library.
              <span className="block mt-2 text-muted-foreground">
                No files will be deleted from your system. Your actual movie files will remain untouched.
              </span>
              <span className="block mt-1 text-xs text-muted-foreground font-mono break-all">{dirToRemove}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeDirectory(dirToRemove)}
              data-testid="confirm-remove-dir-btn"
            >
              Remove Directory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Directory Dialog */}
      <AlertDialog open={!!dirToRename} onOpenChange={(open) => { if (!open) { setDirToRename(null); setDirNewPath(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update directory path</AlertDialogTitle>
            <AlertDialogDescription>
              If your folder has been renamed or moved, update the path below. All movies in this directory will be updated to the new path.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 px-6 pb-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current path:</p>
              <p className="text-sm font-mono bg-secondary/50 rounded px-2 py-1.5 break-all">{dirToRename}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">New path:</p>
              <Input
                value={dirNewPath}
                onChange={(e) => setDirNewPath(e.target.value)}
                className="font-mono text-sm"
                placeholder="Enter new directory path..."
                data-testid="dir-rename-input"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDirToRename(null); setDirNewPath(''); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={renameDirectory}
              disabled={!dirNewPath.trim() || dirNewPath.trim() === dirToRename}
              data-testid="confirm-rename-dir-btn"
            >
              Update Path
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Poster Fetch Tip Popup */}
      <AlertDialog open={showPosterTip} onOpenChange={(open) => { if (!open) { setShowPosterTip(false); setPosterTipDontShow(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Poster Fetch Tip</AlertDialogTitle>
            <AlertDialogDescription>
              For best results, name your movie files as:
              <code className="block mt-2 mb-1 px-3 py-2 bg-secondary rounded text-sm font-mono text-foreground">
                Movie Title (Year).mp4
              </code>
              For example: <code className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono text-foreground">The Dark Knight (2008).mkv</code>
              <span className="block mt-2 text-muted-foreground">
                This helps TMDB find the correct poster and metadata for each movie.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 px-6 pb-2">
            <input
              type="checkbox"
              id="skip-poster-tip"
              checked={posterTipDontShow}
              onChange={(e) => setPosterTipDontShow(e.target.checked)}
              className="rounded border-border"
              data-testid="skip-poster-tip-checkbox"
            />
            <label htmlFor="skip-poster-tip" className="text-sm text-muted-foreground cursor-pointer">
              Don't show this again
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowPosterTip(false); setPosterTipDontShow(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPosterTip} data-testid="poster-tip-continue-btn">
              Continue Fetching
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Naming Convention Tip (Add Files) */}
      <AlertDialog open={showNamingTip} onOpenChange={(open) => { if (!open) { setShowNamingTip(false); setNamingTipDontShow(false); } }}>
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
              onChange={(e) => setNamingTipDontShow(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
              data-testid="skip-naming-tip-checkbox-files"
            />
            <span className="text-xs text-muted-foreground">Don't show this again</span>
          </label>
          <AlertDialogFooter>
            <AlertDialogAction onClick={confirmNamingTip} data-testid="confirm-naming-tip-files-btn">
              Got it, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
