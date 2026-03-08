import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Crown, 
  Check, 
  RefreshCw, 
  Film, 
  FolderHeart,
  Star,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Gift,
  Tag,
  Copy,
  Users,
  Key,
  Download,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Free tier feature list
const FREE_FEATURES = [
  "Up to 30 movies",
  "Up to 3 collections",
  "Basic features"
];

// Pro tier feature list
const PRO_FEATURES = [
  "Unlimited movies",
  "Unlimited collections",
  "Priority support",
  "Early access to new features",
  "Personal referral code"
];

// License Key Card Component for Pro users
function LicenseKeyCard({ user }) {
  const [licenseData, setLicenseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    try {
      const response = await axios.get(`${API}/license/my-license`, { withCredentials: true });
      setLicenseData(response.data);
    } catch (err) {
      console.error("Failed to load license:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLicense = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post(`${API}/license/generate`, {}, { withCredentials: true });
      setLicenseData({
        has_license: true,
        ...response.data
      });
      toast.success("License key generated!");
    } catch (err) {
      console.error("Failed to generate license:", err);
      toast.error("Failed to generate license key");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLicenseKey = () => {
    if (licenseData?.license_key) {
      navigator.clipboard.writeText(licenseData.license_key);
      toast.success("License key copied!");
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="border-blue-500/30">
          <CardContent className="py-8 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6 space-y-4"
    >
      {/* Desktop App Download Card */}
      <Card className="bg-gradient-to-b from-purple-500/10 to-transparent border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            Download Desktop App
          </CardTitle>
          <CardDescription>
            Access your local movie library directly from your Windows PC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {/* Windows Download */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Windows</p>
                  <p className="text-xs text-muted-foreground">Windows 10/11 (64-bit)</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => toast.info("Desktop app download coming soon! Check back after we release the installer.")}
                data-testid="download-windows-btn"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Setup Guide Toggle */}
          <Button 
            variant="ghost" 
            className="w-full justify-between"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Installation & Setup Guide
            </span>
            <span className={`transition-transform ${showSetupGuide ? 'rotate-180' : ''}`}>▼</span>
          </Button>

          {showSetupGuide && (
            <div className="p-4 bg-secondary/30 rounded-lg space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">1. Download & Install</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Download the installer above</li>
                  <li>• Run the .exe file and follow the wizard</li>
                  <li>• Choose your installation directory</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">2. Enter Your License Key</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Launch Obsidian Cinema</li>
                  <li>• Copy your license key from below</li>
                  <li>• Paste it in the activation screen</li>
                  <li>• Click "Activate License"</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">3. Add Your Movie Folders</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Go to Directories in the sidebar</li>
                  <li>• Click "Add Directory"</li>
                  <li>• Browse to your movie folder (e.g., S:\Movies)</li>
                  <li>• Click "Scan" to import movies</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">4. Fetch Movie Posters</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Go to Settings</li>
                  <li>• Add your TMDB API key (free at themoviedb.org)</li>
                  <li>• Click "Fetch All Metadata" to get posters</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 text-xs">
                  <strong>Note:</strong> Your license key can only be activated on one device at a time. 
                  To move to another PC, deactivate first from Settings.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Key Card */}
      <Card className="bg-gradient-to-b from-blue-500/10 to-transparent border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            Your License Key
          </CardTitle>
          <CardDescription>
            Use this key to activate the desktop app on your Windows PC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {licenseData?.has_license ? (
            <>
              {/* License Key Display */}
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-secondary/50 rounded-lg border border-border font-mono text-sm text-center break-all">
                  {licenseData.license_key}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLicenseKey}
                  className="h-12 w-12 shrink-0"
                  data-testid="copy-license-btn"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                {licenseData.is_activated ? (
                  <span className="flex items-center gap-1 text-green-400">
                    <Check className="w-4 h-4" />
                    Activated
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Key className="w-4 h-4" />
                    Ready to activate
                  </span>
                )}
              </div>

              {licenseData.is_activated && licenseData.activated_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activated on:</span>
                  <span className="text-foreground">
                    {new Date(licenseData.activated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Generate a license key to use Obsidian Cinema on your desktop without needing to log in.
              </p>
              <Button 
                onClick={generateLicense}
                disabled={isGenerating}
                className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Generate License Key
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function UpgradePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(location.state?.user || null);
  const [limits, setLimits] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Referral state
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, limitsRes, pricingRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/user/limits`, { withCredentials: true }),
        axios.get(`${API}/pricing`)
      ]);
      setUser(userRes.data);
      setLimits(limitsRes.data);
      setPricing(pricingRes.data);
    } catch (err) {
      console.error("Failed to load data:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const pollPaymentStatus = useCallback(async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.error("Payment status check timed out. Please refresh the page.");
      return;
    }

    try {
      const response = await axios.get(`${API}/stripe/checkout-status/${sessionId}`, {
        withCredentials: true
      });

      if (response.data.payment_status === "paid") {
        setPaymentSuccess(true);
        toast.success("Welcome to Pro! Your upgrade is complete.");
        loadData();
        window.history.replaceState({}, document.title, "/upgrade/success");
        return;
      } else if (response.data.status === "expired") {
        toast.error("Payment session expired. Please try again.");
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (err) {
      console.error("Error checking payment status:", err);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [searchParams, pollPaymentStatus]);

  const validateReferralCode = async () => {
    if (!referralCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }

    setIsValidating(true);
    try {
      const response = await axios.get(`${API}/referral/validate/${referralCode.trim()}`);
      setReferralValid(response.data);
      
      if (response.data.valid) {
        setAppliedDiscount(response.data);
        toast.success(`$${response.data.discount} discount applied!`);
      } else {
        toast.error(response.data.message || "Invalid referral code");
        setAppliedDiscount(null);
      }
    } catch (err) {
      console.error("Referral validation error:", err);
      toast.error("Failed to validate referral code");
      setReferralValid({ valid: false });
      setAppliedDiscount(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const originUrl = window.location.origin;
      const payload = { origin_url: originUrl };
      
      // Include referral code if valid
      if (appliedDiscount?.valid) {
        payload.referral_code = referralCode.trim();
      }
      
      const response = await axios.post(`${API}/stripe/create-checkout-session`, payload, { 
        withCredentials: true 
      });

      window.location.href = response.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      const errorMsg = err.response?.data?.detail || "Failed to start checkout. Please try again.";
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      toast.success("Referral code copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already Pro user - show referral section
  if (user?.subscription_tier === "pro") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8" data-testid="upgrade-page">
        <div className="hero-glow-bg" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/25">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-[Outfit] text-foreground mb-2">
              You're a Pro Member!
            </h1>
            <p className="text-muted-foreground">
              Enjoy unlimited movies, collections, and all premium features.
            </p>
          </motion.div>

          {/* License Key Card - for Desktop App */}
          <LicenseKeyCard user={user} />

          {/* Referral Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  Share & Earn
                </CardTitle>
                <CardDescription>
                  Share your referral code with friends. They get $5 off their Pro upgrade!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Referral Code Display */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-secondary/50 rounded-lg border border-border font-mono text-lg text-center">
                    {user?.referral_code || "Generating..."}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyReferralCode}
                    className="h-12 w-12"
                    data-testid="copy-referral-btn"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>

                {/* Referral Stats */}
                <div className="flex items-center justify-center gap-6 pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-400">
                      <Users className="w-5 h-5" />
                      <span className="text-2xl font-bold">{user?.referral_count || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Friends referred</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Payment success
  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="upgrade-success">
        <div className="hero-glow-bg" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-[Outfit] text-foreground mb-2">
            Welcome to Pro!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your upgrade is complete. Enjoy unlimited movies and collections!
          </p>
          <Button onClick={() => navigate("/")} className="gap-2 bg-primary">
            <Film className="w-4 h-4" />
            Go to Library
          </Button>
        </motion.div>
      </div>
    );
  }

  const displayPrice = appliedDiscount?.valid 
    ? appliedDiscount.final_price 
    : (pricing?.pro_tier?.price || 29.99);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="upgrade-page">
      <div className="hero-glow-bg" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            One-time Payment
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-[Outfit] text-foreground mb-3">
            Upgrade to <span className="text-amber-400">Pro</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Unlock unlimited movies and collections with a single payment
          </p>
        </motion.div>

        {limits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-4 rounded-xl bg-secondary/30 border border-border"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Current Usage</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Film className="w-4 h-4 text-primary" />
                  <span className="text-sm">Movies</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{limits.movies?.current || 0}</span>
                  <span className="text-muted-foreground text-sm">/ {limits.movies?.limit || "∞"}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FolderHeart className="w-4 h-4 text-primary" />
                  <span className="text-sm">Collections</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{limits.collections?.current || 0}</span>
                  <span className="text-muted-foreground text-sm">/ {limits.collections?.limit || "∞"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Referral Code Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 p-4 rounded-xl bg-secondary/30 border border-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium">Have a referral code?</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code (e.g., CINEMA-ABC123)"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
                setReferralValid(null);
                setAppliedDiscount(null);
              }}
              className="flex-1 font-mono uppercase"
              data-testid="referral-code-input"
            />
            <Button
              variant="outline"
              onClick={validateReferralCode}
              disabled={isValidating || !referralCode.trim()}
              data-testid="apply-referral-btn"
            >
              {isValidating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>
          {appliedDiscount?.valid && (
            <div className="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              ${appliedDiscount.discount} discount from {appliedDiscount.referrer_name}!
            </div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-muted-foreground" />
                  Free
                </CardTitle>
                <CardDescription>Basic features for getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2">forever</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {FREE_FEATURES.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-6" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/30 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Best Value
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Pro
                </CardTitle>
                <CardDescription>Unlimited everything, forever</CardDescription>
                <div className="mt-4">
                  {appliedDiscount?.valid ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-amber-400">${displayPrice}</span>
                      <span className="text-xl text-muted-foreground line-through">${pricing?.pro_tier?.price}</span>
                      <span className="text-muted-foreground">one-time</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-amber-400">${displayPrice}</span>
                      <span className="text-muted-foreground ml-2">one-time</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {PRO_FEATURES.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-amber-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  data-testid="upgrade-btn"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro {appliedDiscount?.valid && `- Save $${appliedDiscount.discount}!`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Secure payment via Stripe • Instant activation • One-time purchase
          </p>
        </motion.div>
      </div>
    </div>
  );
}
