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
      const cachedUserProfile = await SecureStorage.getItem('alpha_user_profile');

      let localUser: IAuthUser | null = null;
      if (cachedUserProfile) {
        try {
          const parsed = JSON.parse(cachedUserProfile);
          if (parsed && (parsed.id || parsed.email)) {
            localUser = parsed;
            setUser(localUser);
          }
        } catch {
          // ignore parsing error
        }
      }

      // If we have both cached user and valid tokens, keep authenticated immediately
      if (refreshToken || accessToken) {
        if (localUser) {
          setStatus('authenticated');
        }

        // Background profile verification / refresh without blocking or kicking the user out on network failure
        if (accessToken) {
          try {
            const userRes = await ApiClient.get<any>('/users/me');
            if (userRes.success && userRes.data) {
              const updatedUser: IAuthUser = {
                id: userRes.data.id || localUser?.id || '',
                email: userRes.data.email || localUser?.email || '',
                fullName: userRes.data.fullName || localUser?.fullName || 'Athlete',
                role: userRes.data.role || localUser?.role || ('ATHLETE' as any),
                status: userRes.data.status || localUser?.status || ('ACTIVE' as any),
                isEmailVerified: userRes.data.isEmailVerified ?? localUser?.isEmailVerified ?? true,
              };
              setUser(updatedUser);
              await SecureStorage.setItem('alpha_user_profile', JSON.stringify(updatedUser));
              setStatus('authenticated');
              return;
            }
          } catch {
            // Server might be sleeping or network offline; keep existing cached session!
            if (localUser) {
              setStatus('authenticated');
              return;
            }
          }
        }

        // Attempt refresh token exchange if access token is missing or failed
        if (refreshToken) {
          try {
            const res = await ApiClient.post<IAuthTokens>('/auth/refresh', { refreshToken });
            if (res.success && res.data) {
              await SecureStorage.setItem('alpha_access_token', res.data.accessToken);
              await SecureStorage.setItem('alpha_refresh_token', res.data.refreshToken);

              const userRes = await ApiClient.get<any>('/users/me');
              if (userRes.success && userRes.data) {
                const refreshedUser: IAuthUser = {
                  id: userRes.data.id || localUser?.id || '',
                  email: userRes.data.email || localUser?.email || '',
                  fullName: userRes.data.fullName || localUser?.fullName || 'Athlete',
                  role: userRes.data.role || localUser?.role || ('ATHLETE' as any),
                  status: userRes.data.status || localUser?.status || ('ACTIVE' as any),
                  isEmailVerified: userRes.data.isEmailVerified ?? localUser?.isEmailVerified ?? true,
                };
                setUser(refreshedUser);
                await SecureStorage.setItem('alpha_user_profile', JSON.stringify(refreshedUser));
                setStatus('authenticated');
                return;
              }
            } else if (res.error?.code === 'SESSION_REVOKED' || res.error?.code === 'INVALID_REFRESH_TOKEN') {
              // Explicit rejection by authentication server
              await SecureStorage.removeItem('alpha_access_token');
              await SecureStorage.removeItem('alpha_refresh_token');
              await SecureStorage.removeItem('alpha_user_profile');
              setUser(null);
              setStatus('unauthenticated');
              return;
            }
          } catch {
            // Keep existing cached session on network errors
            if (localUser) {
              setStatus('authenticated');
              return;
            }
          }
        }

        if (localUser) {
          setStatus('authenticated');
          return;
        }
      }

      // No tokens and no valid cached session
      setUser(null);
      setStatus('unauthenticated');
    } catch {
      // Defensive fallback: if cached user exists, do not unauthenticate
      try {
        const cached = await SecureStorage.getItem('alpha_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.id || parsed.email)) {
            setUser(parsed);
            setStatus('authenticated');
            return;
          }
        }
      } catch {}

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
        const derivedName =
          res.data.user.fullName ||
          email.split('@')[0]?.replace(/^\w/, (c) => c.toUpperCase()) ||
          'Athlete';

        const finalUser: IAuthUser = {
          ...res.data.user,
          fullName: derivedName,
        };

        setUser(finalUser);
        await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
        await SecureStorage.setItem('alpha_user_profile', JSON.stringify(finalUser));
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
      const trimmedName = fullName.trim();
      const res = await ApiClient.post<{ user: IAuthUser; tokens: IAuthTokens }>('/auth/register', {
        email: email.trim(),
        password,
        fullName: trimmedName,
      });

      if (res.success && res.data) {
        const finalUser: IAuthUser = {
          ...res.data.user,
          fullName: trimmedName || res.data.user.fullName || 'Athlete',
        };

        setUser(finalUser);
        await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
        await SecureStorage.setItem('alpha_user_profile', JSON.stringify(finalUser));
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
        const finalUser: IAuthUser = {
          ...res.data.user,
          fullName: res.data.user.fullName || 'Athlete',
        };
        setUser(finalUser);
        await SecureStorage.setItem('alpha_access_token', res.data.tokens.accessToken);
        await SecureStorage.setItem('alpha_refresh_token', res.data.tokens.refreshToken);
        await SecureStorage.setItem('alpha_user_profile', JSON.stringify(finalUser));
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
      await SecureStorage.removeItem('alpha_access_token');
      await SecureStorage.removeItem('alpha_refresh_token');
      await SecureStorage.removeItem('alpha_user_profile');
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
