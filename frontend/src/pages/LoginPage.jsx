import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, LogIn, RefreshCw, Monitor, Download, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LoginPage component - handles user login via Emergent Google OAuth
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user passed from auth callback
  useEffect(() => {
    if (location.state?.user) {
      navigate("/", { replace: true });
    }
  }, [location.state, navigate]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Use domain without www for display on auth page ("Obsidiancinema" instead of "Www")
    // After auth, Emergent redirects to this URL — the server/DNS should handle www redirect
    const origin = window.location.origin;
    const displayOrigin = origin.replace("://www.", "://");
    const redirectUrl = displayOrigin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="login-page">
      {/* Background glow */}
      <div className="hero-glow-bg" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Film className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-[Outfit] tracking-tight text-foreground">
            Obsidian Cinema
          </h1>
          <p className="text-muted-foreground mt-2">
            Your personal movie library manager
          </p>
        </div>

        {/* Desktop App CTA */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <Monitor className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm">Looking to scan local drives?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                The <strong>desktop app</strong> can access C:\, D:\, S:\, and USB drives. 
                Sign in below to get your license key.
              </p>
            </div>
          </div>
        </div>
        
        {/* Login card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-center mb-2">
            Sign in to continue
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            Manage your account & get your desktop license key
          </p>
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-medium"
            data-testid="google-login-btn"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
        
        {/* Features preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <HardDrive className="w-6 h-6 mx-auto text-purple-400" />
            <p className="text-xs text-muted-foreground mt-2">Local Drives</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">TMDB</p>
            <p className="text-xs text-muted-foreground mt-1">Posters</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">VLC</p>
            <p className="text-xs text-muted-foreground mt-1">Playback</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
