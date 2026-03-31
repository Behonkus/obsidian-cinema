import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLicense } from "../context/LicenseContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { Key, CheckCircle2, AlertCircle, ExternalLink, Copy, Loader2, Film, Sparkles } from "lucide-react";

export default function LicenseActivationPage() {
  const navigate = useNavigate();
  const { license, licenseStatus, activateLicense, deactivateLicense, machineId, isDesktopApp, setFreeTier } = useLicense();
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    setIsActivating(true);
    const result = await activateLicense(licenseKey);
    setIsActivating(false);

    if (result.success) {
      localStorage.setItem('obsidian_cinema_is_pro', 'true');
      toast.success(result.message);
      setLicenseKey("");
      navigate("/");
    } else {
      toast.error(result.message);
    }
  };

  const handleContinueFree = () => {
    // Set free tier mode and continue to app
    localStorage.setItem('obsidian_cinema_is_pro', 'false');
    if (setFreeTier) {
      setFreeTier();
    }
    toast.success("Welcome! You're using the free tier (50 movies, 3 collections)");
    navigate("/");
  };

  const handleDeactivate = async () => {
    const result = await deactivateLicense();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const copyMachineId = () => {
    navigator.clipboard.writeText(machineId || "");
    toast.success("Machine ID copied to clipboard");
  };

  const openPurchasePage = () => {
    // Open the web version to purchase a license
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(`${process.env.REACT_APP_BACKEND_URL}/upgrade`);
    } else {
      window.open(`${process.env.REACT_APP_BACKEND_URL}/upgrade`, '_blank');
    }
  };

  if (!isDesktopApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Web Version</CardTitle>
            <CardDescription>
              License activation is only available in the desktop app.
              Use Google Sign-in to access your account on the web.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // License is valid - show status
  if (licenseStatus === 'valid' && license) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-green-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-green-500">License Activated</CardTitle>
            <CardDescription>
              Your Obsidian Cinema Pro license is active on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{license.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">License Key</span>
                <span className="font-mono text-xs">{license.license_key?.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-500 font-medium">Pro - Unlimited</span>
              </div>
            </div>

            <Button 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Continue to Library
            </Button>

            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive"
              onClick={handleDeactivate}
            >
              Deactivate License
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Deactivating will allow you to use your license on another device.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // License not activated - show activation form with free option
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Welcome to Obsidian Cinema</CardTitle>
          <CardDescription>
            Choose how you'd like to use the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Free Tier Option */}
          <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Free Tier</h3>
              <span className="text-xs text-muted-foreground">No license needed</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Up to 50 movies</li>
              <li>• Up to 3 collections</li>
              <li>• Full local drive access</li>
            </ul>
            <Button 
              variant="outline"
              className="w-full"
              onClick={handleContinueFree}
            >
              <Film className="w-4 h-4 mr-2" />
              Continue with Free
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or unlock unlimited
              </span>
            </div>
          </div>

          {/* Pro License Option */}
          <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pro License
              </h3>
              <span className="text-xs text-amber-400">Unlimited everything</span>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="OBSIDIAN-XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="font-mono text-center tracking-wider text-sm"
              />
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                onClick={handleActivate}
                disabled={isActivating || !licenseKey.trim()}
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Activate Pro License
                  </>
                )}
              </Button>
            </div>

            {licenseStatus === 'invalid' && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                Invalid or expired license key
              </div>
            )}

            <Button 
              variant="ghost" 
              className="w-full text-amber-400 hover:text-amber-300"
              onClick={openPurchasePage}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get a license key ($25)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
