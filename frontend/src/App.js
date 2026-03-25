import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LicenseProvider, useLicense } from "@/context/LicenseContext";
import { initTheme } from "@/components/ThemeSelector";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import AccountDashboard from "@/pages/AccountDashboard";
import DirectoriesPage from "@/pages/DirectoriesPage";
import SettingsPage from "@/pages/SettingsPage";
import CollectionsPage from "@/pages/CollectionsPage";
import LoginPage from "@/pages/LoginPage";
import AuthCallback from "@/pages/AuthCallback";
import UpgradePage from "@/pages/UpgradePage";
import LicenseActivationPage from "@/pages/LicenseActivationPage";
import LocalLibraryPage from "@/pages/LocalLibraryPage";
import StatsPage from "@/pages/StatsPage";
import LandingPage from "@/pages/LandingPage";
import UpdateNotification from "@/components/UpdateNotification";
import { RefreshCw } from "lucide-react";

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

// Use HashRouter for Electron (file:// protocol), BrowserRouter for web
const Router = isElectron() ? HashRouter : BrowserRouter;

// Apply saved theme immediately
initTheme();

// Protected route wrapper for web (uses Auth)
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // If user data was passed from AuthCallback, skip loading
  if (location.state?.user) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return children;
}

// Protected route wrapper for desktop (uses License)
function DesktopProtectedRoute({ children }) {
  const { isPro, loading, licenseStatus, isFreeTier } = useLicense();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access if user has Pro license OR is using free tier
  // Only redirect to activate page if they haven't chosen either option
  if (licenseStatus === 'not_activated' || licenseStatus === 'invalid') {
    return <Navigate to="/activate" replace />;
  }

  // Free tier and Pro users can access the app
  return children;
}

// Smart protected route that switches between web auth and desktop license
function SmartProtectedRoute({ children }) {
  if (isElectron()) {
    return <DesktopProtectedRoute>{children}</DesktopProtectedRoute>;
  }
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

// App Router - handles session_id detection
function AppRouter() {
  const location = useLocation();
  const desktopMode = isElectron();
  
  // Check URL fragment (not query params) for session_id synchronously during render
  // This prevents race conditions by processing new session_id FIRST before checking existing session_token
  if (location.hash?.includes('session_id=') && !desktopMode) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Desktop-specific routes */}
      <Route path="/activate" element={<LicenseActivationPage />} />
      
      {/* Web routes - skip in desktop mode */}
      {!desktopMode && <Route path="/login" element={<LandingPage />} />}
      {!desktopMode && <Route path="/landing" element={<LandingPage />} />}
      
      {/* Main app routes */}
      <Route
        path="/"
        element={
          <SmartProtectedRoute>
            <Layout />
          </SmartProtectedRoute>
        }
      >
        {/* Use LocalLibraryPage for desktop, AccountDashboard for web */}
        <Route index element={desktopMode ? <LocalLibraryPage /> : <AccountDashboard />} />
        <Route path="stats" element={desktopMode ? <StatsPage /> : <AccountDashboard />} />
        <Route path="directories" element={desktopMode ? <LocalLibraryPage /> : <AccountDashboard />} />
        <Route path="collections" element={desktopMode ? <CollectionsPage /> : <AccountDashboard />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/upgrade"
        element={
          desktopMode ? (
            <LicenseActivationPage />
          ) : (
            <ProtectedRoute>
              <UpgradePage />
            </ProtectedRoute>
          )
        }
      />
      <Route
        path="/upgrade/success"
        element={<UpgradePage />}
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <Router>
        <AuthProvider>
          <LicenseProvider>
            <AppRouter />
            <UpdateNotification />
          </LicenseProvider>
        </AuthProvider>
      </Router>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
