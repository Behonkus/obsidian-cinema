import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  Monitor,
  Crown,
  Key,
  ChevronRight,
  Copy,
  Gift,
  Users,
  HardDrive,
  FolderOpen,
  Film,
  Globe,
  Shield,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { DownloadGuideModal } from "../components/DownloadGuideModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AccountDashboard() {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [licenseData, setLicenseData] = useState(null);
  const [loadingLicense, setLoadingLicense] = useState(false);

  useEffect(() => {
    if (isPro) {
      setLoadingLicense(true);
      axios.get(`${API}/license/my-license`, { withCredentials: true })
        .then(res => setLicenseData(res.data))
        .catch(() => {})
        .finally(() => setLoadingLicense(false));
    }
  }, [isPro]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const [showDownloadGuide, setShowDownloadGuide] = useState(false);

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-8" data-testid="account-dashboard">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold font-[Outfit] tracking-tight text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and download the desktop app
        </p>
      </motion.div>

      {/* Download Desktop App - Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border-primary/30" data-testid="download-card">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">Obsidian Cinema Desktop App</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Scan your local drives, fetch movie posters from TMDB, and play movies with your default player. 
                  Works with C:\, D:\, network shares, and USB drives.
                </p>
                <div className="flex flex-wrap gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HardDrive className="w-3.5 h-3.5 text-green-400" /> Local Drives
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FolderOpen className="w-3.5 h-3.5 text-green-400" /> Network Shares
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Film className="w-3.5 h-3.5 text-green-400" /> TMDB Posters
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-green-400" /> Auto Updates
                  </span>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white gap-2"
                  onClick={() => setShowDownloadGuide(true)}
                  data-testid="download-desktop-btn"
                >
                  <Download className="w-5 h-5" />
                  Download for Windows
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card data-testid="subscription-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">Subscription</span>
                {isPro ? (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <Crown className="w-3 h-3 mr-1" /> Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPro ? (
                <>
                  <div className="space-y-2">
                    {["Unlimited movies", "Unlimited collections", "Priority support", "Early access to new features"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    Lifetime access — no recurring charges
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Film className="w-4 h-4 text-muted-foreground" />
                      <span>Up to 100 movies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span>Up to 3 collections</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                    onClick={() => navigate('/upgrade')}
                    data-testid="upgrade-btn"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro — $25
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* License Key / Referral */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {isPro ? (
            <Card data-testid="license-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="w-5 h-5 text-primary" />
                  License Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingLicense ? (
                  <div className="h-16 animate-pulse bg-secondary rounded" />
                ) : licenseData?.license_key ? (
                  <>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono truncate">
                        {licenseData.license_key}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(licenseData.license_key)}
                        data-testid="copy-license-btn"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter this key in the desktop app to unlock Pro features
                    </p>
                    {licenseData.activated_machine_id && (
                      <div className="flex items-center gap-1.5 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Activated on a device
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your license key will appear here after purchase
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="account-info-card">
              <CardHeader>
                <CardTitle className="text-lg">Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {user?.picture && (
                    <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Signed in with Google
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Web Portal Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 text-xs text-muted-foreground p-4 rounded-lg bg-secondary/30 border border-border/30"
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span>
          This web portal is for account management, payments, and license keys. 
          To scan and manage your movie library, download and use the <strong className="text-foreground">desktop app</strong>.
        </span>
      </motion.div>

      <DownloadGuideModal
        open={showDownloadGuide}
        onClose={() => setShowDownloadGuide(false)}
        onDownload={() => {
          const link = document.createElement('a');
          link.href = `${API}/download/windows`;
          link.click();
        }}
      />
    </div>
  );
}
