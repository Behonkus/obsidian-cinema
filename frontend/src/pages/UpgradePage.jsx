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
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  "Early access to new features"
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(location.state?.user || null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(userRes.data);
      
      const limitsRes = await axios.get(`${API}/user/limits`, { withCredentials: true });
      setLimits(limitsRes.data);
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

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/stripe/create-checkout-session`, {
        origin_url: originUrl
      }, { withCredentials: true });

      window.location.href = response.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      const errorMsg = err.response?.data?.detail || "Failed to start checkout. Please try again.";
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already Pro user
  if (user?.subscription_tier === "pro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="upgrade-page">
        <div className="hero-glow-bg" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/25">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-[Outfit] text-foreground mb-2">
            You're Already Pro!
          </h1>
          <p className="text-muted-foreground mb-6">
            Enjoy unlimited movies, collections, and all premium features.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Button>
        </motion.div>
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
                  <span className="text-4xl font-bold text-amber-400">$29.99</span>
                  <span className="text-muted-foreground ml-2">one-time</span>
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
                      Upgrade to Pro
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
