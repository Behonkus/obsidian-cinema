import { useState } from "react";
import { useLicense } from "../context/LicenseContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { Key, CheckCircle2, AlertCircle, ExternalLink, Copy, Loader2 } from "lucide-react";

export default function LicenseActivationPage() {
  const { license, licenseStatus, activateLicense, deactivateLicense, machineId, isDesktopApp } = useLicense();
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
      toast.success(result.message);
      setLicenseKey("");
    } else {
      toast.error(result.message);
    }
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
                <span className="text-green-500 font-medium">Pro</span>
              </div>
            </div>

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

  // License not activated - show activation form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Key className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle>Activate License</CardTitle>
          <CardDescription>
            Enter your license key to unlock Obsidian Cinema Pro features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">License Key</label>
            <Input
              placeholder="OBSIDIAN-XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              className="font-mono text-center tracking-wider"
            />
          </div>

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
                Activate License
              </>
            )}
          </Button>

          {licenseStatus === 'invalid' && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              Invalid or expired license key
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Don't have a license?
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={openPurchasePage}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Purchase License Online
          </Button>

          {machineId && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Machine ID</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={copyMachineId}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <code className="text-xs font-mono text-muted-foreground break-all">
                {machineId}
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
