import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LicenseContext = createContext(null);

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron?.();
};

export function LicenseProvider({ children }) {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [machineId, setMachineId] = useState(null);
  const [licenseStatus, setLicenseStatus] = useState('checking'); // checking, valid, free, invalid, not_activated
  const [isFreeTier, setIsFreeTier] = useState(false);

  useEffect(() => {
    const init = async () => {
      const electron = isElectron();
      setIsDesktopApp(electron);
      
      if (electron) {
        // Get machine ID for this device
        const id = await window.electronAPI.getMachineId();
        setMachineId(id);
        
        // Check locally stored license
        const storedLicense = await window.electronAPI.getLicense();
        if (storedLicense) {
          // If it has a license_key, it's a Pro license — regardless of subscription_tier field
          if (storedLicense.license_key) {
            setLicense(storedLicense);
            localStorage.setItem('obsidian_cinema_is_pro', 'true');
            window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: true, status: 'pending-validation' } }));
            await validateLicenseWithServer(storedLicense.license_key, id);
          } else if (storedLicense.subscription_tier === 'free') {
            // Free tier marker (no license key, just a tier flag)
            setIsFreeTier(true);
            setLicenseStatus('free');
            localStorage.setItem('obsidian_cinema_is_pro', 'false');
            window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'free' } }));
          } else {
            setLicenseStatus('not_activated');
            localStorage.setItem('obsidian_cinema_is_pro', 'false');
            window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'not_activated' } }));
          }
        } else {
          setLicenseStatus('not_activated');
          localStorage.setItem('obsidian_cinema_is_pro', 'false');
          window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'not_activated' } }));
        }
      }
      setLoading(false);
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const OFFLINE_GRACE_DAYS = 7;
  const LAST_VALIDATION_KEY = 'obsidian_cinema_last_validation';

  const validateLicenseWithServer = useCallback(async (licenseKey, deviceId) => {
    try {
      const response = await axios.post(`${API}/license/validate`, {
        license_key: licenseKey,
        machine_id: deviceId
      });
      
      if (response.data.valid) {
        setLicenseStatus('valid');
        localStorage.setItem('obsidian_cinema_is_pro', 'true');
        // Record successful validation timestamp
        localStorage.setItem(LAST_VALIDATION_KEY, Date.now().toString());
        window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: true, status: 'valid' } }));
        return true;
      } else {
        // Server explicitly rejected this key
        const error = response.data.error;
        if (error === 'deactivated' || error === 'invalid_key') {
          // Key was revoked or doesn't exist — clear local Pro status
          console.warn('License rejected by server:', error, response.data.message);
          setLicenseStatus('invalid');
          localStorage.setItem('obsidian_cinema_is_pro', 'false');
          localStorage.removeItem(LAST_VALIDATION_KEY);
          window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'invalid' } }));
          // Clear the stored license since key is genuinely invalid
          if (isElectron()) {
            await window.electronAPI.clearLicense();
          }
          setLicense(null);
          return false;
        } else {
          // machine_mismatch or other non-critical issue — trust local key, user paid
          console.warn('License validation issue (non-critical):', error, response.data.message);
          setLicenseStatus('valid');
          localStorage.setItem('obsidian_cinema_is_pro', 'true');
          localStorage.setItem(LAST_VALIDATION_KEY, Date.now().toString());
          window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: true, status: 'valid' } }));
          return true;
        }
      }
    } catch (err) {
      console.error('License validation error:', err);
      // Server unreachable — check offline grace period
      if (licenseKey) {
        const lastValidation = parseInt(localStorage.getItem(LAST_VALIDATION_KEY) || '0', 10);
        const daysSinceValidation = (Date.now() - lastValidation) / (1000 * 60 * 60 * 24);
        
        if (lastValidation > 0 && daysSinceValidation <= OFFLINE_GRACE_DAYS) {
          // Within grace period — trust local license
          setLicenseStatus('valid');
          localStorage.setItem('obsidian_cinema_is_pro', 'true');
          window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: true, status: 'valid' } }));
          return true;
        } else {
          // Grace period expired or never validated — degrade to free
          console.warn('Offline grace period expired — degrading to free tier');
          setLicenseStatus('expired_offline');
          localStorage.setItem('obsidian_cinema_is_pro', 'false');
          window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'expired_offline' } }));
          return false;
        }
      }
      setLicenseStatus('invalid');
      return false;
    }
  }, []);

  const activateLicense = useCallback(async (licenseKey) => {
    if (!isElectron()) {
      return { success: false, message: 'License activation is only available in the desktop app.' };
    }
    
    try {
      const response = await axios.post(`${API}/license/activate`, {
        license_key: licenseKey.trim().toUpperCase(),
        machine_id: machineId
      });
      
      if (response.data.success) {
        const licenseData = {
          license_key: licenseKey.trim().toUpperCase(),
          email: response.data.email,
          user_name: response.data.user_name,
          subscription_tier: 'pro',
          activated_at: new Date().toISOString()
        };
        
        // Store locally
        await window.electronAPI.setLicense(licenseData);
        setLicense(licenseData);
        setLicenseStatus('valid');
        setIsFreeTier(false);
        localStorage.setItem('obsidian_cinema_is_pro', 'true');
        window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: true, status: 'valid' } }));
        
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message, error: response.data.error };
      }
    } catch (err) {
      console.error('License activation error:', err);
      return { 
        success: false, 
        message: err.response?.data?.detail || 'Failed to activate license. Please try again.' 
      };
    }
  }, [machineId]);

  const deactivateLicense = useCallback(async () => {
    if (!isElectron()) {
      return { success: false, message: 'License management is only available in the desktop app.' };
    }
    
    try {
      // Clear local license
      await window.electronAPI.clearLicense();
      setLicense(null);
      setLicenseStatus('not_activated');
      setIsFreeTier(false);
      localStorage.setItem('obsidian_cinema_is_pro', 'false');
      window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'not_activated' } }));
      
      return { success: true, message: 'License deactivated from this device.' };
    } catch (err) {
      console.error('License deactivation error:', err);
      return { success: false, message: 'Failed to deactivate license.' };
    }
  }, []);

  // Set free tier mode (no license needed, limited features)
  const setFreeTier = useCallback(async () => {
    if (!isElectron()) return;
    
    // Store free tier marker locally
    const freeTierData = {
      subscription_tier: 'free',
      activated_at: new Date().toISOString()
    };
    
    await window.electronAPI.setLicense(freeTierData);
    setIsFreeTier(true);
    setLicenseStatus('free');
    localStorage.setItem('obsidian_cinema_is_pro', 'false');
    window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', { detail: { isPro: false, status: 'free' } }));
  }, []);

  // Sync license status to localStorage so StatusBar can read it directly
  useEffect(() => {
    if (licenseStatus && licenseStatus !== 'checking') {
      localStorage.setItem('obsidian_cinema_license_status', licenseStatus);
      // Dispatch custom event for immediate cross-component notification
      window.dispatchEvent(new CustomEvent('obsidian-pro-status-change', {
        detail: { isPro: licenseStatus === 'valid', status: licenseStatus }
      }));
      window.dispatchEvent(new Event('storage'));
    }
  }, [licenseStatus]);

  const value = {
    license,
    loading,
    isDesktopApp,
    machineId,
    licenseStatus,
    isFreeTier,
    isPro: licenseStatus === 'valid',
    activateLicense,
    deactivateLicense,
    validateLicenseWithServer,
    setFreeTier
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
}
