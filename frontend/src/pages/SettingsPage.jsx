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
  Info
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tmdbKey, setTmdbKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadData();
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
        
        {/* Library Stats Card */}
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
              
              {/* Poster cache stats */}
              {settings?.cached_posters > 0 && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-300">
                      {settings.cached_posters} movie posters cached in local repository
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Posters are stored separately from movie files
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* About Card */}
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
                    <li>• MPC-HC integration</li>
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
      </div>
    </div>
  );
}
