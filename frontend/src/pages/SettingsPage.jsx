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
  LayoutGrid,
  Check,
  AlertTriangle,
  Trash2,
  Users,
  FolderArchive,
  Upload,
  Clock
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
  const [castFetching, setCastFetching] = useState(false);
  const [castProgress, setCastProgress] = useState(0);
  const [castTotal, setCastTotal] = useState(0);
  const [castStatusText, setCastStatusText] = useState('');
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
      var parsedMovies = [];
      try { parsedMovies = JSON.parse(movies); } catch (e) {}
      var parsedCols = [];
      try { parsedCols = JSON.parse(collections); } catch (e) {}

      var snapshot = {
        date: new Date().toISOString(),
        movieCount: parsedMovies.length,
        collectionCount: parsedCols.length,
        data: { movies: movies, dirs: dirs, collections: collections, trash: trash, tmdb: tmdb, theme: theme, gridSize: gridSize, sortBy: sortBy }
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
    var snapshot = {
      date: new Date().toISOString(),
      version: 'obsidian_cinema_backup_v1',
      data: { movies: movies, dirs: dirs, collections: collections, trash: trash, tmdb: tmdb, theme: theme, gridSize: gridSize, sortBy: sortBy }
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
        setIsCheckingUpdate(false);
        
        if (status === 'available') {
          toast.success(`Update v${data.version} is available!`);
        } else if (status === 'not-available') {
          toast.info("You're running the latest version!");
        } else if (status === 'error') {
          toast.error("Failed to check for updates");
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
      setSettings(settingsRes.data);
    } catch (err) {
      console.error("Failed to load settings:", err);
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
      const response = await axios.post(`${API}/settings/test-tmdb?api_key=${encodeURIComponent(tmdbKey.trim())}`);
      setTestResult(response.data);
      if (response.data.valid) {
        toast.success("API key is valid!");
      } else {
        toast.error(response.data.message || "Invalid API key");
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
      const response = await axios.post(`${API}/settings`, {
        tmdb_api_key: tmdbKey.trim()
      });
      
      if (response.data.success) {
        toast.success("TMDB API key saved successfully!");
        setTmdbKey("");
        setTestResult(null);
        loadData();
      } else {
        toast.error(response.data.message || "Failed to save API key");
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("Failed to save API key");
      }
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
        toast.error(result.message || "Could not reach update server. Make sure a GitHub release exists.");
        setIsCheckingUpdate(false);
      }
    } catch (err) {
      toast.error("Could not check for updates. Ensure a release has been published on GitHub.");
      setIsCheckingUpdate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
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
                    updateStatus.status === 'available' 
                      ? 'bg-purple-500/10 border border-purple-500/20' 
                      : updateStatus.status === 'not-available'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-secondary/30 border border-border'
                  }`}>
                    {updateStatus.status === 'available' && (
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300">
                          Update v{updateStatus.data?.version} available!
                        </span>
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
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300">
                          Update downloaded! Restart to install.
                        </span>
                      </div>
                    )}
                    {updateStatus.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-orange-300">
                          Could not check for updates. Ensure a release has been published on GitHub.
                        </span>
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
        
        {/* Appearance Card - Desktop Only */}
        {isElectron() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="md:col-span-2"
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-4">
              {/* Color Theme */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Solid</p>
                    <div className="flex flex-wrap gap-2">
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
                            className={'w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ' + (active ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                            style={{ background: theme.preview }}
                            title={theme.name}
                            data-testid={'settings-theme-' + theme.id}
                          >
                            {active && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Pastel</p>
                    <div className="flex flex-wrap gap-2">
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
                            className={'w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ' + (active ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                            style={{ background: theme.preview }}
                            title={theme.name}
                            data-testid={'settings-theme-' + theme.id}
                          >
                            {active && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Special</p>
                    <div className="flex flex-wrap items-center gap-2">
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
                            className={'h-9 px-6 rounded-full border-2 transition-all flex items-center justify-center gap-2 text-xs font-medium text-white ' + (active ? 'border-foreground' : 'border-transparent hover:scale-[1.02]')}
                            style={{ background: theme.preview }}
                            title={theme.name}
                            data-testid={'settings-theme-' + theme.id}
                          >
                            {active && <Check className="w-3.5 h-3.5 drop-shadow-md" />}
                            {theme.name}
                          </button>
                        );
                      })}
                      <div className="relative">
                        <button
                          onClick={function() {
                            document.getElementById('custom-color-picker').click();
                          }}
                          className={'h-9 px-4 rounded-full border-2 transition-all flex items-center gap-2 text-xs font-medium ' + (currentTheme === 'custom' ? 'border-foreground' : 'border-border hover:border-primary/30')}
                          title="Custom color"
                          data-testid="settings-theme-custom"
                        >
                          <div className="w-5 h-5 rounded-full border border-border/50" style={{ background: customColor }} />
                          Custom
                          {currentTheme === 'custom' && <Check className="w-3.5 h-3.5 text-primary" />}
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
                <Label className="text-sm font-medium mb-3 block">Poster Size</Label>
                <div className="flex items-center gap-2">
                  {[
                    { key: 'small', label: 'Small', desc: '8-10 per row' },
                    { key: 'medium', label: 'Medium', desc: '5-7 per row' },
                    { key: 'large', label: 'Large', desc: '3-5 per row' },
                  ].map(function(size) {
                    var active = gridSize === size.key;
                    return (
                      <button
                        key={size.key}
                        onClick={function() {
                          setGridSize(size.key);
                          localStorage.setItem('obsidian_cinema_grid_size', size.key);
                        }}
                        className={'flex-1 p-3 rounded-lg border-2 transition-all text-center ' + (active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30')}
                        data-testid={'settings-grid-' + size.key}
                      >
                        <LayoutGrid className={'w-5 h-5 mx-auto mb-1 ' + (active ? 'text-primary' : 'text-muted-foreground')} />
                        <p className={'text-sm font-medium ' + (active ? 'text-primary' : 'text-foreground')}>{size.label}</p>
                        <p className="text-xs text-muted-foreground">{size.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
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
            <CardContent className="px-4 pb-3 space-y-3">
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

              {/* Poster Management */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
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

              {/* Backup & Restore */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
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

              {/* Reset Library */}
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
