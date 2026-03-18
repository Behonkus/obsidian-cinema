import { useState, useEffect } from "react";
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
  Film,
  HardDrive,
  Info,
  Download,
  Sparkles,
  Palette,
  LayoutGrid,
  Check,
  AlertTriangle,
  Trash2
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
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearPostersConfirm, setShowClearPostersConfirm] = useState(false);
  const [showClearCollectionsConfirm, setShowClearCollectionsConfirm] = useState(false);
  const [posterCount, setPosterCount] = useState(0);
  const [collectionsList, setCollectionsList] = useState([]);
  const [appVersion, setAppVersion] = useState(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    loadData();
    
    // Load local poster count and collections
    try {
      const savedMovies = localStorage.getItem('obsidian_cinema_local_movies');
      if (savedMovies) {
        const movies = JSON.parse(savedMovies);
        setPosterCount(movies.filter(m => m.poster_path).length);
        
        // Build local stats for desktop mode
        if (isElectron()) {
          const dirs = localStorage.getItem('obsidian_cinema_local_dirs');
          const dirCount = dirs ? JSON.parse(dirs).length : 0;
          const withMeta = movies.filter(m => m.overview || m.rating || m.genres?.length).length;
          setStats({
            total_movies: movies.length,
            total_directories: dirCount,
            with_metadata: withMeta,
            without_metadata: movies.length - withMeta,
          });
        }
      }
      const savedCols = localStorage.getItem('obsidian_cinema_collections');
      if (savedCols) {
        setCollectionsList(JSON.parse(savedCols));
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
      const [settingsRes, statsRes] = await Promise.all([
        axios.get(`${API}/settings`),
        axios.get(`${API}/stats`),
      ]);
      setSettings(settingsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast.error("Failed to load settings");
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
    <div className="p-6 md:p-8 lg:p-10" data-testid="settings-page">
      {/* Hero glow effect */}
      <div className="hero-glow-bg" />
      
      {/* Header */}
      <div className="relative z-10 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[Outfit] tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your Obsidian Cinema preferences
          </p>
        </motion.div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* TMDB API Key Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>TMDB API Key</CardTitle>
                  <CardDescription>
                    Required for movie posters and metadata
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
        
        {/* Library Stats Card - Desktop Only */}
        {isElectron() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Library Statistics</CardTitle>
                  <CardDescription>
                    Overview of your movie collection
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-3xl font-bold text-foreground">{stats?.total_movies || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Movies</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-3xl font-bold text-foreground">{stats?.total_directories || 0}</p>
                  <p className="text-sm text-muted-foreground">Directories</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10">
                  <p className="text-3xl font-bold text-green-400">{stats?.with_metadata || 0}</p>
                  <p className="text-sm text-muted-foreground">With Metadata</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10">
                  <p className="text-3xl font-bold text-orange-400">{stats?.without_metadata || 0}</p>
                  <p className="text-sm text-muted-foreground">Without Metadata</p>
                </div>
              </div>
              
              {/* Poster cache stats - web only, not relevant in desktop */}
              {!isElectron() && settings?.cached_posters > 0 && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-300">
                        {settings.cached_posters} movie posters cached in local repository
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={async () => {
                        try {
                          await axios.delete(`${API}/posters/cache`);
                          setSettings(prev => ({ ...prev, cached_posters: 0 }));
                          toast.success('Poster cache cleared');
                        } catch (e) {
                          toast.error('Failed to clear poster cache');
                        }
                      }}
                      data-testid="clear-server-poster-cache-btn"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Posters are stored separately from movie files
                  </p>
                </div>
              )}
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
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>App Updates</CardTitle>
                    <CardDescription>
                      Keep Obsidian Cinema up to date
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Library Management</CardTitle>
                  <CardDescription>Manage your local movie database</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recently Deleted */}
              <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
                <div>
                  <p className="font-medium text-foreground text-sm">Recently Deleted</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Movies removed from the database are kept here for 30 days before being permanently cleared. No files on disk are affected.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={function() { window.location.href = '/#/?view=trash'; }}
                  data-testid="settings-recently-deleted-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  View Recently Deleted
                </Button>
              </div>

              <Separator />

              {/* Poster Management */}
              <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
                <div>
                  <p className="font-medium text-foreground text-sm">Poster Cache</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {posterCount > 0
                      ? `${posterCount} movies have cached poster data. Clearing will remove all poster URLs from your library — movies and metadata will remain.`
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

              <Separator />

              {/* Collection Management */}
              <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
                <div>
                  <p className="font-medium text-foreground text-sm">Collections</p>
                  <p className="text-sm text-muted-foreground mt-1">
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

              <Separator />

              {/* Reset Library */}
              <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
                <div>
                  <p className="font-medium text-destructive text-sm">Reset Entire Library</p>
                  <p className="text-sm text-foreground font-medium mt-2">
                    Your actual movie files on disk are never modified or deleted.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This only clears the app's internal database — your scanned movie list, collections, poster data, and directories will be removed from Obsidian Cinema, allowing you to start fresh. Nothing on your hard drive is touched.
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
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>About Obsidian Cinema</CardTitle>
                  <CardDescription>
                    Your personal movie library manager
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Features</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Scan local & network directories</li>
                    <li>• TMDB movie posters & metadata</li>
                    <li>• System default player integration</li>
                    <li>• Search & filter movies</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Supported Formats</h4>
                  <p className="text-muted-foreground">
                    MP4, MKV, AVI, MOV, WMV, FLV, WebM, M4V, MPEG, TS, VOB, and more...
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Network Paths</h4>
                  <p className="text-muted-foreground">
                    Supports UNC paths like <code className="bg-secondary px-1 rounded">\\server\share</code> and mounted drives
                  </p>
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
    </div>
  );
}
