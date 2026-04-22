import { motion } from "framer-motion";
import { 
  Download, 
  Monitor, 
  HardDrive, 
  Globe, 
  Key, 
  CreditCard,
  ChevronRight,
  Sparkles,
  Film,
  FolderOpen,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DesktopAppBanner({ onDismiss, isPro, hasLicense }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border-purple-500/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Icon */}
            <div className="shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Monitor className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Download the Desktop App
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                  Recommended
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Access your local movie collection directly. The desktop app can scan drives like 
                <span className="font-mono text-purple-400 mx-1">C:\Movies</span>, 
                <span className="font-mono text-purple-400 mx-1">D:\</span>, 
                <span className="font-mono text-purple-400 mx-1">S:\</span>, 
                and external USB drives.
              </p>

              {/* Feature comparison */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <HardDrive className="w-3 h-3 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Local Drives</p>
                    <p className="text-xs text-muted-foreground">Scan C:, D:, S:, USB</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <FolderOpen className="w-3 h-3 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Network Shares</p>
                    <p className="text-xs text-muted-foreground">Access \\server\movies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 flex flex-col gap-2 w-full lg:w-auto">
              {/* Download button - available to everyone */}
              <Button 
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2"
                onClick={() => window.location.href = '/upgrade'}
              >
                <Download className="w-4 h-4" />
                Download for Windows
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              {isPro ? (
                <p className="text-xs text-green-400 text-center flex items-center justify-center gap-1">
                  <Crown className="w-3 h-3" />
                  Pro: Unlimited movies
                </p>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  Free: 500 movies • <span className="text-purple-400 cursor-pointer hover:underline" onClick={() => window.location.href = '/upgrade'}>Upgrade for unlimited</span>
                </p>
              )}
            </div>
          </div>

          {/* Web app note */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>
                <strong className="text-foreground">This web portal</strong> is for account management, payments, and license keys. 
                For scanning local movie files, use the desktop app.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
