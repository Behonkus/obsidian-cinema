import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * AuthCallback component - handles OAuth callback from Emergent Auth
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          setError("No session_id found in URL");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Retry up to 5 times with increasing delay for intermittent failures
        let lastError = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const response = await axios.post(`${API}/auth/session`, {
              session_id: sessionId
            }, { withCredentials: true });

            // Update auth context directly so ProtectedRoute works immediately
            setUser(response.data);

            navigate("/", { 
              state: { user: response.data },
              replace: true 
            });
            return;
          } catch (err) {
            lastError = err;
            if (attempt < 4) {
              await new Promise(r => setTimeout(r, 1500 + attempt * 500));
            }
          }
        }

        // All retries failed
        console.error("Auth callback error after retries:", lastError);
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    processAuth();
  }, [location.hash, navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-muted-foreground text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
