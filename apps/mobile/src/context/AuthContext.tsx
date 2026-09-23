import React, { createContext, useContext, useState, useEffect } from 'react';
import { IAuthUser, IAuthTokens } from '@alpha/types';
import { SecureStorage } from '../services/secureStorage';
import { ApiClient } from '../services/api';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  status: AuthStatus;
  user: IAuthUser | null;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  googleLogin: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [user, setUser] = useState<IAuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setStatus('loading');
    try {
      const refreshToken = await SecureStorage.getItem('alpha_refresh_token');
      const accessToken = await SecureStorage.getItem('alpha_access_token');

      if (!refreshToken) {
        setStatus('unauthenticated');
        return;
      }

      // First attempt to get the current profile using the cached access token
      if (accessToken) {
        const userRes = await ApiClient.get<IAuthUser>('/users/me');
        if (userRes.success && userRes.data) {
          setUser(userRes.data);
          setStatus('authenticated');
          return;
        }
      }

      // If access token expired or failed, use refresh token to acquire new token pair
      const res = await ApiClient.post<IAuthTokens>('/auth/refresh', { refreshToken });
      if (res.success && res.data) {
        await SecureStorage.setItem('alpha_access_token', res.data.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.refreshToken);

        const userRes = await ApiClient.get<IAuthUser>('/users/me');
        if (userRes.success && userRes.data) {
          setUser(userRes.data);
          setStatus('authenticated');
          return;
        }
      }

      // Refresh invalid or session revoked: clear storage cleanly
      await SecureStorage.clear();
      setUser(null);
      setStatus('unauthenticated');
    } catch {
      await SecureStorage.clear();
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setStatus('loading');
    setError(null);

    try {
      const res = await ApiClient.post<{ user: IAuthUser; tokens: IAuthTokens }>('/auth/login', {
        email: email.trim(),
        password,
      });

      if (res.success && res.data) {
        setUser(res.data.user);
        await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
        setStatus('authenticated');
        return true;
      }

      const errMsg = res.error?.message || 'Invalid credentials. Please verify your email and password.';
      setError(errMsg);
      setStatus('unauthenticated');
      return false;
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check network connection.');
      setStatus('unauthenticated');
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setStatus('loading');
    setError(null);

    try {
      const res = await ApiClient.post<{ user: IAuthUser; tokens: IAuthTokens }>('/auth/register', {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });

      if (res.success && res.data) {
        setUser(res.data.user);
        await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
        setStatus('authenticated');
        return true;
      }

      const errMsg = res.error?.message || 'Registration failed. Please check your details.';
      setError(errMsg);
      setStatus('unauthenticated');
      return false;
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check network connection.');
      setStatus('unauthenticated');
      return false;
    }
  };

  const googleLogin = async (idToken: string): Promise<boolean> => {
    setStatus('loading');
    setError(null);

    try {
      const res = await ApiClient.post<{ user: IAuthUser; tokens: IAuthTokens }>('/auth/social', {
        provider: 'GOOGLE',
        token: idToken,
      });

      if (res.success && res.data) {
        setUser(res.data.user);
        await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
        setStatus('authenticated');
        return true;
      }

      const errMsg = res.error?.message || 'Google verification failed.';
      setError(errMsg);
      setStatus('unauthenticated');
      return false;
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
      setStatus('unauthenticated');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = await SecureStorage.getItem('alpha_refresh_token');
      if (refreshToken) {
        await ApiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      await SecureStorage.clear();
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        error,
        login,
        register,
        googleLogin,
        logout,
        clearError,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
