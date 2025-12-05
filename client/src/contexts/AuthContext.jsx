import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef(null);

  // Decode JWT to get expiration
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload;
    } catch (error) {
      return null;
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await api.logout(sessionId);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);

      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionId');

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const sessionId = localStorage.getItem('sessionId');

      if (!refreshToken || !sessionId) {
        logout();
        return;
      }

      const data = await api.refreshToken(refreshToken, sessionId);

      // Update tokens
      setAccessToken(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('sessionId', data.sessionId);

      return data.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return null;
    }
  }, [logout]);

  // Schedule token refresh 5 minutes before expiration
  const scheduleTokenRefresh = useCallback((token) => {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return;

    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // 5 minutes before expiry

    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Don't schedule if already expired or expires in less than 1 minute
    if (refreshTime < 60000) {
      console.log('Token expires soon, refreshing immediately');
      refreshAccessToken().then(newToken => {
        if (newToken) {
          scheduleTokenRefresh(newToken);
        }
      });
      return;
    }

    console.log(`Scheduling token refresh in ${Math.round(refreshTime / 1000 / 60)} minutes`);

    refreshTimeoutRef.current = setTimeout(() => {
      refreshAccessToken().then(newToken => {
        if (newToken) {
          scheduleTokenRefresh(newToken);
        }
      });
    }, refreshTime);
  }, [refreshAccessToken]);

  // Login
  const login = useCallback((userData, tokens) => {
    setUser(userData);
    setAccessToken(tokens.accessToken);

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('sessionId', tokens.sessionId);

    scheduleTokenRefresh(tokens.accessToken);
  }, [scheduleTokenRefresh]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      const sessionId = localStorage.getItem('sessionId');
      const userData = localStorage.getItem('user');

      if (refreshToken && sessionId && userData) {
        try {
          setUser(JSON.parse(userData));

          // Try to refresh to get a valid access token
          const newAccessToken = await refreshAccessToken();

          if (newAccessToken) {
            setAccessToken(newAccessToken);
            scheduleTokenRefresh(newAccessToken);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          logout();
        }
      }

      setLoading(false);
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshAccessToken, scheduleTokenRefresh, logout]);

  const value = {
    user,
    setUser,
    accessToken,
    loading,
    login,
    logout,
    refreshAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
