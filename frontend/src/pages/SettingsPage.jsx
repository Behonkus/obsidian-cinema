import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon,
  Key,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  HardDrive,
  Info,
  Download,
  Sparkles,
  Palette,
  Check,
  AlertTriangle,  Trash2,
  Users,
  FolderArchive,
  Upload,
  Clock,
  ChevronDown,
  Tag,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axios from "axios";
import { THEMES, applyTheme, THEME_STORAGE_KEY } from "@/components/ThemeSelector";
import { ClapperAnimation } from "@/components/FunEffects";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

function TmdbSetupGuide() {
  const [open, setOpen] = useState(false);
  const steps = [
    { num: 1, text: <>Go to <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">themoviedb.org/signup</a> and create a free account.</> },
    { num: 2, text: <>After logging in, go to <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings &gt; API</a>.</> },
    { num: 3, text: 'Click "Create" or "Request an API Key" and select "Developer".' },
    { num: 4, text: "Accept the terms of use." },
    { num: 5, text: <>Fill in the required fields:<ul className="mt-1.5 ml-4 space-y-1 list-disc text-muted-foreground"><li><span className="text-foreground">Application Name:</span> Personal Movie Library</li><li><span className="text-foreground">Application URL:</span> N/A</li><li><span className="text-foreground">Application Summary:</span> Personal app for my movie collection.</li></ul></> },
    { num: 6, text: 'Copy the "API Key (v3 auth)" value and paste it in the field above.' },
  ];

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        data-testid="tmdb-setup-guide-toggle"
      >
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          How to get your free TMDB API key
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-2" data-testid="tmdb-setup-guide-content">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-2.5 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">{s.num}</span>
              <span className="text-muted-foreground">{s.text}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground/70 mt-2 pl-7">The TMDB API is completely free for personal use. No credit card required.</p>
        </div>
      )}
    </div>
  );
}


