import { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Film, 
  Play, 
  Search, 
  FolderOpen,
  RefreshCw,
  Trash2,
  FileVideo,
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
  ChevronUp,
  FolderHeart,
  Plus,
  Check,
  ArrowUp,
  FilePlus2,
  Edit2,
  Sparkles,
  Wand2,
  FileEdit,
  Users,
  RotateCcw,
  X,
  Star,
  Tag,
  AlertTriangle,
  Crown,
  FileDown,
  Layers,
  Pause,
  Loader2
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
import { PopcornAnimation, ClapperAnimation, FireworksOverlay, ConfettiBurst, SparkleHover, useMilestone } from "@/components/FunEffects";
import PdfExportDialog from "@/components/PdfExportDialog";
import { LibraryHeader } from "@/components/LibraryHeader";
import { WelcomeGuide } from "@/components/WelcomeGuide";
import { LibraryTools } from "@/components/LibraryTools";
import { useEffectsLevel } from "@/lib/effects";
import { getPosterColor } from "@/lib/posterColor";
import { rootOf, loadDriveNames, driveLabel, DRIVE_NAMES_KEY } from "@/lib/driveRoots";
import { DriveNameEditor } from "@/components/DriveNameEditor";
import { HelpLink } from "@/components/HelpLink";
import { ScanIssuesDialog } from "@/components/ScanIssuesDialog";
import { PosterBackdrop } from "@/components/PosterBackdrop";
import { fetchFullMetadata, fetchDetails, parseFilename, runPool, thumbUrl, normalizeLibraryGenres } from "@/lib/tmdbMatcher";
import { filmography, pairFilmography, filmDirectors } from "@/lib/peopleStats";
import { FilmographyDialog } from "@/components/FilmographyDialog";
import { YearMismatchDialog } from "@/components/YearMismatchDialog";
import { RatingSourceTag } from "@/components/RatingSourceTag";
import { publishLibrary } from "@/lib/libraryStore";
import { fixMissingInfo, needsAutoFix, hasGap } from "@/lib/fixMissing";

const YEAR_MISMATCH_KEY = 'obsidian_cinema_year_mismatches';
const RENAME_IGNORED_KEY = 'obsidian_cinema_year_rename_ignored';
import { findPartGroups, mergeIntoOne, splitParts, isMultiPart, isSeries, mainParts, allLibraryPaths, partsOf, attachEpisodes, setShowRoots, showRootsFrom, applyCardUpdate, partSection as partSectionName, partFolder as partFolderOf, MULTIPART_DISMISSED_KEY } from "@/lib/multiPart";
import { ImportTypeDialog } from "@/components/ImportTypePicker";
import { DirectoryDropdowns, DIR_CATEGORIES, DIR_CATEGORIES_KEY, dirCategory, inDir, cardCategory, folderCategory, categoryCountLabel } from "@/components/DirectoryDropdowns";
import { MoreVertical as MoreIcon, CheckSquare as SelectIcon, FolderInput as MoveIcon, CircleCheck as SelectedIcon, Circle as UnselectedIcon, Undo2 as UndoIcon } from "lucide-react";
import { PartsPlayDialog, PartsList, MultiPartSuggestDialog, MergePickerDialog } from "@/components/MultiPartDialogs";

const FREE_TIER_MOVIE_LIMIT = 500;
const FREE_TIER_COLLECTION_LIMIT = 3;

// Tamper-resistant Pro check: reads from electron-store (not editable via DevTools)
// Falls back to localStorage for web app context
function isFreeTierUser() {
  // Quick sync check from localStorage (set by LicenseContext from electron-store)
  if (localStorage.getItem('obsidian_cinema_is_pro') === 'true') return false;
  return true;
}

// Async deep check against electron-store (ground truth, not user-editable)
async function verifyProStatus() {
  if (typeof window !== 'undefined' && window.electronAPI?.getLicense) {
    try {
      var license = await window.electronAPI.getLicense();
      if (license && license.license_key) return true;
    } catch (e) {}
  }
  return localStorage.getItem('obsidian_cinema_is_pro') === 'true';
}

// Re-parse a scanned file name with the smarter parser (keeps fallback title)
function withParsedName(m) {
  const p = parseFilename(m.file_name);
  return { ...m, title: p.title || m.title, year: p.year || m.year || null, imdb_id: p.imdb_id || m.imdb_id || null };
}

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

// Local storage keys
const STORAGE_KEY = 'obsidian_cinema_local_movies';
const DIRS_KEY = 'obsidian_cinema_local_dirs';
const AUTO_ENRICH_KEY = 'obsidian_cinema_auto_enrich';
const AUTO_MATCH_QUEUE_KEY = 'obsidian_cinema_auto_match_queue';
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

// Standard TMDB genre list
const TMDB_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction', 'TV Movie', 'Thriller',
  'War', 'Western'
];


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
// "Move to" menu on each card
function CardMoveMenu({ movie, category, onMove }) {
  var stop = function(e) { e.stopPropagation(); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="absolute top-9 right-1.5 z-20 p-1 rounded-full bg-black/50 hover:bg-black/75 text-white/80 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity" onClick={stop} title="Move to another category" data-testid={`card-menu-${movie.id}`}>
          <MoreIcon className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={stop} data-testid={`card-move-menu-${movie.id}`}>
        <DropdownMenuLabel className="text-xs flex items-center gap-1.5"><MoveIcon className="w-3.5 h-3.5" /> Move to</DropdownMenuLabel>
        {DIR_CATEGORIES.map(function(c) {
          var Icon = c.icon;
          return (
            <DropdownMenuItem key={c.id} disabled={c.id === category} onSelect={function() { onMove([movie.id], c.id); }} data-testid={`card-move-${c.id}-${movie.id}`}>
              {c.id === category ? <Check className="w-3.5 h-3.5 mr-2" /> : <Icon className="w-3.5 h-3.5 mr-2 opacity-60" />}{c.label}
            </DropdownMenuItem>
          );
        })}
        {movie.category_override && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={function() { onMove([movie.id], null); }} data-testid={`card-move-reset-${movie.id}`}>
              <UndoIcon className="w-3.5 h-3.5 mr-2 opacity-60" />Back to folder's type
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const MovieCard = memo(function MovieCard({ movie, gridSize, onOpen, onPlayMovie, isFavorite, onToggleFav, category, onMove, selectMode, selected, onSelect, fx, index, onHover, offline }) {
  var onClick = function() { if (selectMode) onSelect(movie.id); else onOpen(movie); };
  var onPlay = function(e) { e.stopPropagation(); onPlayMovie(movie); };
  var onToggleFavorite = function(e) { onToggleFav(movie.id, e); };
  var [showConfetti, setShowConfetti] = useState(false);
  var [showShimmer, setShowShimmer] = useState(false);

  var handleFavorite = function(e) {
    if (!isFavorite) {
      setShowConfetti(true);
      setTimeout(function() { setShowConfetti(false); }, 1000);
    }
    onToggleFavorite(e);
  };

  var tilt = function(e) {
    var r = e.currentTarget.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
    e.currentTarget.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
    e.currentTarget.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    e.currentTarget.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  };
  var untilt = function(e) {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
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
    <div
      className={'group relative oc-card ' + (fx === 'full' ? 'oc-card-full' : 'oc-card-lite')}
      style={fx === 'full' ? { animationDelay: ((index || 0) % 24) * 28 + 'ms' } : undefined}
      onMouseMove={fx === 'full' ? tilt : undefined}
      onMouseEnter={function() { onHover(movie); }}
      onMouseLeave={function(e) { onHover(null); if (fx === 'full') untilt(e); }}
    >
      {showConfetti && (
        <div className="fav-confetti" style={{ position: 'absolute', top: '0.75rem', right: '1rem', zIndex: 50 }}>
          <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      )}
      <Card className={(offline ? 'oc-offline ' : '') + 'oc-card-surface overflow-hidden hover:border-primary/50 transition-colors cursor-pointer ' + (selected ? 'ring-2 ring-primary border-primary' : '')} onClick={onClick} data-testid={`movie-card-${movie.id}`}>
        <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-secondary relative flex items-center justify-center overflow-hidden">
          {selectMode && (
            <span className={'absolute inset-0 z-30 flex items-start justify-start p-1.5 transition-colors ' + (selected ? 'bg-primary/25' : 'bg-black/20 hover:bg-black/10')} data-testid={`card-select-${movie.id}`}>
              {selected ? <SelectedIcon className="w-6 h-6 text-primary fill-background" /> : <UnselectedIcon className="w-6 h-6 text-white/80" />}
            </span>
          )}
          {!selectMode && <CardMoveMenu movie={movie} category={category} onMove={onMove} />}
          {movie.poster_path ? (
            <img src={thumbUrl(movie.poster_path, gridSize === 'large' ? 'w500' : 'w342')} alt={movie.title} className="oc-poster w-full h-full object-cover" loading="lazy" decoding="async" onLoad={handlePosterLoad} />
          ) : (
            <Film className="w-12 h-12 text-primary/50" />
          )}
          {fx === 'full' && <div className="oc-sheen" />}
          {showShimmer && <div className="poster-shimmer" />}
          {movie.needs_review && (
            <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-amber-500/90 text-black text-[9px] font-bold" title="Uncertain match — open to verify" data-testid={`needs-review-badge-${movie.id}`}>CHECK</span>
          )}
          {isMultiPart(movie) && (
            <span className="absolute bottom-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-sm" title={movie.parts.length + ' parts'} data-testid={`parts-badge-${movie.id}`}>
              <Layers className="w-2.5 h-2.5" />{movie.parts.length} PARTS
            </span>
          )}
          {offline && (
            <span className="absolute bottom-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-medium text-amber-300 flex items-center gap-1" title={(typeof offline === 'string' ? offline : rootOf(movie.file_path)) + ' is not connected'} data-testid={`offline-badge-${movie.id}`}>
              <HardDrive className="w-3 h-3" /> Drive offline
            </span>
          )}
          {/* Favorite star - top right */}
          {!selectMode && <button
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
          </button>}
          {/* Play button - center */}
          {!selectMode && <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {offline ? (
              <Button size="sm" variant="secondary" className="opacity-80" onClick={onPlay} data-testid={`card-play-offline-${movie.id}`}>
                <HardDrive className="w-4 h-4 mr-1" /> Drive offline
              </Button>
            ) : (
              <Button size="sm" onClick={onPlay}>
                <Play className="w-4 h-4 mr-1" /> Play
              </Button>
            )}
          </div>}
          {/* Synopsis - bottom, only on hover */}
          {movie.overview && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-black/85 backdrop-blur-sm p-2 pointer-events-none">
              <p className="text-[10px] leading-snug text-gray-200 line-clamp-4">{movie.overview}</p>
            </div>
          )}
        </div>
        <CardContent className={gridSize === 'small' ? 'p-2' : 'p-3'}>
          <h3 className={`font-medium truncate ${gridSize === 'small' ? 'text-xs' : 'text-sm'}`}>{movie.title}</h3>
          {gridSize !== 'small' && movie.aka && movie.aka.length > 0 && (
            <p className="text-[10px] text-muted-foreground/80 truncate italic" title={'Also known as: ' + movie.aka.join(' · ')} data-testid="movie-card-aka">aka {movie.aka[0]}</p>
          )}
          {gridSize !== 'small' && (
            <div className="flex items-center justify-between">
              {movie.year && <p className="text-xs text-muted-foreground">{movie.year}</p>}
              {movie.rating > 0 && <p className="text-xs text-amber-400">★ {movie.rating.toFixed(1)}<RatingSourceTag source={movie.rating_source} /></p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

function CastRow({ cast, onClear, onPick }) {
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
            <button type="button" key={idx} onClick={function() { onPick({ name: actor.name, role: 'actor', photo: actor.profile_path }); }} title={'See ' + actor.name + "'s films"} className="flex flex-col items-center shrink-0 w-20 rounded-md py-1 hover:bg-secondary/60 transition-colors" data-testid={'cast-member-' + idx}>
              {actor.profile_path ? (
                <img src={actor.profile_path} alt={actor.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
              <p className="text-[10px] font-medium text-center mt-1.5 leading-tight w-full">{actor.name}</p>
              <p className="text-[9px] text-muted-foreground text-center leading-tight w-full">{actor.character}</p>
            </button>
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
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [posterMode, setPosterMode] = useState(null); // 'search' | 'url' | null
  const [partsMovie, setPartsMovie] = useState(null);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [showMultiPart, setShowMultiPart] = useState(false);
  const [multipartDismissed, setMultipartDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MULTIPART_DISMISSED_KEY) || '[]'); } catch (e) { return []; }
  });
  const [posterSearch, setPosterSearch] = useState('');
  const [posterResults, setPosterResults] = useState([]);
  const [posterSearching, setPosterSearching] = useState(false);
  const [posterUrl, setPosterUrl] = useState('');
  const [editingYear, setEditingYear] = useState(false);
  const [yearInput, setYearInput] = useState('');
  const [editingRating, setEditingRating] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisInput, setSynopsisInput] = useState('');
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(() => searchParams.get('collection') || null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [skipRemoveConfirm, setSkipRemoveConfirm] = useState(() => localStorage.getItem(SKIP_REMOVE_CONFIRM_KEY) === 'true');
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false);
  const [activeDirectory, setActiveDirectory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const catCheckDirRef = useRef(null);
  const [dirCategories, setDirCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DIR_CATEGORIES_KEY) || '{}'); } catch (e) { return {}; }
  });
  const setDirType = (dir, type) => {
    const next = { ...dirCategories, [dir]: type };
    // Switching a folder to TV / Docs / Animations re-checks it for shows to merge
    if (type !== 'movies' && type !== dirCategory(dirCategories, dir) && (directories.includes(dir) || dir in dirCategories)) catCheckDirRef.current = dir;
    setDirCategories(next);
    localStorage.setItem(DIR_CATEGORIES_KEY, JSON.stringify(next));
  };
  // Set a type for folders at import time (folder scans and the folders of picked files)
  const applyImportType = (dirs, type) => {
    const next = { ...dirCategories };
    dirs.forEach(d => { next[d] = type; });
    setDirCategories(next);
    localStorage.setItem(DIR_CATEGORIES_KEY, JSON.stringify(next));
    setShowRoots(showRootsFrom(next));
  };
  // TV Shows / Documentaries / Animations folders: each sub-folder groups into one show
  const showRootsKey = JSON.stringify(dirCategories);
  useMemo(() => setShowRoots(showRootsFrom(JSON.parse(showRootsKey))), [showRootsKey]);
  const [dirToRemove, setDirToRemove] = useState(null);
  const [fileDirToRemove, setFileDirToRemove] = useState(null);
  const [person, setPerson] = useState(null);
  // Titles that came in through Add Files from this exact folder
  const inFileDir = (m, dir) => String(m.file_path).replace(/[\\/][^\\/]*$/, '').toLowerCase() === dir.toLowerCase();
  const removeFileDir = (dir) => {
    const count = movies.filter(m => inFileDir(m, dir)).length;
    setMovies(prev => prev.filter(m => !inFileDir(m, dir)));
    if (activeDirectory === dir) setActiveDirectory(null);
    const nextCats = { ...dirCategories };
    delete nextCats[dir];
    setDirCategories(nextCats);
    localStorage.setItem(DIR_CATEGORIES_KEY, JSON.stringify(nextCats));
    setFileDirToRemove(null);
    toast.success('Removed ' + count + (count === 1 ? ' title' : ' titles') + ' from your library');
  };
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; }
  });
  const [dirToRename, setDirToRename] = useState(null);
  const [dirNewPath, setDirNewPath] = useState('');
  const [showDirManager, setShowDirManager] = useState(false);
  // Folders the last Update Library couldn't open (offline drive, access denied…)
  const [scanIssues, setScanIssues] = useState([]);
  const [showScanIssues, setShowScanIssues] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const fetchAbortRef = useRef(false);
  const fetchCountRef = useRef({ fetched: 0, found: 0, total: 0 });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiButtonHover, setAiButtonHover] = useState(false);
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

  // Anti-tamper: periodically verify localStorage Pro status against electron-store
  useEffect(function() {
    if (!isElectron()) return;
    function tamperCheck() {
      var lsPro = localStorage.getItem('obsidian_cinema_is_pro');
      if (lsPro === 'true' && window.electronAPI && window.electronAPI.getLicense) {
        window.electronAPI.getLicense().then(function(license) {
          if (!license || !license.license_key) {
            // localStorage says Pro but electron-store has no license key — tampered
            console.warn('Pro status mismatch detected — resetting to free');
            localStorage.setItem('obsidian_cinema_is_pro', 'false');
            localStorage.setItem('obsidian_cinema_license_status', 'free');
            window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'free' } }));
          }
        }).catch(function() {});
      }
    }
    tamperCheck();
    var interval = setInterval(tamperCheck, 30000); // Check every 30 seconds
    return function() { clearInterval(interval); };
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedMovies = localStorage.getItem(STORAGE_KEY);
    const savedDirs = localStorage.getItem(DIRS_KEY);
    const savedTmdbKey = localStorage.getItem(TMDB_KEY);
    const savedTrash = localStorage.getItem(TRASH_KEY);
    
    if (savedMovies) {
      setMovies(normalizeLibraryGenres(JSON.parse(savedMovies)));
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
  const moviesLoadedRef = useRef(false);
  const pendingSaveRef = useRef(null);
  const saveMoviesNow = (sync) => {
    const data = pendingSaveRef.current;
    if (data == null) return;
    pendingSaveRef.current = null;
    try {
      const str = JSON.stringify(data);
      if (sync && window.__ocSaveLibrarySync) window.__ocSaveLibrarySync(str);
      else localStorage.setItem(STORAGE_KEY, str);
      publishLibrary(data, localStorage.getItem(STORAGE_KEY));
      window.dispatchEvent(new Event('oc-library-updated'));
    } catch (e) { console.error('Library save failed:', e); toast.error('Could not save library — storage is full'); }
  };
  useEffect(() => {
    if (!moviesLoadedRef.current) { moviesLoadedRef.current = true; return; }
    pendingSaveRef.current = movies;
    // Fewer, larger writes while many cards change (background matching / enrichment)
    const t = setTimeout(() => saveMoviesNow(false), 1200);
    return () => clearTimeout(t);
  }, [movies]);
  useEffect(() => {
    const onUnload = () => saveMoviesNow(true);
    window.addEventListener('beforeunload', onUnload);
    return () => { window.removeEventListener('beforeunload', onUnload); saveMoviesNow(false); };
  }, []);

  useEffect(() => {
    if (!selectedMovie) return;
    const onKey = (e) => {
      if (e.key !== 'Escape' || editingTitle || posterMode || mergeTarget || partsMovie) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
      setSelectedMovie(null);
    };
    // Capture phase: runs before nested dialogs close themselves
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [selectedMovie, editingTitle, posterMode, mergeTarget, partsMovie]);

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

  const toggleFavorite = useCallback((movieId, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setFavorites(prev => {
      if (prev.includes(movieId)) {
        return prev.filter(id => id !== movieId);
      }
      return [...prev, movieId];
    });
  }, []);
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

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
    if (isFreeTierUser() && collections.length >= FREE_TIER_COLLECTION_LIMIT) {
      toast.error(`Free tier is limited to ${FREE_TIER_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited!`);
      return;
    }
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

  // Smart match + full metadata from TMDB
  const fetchPosterForMovie = async (movie) => {
    if (!tmdbApiKey) return null;
    try {
      const multi = isMultiPart(movie);
      const d = await fetchFullMetadata(movie, tmdbApiKey, { preferTv: mainParts(movie).length > 1 || isSeries(movie) });
      if (d && d.media_type === 'tv' && multi) d.parts = (await attachEpisodes(movie.parts, d.tmdb_id, tmdbApiKey)).parts;
      return d;
    } catch (err) {
      console.error('TMDB fetch error:', err);
      return null;
    }
  };

  // Fetch full details (cast, director, runtime...) for a movie that already has tmdb_id
  const fetchDetailsForMovie = async (movie) => {
    if (!tmdbApiKey || !movie.tmdb_id) return null;
    const d = await fetchDetails(movie.tmdb_id, movie.media_type, tmdbApiKey);
    if (!d) return null;
    const keep = {};
    if (d.media_type === 'tv' && isMultiPart(movie)) keep.parts = (await attachEpisodes(movie.parts, d.tmdb_id, tmdbApiKey)).parts;
    ['media_type', 'season_count', 'episode_count', 'cast', 'directors', 'aka', 'runtime', 'tagline', 'director', 'writers', 'certification', 'imdb_id', 'original_title', 'original_language', 'tmdb_title', 'collection_name', 'studios', 'countries', 'backdrop_path', 'vote_count', 'release_date', 'metadata_updated_at'].forEach(k => { if (d[k] != null) keep[k] = d[k]; });
    if (!movie.poster_path && d.poster_path) keep.poster_path = d.poster_path;
    if (!movie.overview && d.overview) keep.overview = d.overview;
    if (!movie.rating && d.rating) { keep.rating = d.rating; keep.rating_source = null; }
    if (!movie.year && d.year) keep.year = d.year;
    if ((!movie.genres || movie.genres.length === 0) && d.genres.length) keep.genres = d.genres;
    return keep;
  };

  // Batch many per-movie updates into one state change
  const pendingUpdatesRef = useRef({});
  const flushUpdates = () => {
    const pending = pendingUpdatesRef.current;
    pendingUpdatesRef.current = {};
    if (Object.keys(pending).length === 0) return;
    setMovies(prev => prev.map(m => pending[m.id] ? applyCardUpdate(m, pending[m.id]) : m));
  };
  const queueUpdate = (id, data) => {
    pendingUpdatesRef.current[id] = { ...(pendingUpdatesRef.current[id] || {}), ...data };
  };

  // Manually pick a TMDB result — re-matches the movie with full metadata
  const applyManualMatch = async (result) => {
    if (!selectedMovie) return;
    const id = selectedMovie.id;
    const d = await fetchDetails(result.id, result.media_type, tmdbApiKey);
    // Without full details the card would keep the old director/cast under the new title: change nothing
    if (!d) { toast.error('Could not load details from TMDB — please try again'); return; }
    if (isMultiPart(selectedMovie)) {
      d.parts = d.media_type === 'tv'
        ? (await attachEpisodes(selectedMovie.parts, d.tmdb_id, tmdbApiKey)).parts
        : selectedMovie.parts.map(p => ({ file_path: p.file_path, file_name: p.file_name }));
    }
    const data = { ...d, match_confidence: 1, match_method: 'manual', needs_review: false };
    if (!data.poster_path) data.poster_path = result.poster;
    setMovies(prev => prev.map(m => m.id === id ? applyCardUpdate(m, data) : m));
    setSelectedMovie(prev => prev && prev.id === id ? applyCardUpdate(prev, data) : prev);
    setPosterMode(null);
    setPosterSearch('');
    setPosterResults([]);
    toast.success('Matched to "' + (result.name || result.title || 'movie') + (result.year ? ' (' + result.year + ')' : '') + '"');
  };

  // Look up a multi-part card as a TMDB TV series and attach episode names to each part
  const [seriesLoading, setSeriesLoading] = useState(false);
  const refreshSeriesInfo = async (movie) => {
    if (!tmdbApiKey) { toast.error('Please add your TMDB API key in Settings first'); return; }
    setSeriesLoading(true);
    try {
      let d = null;
      if (movie.media_type === 'tv' && movie.tmdb_id) {
        d = await fetchDetails(movie.tmdb_id, 'tv', tmdbApiKey);
        if (d) { d.match_confidence = movie.match_confidence; d.needs_review = movie.needs_review; }
      } else {
        d = await fetchFullMetadata(movie, tmdbApiKey, { tvOnly: true });
      }
      if (!d) { toast.info('No matching TV series found — try "Pick the right one" in the poster search'); return; }
      const r = await attachEpisodes(movie.parts, d.tmdb_id, tmdbApiKey);
      const data = { ...d, parts: r.parts };
      setMovies(prev => prev.map(m => m.id === movie.id ? applyCardUpdate(m, data) : m));
      setSelectedMovie(prev => prev && prev.id === movie.id ? applyCardUpdate(prev, data) : prev);
      const msg = 'Matched series "' + (d.tmdb_title || movie.title) + '" — ' + r.found + ' of ' + mainParts(movie).length + ' episodes found';
      if (r.found > 0) toast.success(msg); else toast.warning(msg + ' (episode details unavailable right now)');
    } finally {
      setSeriesLoading(false);
    }
  };

  const confirmMatch = (movie) => {
    setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, needs_review: false } : m));
    setSelectedMovie(prev => prev ? { ...prev, needs_review: false } : prev);
    toast.success('Match confirmed');
  };

  // New files found by Update Library / Browse / Add Files are matched automatically
  // Auto multi-part check: new files that belong with a show / multi-part title trigger a merge prompt
  const autoMultiIdsRef = useRef(new Set());
  const [autoMultiKeys, setAutoMultiKeys] = useState(null);
  const [autoMultiHeading, setAutoMultiHeading] = useState(null);

  // Queue is saved so titles added while paused / without a key are matched later
  const autoMatchQueueRef = useRef(null);
  if (autoMatchQueueRef.current === null) {
    try { autoMatchQueueRef.current = new Set(JSON.parse(localStorage.getItem(AUTO_MATCH_QUEUE_KEY) || '[]')); } catch (e) { autoMatchQueueRef.current = new Set(); }
  }
  const saveAutoMatchQueue = () => localStorage.setItem(AUTO_MATCH_QUEUE_KEY, JSON.stringify([...autoMatchQueueRef.current]));
  const [autoMatchTick, setAutoMatchTick] = useState(0);
  const queueAutoMatch = (list, matchOnly) => {
    if (!list || list.length === 0) return;
    if (!matchOnly) list.forEach(m => autoMultiIdsRef.current.add(m.id));
    // Episodes / extras inside a show folder are matched as the show (after merging), not as separate movies
    list.forEach(m => { if (matchOnly || !partFolderOf(m.file_path).showDir) autoMatchQueueRef.current.add(m.id); });
    saveAutoMatchQueue();
    setAutoMatchTick(t => t + 1);
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
      const [movieData, tvData] = await Promise.all([
        fetch(TMDB_API + '/search/movie?api_key=' + tmdbApiKey + '&query=' + query).then(r => r.json()).catch(() => ({})),
        fetch(TMDB_API + '/search/tv?api_key=' + tmdbApiKey + '&query=' + query).then(r => r.json()).catch(() => ({})),
      ]);
      const toResult = (r, type) => ({
        id: r.id,
        media_type: type,
        title: type === 'tv' ? (r.name + ' (Series)') : r.title,
        name: type === 'tv' ? r.name : r.title,
        year: (r.release_date || r.first_air_date || '').substring(0, 4),
        poster: TMDB_IMG + r.poster_path,
        overview: r.overview,
        rating: r.vote_average,
      });
      const movieResults = (movieData.results || []).filter(r => r.poster_path).slice(0, 8).map(r => toResult(r, 'movie'));
      const tvResults = (tvData.results || []).filter(r => r.poster_path).slice(0, 4).map(r => toResult(r, 'tv'));
      var results = selectedMovie && isMultiPart(selectedMovie) ? [...tvResults, ...movieResults].slice(0, 10) : [...movieResults, ...tvResults].slice(0, 10);
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
    setEditingRating(false);
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
      runtime: null, tagline: null, director: null, directors: null, writers: null, certification: null,
      aka: null, rating_source: null, media_type: null, season_count: null, episode_count: null, gap_checked_at: null,
      imdb_id: null, tmdb_title: null, original_title: null, collection_name: null,
      backdrop_path: null, match_confidence: null, needs_review: false, metadata_updated_at: null,
    };
    setMovies(prev => prev.map(m => m.id === movie.id ? cleaned : m));
    setSelectedMovie(cleaned);
    toast.success('Metadata cleared for "' + (movie.title || movie.file_name) + '". You can now re-fetch from TMDB.');
  };

  // Remove a directory and all its movies
  const removeDirectory = (dirPath) => {
    const count = movies.filter(m => inDir(m.file_path, dirPath)).length;
    setMovies(prev => prev.filter(m => !inDir(m.file_path, dirPath)));
    setDirectories(prev => prev.filter(d => d !== dirPath));
    if (activeDirectory === dirPath) setActiveDirectory(null);
    if (dirCategories[dirPath]) {
      const nextCats = { ...dirCategories };
      delete nextCats[dirPath];
      setDirCategories(nextCats);
      localStorage.setItem(DIR_CATEGORIES_KEY, JSON.stringify(nextCats));
    }
    setDirToRemove(null);
    toast.success('Removed directory and ' + count + ' movies');
  };

  // Rename a directory — updates directory list and all movie file_paths
  const renameDirectory = () => {
    if (!dirToRename || !dirNewPath.trim()) return;
    const oldPath = dirToRename;
    const newPath = dirNewPath.trim();
    if (oldPath === newPath) { setDirToRename(null); return; }
    if (directories.includes(newPath)) { toast.error('That folder is already in your library'); return; }
    setDirectories(prev => prev.map(d => d === oldPath ? newPath : d));
    const move = (fp) => (inDir(fp, oldPath) ? newPath + fp.substring(oldPath.length) : fp);
    setMovies(prev => prev.map(m => {
      const movedParts = Array.isArray(m.parts) && m.parts.some(p => inDir(p.file_path, oldPath));
      if (!inDir(m.file_path, oldPath) && !movedParts) return m;
      const next = { ...m, file_path: move(m.file_path) };
      if (Array.isArray(m.parts)) next.parts = m.parts.map(p => ({ ...p, file_path: move(p.file_path) }));
      return next;
    }));
    if (activeDirectory === oldPath) setActiveDirectory(newPath);
    if (dirCategories[oldPath]) {
      const nextCats = { ...dirCategories, [newPath]: dirCategories[oldPath] };
      delete nextCats[oldPath];
      setDirCategories(nextCats);
      localStorage.setItem(DIR_CATEGORIES_KEY, JSON.stringify(nextCats));
    }
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
      // Build full library list, excluding the selected movie
      const allCandidates = movies
        .filter(m => m.id !== movie.id)
        .map(m => ({
          id: m.id,
          title: m.title || m.file_name,
          year: m.year || null,
          genres: toGenreStrings(m.genres),
          overview: m.overview ? m.overview.substring(0, 100) : null,
          rating: m.rating || null,
        }));
      // Shuffle to get a diverse sample from the entire library
      for (let i = allCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCandidates[i], allCandidates[j]] = [allCandidates[j], allCandidates[i]];
      }
      // Send a capped, randomized sample
      const libraryMovies = allCandidates.slice(0, 300);
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

  // Bulk enrich: fetch cast, director, runtime etc. for matched movies missing full details
  const fetchAllCast = async () => {
    if (!tmdbApiKey) {
      toast.error('Please add your TMDB API key in Settings first');
      return;
    }
    const needDetails = movies.filter(m => m.tmdb_id && !m.metadata_updated_at);
    if (needDetails.length === 0) {
      toast.info('All matched movies already have full details');
      return;
    }
    bgStopRef.current = true;
    fetchAbortRef.current = false;
    setFetchingCast(true);
    setCastFetchProgress(0);
    let done = 0;
    let enriched = 0;
    let lastFlush = Date.now();
    await runPool(needDetails, m => fetchDetailsForMovie(m), {
      concurrency: 8,
      shouldStop: () => fetchAbortRef.current,
      onResult: (movie, data) => {
        done++;
        if (data) { queueUpdate(movie.id, data); enriched++; }
        if (Date.now() - lastFlush > 1500) { lastFlush = Date.now(); flushUpdates(); setCastFetchProgress(Math.round((done / needDetails.length) * 100)); }
      },
    });
    flushUpdates();
    setCastFetchProgress(100);
    setFetchingCast(false);
    toast.success('Full details added for ' + enriched + ' of ' + done + ' movies');
  };


  // Fetch posters for all movies without posters
  const startFetchPosters = () => {
    if (!tmdbApiKey) {
      toast.error('Please add your TMDB API key in settings first');
      navigate("/settings");
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

  // onlyIds: auto-match just these newly added titles (quiet, no navigation)
  const fetchAllPosters = async (onlyIds) => {
    const auto = onlyIds instanceof Set;
    if (!tmdbApiKey) {
      if (auto) return;
      toast.error('Please add your TMDB API key in settings first');
      navigate("/settings");
      return;
    }

    const moviesNeedingPosters = movies.filter(m => !m.poster_path && (!auto || onlyIds.has(m.id)));
    if (moviesNeedingPosters.length === 0) {
      if (!auto) toast.info('All movies already have posters');
      return;
    }
    if (auto) {
      bgStopRef.current = true;
      toast.info('Auto-matching ' + moviesNeedingPosters.length + ' new ' + (moviesNeedingPosters.length === 1 ? 'title' : 'titles') + ' with TMDB…');
    }

    fetchAbortRef.current = false;
    fetchCountRef.current = { fetched: 0, found: 0, total: moviesNeedingPosters.length };
    setFetchingPosters(true);
    setFetchProgress(0);

    let fetched = 0;
    let found = 0;
    let review = 0;
    let lastFlush = Date.now();
    const total = moviesNeedingPosters.length;

    await runPool(moviesNeedingPosters, m => fetchPosterForMovie(m), {
      concurrency: 6,
      shouldStop: () => fetchAbortRef.current,
      onResult: (movie, tmdbData) => {
        fetched++;
        if (tmdbData) {
          queueUpdate(movie.id, tmdbData);
          found++;
          if (tmdbData.needs_review) review++;
        }
        fetchCountRef.current = { fetched, found, total };
        if (Date.now() - lastFlush > 1500) {
          lastFlush = Date.now();
          flushUpdates();
          setFetchProgress((fetched / total) * 100);
        }
      },
    });
    flushUpdates();
    setFetchProgress((fetched / total) * 100);

    setFetchingPosters(false);
    const reviewMsg = review > 0 ? ' ' + review + ' uncertain match' + (review > 1 ? 'es are' : ' is') + ' marked CHECK for you to verify.' : '';
    if (fetchAbortRef.current) {
      toast.info('Fetch paused — ' + found + ' of ' + fetched + ' processed saved. Click "Fetch Posters" to continue.' + reviewMsg);
    } else {
      toast.success((auto ? 'New titles matched: ' : 'Done! Found metadata for ') + found + ' of ' + fetched + (auto ? '.' : ' movies.') + reviewMsg);
    }
  };

  const abortFetch = () => {
    fetchAbortRef.current = true;
  };

  const handleMoviesFound = (newMovies, dirPaths, importType) => addFolders(Array.isArray(dirPaths) ? dirPaths : [dirPaths], newMovies, importType);

  // Adds scanned folders as library folders (so Update Library rescans them) plus the videos found
  const addFolders = (dirPaths, newMovies, importType) => {
    const fresh = dirPaths.filter(d => !directories.some(r => d === r || inDir(d, r)));
    if (fresh.length) setDirectories(prev => [...prev, ...fresh.filter(d => !prev.includes(d))]);
    if (importType) applyImportType(fresh.length ? fresh : dirPaths, importType);

    // Merge movies, avoiding duplicates by file path
    const existingPaths = allLibraryPaths(movies);
    const now = Date.now();
    let uniqueNewMovies = newMovies
      .filter(m => !existingPaths.has(m.file_path))
      .map(m => withParsedName({ ...m, added_at: now }));

    // Free tier limit — verify against electron-store to prevent localStorage tampering
    if (isFreeTierUser()) {
      // Double-check with electron-store (async, but block scan if tampered)
      verifyProStatus().then(function(isPro) {
        if (isPro) {
          // electron-store says Pro but localStorage says free — fix localStorage
          localStorage.setItem('obsidian_cinema_is_pro', 'true');
        }
      });
      const slotsLeft = FREE_TIER_MOVIE_LIMIT - movies.length;
      if (slotsLeft <= 0) {
        toast.error(`Free tier organizes up to ${FREE_TIER_MOVIE_LIMIT} of your own files. Upgrade to Pro to remove the limit!`);
        return;
      }
      if (uniqueNewMovies.length > slotsLeft) {
        toast.warning(`Free tier limit: only adding ${slotsLeft} of ${uniqueNewMovies.length} files. Upgrade to Pro to remove the limit!`);
        uniqueNewMovies = uniqueNewMovies.slice(0, slotsLeft);
      }
    }
    
    if (uniqueNewMovies.length === 0) { toast.info('No new video files found — they may already be in your library'); return; }
    setMovies(prev => { const known = allLibraryPaths(prev); return [...prev, ...uniqueNewMovies.filter(m => !known.has(m.file_path))]; });
    queueAutoMatch(uniqueNewMovies);
    toast.success(`Added ${uniqueNewMovies.length} new ${uniqueNewMovies.length === 1 ? 'file' : 'files'} to library`);
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

  const [showFilesType, setShowFilesType] = useState(false);
  const addIndividualFiles = () => { dropPathsRef.current = null; dropDirsRef.current = null; setDropCount(0); setShowFilesType(true); };

  // Drag & drop: video files (or the videos directly inside a dropped folder) are added after picking a type
  const dropPathsRef = useRef(null);
  const dropDirsRef = useRef(null);
  const [dropCount, setDropCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const VIDEO_EXT = /\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|3gp|ts)$/i;
  const isFileDrag = (e) => Array.from((e.dataTransfer && e.dataTransfer.types) || []).includes('Files');
  const onLibraryDragOver = (e) => {
    if (!isElectron() || !isFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOver) setDragOver(true);
  };
  const onLibraryDragLeave = (e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) setDragOver(false); };
  const onLibraryDrop = async (e) => {
    if (!isElectron() || !isFileDrag(e)) return;
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []).map(f => f.path).filter(Boolean);
    const paths = [];
    const dirs = [];
    const dirFound = [];
    let dirVideos = 0;
    const known = allLibraryPaths(movies);
    for (const p of dropped) {
      if (VIDEO_EXT.test(p)) paths.push(p);
      else if (window.electronAPI?.scanForVideos) {
        // Dropped folders are scanned with every subfolder (seasons, extras…)
        const inside = await window.electronAPI.scanForVideos(p, true).catch(() => []);
        if (inside && inside.length) { dirs.push(p); dirFound.push(...inside); dirVideos += inside.filter(v => !known.has(v.file_path)).length; }
      }
    }
    const fresh = [...new Set(paths)].filter(p => !known.has(p));
    if (fresh.length === 0 && dirs.length === 0) { toast.info(paths.length ? 'Those files are already in your library' : 'No video files found in what you dropped'); return; }
    if (fresh.length === 0 && dirVideos === 0) { toast.info('Those files are already in your library'); return; }
    dropPathsRef.current = fresh.length ? fresh : null;
    dropDirsRef.current = dirs.length ? { dirs, found: dirFound } : null;
    setDropCount(fresh.length + dirVideos);
    setShowFilesType(true);
  };
  const onFilesTypePicked = (type) => {
    const dropped = dropPathsRef.current;
    const droppedDirs = dropDirsRef.current;
    dropPathsRef.current = null;
    dropDirsRef.current = null;
    setDropCount(0);
    if (droppedDirs) addFolders(droppedDirs.dirs, droppedDirs.found, type);
    if (dropped) pickIndividualFiles(type, dropped);
    if (!dropped && !droppedDirs) pickIndividualFiles(type);
  };

  const pickIndividualFiles = async (importType, droppedPaths) => {
    if (!isElectron() || !window.electronAPI?.openFileDialog) return;
    try {
      const result = droppedPaths ? { canceled: false, filePaths: droppedPaths } : await window.electronAPI.openFileDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Video Files', extensions: ['mp4','mkv','avi','mov','wmv','flv','webm','m4v','mpg','mpeg','3gp','ts'] }],
        title: 'Select movie files to add'
      });
      if (result.canceled || !result.filePaths?.length) return;

      const existingPaths = allLibraryPaths(movies);
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
            .trim() || nameWithoutExt.replace(/\./g, ' ').replace(/[_-]/g, ' ').trim();
          return withParsedName({ id: Date.now().toString() + Math.random().toString(36).slice(2, 8), file_path: fp, file_name: fileName, title, year, added_at: now });
        });

      if (newMovies.length > 0) {
        // Folders inside a scanned directory keep that directory's type
        applyImportType([...new Set(newMovies.map(m => m.file_path.replace(/[\\/][^\\/]*$/, '')))].filter(d => !directories.some(r => d === r || inDir(d, r))), importType);
        // Free tier limit
        let moviesToAdd = newMovies;
        if (isFreeTierUser()) {
          const slotsLeft = FREE_TIER_MOVIE_LIMIT - movies.length;
          if (slotsLeft <= 0) {
            toast.error(`Free tier organizes up to ${FREE_TIER_MOVIE_LIMIT} of your own files. Upgrade to Pro to remove the limit!`);
            return;
          }
          if (moviesToAdd.length > slotsLeft) {
            toast.warning(`Free tier limit: only adding ${slotsLeft} of ${moviesToAdd.length} movies.`);
            moviesToAdd = moviesToAdd.slice(0, slotsLeft);
          }
        }
        setMovies(prev => [...prev, ...moviesToAdd]);
        queueAutoMatch(moviesToAdd);
        toast.success(`Added ${moviesToAdd.length} movie${moviesToAdd.length > 1 ? 's' : ''} to library`);
      } else {
        toast.info('Selected files are already in your library');
      }
    } catch (err) {
      console.error('File selection failed:', err);
      toast.error('Failed to add files');
    }
  };

  const [isRescanning, setIsRescanning] = useState(false);

  const rescanAllDirectories = async () => {
    if (!isElectron() || !window.electronAPI?.scanForVideos || directories.length === 0) return;
    setIsRescanning(true);
    try {
      let allScanned = [];
      // Folders we couldn't read: their titles are kept, never treated as deleted
      const issues = [];
      for (const dir of directories) {
        try {
          if (window.electronAPI.rescanFolder) {
            const res = await window.electronAPI.rescanFolder(dir);
            allScanned = allScanned.concat(res.videos || []);
            (res.failed || []).forEach(f => issues.push(typeof f === 'string' ? { path: f, code: 'ERR' } : f));
          } else {
            allScanned = allScanned.concat(await window.electronAPI.scanForVideos(dir, true));
          }
        } catch (e) {
          console.error('Failed to scan:', dir, e);
          issues.push({ path: dir, code: 'ERR' });
        }
      }
      const unreadable = issues.map(i => i.path);

      const scannedPaths = new Set(allScanned.map(f => f.file_path));
      const dirSet = new Set(directories);
      const inDirs = (p) => directories.some(d => inDir(p, d));
      const existingInDirs = movies.filter(m => partsOf(m).some(p => p.file_path && inDirs(p.file_path)));
      const existingPaths = new Set();
      existingInDirs.forEach(m => partsOf(m).forEach(p => { if (p.file_path && inDirs(p.file_path)) existingPaths.add(p.file_path); }));
      const knownPaths = allLibraryPaths(movies);

      const now = Date.now();
      const newMovies = allScanned
        .filter(f => !knownPaths.has(f.file_path))
        .map(f => withParsedName({ ...f, added_at: now }));

      const removedPaths = [...existingPaths].filter(p => !scannedPaths.has(p) && !unreadable.some(u => p === u || inDir(p, u)));

      let updated = movies;
      if (removedPaths.length > 0) {
        const removedSet = new Set(removedPaths);
        updated = updated.flatMap(m => {
          if (!isMultiPart(m)) return removedSet.has(m.file_path) ? [] : [m];
          const kept = m.parts.filter(p => !removedSet.has(p.file_path));
          if (kept.length === m.parts.length) return [m];
          if (kept.length === 0) return [];
          const next = { ...m, parts: kept, file_path: kept[0].file_path, file_name: kept[0].file_name };
          if (kept.length === 1) delete next.parts;
          return [next];
        });
      }
      if (newMovies.length > 0) {
        updated = [...updated, ...newMovies];
      }

      setMovies(updated);
      queueAutoMatch(newMovies);

      const parts = [];
      if (newMovies.length > 0) parts.push(`${newMovies.length} added`);
      if (removedPaths.length > 0) parts.push(`${removedPaths.length} removed`);
      if (parts.length === 0) {
        toast.info('All directories are up to date — no changes found');
      } else {
        toast.success(`Library updated: ${parts.join(', ')}`);
      }
      checkDrives();
      const known = allLibraryPaths(movies);
      const detailed = issues.map(i => ({ ...i, kept: [...known].filter(p => p === i.path || inDir(p, i.path)).length, root: directories.includes(i.path) }));
      setScanIssues(detailed);
      if (detailed.length > 0) {
        const n = detailed.length;
        toast.warning(`${n} ${n === 1 ? 'folder' : 'folders'} couldn't be opened — any titles in them were kept.`, {
          duration: 12000,
          action: { label: 'Show which', onClick: () => setShowScanIssues(true) },
        });
      }
    } catch (err) {
      console.error('Rescan all failed:', err);
      toast.error('Failed to update library');
    } finally {
      setIsRescanning(false);
    }
  };

  const offlineGuard = (path) => {
    const r = rootOf(path);
    if (r && offlineRef.current.has(r)) { toast.error(`${driveLabel(r, driveNamesRef.current)} isn't connected — plug it in (or wake your NAS) to play this`); return true; }
    return false;
  };

  const playMovie = (movie) => {
    if (isMultiPart(movie)) { setPartsMovie(movie); return; }
    if (offlineGuard(movie.file_path)) return;
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
    if (offlineGuard(movie.file_path)) return;
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
  // Recently Added always lists the newest files first
  const sortNewestAdded = (list) => [...list].sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
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

  // Compute available genres from all movies
  const availableGenres = useMemo(() => {
    const genreCount = {};
    movies.forEach(m => {
      if (m.genres && Array.isArray(m.genres)) {
        m.genres.forEach(g => {
          const name = typeof g === 'object' && g.name ? g.name : String(g);
          if (name) genreCount[name] = (genreCount[name] || 0) + 1;
        });
      }
    });
    return Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
  }, [movies]);

  const deferredSearch = useDeferredValue(searchQuery);
  const activeCollectionIds = useMemo(() => {
    if (!activeCollection) return null;
    const col = collections.find(c => c.id === activeCollection);
    return col ? new Set(col.movie_ids) : null;
  }, [activeCollection, collections]);
  const typedDirs = useMemo(() => [...new Set([...directories, ...Object.keys(dirCategories)])], [directories, dirCategories]);
  const categoryOf = useCallback((m) => cardCategory(m, dirCategories, typedDirs), [dirCategories, typedDirs]);
  // Move titles to a type; picking the folder's own type clears the override
  const moveToCategory = useCallback((ids, cat) => {
    const idSet = new Set(ids);
    setMovies(prev => prev.map(m => {
      if (!idSet.has(m.id)) return m;
      const next = { ...m };
      if (!cat || cat === folderCategory(m, dirCategories, typedDirs)) delete next.category_override;
      else next.category_override = cat;
      return next;
    }));
    const n = idSet.size;
    const label = cat ? (DIR_CATEGORIES.find(c => c.id === cat) || {}).label : "their folder's type";
    toast.success('Moved ' + n + (n === 1 ? ' title' : ' titles') + ' to ' + label);
  }, [dirCategories, typedDirs]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const toggleSelect = useCallback((id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);
  const exitSelect = () => { setSelectMode(false); setSelectedIds(new Set()); };
  // ?person=<name>&role=actor|director|pair[&director=<name>] (from a Stats filmography) limits the grid to their films
  const personParam = searchParams.get('person');
  const personRole = searchParams.get('role');
  const personDirector = searchParams.get('director');
  const personIds = useMemo(() => {
    if (!personParam) return null;
    const films = personRole === 'pair' ? pairFilmography(movies, personParam, personDirector) : filmography(movies, personParam, personRole === 'director' ? 'director' : 'actor');
    return new Set(films.map(f => f.movie.id));
  }, [personParam, personRole, personDirector, movies]);
  const clearPersonFilter = () => {
    const next = new URLSearchParams(searchParams);
    ['person', 'role', 'director'].forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
  };
  // Drives / shares that aren't reachable right now (checked on open, every minute, after Update Library)
  const [offlineRoots, setOfflineRoots] = useState(() => new Set());
  const [driveNames, setDriveNames] = useState(loadDriveNames);
  const driveNamesRef = useRef(driveNames);
  driveNamesRef.current = driveNames;
  const setDriveName = (root, name) => {
    setDriveNames(prev => {
      const next = { ...prev };
      if (name) next[root] = name; else delete next[root];
      localStorage.setItem(DRIVE_NAMES_KEY, JSON.stringify(next));
      return next;
    });
    toast.success(name ? `${root} is now "${name}"` : `Nickname removed from ${root}`);
  };
  const offlineRef = useRef(offlineRoots);
  const libraryRoots = useMemo(() => {
    const set = new Set();
    movies.forEach(m => partsOf(m).forEach(p => { const r = rootOf(p.file_path); if (r) set.add(r); }));
    return [...set].sort();
  }, [movies]);
  const rootsKey = libraryRoots.join('|');
  const checkDrives = useCallback(async () => {
    if (!window.electronAPI?.checkRoots || !libraryRoots.length) return;
    const res = await window.electronAPI.checkRoots(libraryRoots).catch(() => null);
    if (!res) return;
    const next = new Set(libraryRoots.filter(r => res[r] === false));
    const prev = offlineRef.current;
    if (next.size === prev.size && [...next].every(r => prev.has(r))) return;
    [...prev].filter(r => !next.has(r)).forEach(r => toast.success(`${driveLabel(r, driveNamesRef.current)} is back online`));
    offlineRef.current = next;
    setOfflineRoots(next);
  }, [rootsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkDrives();
    const t = setInterval(checkDrives, 60000);
    return () => clearInterval(t);
  }, [checkDrives]);
  const detailOffline = !!selectedMovie && !isMultiPart(selectedMovie) && offlineRoots.has(rootOf(selectedMovie.file_path));
  const isOfflineTitle = useCallback((m) => offlineRoots.size > 0 && partsOf(m).some(p => offlineRoots.has(rootOf(p.file_path))), [offlineRoots]);
  const offlineByDrive = useMemo(() => {
    const out = {};
    if (!offlineRoots.size) return out;
    movies.forEach(m => {
      const r = [...new Set(partsOf(m).map(p => rootOf(p.file_path)))].find(x => offlineRoots.has(x));
      if (r) (out[r] = out[r] || []).push(m);
    });
    return out;
  }, [movies, offlineRoots]);
  const offlineTitleCount = useMemo(() => Object.values(offlineByDrive).reduce((n, l) => n + l.length, 0), [offlineByDrive]);
  useEffect(() => {
    window.__ocOffline = { titles: offlineTitleCount, drives: offlineRoots.size };
    window.dispatchEvent(new CustomEvent('oc-offline-drives', { detail: window.__ocOffline }));
  }, [offlineTitleCount, offlineRoots]);
  const filteredMovies = useMemo(() => (quickFilter === 'recent' ? sortNewestAdded : sortMovies)(
    movies.filter(movie => {
      if (personIds && !personIds.has(movie.id)) return false;
      // Quick filter
      if (quickFilter === 'no-poster' && movie.poster_path) return false;
      if (quickFilter === 'no-rating' && movie.rating) return false;
      if (quickFilter === 'no-year' && movie.year) return false;
      if (quickFilter === 'no-genre' && movie.genres && movie.genres.length > 0) return false;
      if (quickFilter === 'favorites' && !favoriteSet.has(movie.id)) return false;
      if (quickFilter === 'needs-review' && !movie.needs_review) return false;
      if (quickFilter === 'recent' && !recentIds.has(movie.id)) return false;
      if (quickFilter === 'offline' && !isOfflineTitle(movie)) return false;
      // Genre filter
      if (selectedGenre) {
        const movieGenres = (movie.genres || []).map(g => typeof g === 'object' && g.name ? g.name : String(g));
        if (!movieGenres.includes(selectedGenre)) return false;
      }
      // Directory filter
      if (activeDirectory) {
        if (!inDir(movie.file_path, activeDirectory)) return false;
      } else if (activeCategory) {
        if (categoryOf(movie) !== activeCategory) return false;
      }
      // Collection filter
      if (activeCollectionIds && !activeCollectionIds.has(movie.id)) return false;
      if (!deferredSearch) return true;
      const query = deferredSearch.toLowerCase();
      return String(movie.title || '').toLowerCase().includes(query) || 
             movie.file_name?.toLowerCase().includes(query) ||
             (movie.year && String(movie.year) === query) ||
             (movie.director && movie.director.toLowerCase().includes(query)) ||
             (movie.aka && movie.aka.some(a => a.toLowerCase().includes(query))) ||
             (movie.cast && movie.cast.some(c => c.name?.toLowerCase().includes(query)));
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [movies, quickFilter, selectedGenre, activeDirectory, activeCategory, categoryOf, activeCollectionIds, deferredSearch, sortBy, favoriteSet, showRootsKey, personIds, isOfflineTitle]);

  const openMovieDetailCb = useCallback((m) => { setSelectedMovie(m); trackActivity(m.id, 'view'); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const playMovieCb = useCallback((m) => playMovie(m), []);
  const [glow, setGlow] = useState(null);
  const [detailRgb, setDetailRgb] = useState(null);
  const detailPoster = selectedMovie ? selectedMovie.poster_path : null;
  const detailTitle = selectedMovie ? selectedMovie.title : null;
  useEffect(() => {
    if (!detailTitle) { setDetailRgb(null); return undefined; }
    let live = true;
    getPosterColor(detailPoster, detailTitle).then(rgb => { if (live) setDetailRgb(rgb); });
    return () => { live = false; };
  }, [detailPoster, detailTitle]);
  const glowRef = useRef({ key: null, timer: null });
  const hoverPoster = useCallback((m) => {
    const g = glowRef.current;
    clearTimeout(g.timer);
    if (!m) { g.key = null; g.timer = setTimeout(() => setGlow(null), 350); return; }
    g.key = m.id;
    getPosterColor(m.poster_path, m.title).then(rgb => { if (glowRef.current.key === m.id) setGlow(rgb); });
  }, []);
  const multipartGroups = useMemo(() => findPartGroups(movies, multipartDismissed), [movies, multipartDismissed, showRootsKey]);
  useEffect(() => {
    const catDir = catCheckDirRef.current;
    if (catDir) {
      catCheckDirRef.current = null;
      const inCat = multipartGroups.filter(g => g.members.some(m => inDir(String(partsOf(m)[0].file_path).toLowerCase(), catDir.toLowerCase())));
      if (inCat.length > 0) { setAutoMultiHeading('Shows found in this folder'); setAutoMultiKeys(inCat.map(g => g.key)); }
    }
    const ids = autoMultiIdsRef.current;
    if (ids.size === 0) return;
    const hit = multipartGroups.filter(g => g.members.some(m => ids.has(m.id)));
    const grouped = new Set(hit.flatMap(g => g.members.map(m => m.id)));
    autoMultiIdsRef.current = new Set();
    if (hit.length > 0) { setAutoMultiHeading(null); setAutoMultiKeys(hit.map(g => g.key)); }
    // Lone show-folder files that join no group are matched on their own (as TV)
    const lone = movies.filter(m => ids.has(m.id) && !grouped.has(m.id) && partFolderOf(m.file_path).showDir && !partFolderOf(m.file_path).extra);
    if (lone.length > 0) queueAutoMatch(lone, true);
  }, [multipartGroups]);
  const autoMultiGroups = autoMultiKeys ? multipartGroups.filter(g => autoMultiKeys.includes(g.key)) : [];

  const mergeGroups = (groups) => {
    // Use the latest card data (auto-match may have updated members since the suggestion was made)
    const current = new Map(movies.map(m => [m.id, m]));
    const byId = {};
    const removeIds = new Set();
    groups.forEach(g => {
      const cards = g.members.map(m => current.get(m.id)).filter(Boolean);
      if (cards.length < 2) return;
      const merged = mergeIntoOne(cards, g.title, g.year);
      cards.forEach(m => removeIds.add(m.id));
      byId[merged.id] = merged;
    });
    setMovies(prev => prev.filter(m => !removeIds.has(m.id) || byId[m.id]).map(m => byId[m.id] || m));
    setShowMultiPart(false);
    setAutoMultiKeys(null);
    toast.success('Merged ' + groups.length + ' multi-part ' + (groups.length === 1 ? 'title' : 'titles') + ' into single cards');
    // Series cards: add episode names for newly merged episodes
    Object.values(byId).forEach(async (card) => {
      if (card.media_type !== 'tv' || !card.tmdb_id || !tmdbApiKey) return;
      if (card.parts.every(p => p.episode || partSectionName(p) === 'Extras')) return;
      const r = await attachEpisodes(card.parts, card.tmdb_id, tmdbApiKey);
      setMovies(prev => prev.map(m => m.id === card.id ? applyCardUpdate(m, { parts: r.parts }) : m));
    });
    // Brand-new show cards with no match yet: look them up as a TV series
    groups.forEach(g => {
      const card = Object.values(byId).find(c => g.members.some(m => m.id === c.id));
      if (g.show && card && card.media_type !== 'tv' && tmdbApiKey) refreshSeriesInfo(card);
    });
  };

  const dismissMultipartGroup = (group) => {
    const next = [...multipartDismissed, group.key];
    setMultipartDismissed(next);
    localStorage.setItem(MULTIPART_DISMISSED_KEY, JSON.stringify(next));
  };

  const mergeManual = (target, ids) => {
    const idSet = new Set(ids);
    const cards = [target, ...movies.filter(m => idSet.has(m.id))];
    const merged = mergeIntoOne(cards, target.title);
    setMovies(prev => prev.filter(m => !idSet.has(m.id) && m.id !== target.id || m.id === merged.id).map(m => m.id === merged.id ? merged : m));
    setSelectedMovie(merged);
    setMergeTarget(null);
    toast.success('"' + merged.title + '" now has ' + merged.parts.length + ' parts');
  };

  const splitMovie = (movie) => {
    const cards = splitParts(movie);
    setMovies(prev => prev.flatMap(m => m.id === movie.id ? cards : [m]));
    setSelectedMovie(null);
    toast.success('Split into ' + cards.length + ' separate cards');
  };

  const playPart = (movie, part) => {
    if (offlineGuard(part.file_path)) return;
    trackActivity(movie.id, 'play');
    if (window.electronAPI?.openPath) window.electronAPI.openPath(part.file_path);
    else if (window.electronAPI?.openExternal) window.electronAPI.openExternal(part.file_path);
    toast.success('Opening: ' + part.file_name);
  };
  // Scanned folders plus folders typed through Add Files
  const libraryCounts = useMemo(() => {
    const dirCounts = {};
    let missingPoster = 0, needsReview = 0, needsDetails = 0;
    movies.forEach(m => {
      if (!m.poster_path) missingPoster++;
      if (m.needs_review) needsReview++;
      if (m.tmdb_id && !m.metadata_updated_at) needsDetails++;
    });
    typedDirs.forEach(d => { dirCounts[d] = 0; });
    const catCounts = {};
    movies.forEach(m => {
      typedDirs.forEach(d => { if (inDir(m.file_path, d)) dirCounts[d]++; });
      const c = categoryOf(m);
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
    return { dirCounts, catCounts, missingPoster, needsReview, needsDetails };
  }, [movies, typedDirs, categoryOf]);

  const displayedMovies = filteredMovies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMovies.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(100);
  }, [activeDirectory, activeCategory, activeCollection, searchQuery, sortBy, quickFilter, selectedGenre]);

  // Sync quickFilter with URL search params
  useEffect(() => {
    const qf = searchParams.get('qf');
    if (qf !== quickFilter) setQuickFilter(qf);
  }, [searchParams]);

  // ?open=<id> (e.g. from a Stats filmography) opens that title's detail window
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || movies.length === 0) return;
    const m = movies.find(x => String(x.id) === openId);
    if (m) openMovieDetailCb(m);
    const next = new URLSearchParams(searchParams);
    next.delete('open');
    setSearchParams(next, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, movies.length > 0]);

  // Background auto-fill: quietly fetch full details (runtime, cast...) for matched titles, in small slow batches
  const bgTriedRef = useRef(new Set());
  const bgStopRef = useRef(false);
  const [autoEnrich, setAutoEnrich] = useState(() => localStorage.getItem(AUTO_ENRICH_KEY) !== 'off');
  const [bgEnrich, setBgEnrich] = useState(null);
  // Missing details, or a film fetched before AKA titles / director photos existed
  const needsBg = (m) => m.tmdb_id && !bgTriedRef.current.has(m.id) && (!m.metadata_updated_at || (m.media_type !== 'tv' && !isSeries(m) && m.aka === undefined));
  const bgPending = useMemo(
    () => movies.filter(needsBg).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movies, bgEnrich]
  );
  const runBackgroundEnrich = async () => {
    const batch = movies.filter(needsBg).slice(0, 200);
    if (batch.length === 0) return;
    bgStopRef.current = false;
    setBgEnrich({ done: 0, total: batch.length });
    let done = 0;
    let lastFlush = Date.now();
    let lastUi = 0;
    await runPool(batch, m => { bgTriedRef.current.add(m.id); return fetchDetailsForMovie(m); }, {
      concurrency: 2,
      shouldStop: () => bgStopRef.current,
      onResult: (movie, data) => {
        done++;
        if (data) queueUpdate(movie.id, data);
        if (Date.now() - lastFlush > 3000) { lastFlush = Date.now(); flushUpdates(); }
        if (Date.now() - lastUi > 1000) { lastUi = Date.now(); setBgEnrich({ done, total: batch.length }); }
      },
    });
    flushUpdates();
    setBgEnrich(null);
  };
  useEffect(() => {
    if (!autoEnrich || !tmdbApiKey || fetchingPosters || fetchingCast || bgEnrich || bgPending === 0) return;
    const t = setTimeout(runBackgroundEnrich, 10000);
    return () => clearTimeout(t);
  }, [autoEnrich, tmdbApiKey, fetchingPosters, fetchingCast, bgEnrich, bgPending]);
  useEffect(() => () => { bgStopRef.current = true; }, []);
  const libraryReady = movies.length > 0;

  // Fix missing info: TMDB, then Wikidata, then file/folder clues; year mismatches are offered as renames
  const [fixRun, setFixRun] = useState(null);
  const [yearMismatches, setYearMismatchesState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(YEAR_MISMATCH_KEY) || '[]'); } catch { return []; }
  });
  // Kept on disk so mismatches found in the background survive a restart
  const setYearMismatches = (fn) => setYearMismatchesState(prev => {
    const next = typeof fn === 'function' ? fn(prev) : fn;
    localStorage.setItem(YEAR_MISMATCH_KEY, JSON.stringify(next));
    return next;
  });
  const [showMismatches, setShowMismatches] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const fx = useEffectsLevel(movies.length);
  const fixTriedRef = useRef(new Set());
  const runFixMissing = async (list, manual) => {
    if (fixRun || list.length === 0) return;
    list.forEach(m => fixTriedRef.current.add(m.id));
    setFixRun({ done: 0, total: list.length, manual });
    try {
      const { updates, mismatches } = await fixMissingInfo(list, {
        apiKey: tmdbApiKey, categoryOf,
        onProgress: (done, total) => setFixRun({ done, total, manual }),
      });
      setMovies(prev => prev.map(m => updates[m.id] ? applyCardUpdate(m, updates[m.id]) : m));
      const count = (k) => list.filter(m => { const u = updates[m.id] || {}; return k === 'genres' ? u.genres && u.genres.length && !(m.genres && m.genres.length) : u[k] && !m[k]; }).length;
      const parts = [['rating', 'ratings'], ['year', 'years'], ['genres', 'genres']].map(([k, label]) => { const n = count(k); return n + ' ' + (n === 1 && k !== 'genres' ? label.slice(0, -1) : label); });
      const left = list.map(m => ({ ...m, ...(updates[m.id] || {}) })).filter(hasGap).length;
      const keep = mismatches.filter(x => !renameIgnored.includes(x.file_path));
      if (keep.length) {
        setYearMismatches(prev => [...prev.filter(p => !keep.some(x => x.id === p.id)), ...keep]);
        if (manual) setShowMismatches(true);
      }
      if (manual) toast.success('Filled ' + parts.join(', ') + (left ? ' · ' + left + ' still incomplete' : '') + (keep.length ? ' · ' + keep.length + (keep.length === 1 ? ' file name differs' : ' file names differ') + ' in year' : ''));
    } finally {
      setFixRun(null);
    }
  };
  const fixList = quickFilter === 'no-rating' || quickFilter === 'no-year' || quickFilter === 'no-genre' ? filteredMovies : null;
  // Background: quietly fill gaps in small batches while auto-fill is on
  useEffect(() => {
    if (!libraryReady || !autoEnrich || fixRun || fetchingPosters || fetchingCast) return;
    const t = setTimeout(() => {
      const batch = movies.filter(m => needsAutoFix(m) && !fixTriedRef.current.has(m.id)).slice(0, 100);
      if (batch.length) runFixMissing(batch, false);
    }, 25000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryReady, autoEnrich, fixRun, fetchingPosters, fetchingCast, movies.length]);
  // Files the user never wants renamed (by path), kept across restarts
  const [renameIgnored, setRenameIgnored] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RENAME_IGNORED_KEY) || '[]'); } catch { return []; }
  });
  const saveIgnored = (list) => { setRenameIgnored(list); localStorage.setItem(RENAME_IGNORED_KEY, JSON.stringify(list)); };
  const ignoreMismatch = (item) => {
    saveIgnored([...new Set([...renameIgnored, item.file_path])]);
    setYearMismatches(prev => prev.filter(p => p.id !== item.id));
    toast.success(item.file_name + ' will not be suggested for renaming again');
  };
  const resetRenameIgnored = () => {
    saveIgnored([]);
    toast.success('Those files can be suggested again on the next check');
  };
  // Only titles still in the library, at the same path, and not set to never rename
  const liveMismatches = useMemo(() => {
    const byId = new Map(movies.map(m => [m.id, m]));
    return yearMismatches.filter(x => { const m = byId.get(x.id); return m && m.file_path === x.file_path && !renameIgnored.includes(x.file_path); });
  }, [yearMismatches, movies, renameIgnored]);
  useEffect(() => {
    if (libraryReady && liveMismatches.length !== yearMismatches.length) setYearMismatches(liveMismatches);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryReady, liveMismatches]);
  const renameMismatches = async (items) => {
    let ok = 0;
    const failed = [];
    const done = new Set();
    for (const it of items) {
      const r = window.electronAPI?.renameFile ? await window.electronAPI.renameFile(it.file_path, it.newName) : { success: false, error: 'Desktop app only' };
      if (r && r.success) {
        ok++;
        done.add(it.id);
        setMovies(prev => prev.map(m => m.id === it.id ? { ...m, file_path: r.newPath, file_name: it.newName, year: it.foundYear } : m));
      } else failed.push(it.file_name + ': ' + ((r && r.error) || 'failed'));
    }
    // Failed renames stay in the list so they can be retried
    setYearMismatches(prev => prev.filter(p => !done.has(p.id)));
    setShowMismatches(false);
    if (ok) toast.success('Renamed ' + ok + (ok === 1 ? ' file' : ' files'));
    if (failed.length) toast.error('Could not rename: ' + failed.slice(0, 3).join('; '));
  };
  useEffect(() => {
    if (!libraryReady || !autoEnrich || !tmdbApiKey || fetchingPosters || fetchingCast || autoMatchQueueRef.current.size === 0) return;
    const ids = new Set(autoMatchQueueRef.current);
    autoMatchQueueRef.current.clear();
    saveAutoMatchQueue();
    fetchAllPosters(ids);
  }, [autoMatchTick, autoEnrich, tmdbApiKey, fetchingPosters, fetchingCast, libraryReady]);
  const toggleAutoEnrich = () => {
    const next = !autoEnrich;
    setAutoEnrich(next);
    localStorage.setItem(AUTO_ENRICH_KEY, next ? 'on' : 'off');
    if (!next) bgStopRef.current = true;
    toast.info(next ? 'Auto-fill details turned on' : 'Auto-fill details paused');
  };

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
    <div className="p-6 space-y-6 relative isolate min-h-full" onDragOver={onLibraryDragOver} onDragLeave={onLibraryDragLeave} onDrop={onLibraryDrop} data-testid="library-drop-zone">
      <PosterBackdrop rgb={glow} />
      {dragOver && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-background/70 backdrop-blur-sm" data-testid="library-drop-overlay">
          <div className="px-8 py-6 rounded-2xl border-2 border-dashed border-primary bg-card/90 text-center">
            <FilePlus2 className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">Drop video files or a folder to add them</p>
            <p className="text-xs text-muted-foreground mt-1">You'll pick Movies, TV Shows, Documentaries or Animations next</p>
          </div>
        </div>
      )}
      {/* Milestone celebration */}
      {milestone && <ConfettiBurst onComplete={dismissMilestone} />}
      {milestone && <FireworksOverlay onComplete={dismissMilestone} />}
      {milestone && (
        <div className="milestone-banner" onClick={dismissMilestone}>
          {milestone.toLocaleString()} movies in your library! 
        </div>
      )}
      {/* Dialogs driven by the toolbar */}
      <ScanIssuesDialog open={showScanIssues} onClose={() => setShowScanIssues(false)} issues={scanIssues} onDismiss={() => { setScanIssues([]); setShowScanIssues(false); }} />
      <ImportTypeDialog open={showFilesType} onOpenChange={setShowFilesType} onPick={onFilesTypePicked} dropCount={dropCount} />
      <FilmographyDialog person={person} movies={movies} onClose={() => setPerson(null)} onLeave={() => setSelectedMovie(null)} />
      <PartsPlayDialog movie={partsMovie} onClose={() => setPartsMovie(null)} onPlayPart={playPart} />
      <MergePickerDialog movie={mergeTarget} movies={movies} onClose={() => setMergeTarget(null)} onMerge={mergeManual} />
      {showMismatches && <YearMismatchDialog items={liveMismatches} onClose={() => setShowMismatches(false)} onRename={renameMismatches} onIgnore={ignoreMismatch} ignoredCount={renameIgnored.length} onResetIgnored={resetRenameIgnored} />}
      {showMultiPart && multipartGroups.length > 0 && (
        <MultiPartSuggestDialog open={showMultiPart} onOpenChange={setShowMultiPart} groups={multipartGroups} onMerge={mergeGroups} onDismiss={dismissMultipartGroup} />
      )}
      {!showMultiPart && autoMultiGroups.length > 0 && (
        <MultiPartSuggestDialog
          open
          onOpenChange={(o) => { if (!o) setAutoMultiKeys(null); }}
          groups={autoMultiGroups}
          onMerge={mergeGroups}
          onDismiss={dismissMultipartGroup}
          heading={autoMultiHeading || "New files belong with existing titles"}
        />
      )}
      {showPdf && (
        <PdfExportDialog
          autoOpen
          onClose={() => setShowPdf(false)}
          movies={filteredMovies}
          listTitle={activeCollection ? 'Collection' : (activeDirectory ? activeDirectory.split(/[\\/]/).pop() : (activeCategory ? 'All ' + (DIR_CATEGORIES.find(c => c.id === activeCategory) || {}).label : 'My Movie Library'))}
        />
      )}

      {/* Header: title, counts and the three main actions */}
      <LibraryHeader
        catCounts={libraryCounts.catCounts}
        total={movies.length}
        folders={directories.length}
        fx={fx}
        actions={
          <>
            <LocalDirectoryBrowser onMoviesFound={handleMoviesFound} />
            {directories.length > 0 && (
              <Button variant="outline" size="sm" className="h-9 rounded-full px-4 gap-1.5 border-border/70 hover:border-primary/60 transition-colors" onClick={rescanAllDirectories} disabled={isRescanning} data-testid="update-library-btn" title="Rescan all directories for changes">
                <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin' : ''}`} />
                <span className="text-xs">{isRescanning ? 'Scanning...' : 'Update Library'}</span>
              </Button>
            )}
            {directories.length > 0 && <HelpLink chapter="updating" label="Keeping your library up to date" className="-ml-1" />}
            <LibraryTools
              hasTitles={movies.length > 0}
              needsReview={libraryCounts.needsReview}
              reviewActive={quickFilter === 'needs-review'}
              onToggleReview={() => setQuickFilter(quickFilter === 'needs-review' ? null : 'needs-review')}
              multipart={multipartGroups.length}
              onMultipart={() => setShowMultiPart(true)}
              mismatches={liveMismatches.length}
              onMismatches={() => setShowMismatches(true)}
              missingPoster={movies.length > 0 ? libraryCounts.missingPoster : 0}
              fetchingPosters={fetchingPosters}
              onFetchPosters={startFetchPosters}
              needsDetails={libraryCounts.needsDetails}
              fetchingCast={fetchingCast}
              castProgress={castFetchProgress}
              onEnrich={fetchAllCast}
              fixCount={fixList ? fixList.length : null}
              fixRun={fixRun}
              onFix={() => runFixMissing(fixList, true)}
              showAutoFill={!!tmdbApiKey && movies.length > 0}
              autoEnrich={autoEnrich}
              bgEnrich={bgEnrich}
              onToggleAutoFill={toggleAutoEnrich}
              onSelect={() => setSelectMode(true)}
              onAddFiles={handleAddFiles}
              onPdf={() => setShowPdf(true)}
            />
          </>
        }
      />

      {/* Toolbar: search, type filters, genre and sort */}
      <div className="oc-toolbar sticky top-2 z-30 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl shadow-lg shadow-black/20 px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-2" data-testid="library-toolbar">
        <div className="relative w-52 xl:w-64 focus-within:w-72 xl:focus-within:w-80 transition-[width] duration-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search titles, actors…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-12 h-8 text-sm rounded-full bg-secondary/50 border-transparent focus-visible:border-primary/50 focus-visible:ring-primary/30"
            data-testid="movie-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="movie-search-clear-btn"
            >
              Clear
            </button>
          )}
        </div>
        {typedDirs.length > 0 && (
          <>
            <DirectoryDropdowns
              directories={typedDirs}
              categories={dirCategories}
              counts={libraryCounts.dirCounts}
              catCounts={libraryCounts.catCounts}
              totalCount={movies.length}
              activeDirectory={activeDirectory}
              activeCategory={activeCategory}
              onPickDir={(d) => { setActiveCategory(null); setActiveDirectory(activeDirectory === d ? null : d); }}
              onPickCategory={(c) => { setActiveDirectory(null); setActiveCategory(activeCategory === c ? null : c); }}
              onClearAll={() => { setActiveDirectory(null); setActiveCategory(null); }}
              onManage={() => setShowDirManager(true)}
            />
          </>
        )}
        <div className="flex-1" />
        {scanIssues.length > 0 && (
          <button type="button" onClick={() => setShowScanIssues(true)} className="oc-chip-in h-7 px-2.5 rounded-full text-[11px] flex items-center gap-1.5 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors" title="Folders the last Update Library couldn't open" data-testid="scan-issues-chip">
            <AlertTriangle className="w-3 h-3" /> {scanIssues.length} {scanIssues.length === 1 ? 'folder' : 'folders'} skipped
          </button>
        )}
        {offlineRoots.size > 0 && (
          <button
            type="button"
            onClick={() => setSearchParams(quickFilter === 'offline' ? {} : { qf: 'offline' })}
            className={'oc-chip-in h-7 px-2.5 rounded-full text-[11px] flex items-center gap-1.5 transition-colors ' + (quickFilter === 'offline' ? 'bg-amber-500 text-black' : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25')}
            title={'Not connected: ' + [...offlineRoots].map(r => driveLabel(r, driveNames)).join(', ')}
            data-testid="offline-drives-chip"
          >
            <HardDrive className="w-3 h-3" />
            {offlineRoots.size} {offlineRoots.size === 1 ? 'drive' : 'drives'} offline · {offlineTitleCount}
            {quickFilter === 'offline' && <X className="w-3 h-3 ml-0.5" />}
          </button>
        )}
        {quickFilter === 'needs-review' && (
          <button type="button" onClick={() => setQuickFilter(null)} className="oc-chip-in h-7 px-2.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] flex items-center gap-1" data-testid="needs-review-active-chip">
            <AlertTriangle className="w-3 h-3" /> Checking matches <X className="w-3 h-3 ml-0.5" />
          </button>
        )}
        {fetchingCast && (
          <span className="oc-chip-in h-7 pl-2.5 pr-1 rounded-full bg-primary/15 text-primary text-[11px] flex items-center gap-1.5" data-testid="enrich-activity">
            <Sparkles className="w-3 h-3 animate-pulse" /> Enriching {castFetchProgress}%
            <button type="button" onClick={abortFetch} className="h-5 px-2 rounded-full bg-background/60 text-amber-300 hover:bg-background" data-testid="abort-enrich-btn">Pause</button>
          </span>
        )}
        {!fetchingCast && bgEnrich && (
          <span className="oc-chip-in h-7 px-2.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] flex items-center gap-1.5" data-testid="auto-enrich-activity">
            <Loader2 className="w-3 h-3 animate-spin" /> Auto-filling {bgEnrich.done}/{bgEnrich.total}
          </span>
        )}
        {fixRun && (
          <span className="oc-chip-in h-7 px-2.5 rounded-full bg-secondary text-muted-foreground text-[11px] flex items-center gap-1.5" data-testid="fix-missing-bg">
            <Loader2 className="w-3 h-3 animate-spin" /> Filling gaps {fixRun.done}/{fixRun.total}
          </span>
        )}
        {personParam && (
          <div className="flex items-center gap-1 text-sm" data-testid="person-filter-chip">
            <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs">
              {personRole === 'pair' ? personParam + ' & ' + personDirector : personParam} · {personIds ? personIds.size : 0} {personIds && personIds.size === 1 ? 'film' : 'films'}
            </span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearPersonFilter} data-testid="person-filter-clear">
              <X className="w-3 h-3 mr-1" /> Show all
            </Button>
          </div>
        )}
          {/* Genre Filter */}
          {availableGenres.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={selectedGenre ? "default" : "outline"} size="sm" className="gap-1.5 h-8 rounded-full" data-testid="genre-dropdown">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="text-xs">{selectedGenre || 'Genre'}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Filter by Genre</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedGenre(null)} className={!selectedGenre ? 'bg-accent' : ''}>
                  All Genres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableGenres.map(([genre, count]) => (
                  <DropdownMenuItem key={genre} onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)} className={selectedGenre === genre ? 'bg-accent' : ''}>
                    <span className="flex-1">{genre}</span>
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-2">{count}</Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 rounded-full" data-testid="sort-dropdown">
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

      {/* Over-limit warning for free users who somehow have more than 500 movies */}
      {isFreeTierUser() && movies.length > FREE_TIER_MOVIE_LIMIT && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg" data-testid="over-limit-banner">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Library exceeds Free Tier limit</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your library has {movies.length.toLocaleString()} movies but the free tier allows {FREE_TIER_MOVIE_LIMIT}. 
                You cannot add new movies or scan new directories until you upgrade to Pro.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold flex-shrink-0"
              onClick={() => {
                if (isElectron()) {
                  window.location.hash = '#/activate';
                }
              }}
              data-testid="over-limit-upgrade-btn"
            >
              <Crown className="w-3.5 h-3.5 mr-1.5" />
              Upgrade to Pro
            </Button>
          </div>
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
        <WelcomeGuide
          addFolderButton={<LocalDirectoryBrowser onMoviesFound={handleMoviesFound} label="Add your first folder" testId="welcome-add-folder-btn" />}
        />
      ) : quickFilter === 'offline' ? (
        <div className="space-y-8" data-testid="offline-groups">
          <p className="text-xs text-muted-foreground flex items-center gap-1">Titles on drives that aren't connected right now, grouped by drive. <HelpLink chapter="drives" label="Offline drives" /></p>
          {Object.keys(offlineByDrive).length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground" data-testid="offline-none">All your drives are connected — nothing to plug in.</Card>
          )}
          {Object.keys(offlineByDrive).sort().map(root => {
            const ids = new Set(filteredMovies.map(m => m.id));
            const list = offlineByDrive[root].filter(m => ids.has(m.id));
            if (!list.length) return null;
            return (
              <div key={root} data-testid={`offline-group-${root.replace(/[^a-zA-Z0-9]/g, '')}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><HardDrive className="w-4 h-4" /></span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DriveNameEditor root={root} name={driveNames[root]} onSave={setDriveName} testid={`drive-name-${root.replace(/[^a-zA-Z0-9]/g, '')}`} />
                      <span className="font-mono text-xs text-muted-foreground">{root}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{list.length} {list.length === 1 ? 'title' : 'titles'} · plug in {driveNames[root] ? `"${driveNames[root]}"` : 'this drive'} (or wake your NAS) to play them</p>
                  </div>
                </div>
                <div className={`grid ${GRID_SIZES[gridSize].cols} ${GRID_SIZES[gridSize].gap}`}>
                  {list.map((movie, i) => (
                    <MovieCard index={i} key={movie.id} movie={movie} gridSize={gridSize} onOpen={openMovieDetailCb} onPlayMovie={playMovieCb} isFavorite={favoriteSet.has(movie.id)} onToggleFav={toggleFavorite} category={categoryOf(movie)} onMove={moveToCategory} selectMode={selectMode} selected={selectMode && selectedIds.has(movie.id)} onSelect={toggleSelect} fx={fx} onHover={hoverPoster} offline={driveLabel(root, driveNames)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
                  {dirMovies.map((movie, i) => (
                    <MovieCard index={i} key={movie.id} movie={movie} gridSize={gridSize} onOpen={openMovieDetailCb} onPlayMovie={playMovieCb} isFavorite={favoriteSet.has(movie.id)} onToggleFav={toggleFavorite} category={categoryOf(movie)} onMove={moveToCategory} selectMode={selectMode} selected={selectMode && selectedIds.has(movie.id)} onSelect={toggleSelect} fx={fx} onHover={hoverPoster} offline={offlineRoots.size > 0 && offlineRoots.has(rootOf(movie.file_path)) && driveLabel(rootOf(movie.file_path), driveNames)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className={`grid ${GRID_SIZES[gridSize].cols} ${GRID_SIZES[gridSize].gap}`}>
          {displayedMovies.map((movie, i) => (
            <MovieCard index={i} key={movie.id} movie={movie} gridSize={gridSize} onOpen={openMovieDetailCb} onPlayMovie={playMovieCb} isFavorite={favoriteSet.has(movie.id)} onToggleFav={toggleFavorite} category={categoryOf(movie)} onMove={moveToCategory} selectMode={selectMode} selected={selectMode && selectedIds.has(movie.id)} onSelect={toggleSelect} fx={fx} onHover={hoverPoster} offline={offlineRoots.size > 0 && offlineRoots.has(rootOf(movie.file_path)) && driveLabel(rootOf(movie.file_path), driveNames)} />
          ))}
        </div>
        )
      )}

      {selectMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-border bg-background/90 backdrop-blur-xl shadow-2xl px-4 py-2" data-testid="select-bar">
          <span className="text-sm font-medium whitespace-nowrap" data-testid="select-count">{selectedIds.size} selected</span>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedIds(new Set(filteredMovies.map(m => m.id)))} data-testid="select-all-shown-btn">
            Select all shown ({filteredMovies.length.toLocaleString()})
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedIds(new Set())} data-testid="select-clear-btn">Clear</Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8 rounded-full gap-1.5" disabled={selectedIds.size === 0} data-testid="bulk-move-btn">
                <MoveIcon className="w-3.5 h-3.5" /> Move to…
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52" data-testid="bulk-move-menu">
              {DIR_CATEGORIES.map(c => {
                const Icon = c.icon;
                return (
                  <DropdownMenuItem key={c.id} onSelect={() => { moveToCategory([...selectedIds], c.id); exitSelect(); }} data-testid={`bulk-move-${c.id}`}>
                    <Icon className="w-3.5 h-3.5 mr-2 opacity-60" />{c.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { moveToCategory([...selectedIds], null); exitSelect(); }} data-testid="bulk-move-reset">
                <UndoIcon className="w-3.5 h-3.5 mr-2 opacity-60" />Back to folder's type
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={exitSelect} title="Cancel" data-testid="select-cancel-btn">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Load More */}
      {hasMore && !showTrash && (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-xs text-muted-foreground">
            Showing {displayedMovies.length} of {filteredMovies.length} titles
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
          <Card className={'oc-detail max-w-lg w-full max-h-[90vh] overflow-y-auto relative ' + (detailRgb ? 'oc-detail-on' : '')} style={detailRgb ? { '--oc-r': detailRgb[0], '--oc-g': detailRgb[1], '--oc-b': detailRgb[2] } : undefined} onClick={(e) => e.stopPropagation()} data-testid="movie-detail-card" data-rgb={detailRgb ? detailRgb.join(',') : ''}>
            <CardContent className="p-6 space-y-4 relative">
              {/* Close X */}
              <button
                onClick={closeDetail}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-destructive/10 transition-colors z-10"
                data-testid="detail-close-x"
              >
                <X className="w-5 h-5 text-red-500" />
              </button>
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
                      className="text-xl font-bold group flex items-center gap-1.5 select-text"
                      data-testid="movie-title-editable"
                    >
                      <span
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => { setEditingTitle(true); setTitleInput(String(selectedMovie.title || selectedMovie.file_name || '')); }}
                        title="Click to edit title"
                      >
                        {String(selectedMovie.title || selectedMovie.file_name || 'Untitled')}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-muted-foreground transition-opacity p-0.5"
                        onClick={() => {
                          navigator.clipboard.writeText(String(selectedMovie.title || selectedMovie.file_name || ''));
                          toast.success('Title copied to clipboard');
                        }}
                        title="Copy title"
                        data-testid="copy-title-btn"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
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
                  {editingRating ? (
                    <div className="flex items-center gap-1.5" data-testid="edit-rating-input-wrapper">
                      <span className="text-amber-400">★</span>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={ratingInput}
                        onChange={(e) => setRatingInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = ratingInput.trim();
                            const parsed = val === '' ? null : parseFloat(val);
                            if (val !== '' && (isNaN(parsed) || parsed < 0 || parsed > 10)) {
                              toast.error('Please enter a rating between 0 and 10');
                              return;
                            }
                            setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, rating: parsed, rating_source: null } : m));
                            setSelectedMovie(prev => ({ ...prev, rating: parsed, rating_source: null }));
                            setEditingRating(false);
                            toast.success(parsed !== null ? `Rating set to ${parsed.toFixed(1)}` : 'Rating removed');
                          }
                          if (e.key === 'Escape') setEditingRating(false);
                        }}
                        className="h-7 w-20 text-sm"
                        autoFocus
                        placeholder="0–10"
                        data-testid="edit-rating-input"
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          const val = ratingInput.trim();
                          const parsed = val === '' ? null : parseFloat(val);
                          if (val !== '' && (isNaN(parsed) || parsed < 0 || parsed > 10)) {
                            toast.error('Please enter a rating between 0 and 10');
                            return;
                          }
                          setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, rating: parsed, rating_source: null } : m));
                          setSelectedMovie(prev => ({ ...prev, rating: parsed, rating_source: null }));
                          setEditingRating(false);
                          toast.success(parsed !== null ? `Rating set to ${parsed.toFixed(1)}` : 'Rating removed');
                        }}
                        data-testid="confirm-rating-btn"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="group flex items-center gap-1.5 cursor-pointer"
                      onClick={() => {
                        setRatingInput(selectedMovie.rating ? String(selectedMovie.rating) : '');
                        setEditingRating(true);
                      }}
                      data-testid="edit-rating-btn"
                    >
                      <p className="text-amber-400">
                        ★ {selectedMovie.rating ? selectedMovie.rating.toFixed(1) : 'No rating'}
                        {selectedMovie.rating > 0 && <RatingSourceTag source={selectedMovie.rating_source} full />}
                      </p>
                      <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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
                          setMovies(prev => prev.map(m => m.id === selectedMovie.id ? applyCardUpdate(m, meta) : m));
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

              {/* Genre Editor */}
              <div className="space-y-1.5" data-testid="genre-editor">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Genres</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedMovie.genres || []).map((g, i) => {
                    const name = typeof g === 'object' && g.name ? g.name : String(g);
                    return (
                      <span key={name + i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/15 text-primary border border-primary/20">
                        {name}
                        <button
                          className="hover:text-destructive transition-colors"
                          onClick={() => {
                            const updated = (selectedMovie.genres || []).filter((_, idx) => idx !== i);
                            setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, genres: updated } : m));
                            setSelectedMovie(prev => ({ ...prev, genres: updated }));
                          }}
                          data-testid={`remove-genre-${name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors" data-testid="add-genre-btn">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44 max-h-60 overflow-y-auto">
                      <DropdownMenuLabel className="text-xs">Select Genre</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {TMDB_GENRES.filter(g => {
                        const current = (selectedMovie.genres || []).map(x => typeof x === 'object' && x.name ? x.name : String(x));
                        return !current.includes(g);
                      }).map(g => (
                        <DropdownMenuItem key={g} onClick={() => {
                          const updated = [...(selectedMovie.genres || []), g];
                          setMovies(prev => prev.map(m => m.id === selectedMovie.id ? { ...m, genres: updated } : m));
                          setSelectedMovie(prev => ({ ...prev, genres: updated }));
                          toast.success(g + ' added');
                        }}>
                          {g}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {selectedMovie.needs_review && (
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-2" data-testid="needs-review-panel">
                  <p className="text-xs text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Uncertain match{selectedMovie.tmdb_title ? ': "' + selectedMovie.tmdb_title + '"' : ''}{selectedMovie.release_date ? ' (' + selectedMovie.release_date.slice(0, 4) + ')' : ''} — is this the right movie?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => confirmMatch(selectedMovie)} data-testid="confirm-match-btn">
                      <Check className="w-3 h-3 mr-1" /> Yes, correct
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setPosterMode('search'); setPosterSearch(selectedMovie.title || ''); searchPosters(selectedMovie.title || ''); }} data-testid="fix-match-btn">
                      <Search className="w-3 h-3 mr-1" /> Pick the right one
                    </Button>
                  </div>
                </div>
              )}

              {(filmDirectors(selectedMovie).length > 0 || selectedMovie.runtime || selectedMovie.certification || selectedMovie.tagline || selectedMovie.imdb_id || (selectedMovie.aka && selectedMovie.aka.length > 0)) && (
                <div className="space-y-1.5" data-testid="movie-extra-details">
                  {selectedMovie.tagline && <p className="text-xs italic text-muted-foreground" data-testid="movie-tagline">"{selectedMovie.tagline}"</p>}
                  {selectedMovie.aka && selectedMovie.aka.length > 0 && (
                    <p className="text-xs text-muted-foreground" data-testid="movie-aka">Also known as: <span className="text-foreground">{selectedMovie.aka.join(' · ')}</span></p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {selectedMovie.certification && <span className="px-1.5 py-0.5 border border-border rounded text-[10px] font-semibold" data-testid="movie-certification">{selectedMovie.certification}</span>}
                    {selectedMovie.runtime ? <span className="flex items-center gap-1" data-testid="movie-runtime"><Clock className="w-3 h-3" />{Math.floor(selectedMovie.runtime / 60) > 0 ? Math.floor(selectedMovie.runtime / 60) + 'h ' : ''}{selectedMovie.runtime % 60}m</span> : null}
                    {selectedMovie.media_type === 'tv' && <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-semibold" data-testid="movie-series-badge">TV SERIES{selectedMovie.episode_count ? ' · ' + selectedMovie.episode_count + ' episodes' : ''}</span>}
                    {filmDirectors(selectedMovie).length > 0 && <span data-testid="movie-director">{selectedMovie.media_type === 'tv' ? 'Created by' : 'Directed by'} {filmDirectors(selectedMovie).map((d, i) => (
                      <span key={d.name + i}>{i > 0 && ', '}<button type="button" onClick={() => setPerson({ name: d.name, role: 'director', photo: d.profile_path })} className="text-foreground hover:text-primary hover:underline" data-testid={'movie-director-link-' + i}>{d.name}</button></span>
                    ))}</span>}
                    {selectedMovie.imdb_id && (
                      <button className="text-amber-400 hover:underline" onClick={() => { var u = 'https://www.imdb.com/title/' + selectedMovie.imdb_id + '/'; if (window.electronAPI?.openExternal) window.electronAPI.openExternal(u); else window.open(u, '_blank'); }} data-testid="movie-imdb-link">IMDb</button>
                    )}
                  </div>
                  {selectedMovie.collection_name && <p className="text-[11px] text-muted-foreground" data-testid="movie-collection-name">Part of: {selectedMovie.collection_name}</p>}
                </div>
              )}

              {/* Cast Section */}
              {selectedMovie.cast && selectedMovie.cast.length > 0 ? (
                <CastRow cast={selectedMovie.cast} onPick={setPerson} onClear={() => {
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
                    var details = await fetchDetailsForMovie(selectedMovie);
                    if (details && details.cast && details.cast.length) {
                      setMovies(function(prev) { return prev.map(function(m) { return m.id === selectedMovie.id ? Object.assign({}, m, details) : m; }); });
                      setSelectedMovie(function(prev) { return Object.assign({}, prev, details); });
                      toast.success('Cast & details loaded');
                    } else {
                      toast.info('No cast data found');
                    }
                  }}
                  data-testid="fetch-cast-single-btn"
                >
                  <Users className="w-3 h-3 mr-1.5" /> Load cast & details from TMDB
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
                        <Button size="sm" onClick={() => searchPosters()} disabled={posterSearching} className="h-8">
                          {posterSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        </Button>
                      </div>
                      {posterResults.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                          {posterResults.map(function(result) {
                            return (
                              <div
                                key={result.media_type + '-' + result.id}
                                className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                                onClick={() => applyManualMatch(result)}
                                data-testid={'poster-result-' + result.media_type + '-' + result.id}
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
                    <SparkleHover active={aiButtonHover}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs"
                        onClick={() => fetchAiSuggestions(selectedMovie)}
                        onMouseEnter={() => setAiButtonHover(true)}
                        onMouseLeave={() => setAiButtonHover(false)}
                        data-testid="get-ai-suggestions-btn"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        If you liked this, you might also enjoy...
                      </Button>
                    </SparkleHover>
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

              {isMultiPart(selectedMovie) && (
                <div className="space-y-1.5" data-testid="movie-parts-section">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" />{selectedMovie.parts.length} Parts</span>
                  <PartsList movie={selectedMovie} onPlayPart={(p) => playPart(selectedMovie, p)} onSplit={() => splitMovie(selectedMovie)} onSeriesInfo={(isSeries(selectedMovie) || mainParts(selectedMovie).length > 1) ? () => refreshSeriesInfo(selectedMovie) : null} seriesLoading={seriesLoading} />
                </div>
              )}

              <div className="flex gap-2">
                <Button className={'flex-1 ' + (detailOffline ? 'opacity-60' : 'oc-play-glow')} variant={detailOffline ? 'secondary' : 'default'} onClick={() => playMovie(selectedMovie)} data-testid="detail-play-btn">
                  {detailOffline ? <HardDrive className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {detailOffline ? `Drive offline · ${driveLabel(rootOf(selectedMovie.file_path), driveNames)}` : isMultiPart(selectedMovie) ? 'Play a Part…' : 'Play (Default Player)'}
                </Button>
                <Button variant="outline" onClick={() => setMergeTarget(selectedMovie)} title="Merge other cards into this one as parts" data-testid="merge-parts-btn">
                  <Layers className="w-4 h-4" />
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
        <AlertDialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">Manage Directories <HelpLink chapter="types" label="Folder types and drives" /></AlertDialogTitle>
            <AlertDialogDescription>
              Reorder, rename, or remove directories. Drag order is saved. Your actual files and folders on disk are never modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-[34vh] min-h-0 overflow-y-auto px-1 shrink" data-testid="dir-manager-list">
            {directories.map(function(dir, i) {
              var count = libraryCounts.dirCounts[dir] || 0;
              var label = dir.split(/[\\/]/).pop() || dir;
              return (
                <div key={dir} className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/40 border border-border/50" data-testid={'dir-manage-' + i}>
                  {/* Reorder buttons */}
                  <div className="flex flex-col shrink-0">
                    <button
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                      disabled={i === 0}
                      onClick={() => {
                        var newDirs = [...directories];
                        var temp = newDirs[i - 1];
                        newDirs[i - 1] = newDirs[i];
                        newDirs[i] = temp;
                        setDirectories(newDirs);
                        localStorage.setItem(DIRS_KEY, JSON.stringify(newDirs));
                      }}
                      title="Move up"
                      data-testid={'dir-mgr-up-' + i}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                      disabled={i === directories.length - 1}
                      onClick={() => {
                        var newDirs = [...directories];
                        var temp = newDirs[i + 1];
                        newDirs[i + 1] = newDirs[i];
                        newDirs[i] = temp;
                        setDirectories(newDirs);
                        localStorage.setItem(DIRS_KEY, JSON.stringify(newDirs));
                      }}
                      title="Move down"
                      data-testid={'dir-mgr-down-' + i}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{dir}</p>
                  </div>
                  <select
                    value={dirCategory(dirCategories, dir)}
                    onChange={(e) => setDirType(dir, e.target.value)}
                    className="h-7 text-xs rounded-md bg-background border border-border px-1.5 shrink-0"
                    title="Folder type"
                    data-testid={'dir-type-' + i}
                  >
                    {DIR_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <span className="text-xs text-muted-foreground shrink-0">{count} {count === 1 ? 'title' : 'titles'}</span>
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
            {(function() {
              var fileDirs = Object.keys(dirCategories).filter(function(d) { return !directories.some(function(r) { return d === r || inDir(d, r); }) && movies.some(function(m) { return inFileDir(m, d); }); });
              if (fileDirs.length === 0) return null;
              return (
                <div className="pt-3 space-y-2" data-testid="file-dirs-section">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Folders from Add Files</p>
                  {fileDirs.map(function(dir, i) {
                    var count = movies.filter(function(m) { return inFileDir(m, dir); }).length;
                    return (
                      <div key={dir} className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/20 border border-dashed border-border/60" data-testid={'file-dir-' + i}>
                        <FileVideo className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dir.split(/[\\/]/).pop() || dir}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{dir}</p>
                        </div>
                        <select
                          value={dirCategory(dirCategories, dir)}
                          onChange={(e) => setDirType(dir, e.target.value)}
                          className="h-7 text-xs rounded-md bg-background border border-border px-1.5 shrink-0"
                          title="Type of the files added from this folder"
                          data-testid={'file-dir-type-' + i}
                        >
                          {DIR_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <span className="text-xs text-muted-foreground shrink-0" data-testid={'file-dir-count-' + i}>{count} {count === 1 ? 'title' : 'titles'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => { setShowDirManager(false); setFileDirToRemove(dir); }}
                          title="Remove these titles"
                          data-testid={'file-dir-remove-' + i}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          {libraryRoots.length > 0 && (
            <div className="space-y-2 pt-1 min-h-0 flex flex-col" data-testid="drives-section">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 shrink-0">Drives <span className="normal-case tracking-normal">({libraryRoots.length})</span></p>
              <div className="space-y-2 max-h-[26vh] overflow-y-auto pr-1" data-testid="drives-list">
              {libraryRoots.map(root => {
                const off = offlineRoots.has(root);
                const n = movies.filter(m => rootOf(m.file_path) === root).length;
                const id = root.replace(/[^a-zA-Z0-9]/g, '');
                return (
                  <div key={root} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50" data-testid={`drive-row-${id}`}>
                    <span className={'w-2 h-2 rounded-full shrink-0 ' + (off ? 'bg-amber-400' : 'bg-emerald-400')} title={off ? 'Not connected' : 'Connected'} />
                    <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs w-28 truncate shrink-0" title={root}>{root}</span>
                    <div className="flex-1 min-w-0 text-sm"><DriveNameEditor root={root} name={driveNames[root]} onSave={setDriveName} testid={`drive-mgr-name-${id}`} /></div>
                    <span className="text-xs text-muted-foreground shrink-0">{off ? 'offline · ' : ''}{n} {n === 1 ? 'title' : 'titles'}</span>
                  </div>
                );
              })}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Add Files folder confirmation */}
      <AlertDialog open={!!fileDirToRemove} onOpenChange={(open) => { if (!open) setFileDirToRemove(null); }}>
        <AlertDialogContent data-testid="file-dir-remove-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove these titles?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the {fileDirToRemove ? movies.filter(m => inFileDir(m, fileDirToRemove)).length : 0} titles you added from <strong className="text-foreground">{fileDirToRemove && (fileDirToRemove.split(/[\\/]/).pop() || fileDirToRemove)}</strong> from your library.
              <span className="block mt-2 text-muted-foreground">No files will be deleted from your system.</span>
              <span className="block mt-1 text-xs text-muted-foreground font-mono break-all">{fileDirToRemove}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="file-dir-remove-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeFileDir(fileDirToRemove)}
              data-testid="file-dir-remove-confirm"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Directory Confirmation */}
      <AlertDialog open={!!dirToRemove} onOpenChange={(open) => { if (!open) setDirToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove directory?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong className="text-foreground">{dirToRemove && (dirToRemove.split(/[\\/]/).pop() || dirToRemove)}</strong> and all {dirToRemove ? movies.filter(m => inDir(m.file_path, dirToRemove)).length : 0} of its movies from your library.
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
