import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// DEV MODE: Set to true to bypass authentication for testing
// ⚠️ REMOVE THIS BEFORE PRODUCTION DEPLOYMENT
const DEV_BYPASS_AUTH = true;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // DEV MODE: Auto-authenticate with dev user
    if (DEV_BYPASS_AUTH) {
      try {
        // Try to get or create dev user
        const response = await axios.post(`${API}/auth/dev-login`, {}, {
          withCredentials: true
        });
        setUser(response.data);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      } catch (err) {
        console.log("Dev login failed, trying normal auth...");
      }
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // In dev mode, just refresh the page to re-login
    if (DEV_BYPASS_AUTH) {
      window.location.reload();
      return;
    }
    
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    logout,
    refreshUser,
    isPro: user?.subscription_tier === "pro"
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