function DuplicateDetector() {
  const [duplicates, setDuplicates] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // { movieId, movieName }

  const scan = () => {
    setScanning(true);
    var saved = localStorage.getItem('obsidian_cinema_local_movies');
    var movies = saved ? JSON.parse(saved) : [];
    var dismissed = [];
    try { dismissed = JSON.parse(localStorage.getItem('obsidian_cinema_dismissed_dupes') || '[]'); } catch (e) {}
    var groups = [];

    // 1. Exact TMDB ID duplicates (strongest signal)
    var tmdbMap = {};
    movies.forEach(function(m) {
      if (m.tmdb_id) {
        if (!tmdbMap[m.tmdb_id]) tmdbMap[m.tmdb_id] = [];
        tmdbMap[m.tmdb_id].push(m);
      }
    });
    Object.entries(tmdbMap).forEach(function([tmdbId, group]) {
      if (group.length > 1) {
        var key = 'tmdb-' + tmdbId;
        if (!dismissed.includes(key)) {
          groups.push({ type: 'tmdb', key: key, label: group[0].title || group[0].file_name, tmdbId: tmdbId, movies: group });
        }
      }
    });

    // 2. Exact file name duplicates — keep year in the name so different years are NOT flagged
    var nameMap = {};
    movies.forEach(function(m) {
      var name = (m.file_name || '').replace(/\.[^.]+$/, '').toLowerCase().trim();
      if (!name) return;
      if (!nameMap[name]) nameMap[name] = [];
      nameMap[name].push(m);
    });
    var tmdbGroupedIds = new Set();
    groups.forEach(function(g) { g.movies.forEach(function(m) { tmdbGroupedIds.add(m.id); }); });
    Object.entries(nameMap).forEach(function([name, group]) {
      if (group.length > 1) {
        var key = 'file-' + name;
        if (dismissed.includes(key)) return;
        var uncaught = group.filter(function(m) { return !tmdbGroupedIds.has(m.id); });
        if (uncaught.length > 1 || (uncaught.length >= 1 && group.length > uncaught.length)) {
          var allCovered = group.every(function(m) { return tmdbGroupedIds.has(m.id); });
          if (!allCovered) {
            groups.push({ type: 'filename', key: key, label: group[0].file_name, movies: group });
          }
        }
      }
    });

    setDuplicates(groups);
    setScanning(false);
  };

  const dismissGroup = (groupKey) => {
    var dismissed = [];
    try { dismissed = JSON.parse(localStorage.getItem('obsidian_cinema_dismissed_dupes') || '[]'); } catch (e) {}
    dismissed.push(groupKey);
    localStorage.setItem('obsidian_cinema_dismissed_dupes', JSON.stringify(dismissed));
    setDuplicates(function(prev) {
      if (!prev) return prev;
      return prev.filter(function(g) { return g.key !== groupKey; });
    });
  };

  const dismissAll = () => {
    if (!duplicates) return;
    var dismissed = [];
    try { dismissed = JSON.parse(localStorage.getItem('obsidian_cinema_dismissed_dupes') || '[]'); } catch (e) {}
    duplicates.forEach(function(g) { if (!dismissed.includes(g.key)) dismissed.push(g.key); });
    localStorage.setItem('obsidian_cinema_dismissed_dupes', JSON.stringify(dismissed));
    setDuplicates([]);
    toast.success('All duplicate warnings dismissed');
  };

  const resetDismissed = () => {
    localStorage.removeItem('obsidian_cinema_dismissed_dupes');
    toast.success('Dismissed duplicates reset — they will appear on next scan');
  };

  const removeMovie = (movieId) => {
    var saved = localStorage.getItem('obsidian_cinema_local_movies');
    var movies = saved ? JSON.parse(saved) : [];
    var updated = movies.filter(function(m) { return m.id !== movieId; });
    localStorage.setItem('obsidian_cinema_local_movies', JSON.stringify(updated));
    setDuplicates(function(prev) {
      if (!prev) return prev;
      var newGroups = prev.map(function(g) {
        return { ...g, movies: g.movies.filter(function(m) { return m.id !== movieId; }) };
      }).filter(function(g) { return g.movies.length > 1; });
      return newGroups;
    });
    toast.success('Movie entry removed from library');
  };

  return (
    <div className="md:col-span-2 p-3 rounded-lg border border-border bg-secondary/30 space-y-2" data-testid="duplicate-detector">
      <div>
        <p className="font-medium text-foreground text-sm flex items-center gap-2">
          <Copy className="w-4 h-4" /> Duplicate Detection
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Scan for duplicate movies by matching exact TMDB IDs or identical file names (including year). Dismissed groups won't reappear on future scans.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={scan} disabled={scanning} data-testid="scan-duplicates-btn">
          {scanning ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
          {scanning ? 'Scanning...' : 'Scan for Duplicates'}
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={resetDismissed} data-testid="reset-dismissed-btn">
          Reset Dismissed
        </Button>
      </div>

      {duplicates !== null && duplicates.length === 0 && (
        <p className="text-xs text-emerald-400 font-medium py-2" data-testid="no-duplicates-msg">No duplicates found — your library is clean!</p>
      )}

      {duplicates !== null && duplicates.length > 0 && (
        <div className="space-y-3 mt-2" data-testid="duplicate-results">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-400 font-medium">{duplicates.length} duplicate group{duplicates.length > 1 ? 's' : ''} found</p>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={dismissAll} data-testid="dismiss-all-btn">
              Dismiss All
            </Button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {duplicates.map(function(group, gi) {
              return (
                <div key={gi} className="p-2.5 rounded-lg bg-background border border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {group.type === 'tmdb' ? 'Same TMDB ID' : 'Same Filename'}
                      </Badge>
                      <span className="text-sm font-medium truncate">{group.label}</span>
                    </div>
                    <Button
                      variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground flex-shrink-0"
                      onClick={function() { dismissGroup(group.key); }}
                      data-testid={'dismiss-dup-' + gi}
                    >
                      Dismiss
                    </Button>
                  </div>
                  {group.movies.map(function(m, mi) {
                    var path = m.file_path || m.file_name || 'Unknown';
                    if (path.length > 70) path = '...' + path.slice(-70);
                    return (
                      <div key={m.id} className="flex items-center gap-2 text-xs pl-2">
                        <span className="flex-1 text-muted-foreground truncate font-mono" title={m.file_path}>{path}</span>
                        {mi > 0 && (
                          <Button
                            variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                            onClick={function() { setConfirmRemove({ movieId: m.id, movieName: m.title || m.file_name || 'this movie' }); }}
                            data-testid={'remove-dup-' + gi + '-' + mi}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Remove Entry
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Remove Entry Confirmation Dialog */}
      <AlertDialog open={!!confirmRemove} onOpenChange={function(open) { if (!open) setConfirmRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Remove Movie from Library?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will permanently remove <strong className="text-foreground">"{confirmRemove?.movieName}"</strong> from your Obsidian Cinema library.
              </span>
              <span className="block text-foreground font-medium">
                Your actual file on disk will NOT be deleted or modified.
              </span>
              <span className="block">
                However, you will lose any metadata, poster, cast data, and ratings associated with this entry. If the movie is re-scanned later, it will need to be re-fetched from TMDB.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={function() {
                if (confirmRemove) {
                  removeMovie(confirmRemove.movieId);
                  setConfirmRemove(null);
                }
              }}
              data-testid="confirm-remove-entry-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove from Library
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tmdbKey, setTmdbKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  // Desktop app state
  const [currentTheme, setCurrentTheme] = useState(function() {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'crimson';
  });
  const [gridSize, setGridSize] = useState(function() {
    return localStorage.getItem('obsidian_cinema_grid_size') || 'medium';
  });
  const [customColor, setCustomColor] = useState(function() {
    return localStorage.getItem('obsidian_cinema_custom_color') || '#e11d48';
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearPostersConfirm, setShowClearPostersConfirm] = useState(false);
  const [showClearCollectionsConfirm, setShowClearCollectionsConfirm] = useState(false);
  const [posterCount, setPosterCount] = useState(0);
  const [collectionsList, setCollectionsList] = useState([]);
  const [appVersion, setAppVersion] = useState(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [castFetching, setCastFetching] = useState(false);
  const [castProgress, setCastProgress] = useState(0);
  const [castTotal, setCastTotal] = useState(0);
  const [castStatusText, setCastStatusText] = useState('');
  const [genreFetching, setGenreFetching] = useState(false);
  const [genreProgress, setGenreProgress] = useState(0);
  const [genreTotal, setGenreTotal] = useState(0);
  const [genreStatusText, setGenreStatusText] = useState('');
  const [backups, setBackups] = useState([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);
  const [lastExportDate, setLastExportDate] = useState(() => localStorage.getItem('obsidian_cinema_last_export') || null);
  const [importStep, setImportStep] = useState(null); // null, 'select', 'preview', 'done'
  const [importData, setImportData] = useState(null);

  // Load backup list
  const loadBackups = () => {
    var list = [];
    var raw = localStorage.getItem('obsidian_cinema_backup_1');
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        list.push({ slot: 1, date: parsed.date, movieCount: parsed.movieCount || 0, collectionCount: parsed.collectionCount || 0 });
      } catch (e) {}
    }
    setBackups(list);
  };

  // Create a backup snapshot (single slot, always replaced)
  const createBackup = () => {
    try {
      var movies = localStorage.getItem('obsidian_cinema_local_movies') || '[]';
      var dirs = localStorage.getItem('obsidian_cinema_local_dirs') || '[]';
      var collections = localStorage.getItem('obsidian_cinema_collections') || '[]';
      var trash = localStorage.getItem('obsidian_cinema_trash') || '[]';
      var tmdb = localStorage.getItem('obsidian_cinema_tmdb_key') || '';
      var theme = localStorage.getItem('obsidian_cinema_theme') || '';
      var gridSize = localStorage.getItem('obsidian_cinema_grid_size') || '';
      var sortBy = localStorage.getItem('obsidian_cinema_sort_by') || '';
      var favorites = localStorage.getItem('obsidian_cinema_favorites') || '[]';
      var activity = localStorage.getItem('obsidian_cinema_activity') || '{}';
      var parsedMovies = [];
      try { parsedMovies = JSON.parse(movies); } catch (e) {}
      var parsedCols = [];
      try { parsedCols = JSON.parse(collections); } catch (e) {}

      var snapshot = {
        date: new Date().toISOString(),
        movieCount: parsedMovies.length,
        collectionCount: parsedCols.length,
        data: { movies: movies, dirs: dirs, collections: collections, trash: trash, tmdb: tmdb, theme: theme, gridSize: gridSize, sortBy: sortBy, favorites: favorites, activity: activity }
      };
      // Clean up any old backup slots (2-5) from previous versions
      for (var i = 2; i <= 5; i++) {
        localStorage.removeItem('obsidian_cinema_backup_' + i);
      }
      localStorage.setItem('obsidian_cinema_backup_1', JSON.stringify(snapshot));
      loadBackups();
      return true;
    } catch (e) {
      console.error('Backup failed:', e);
      toast.error('Backup failed — storage may be full. Try exporting to file instead.');
      return false;
    }
  };

  // Restore from a backup slot
  const restoreBackup = (slot) => {
    var raw = localStorage.getItem('obsidian_cinema_backup_' + slot);
    if (!raw) return;
    try {
      var snapshot = JSON.parse(raw);
      var d = snapshot.data;
      if (d.movies) localStorage.setItem('obsidian_cinema_local_movies', d.movies);
      if (d.dirs) localStorage.setItem('obsidian_cinema_local_dirs', d.dirs);
      if (d.collections) localStorage.setItem('obsidian_cinema_collections', d.collections);
      if (d.trash) localStorage.setItem('obsidian_cinema_trash', d.trash);
      if (d.tmdb) localStorage.setItem('obsidian_cinema_tmdb_key', d.tmdb);
      if (d.theme) localStorage.setItem('obsidian_cinema_theme', d.theme);
      if (d.gridSize) localStorage.setItem('obsidian_cinema_grid_size', d.gridSize);
      if (d.sortBy) localStorage.setItem('obsidian_cinema_sort_by', d.sortBy);
      if (d.favorites) localStorage.setItem('obsidian_cinema_favorites', d.favorites);
      if (d.activity) localStorage.setItem('obsidian_cinema_activity', d.activity);
      toast.success('Restored from backup. Reloading...');
      setShowRestoreConfirm(null);
      setTimeout(function() { window.location.reload(); }, 1000);
    } catch (e) {
      toast.error('Failed to restore backup');
    }
  };

  // Export backup to file
  const exportBackup = () => {
    var movies = localStorage.getItem('obsidian_cinema_local_movies') || '[]';
    var dirs = localStorage.getItem('obsidian_cinema_local_dirs') || '[]';
    var collections = localStorage.getItem('obsidian_cinema_collections') || '[]';
    var trash = localStorage.getItem('obsidian_cinema_trash') || '[]';
    var tmdb = localStorage.getItem('obsidian_cinema_tmdb_key') || '';
    var theme = localStorage.getItem('obsidian_cinema_theme') || '';
    var gridSize = localStorage.getItem('obsidian_cinema_grid_size') || '';
    var sortBy = localStorage.getItem('obsidian_cinema_sort_by') || '';
    var favorites = localStorage.getItem('obsidian_cinema_favorites') || '[]';
    var activity = localStorage.getItem('obsidian_cinema_activity') || '{}';
    var snapshot = {
      date: new Date().toISOString(),
      version: 'obsidian_cinema_backup_v1',
      data: { movies: movies, dirs: dirs, collections: collections, trash: trash, tmdb: tmdb, theme: theme, gridSize: gridSize, sortBy: sortBy, favorites: favorites, activity: activity }
    };
    var blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    var fileName = 'obsidian-cinema-backup-' + dateStr + '.json';
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    var now = new Date().toISOString();
    localStorage.setItem('obsidian_cinema_last_export', now);
    setLastExportDate(now);
    toast.success('Backup saved to your Downloads folder as "' + fileName + '"');
  };

  // Import backup — guided flow
  const startImport = () => {
    setImportStep('select');
    setImportData(null);
  };

  const handleFileSelect = () => {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var snapshot = JSON.parse(ev.target.result);
          if (!snapshot.data || !snapshot.data.movies) {
            toast.error('This file is not a valid Obsidian Cinema backup');
            return;
          }
          var movieCount = 0;
          var colCount = 0;
          try { movieCount = JSON.parse(snapshot.data.movies).length; } catch (e) {}
          try { colCount = JSON.parse(snapshot.data.collections).length; } catch (e) {}
          setImportData({
            snapshot: snapshot,
            fileName: file.name,
            date: snapshot.date ? new Date(snapshot.date).toLocaleDateString() + ' ' + new Date(snapshot.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
            movieCount: movieCount,
            collectionCount: colCount,
            hasTrash: snapshot.data.trash && snapshot.data.trash !== '[]',
            hasTheme: !!snapshot.data.theme,
          });
          setImportStep('preview');
        } catch (err) {
          toast.error('Could not read this file. Make sure it is an Obsidian Cinema backup (.json)');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const confirmImport = () => {
    if (!importData || !importData.snapshot) return;
    try {
      var d = importData.snapshot.data;
      if (d.movies) localStorage.setItem('obsidian_cinema_local_movies', d.movies);
      if (d.dirs) localStorage.setItem('obsidian_cinema_local_dirs', d.dirs);
      if (d.collections) localStorage.setItem('obsidian_cinema_collections', d.collections);
      if (d.trash) localStorage.setItem('obsidian_cinema_trash', d.trash);
      if (d.tmdb) localStorage.setItem('obsidian_cinema_tmdb_key', d.tmdb);
      if (d.theme) localStorage.setItem('obsidian_cinema_theme', d.theme);
      if (d.gridSize) localStorage.setItem('obsidian_cinema_grid_size', d.gridSize);
      if (d.sortBy) localStorage.setItem('obsidian_cinema_sort_by', d.sortBy);
      if (d.favorites) localStorage.setItem('obsidian_cinema_favorites', d.favorites);
      if (d.activity) localStorage.setItem('obsidian_cinema_activity', d.activity);
      setImportStep('done');
    } catch (e) {
      toast.error('Failed to restore backup');
    }
  };

  useEffect(() => {
    loadData();
    
    // Load local poster count and collections
    try {
      const savedMovies = localStorage.getItem('obsidian_cinema_local_movies');
      if (savedMovies) {
        const movies = JSON.parse(savedMovies);
        setPosterCount(movies.filter(m => m.poster_path).length);
      }
      const savedCols = localStorage.getItem('obsidian_cinema_collections');
      if (savedCols) {
        setCollectionsList(JSON.parse(savedCols));
      }
    } catch (e) {}
    
    // Load backups list and auto-backup
    loadBackups();
    // Auto-backup: once per session, only if movies exist
    try {
      var lastAutoBackup = sessionStorage.getItem('obsidian_cinema_last_auto_backup');
      if (!lastAutoBackup) {
        var savedMoviesForBackup = localStorage.getItem('obsidian_cinema_local_movies');
        if (savedMoviesForBackup) {
          var parsed = JSON.parse(savedMoviesForBackup);
          if (parsed.length > 0) {
            createBackup();
            sessionStorage.setItem('obsidian_cinema_last_auto_backup', 'true');
          }
        }
      }
    } catch (e) {}

    // Get app version if in Electron
    if (isElectron()) {
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version);
      });
      
      // Listen for update status
      window.electronAPI.onUpdateStatus(({ status, data }) => {
        setUpdateStatus({ status, data });
        
        if (status === 'available') {
          setIsCheckingUpdate(false);
          toast.success(`Update v${data.version} is available!`, {
            description: 'Go to Settings → App Updates to download it.',
            duration: 8000,
          });
        } else if (status === 'downloading' && data) {
          setIsCheckingUpdate(false);
          setDownloadProgress(data.percent || 0);
        } else if (status === 'downloaded') {
          setIsCheckingUpdate(false);
          toast.success("Update downloaded! Ready to install.");
        } else if (status === 'not-available') {
          setIsCheckingUpdate(false);
          toast.info("You're running the latest version!");
        } else if (status === 'error') {
          setIsCheckingUpdate(false);
          // Toast is handled by handleCheckForUpdates if triggered from button
          // This covers auto-check on startup
        } else {
          setIsCheckingUpdate(false);
        }
      });
      
      return () => {
        window.electronAPI.removeUpdateListener();
      };
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsRes = await axios.get(`${API}/settings`);
      const serverSettings = settingsRes.data;
      // Override TMDB status from localStorage (per-user, not shared server)
      const localTmdbKey = localStorage.getItem('obsidian_cinema_tmdb_key') || '';
      serverSettings.tmdb_configured = Boolean(localTmdbKey);
      serverSettings.tmdb_key_masked = localTmdbKey ? '*'.repeat(8) + '...' + localTmdbKey.slice(-4) : null;
      setSettings(serverSettings);
    } catch (err) {
      console.error("Failed to load settings:", err);
      // Still show local TMDB status even if server is unreachable
      const localTmdbKey = localStorage.getItem('obsidian_cinema_tmdb_key') || '';
      setSettings({
        tmdb_configured: Boolean(localTmdbKey),
        tmdb_key_masked: localTmdbKey ? '*'.repeat(8) + '...' + localTmdbKey.slice(-4) : null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    if (!tmdbKey.trim()) {
      toast.error("Please enter an API key to test");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      // Test directly against TMDB API — no server needed
      const resp = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(tmdbKey.trim())}`);
      if (resp.ok) {
        setTestResult({ valid: true, message: "API key is valid! Connected to TMDB." });
        toast.success("API key is valid!");
      } else {
        setTestResult({ valid: false, message: "Invalid API key — TMDB rejected it." });
        toast.error("Invalid API key");
      }
    } catch (err) {
      toast.error("Failed to test API key");
      setTestResult({ valid: false, message: "Connection error" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKey = async () => {
    if (!tmdbKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsSaving(true);
    try {
      // Save locally only — never to the shared server
      localStorage.setItem('obsidian_cinema_tmdb_key', tmdbKey.trim());
      toast.success("TMDB API key saved locally!");
      setTmdbKey("");
      setTestResult(null);
      // Refresh local settings display
      setSettings(prev => ({
        ...prev,
        tmdb_configured: true,
        tmdb_key_masked: '*'.repeat(8) + '...' + tmdbKey.trim().slice(-4)
      }));
    } catch (err) {
      toast.error("Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!isElectron()) return;
    
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result?.status === 'dev-mode') {
        toast.info("Update checks are not available in development mode");
        setIsCheckingUpdate(false);
      } else if (result?.status === 'error') {
        setUpdateStatus({ status: 'error', data: { message: result.message, errorType: result.errorType } });
        if (result.errorType === 'no-release' || result.errorType === 'missing-artifact') {
          toast.error("No update available to download from GitHub.");
        } else if (result.errorType === 'rate-limit') {
          toast.error("GitHub rate limit reached. Try again in a few minutes.");
        } else if (result.errorType === 'network') {
          toast.error("Network error — check your internet connection.");
        } else {
          toast.error(result.message || "Could not check for updates.");
        }
        setIsCheckingUpdate(false);
      }
      // If status is 'checking', the onUpdateStatus listener will handle subsequent updates
    } catch (err) {
      toast.error("Could not check for updates.");
      setUpdateStatus({ status: 'error', data: { message: err.message, errorType: 'unknown' } });
      setIsCheckingUpdate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClapperAnimation text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8" data-testid="settings-page">
      {/* Hero glow effect */}
      <div className="hero-glow-bg" />
      
      {/* Header */}
      <div className="relative z-10 mb-5">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold font-[Outfit] tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your Obsidian Cinema preferences
          </p>
        </motion.div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* TMDB API Key Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={!isElectron() ? "md:col-span-2" : ""}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                TMDB API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* Current Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {settings?.tmdb_configured ? (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
              
              {settings?.tmdb_key_masked && (
                <div className="text-sm text-muted-foreground">
                  Current key: <code className="bg-secondary px-2 py-0.5 rounded">{settings.tmdb_key_masked}</code>
                </div>
              )}
              
              <Separator />
              
              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="tmdb-key">
                  {settings?.tmdb_configured ? "Update API Key" : "Enter API Key"}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="tmdb-key"
                      type={showKey ? "text" : "password"}
                      placeholder="Enter your TMDB API key"
                      value={tmdbKey}
                      onChange={(e) => {
                        setTmdbKey(e.target.value);
                        setTestResult(null);
                      }}
                      className="pr-10 font-mono text-sm"
                      data-testid="tmdb-key-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Test Result */}
              {testResult && (
                <div className={`p-3 rounded-lg ${testResult.valid ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-2">
                    {testResult.valid ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm ${testResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestKey}
                  disabled={!tmdbKey.trim() || isTesting}
                  className="flex-1"
                  data-testid="test-key-btn"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Test Key
                </Button>
                <Button
                  onClick={handleSaveKey}
                  disabled={!tmdbKey.trim() || isSaving}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  data-testid="save-key-btn"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Key
                </Button>
              </div>
              
              {/* Help Link */}
              <div className="pt-2">
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Get a free TMDB API key
                </a>
              </div>
              
              {/* TMDB Setup Guide */}
              <TmdbSetupGuide />
              
              {/* Cached posters info */}
              {settings?.cached_posters > 0 && (
                <div className="pt-2 text-sm text-muted-foreground">
                  <HardDrive className="w-3 h-3 inline mr-1" />
                  {settings.cached_posters} posters cached locally
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Appearance Card - Desktop Only */}
        {isElectron() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* Color Theme */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Color Theme</Label>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Solid</p>
                    <div className="flex flex-wrap gap-1.5">
                      {THEMES.filter(function(t) { return !t.id.startsWith('pastel') && t.id !== 'rainbow'; }).map(function(theme) {
                        var active = currentTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={function() {
                              setCurrentTheme(theme.id);
                              localStorage.setItem(THEME_STORAGE_KEY, theme.id);
                              applyTheme(theme.id);
                            }}
                            className={'w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ' + (active ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                            style={{ background: theme.preview }}
                            title={theme.name}
                            data-testid={'settings-theme-' + theme.id}
                          >
                            {active && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Pastel</p>
                    <div className="flex flex-wrap gap-1.5">
                      {THEMES.filter(function(t) { return t.id.startsWith('pastel'); }).map(function(theme) {
                        var active = currentTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={function() {
                              setCurrentTheme(theme.id);
                              localStorage.setItem(THEME_STORAGE_KEY, theme.id);
                              applyTheme(theme.id);
                            }}
                            className={'w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ' + (active ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                            style={{ background: theme.preview }}
                            title={theme.name}
                            data-testid={'settings-theme-' + theme.id}
                          >
                            {active && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Special</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {THEMES.filter(function(t) { return t.id === 'rainbow'; }).map(function(theme) {
                        var active = currentTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={function() {
                              setCurrentTheme(theme.id);
                              localStorage.setItem(THEME_STORAGE_KEY, theme.id);
                              applyTheme(theme.id);
                            }}
                            className={'h-7 px-4 rounded-full border-2 transition-all flex items-center justify-center gap-1.5 text-[11px] font-medium text-white ' + (active ? 'border-foreground' : 'border-transparent hover:scale-[1.02]')}
                            style={{ background: theme.preview }}
                            title={theme.name}
                            data-testid={'settings-theme-' + theme.id}
                          >
                            {active && <Check className="w-3 h-3 drop-shadow-md" />}
                            {theme.name}
                          </button>
                        );
                      })}
                      <div className="relative">
                        <button
                          onClick={function() {
                            document.getElementById('custom-color-picker').click();
                          }}
                          className={'h-7 px-3 rounded-full border-2 transition-all flex items-center gap-1.5 text-[11px] font-medium ' + (currentTheme === 'custom' ? 'border-foreground' : 'border-border hover:border-primary/30')}
                          title="Custom color"
                          data-testid="settings-theme-custom"
                        >
                          <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: customColor }} />
                          Custom
                          {currentTheme === 'custom' && <Check className="w-3 h-3 text-primary" />}
                        </button>
                        <input
                          id="custom-color-picker"
                          type="color"
                          value={customColor}
                          onChange={function(e) {
                            var hex = e.target.value;
                            setCustomColor(hex);
                            setCurrentTheme('custom');
                            localStorage.setItem('obsidian_cinema_custom_color', hex);
                            localStorage.setItem(THEME_STORAGE_KEY, 'custom');
                            applyTheme('custom');
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          data-testid="custom-color-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Poster Size */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Poster Size</Label>
                <div className="flex items-center gap-1.5">
                  {[
                    { key: 'small', label: 'S' },
                    { key: 'medium', label: 'M' },
                    { key: 'large', label: 'L' },
                  ].map(function(size) {
                    var active = gridSize === size.key;
                    return (
                      <button
                        key={size.key}
                        onClick={function() {
                          setGridSize(size.key);
                          localStorage.setItem('obsidian_cinema_grid_size', size.key);
                        }}
                        className={'flex-1 py-2 rounded-lg border-2 transition-all text-center ' + (active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30')}
                        data-testid={'settings-grid-' + size.key}
                      >
                        <p className={'text-sm font-medium ' + (active ? 'text-primary' : 'text-foreground')}>{size.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* App Updates Card - Desktop Only */}
        {isElectron() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  App Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {/* Current Version */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Version:</span>
                  <Badge variant="secondary" className="font-mono">
                    v{appVersion || '1.0.0'}
                  </Badge>
                </div>
                
                {/* Update Status */}
                {updateStatus && (
                  <div className={`p-3 rounded-lg ${
                    updateStatus.status === 'available' || updateStatus.status === 'downloading'
                      ? 'bg-purple-500/10 border border-purple-500/20' 
                      : updateStatus.status === 'downloaded'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : updateStatus.status === 'not-available'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-secondary/30 border border-border'
                  }`}>
                    {updateStatus.status === 'available' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-purple-300">
                            Update v{updateStatus.data?.version} is available!
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            if (window.electronAPI.downloadUpdate) {
                              window.electronAPI.downloadUpdate();
                            }
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                          data-testid="download-update-btn"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Update
                        </Button>
                      </div>
                    )}
                    {updateStatus.status === 'downloading' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-300">Downloading update...</span>
                          <span className="font-medium text-purple-300">{Math.round(downloadProgress)}%</span>
                        </div>
                        <Progress value={downloadProgress} className="h-2" />
                      </div>
                    )}
                    {updateStatus.status === 'not-available' && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300">
                          You're running the latest version
                        </span>
                      </div>
                    )}
                    {updateStatus.status === 'downloaded' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-300">
                            Update downloaded! Ready to install.
                          </span>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs text-amber-300">
                            The app will close completely and reopen with the new version. This is normal — it is not a crash.
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setUpdateStatus({ status: 'installing' });
                            setTimeout(() => {
                              window.electronAPI.installUpdate();
                            }, 2000);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                          size="sm"
                          data-testid="install-update-btn"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Restart & Install Update
                        </Button>
                      </div>
                    )}
                    {updateStatus.status === 'installing' && (
                      <div className="space-y-2 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            Installing update...
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          The app will close and reopen automatically. This is normal.
                        </p>
                      </div>
                    )}
                    {updateStatus.status === 'error' && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            <span className="text-sm text-orange-300 block">
                              {updateStatus.data?.errorType === 'no-release' && 'No published release found on GitHub.'}
                              {updateStatus.data?.errorType === 'missing-artifact' && 'GitHub release is missing update files.'}
                              {updateStatus.data?.errorType === 'rate-limit' && 'GitHub API rate limit reached.'}
                              {updateStatus.data?.errorType === 'network' && 'Could not connect to GitHub.'}
                              {(!updateStatus.data?.errorType || updateStatus.data?.errorType === 'unknown') && (updateStatus.data?.message || 'Could not check for updates.')}
                            </span>
                            {(updateStatus.data?.errorType === 'no-release' || updateStatus.data?.errorType === 'missing-artifact') && (
                              <p className="text-xs text-muted-foreground">
                                The developer needs to publish a release with <code className="text-orange-300/70">electron-builder</code> to enable auto-updates.
                              </p>
                            )}
                            {updateStatus.data?.errorType === 'rate-limit' && (
                              <p className="text-xs text-muted-foreground">Try again in a few minutes.</p>
                            )}
                            {updateStatus.data?.errorType === 'network' && (
                              <p className="text-xs text-muted-foreground">Check your internet connection and try again.</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            if (isElectron()) {
                              window.electronAPI.openExternal('https://github.com/Behonkus/obsidian-cinema/releases');
                            } else {
                              window.open('https://github.com/Behonkus/obsidian-cinema/releases', '_blank');
                            }
                          }}
                          data-testid="manual-download-btn"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Download Manually from GitHub
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Check for Updates Button */}
                <Button
                  onClick={handleCheckForUpdates}
                  disabled={isCheckingUpdate}
                  variant="outline"
                  className="w-full"
                >
                  {isCheckingUpdate ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Check for Updates
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Updates are checked automatically on startup
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Library Management Card - Desktop Only */}
        {isElectron() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="md:col-span-2"
        >
          <Card className="bg-card border-destructive/30">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Library Management
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid md:grid-cols-2 gap-3">
              {/* Recently Deleted */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                <div>
                  <p className="font-medium text-foreground text-sm">Recently Deleted</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Movies removed are kept for 30 days. No files on disk are affected.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={function() { navigate('/?view=trash'); }}
                  data-testid="settings-recently-deleted-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  View Recently Deleted
                </Button>
              </div>

              {/* Collection Management */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                <div>
                  <p className="font-medium text-foreground text-sm">Collections</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {collectionsList.length > 0
                      ? `${collectionsList.length} collection${collectionsList.length > 1 ? 's' : ''} in your library.`
                      : 'No collections created.'}
                  </p>
                </div>
                {collectionsList.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {collectionsList.map(function(col) {
                        return (
                          <div key={col.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border text-xs">
                            <span>{col.name}</span>
                            <span className="text-muted-foreground">({col.movie_ids?.length || 0})</span>
                            <button
                              onClick={function() {
                                var updated = collectionsList.filter(function(c) { return c.id !== col.id; });
                                setCollectionsList(updated);
                                localStorage.setItem('obsidian_cinema_collections', JSON.stringify(updated));
                                toast.success('Collection "' + col.name + '" deleted');
                              }}
                              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                              title={'Delete ' + col.name}
                              data-testid={'settings-delete-col-' + col.id}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={function() { setShowClearCollectionsConfirm(true); }}
                      data-testid="settings-clear-collections-btn"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Collections
                    </Button>
                  </div>
                )}
              </div>

              {/* Fetch Cast Data */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                <div>
                  <p className="font-medium text-foreground text-sm">Cast Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {castFetching
                      ? 'Fetching cast... ' + castProgress + ' of ' + castTotal + ' movies'
                      : castStatusText || (function() {
                        var saved = localStorage.getItem('obsidian_cinema_local_movies');
                        var all = saved ? JSON.parse(saved) : [];
                        var withCast = all.filter(function(m) { return m.cast && m.cast.length > 0; }).length;
                        var needCast = all.filter(function(m) { return m.tmdb_id && (!m.cast || m.cast.length === 0); }).length;
                        if (needCast > 0) return withCast + ' movies have cast data. ' + needCast + ' can be fetched from TMDB.';
                        if (withCast > 0) return 'All ' + withCast + ' movies with TMDB data have cast info.';
                        return 'No cast data available. Fetch posters first to get TMDB IDs.';
                      })()
                    }
                  </p>
                  {castFetching && castTotal > 0 && (
                    <div className="mt-2 w-full bg-secondary rounded-full h-2 overflow-hidden" data-testid="cast-progress-bar">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: Math.round((castProgress / castTotal) * 100) + '%' }}
                      />
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  disabled={castFetching}
                  onClick={async function() {
                    var tmdbKey = localStorage.getItem('obsidian_cinema_tmdb_key');
                    if (!tmdbKey) { toast.error('Add your TMDB API key first'); return; }
                    var saved = localStorage.getItem('obsidian_cinema_local_movies');
                    var all = saved ? JSON.parse(saved) : [];
                    var need = all.filter(function(m) { return m.tmdb_id && (!m.cast || m.cast.length === 0); });
                    if (need.length === 0) { toast.info('All movies with TMDB data already have cast info'); return; }
                    setCastFetching(true);
                    setCastProgress(0);
                    setCastTotal(need.length);
                    setCastStatusText('');
                    var fetched = 0;
                    for (var i = 0; i < need.length; i++) {
                      try {
                        var resp = await fetch('https://api.themoviedb.org/3/movie/' + need[i].tmdb_id + '/credits?api_key=' + tmdbKey);
                        var data = await resp.json();
                        if (data.cast) {
                          need[i].cast = data.cast.slice(0, 5).map(function(c) {
                            return { name: c.name, character: c.character, profile_path: c.profile_path ? 'https://image.tmdb.org/t/p/w185' + c.profile_path : null };
                          });
                          fetched++;
                        }
                      } catch (e) {}
                      setCastProgress(i + 1);
                      if (i < need.length - 1) await new Promise(function(r) { setTimeout(r, 250); });
                    }
                    var updated = all.map(function(m) {
                      var match = need.find(function(n) { return n.id === m.id; });
                      return match ? match : m;
                    });
                    localStorage.setItem('obsidian_cinema_local_movies', JSON.stringify(updated));
                    setCastFetching(false);
                    setCastStatusText('Done! Cast fetched for ' + fetched + ' of ' + need.length + ' movies.');
                    toast.success('Cast fetched for ' + fetched + ' movies');
                  }}
                  data-testid="settings-fetch-cast-btn"
                >
                  {castFetching ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  {castFetching ? 'Fetching... (' + castProgress + '/' + castTotal + ')' : 'Fetch Cast Data'}
                </Button>
              </div>

              {/* Fetch Genre Data */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                <div>
                  <p className="font-medium text-foreground text-sm">Genre Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {genreFetching
                      ? 'Fetching genres... ' + genreProgress + ' of ' + genreTotal + ' movies'
                      : genreStatusText || (function() {
                        var saved = localStorage.getItem('obsidian_cinema_local_movies');
                        var all = saved ? JSON.parse(saved) : [];
                        var withGenre = all.filter(function(m) { return m.genres && m.genres.length > 0; }).length;
                        var needGenre = all.filter(function(m) { return m.tmdb_id && (!m.genres || m.genres.length === 0); }).length;
                        if (needGenre > 0) return withGenre + ' movies have genre data. ' + needGenre + ' can be fetched from TMDB.';
                        if (withGenre > 0) return 'All ' + withGenre + ' movies with TMDB data have genre info.';
                        return 'No genre data available. Fetch posters first to get TMDB IDs.';
                      })()
                    }
                  </p>
                  {genreFetching && genreTotal > 0 && (
                    <div className="mt-2 w-full bg-secondary rounded-full h-2 overflow-hidden" data-testid="genre-progress-bar">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: Math.round((genreProgress / genreTotal) * 100) + '%' }}
                      />
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  disabled={genreFetching}
                  onClick={async function() {
                    var tmdbKey = localStorage.getItem('obsidian_cinema_tmdb_key');
                    if (!tmdbKey) { toast.error('Add your TMDB API key first'); return; }
                    var saved = localStorage.getItem('obsidian_cinema_local_movies');
                    var all = saved ? JSON.parse(saved) : [];
                    var need = all.filter(function(m) { return m.tmdb_id && (!m.genres || m.genres.length === 0); });
                    if (need.length === 0) { toast.info('All movies with TMDB data already have genre info'); return; }
                    setGenreFetching(true);
                    setGenreProgress(0);
                    setGenreTotal(need.length);
                    setGenreStatusText('');
                    var fetched = 0;
                    for (var i = 0; i < need.length; i++) {
                      try {
                        var resp = await fetch('https://api.themoviedb.org/3/movie/' + need[i].tmdb_id + '?api_key=' + tmdbKey);
                        var data = await resp.json();
                        if (data.genres && data.genres.length > 0) {
                          need[i].genres = data.genres.map(function(g) { return g.name; });
                          fetched++;
                        }
                      } catch (e) {}
                      setGenreProgress(i + 1);
                      if (i < need.length - 1) await new Promise(function(r) { setTimeout(r, 250); });
                    }
                    var updated = all.map(function(m) {
                      var match = need.find(function(n) { return n.id === m.id; });
                      return match ? match : m;
                    });
                    localStorage.setItem('obsidian_cinema_local_movies', JSON.stringify(updated));
                    setGenreFetching(false);
                    setGenreStatusText('Done! Genres fetched for ' + fetched + ' of ' + need.length + ' movies.');
                    toast.success('Genres fetched for ' + fetched + ' movies');
                  }}
                  data-testid="settings-fetch-genre-btn"
                >
                  {genreFetching ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Tag className="w-4 h-4 mr-2" />
                  )}
                  {genreFetching ? 'Fetching... (' + genreProgress + '/' + genreTotal + ')' : 'Fetch Genre Data'}
                </Button>
              </div>

              {/* Duplicate Detection — spans full width */}
              <DuplicateDetector />

              {/* Backup & Restore — spans full width */}
              <div className="md:col-span-2 p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                <div>
                  <p className="font-medium text-foreground text-sm flex items-center gap-2">
                    <FolderArchive className="w-4 h-4" /> Backup & Restore
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Export saves a file to <strong className="text-foreground">Downloads</strong> — use Import to restore anytime.
                  </p>
                </div>

                {/* Export / Import — primary actions */}
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <p className="text-xs font-medium text-foreground">Recommended: Save to File</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportBackup} data-testid="export-backup-btn">
                      <Download className="w-4 h-4 mr-2" /> Export to File
                    </Button>
                    <Button variant="outline" onClick={startImport} data-testid="import-backup-btn">
                      <Upload className="w-4 h-4 mr-2" /> Import from File
                    </Button>
                  </div>
                  {lastExportDate && (
                    <p className="text-xs text-muted-foreground" data-testid="last-export-info">
                      Last exported: {new Date(lastExportDate).toLocaleDateString()} at {new Date(lastExportDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block mt-0.5">File saved to your Downloads folder as <strong className="text-foreground font-mono text-[11px]">obsidian-cinema-backup-{new Date(lastExportDate).toISOString().slice(0, 10)}.json</strong></span>
                    </p>
                  )}
                </div>

                {/* Quick backup */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Quick Backup (stored in app)</p>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={function() { var ok = createBackup(); if (ok) toast.success('Backup saved'); }} data-testid="manual-backup-btn">
                      <Save className="w-3.5 h-3.5 mr-1.5" /> {backups.length > 0 ? 'Update Backup' : 'Backup Now'}
                    </Button>
                  </div>
                  {backups.length > 0 ? (
                    <div className="flex items-center justify-between p-2 rounded-md bg-background border border-border/50 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{new Date(backups[0].date).toLocaleDateString()} {new Date(backups[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-xs text-muted-foreground">{backups[0].movieCount} movies, {backups[0].collectionCount} collections</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={function() { setShowRestoreConfirm(1); }}
                        data-testid="restore-backup-1"
                      >
                        Restore
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">No backup yet. Click "Backup Now" to create one.</p>
                  )}
                </div>
              </div>

              {/* Poster Cache — critical */}
              <div className="p-3 rounded-lg border border-destructive/20 bg-secondary/30 space-y-2">
                <div>
                  <p className="font-medium text-foreground text-sm">Poster Cache</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {posterCount > 0
                      ? `${posterCount} posters cached. Clearing removes URLs only — movies and metadata remain.`
                      : 'No poster data cached.'}
                  </p>
                </div>
                {posterCount > 0 && (
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={function() { setShowClearPostersConfirm(true); }}
                    data-testid="settings-clear-posters-btn"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Posters ({posterCount})
                  </Button>
                )}
              </div>

              {/* Reset Library — most critical */}
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-2">
                <div>
                  <p className="font-medium text-destructive text-sm">Reset Entire Library</p>
                  <p className="text-xs text-foreground font-medium mt-1">
                    Your actual movie files on disk are never touched.
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clears the app's internal database only — movie list, collections, poster data, and directories. Start fresh.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={function() { setShowResetConfirm(true); }}
                  data-testid="settings-clear-library-btn"
                >
                  Reset Library Database
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* About Card - Desktop Only */}
        {isElectron() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                About Obsidian Cinema
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Library</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Scan local & network directories</li>
                    <li>• TMDB posters, metadata & cast</li>
                    <li>• System default player integration</li>
                    <li>• 13 sorting options & poster sizes</li>
                    <li>• Directory management & filtering</li>
                    <li>• Individual file import</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Smart Features</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• AI movie suggestions</li>
                    <li>• Editable title, year & synopsis</li>
                    <li>• Cast display & bulk fetch</li>
                    <li>• Reset & re-fetch metadata</li>
                    <li>• Collections & trash management</li>
                    <li>• Backup, export & restore</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Stats & More</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Library stats & cast insights</li>
                    <li>• Collection health tracking</li>
                    <li>• 18 color themes</li>
                    <li>• Auto-updates</li>
                    <li>• MP4, MKV, AVI, MOV, WMV & more</li>
                    <li>• UNC & network path support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}
      </div>

      {/* Reset Library Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Reset entire library database?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block p-2 bg-secondary rounded text-foreground text-sm font-medium">Your actual movie files are completely safe. Nothing on your hard drive will be touched.</span>
              <span className="block">This will clear the app's internal database only — your scanned movie list, poster data, collections, and directories will be removed from Obsidian Cinema so you can start fresh.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={function() {
                localStorage.removeItem('obsidian_cinema_local_movies');
                localStorage.removeItem('obsidian_cinema_local_dirs');
                localStorage.removeItem('obsidian_cinema_trash');
                setShowResetConfirm(false);
                toast.success('Library database has been reset');
              }}
              data-testid="confirm-reset-library-btn"
            >
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Posters Confirmation */}
      <AlertDialog open={showClearPostersConfirm} onOpenChange={setShowClearPostersConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all poster data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove poster URLs from all {posterCount} movies. Movie titles, metadata, and files on disk are not affected. You can re-fetch posters afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={function() {
                try {
                  var saved = localStorage.getItem('obsidian_cinema_local_movies');
                  if (saved) {
                    var movies = JSON.parse(saved);
                    var cleared = movies.map(function(m) { var copy = Object.assign({}, m); delete copy.poster_path; return copy; });
                    localStorage.setItem('obsidian_cinema_local_movies', JSON.stringify(cleared));
                  }
                  setPosterCount(0);
                  setShowClearPostersConfirm(false);
                  toast.success('All poster data cleared');
                } catch (e) {
                  toast.error('Failed to clear posters');
                }
              }}
              data-testid="confirm-clear-posters-btn"
            >
              Clear Posters
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Collections Confirmation */}
      <AlertDialog open={showClearCollectionsConfirm} onOpenChange={setShowClearCollectionsConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all collections?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all {collectionsList.length} collections. Movies themselves will not be removed from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={function() {
                localStorage.setItem('obsidian_cinema_collections', JSON.stringify([]));
                setCollectionsList([]);
                setShowClearCollectionsConfirm(false);
                toast.success('All collections deleted');
              }}
              data-testid="confirm-clear-collections-btn"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Backup Confirmation */}
      <AlertDialog open={showRestoreConfirm !== null} onOpenChange={function(open) { if (!open) setShowRestoreConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current library with the backup data. Your current data will be overwritten.
              <span className="block mt-2 font-medium text-foreground">
                Tip: Use "Backup Now" first to save your current state before restoring.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={function() { restoreBackup(showRestoreConfirm); }} data-testid="confirm-restore-btn">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Backup Wizard */}
      {importStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="import-wizard">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (importStep !== 'done') { setImportStep(null); setImportData(null); } }} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Step 1: Select file */}
            {importStep === 'select' && (
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Restore from Backup File</h2>
                  <p className="text-sm text-muted-foreground mt-1">Follow these steps to restore your library from a previously exported backup.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <p className="text-sm font-medium">Find your backup file</p>
                      <p className="text-xs text-muted-foreground">Look in your <strong className="text-foreground">Downloads folder</strong> for a file named like:<br /><span className="font-mono text-[11px]">obsidian-cinema-backup-2025-03-20.json</span></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <p className="text-sm font-medium">Select the file</p>
                      <p className="text-xs text-muted-foreground">Click the button below to open a file picker, then choose your backup file.</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setImportStep(null); setImportData(null); }}>Cancel</Button>
                  <Button className="flex-1" onClick={handleFileSelect} data-testid="import-select-file-btn">
                    <Upload className="w-4 h-4 mr-2" /> Select Backup File
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Preview & confirm */}
            {importStep === 'preview' && importData && (
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Review Backup</h2>
                  <p className="text-sm text-muted-foreground mt-1">Please confirm this is the correct backup before restoring.</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">File:</span>
                    <span className="font-mono text-xs">{importData.fileName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Backup date:</span>
                    <span>{importData.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Movies:</span>
                    <span className="font-medium">{importData.movieCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Collections:</span>
                    <span className="font-medium">{importData.collectionCount}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm text-orange-400 font-medium">This will replace your current library</p>
                  <p className="text-xs text-muted-foreground mt-1">All current movies, collections, and settings will be replaced with this backup. Consider using "Export to File" first to save your current state.</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setImportStep('select'); setImportData(null); }}>Back</Button>
                  <Button className="flex-1" onClick={confirmImport} data-testid="import-confirm-btn">
                    Restore This Backup
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {importStep === 'done' && (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Backup Restored!</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your library has been restored successfully. The app needs to reload to apply all changes.</p>
                </div>
                <Button className="w-full" onClick={() => window.location.reload()} data-testid="import-reload-btn">
                  Reload App
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
