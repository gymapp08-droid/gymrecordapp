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
  logout: () => Promise<void>;
  clearError: () => void;
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
      if (!refreshToken) {
        setStatus('unauthenticated');
        return;
      }

      const res = await ApiClient.post<IAuthTokens>('/auth/refresh', { refreshToken });
      if (res.success && res.data) {
        await SecureStorage.setItem('alpha_access_token', res.data.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.refreshToken);

        // Fetch user context
        const userRes = await ApiClient.get<IAuthUser>('/users/me');
        if (userRes.success && userRes.data) {
          setUser(userRes.data);
          setStatus('authenticated');
          return;
        }
      }
      // If refresh failed, clear tokens
      await SecureStorage.clear();
      setStatus('unauthenticated');
    } catch {
      await SecureStorage.clear();
      setStatus('unauthenticated');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setStatus('loading');
    setError(null);

    const res = await ApiClient.post<{ user: IAuthUser; tokens: IAuthTokens }>('/auth/login', {
      email,
      password,
    });

    if (res.success && res.data) {
      setUser(res.data.user);
      await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
      await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
      setStatus('authenticated');
      return true;
    } else {
      setError(res.error?.message || 'Authentication failed');
      setStatus('unauthenticated');
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setStatus('loading');
    setError(null);

    const res = await ApiClient.post<{ user: IAuthUser; tokens: IAuthTokens }>('/auth/register', {
      email,
      password,
      fullName,
    });

    if (res.success && res.data) {
      setUser(res.data.user);
      await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
      await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
      setStatus('authenticated');
      return true;
    } else {
      setError(res.error?.message || 'Registration failed');
      setStatus('unauthenticated');
      return false;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStorage.getItem('alpha_refresh_token');
      if (refreshToken) {
        await ApiClient.post('/auth/logout', { refreshToken });
      }
    } finally {
      await SecureStorage.clear();
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        error,
        login,
        register,
        logout,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
