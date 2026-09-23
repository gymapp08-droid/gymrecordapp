import React, { useState, useEffect } from 'react';
import { UserRole, IAuthUser } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';
import { LoginView } from './LoginView';

interface AuthGuardProps {
  children: (authUser: IAuthUser, onLogout: () => void) => React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<IAuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const savedToken = localStorage.getItem('alpha_auth_token');
      const savedUserStr = localStorage.getItem('alpha_auth_user');
      if (savedToken && savedUserStr) {
        const user = JSON.parse(savedUserStr);
        setAuthToken(savedToken);
        setCurrentUser(user);
      }
    } catch (e) {
      console.error('Failed to parse cached auth session', e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleLoginSuccess = (user: IAuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('alpha_auth_token');
    localStorage.removeItem('alpha_auth_user');
    setCurrentUser(null);
    setAuthToken(null);
  };

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: STITCH_THEME.colors.bgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: STITCH_THEME.colors.accentCyan,
          fontFamily: STITCH_THEME.typography.fontSans,
          fontSize: '14px',
          letterSpacing: '0.05em',
        }}
      >
        VERIFYING ALPHA PORTAL CREDENTIALS...
      </div>
    );
  }

  // If unauthenticated, show Login
  if (!currentUser || !authToken) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Role check: Normal USER/ATHLETE is strictly rejected with 403 Forbidden
  const role = currentUser.role as UserRole;
  const isPrivileged =
    role === UserRole.ADMIN ||
    role === UserRole.TRAINER ||
    role === UserRole.COACH ||
    role === UserRole.NUTRITIONIST ||
    role === UserRole.ORG_ADMIN;

  if (!isPrivileged) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: STITCH_THEME.colors.bgPrimary,
          color: STITCH_THEME.colors.textPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: STITCH_THEME.typography.fontSans,
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            backgroundColor: STITCH_THEME.colors.bgSecondary,
            border: `1px solid ${STITCH_THEME.colors.accentCrimson}`,
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(255, 59, 48, 0.15)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 59, 48, 0.12)',
              color: STITCH_THEME.colors.accentCrimson,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 20px auto',
              border: `1px solid rgba(255, 59, 48, 0.3)`,
            }}
          >
            🚫
          </div>

          <div
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              color: STITCH_THEME.colors.accentCrimson,
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              marginBottom: '12px',
            }}
          >
            403 FORBIDDEN • ACCESS DENIED
          </div>

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 800,
              margin: '0 0 12px 0',
              color: '#FFFFFF',
            }}
          >
            Privileged Access Required
          </h2>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: STITCH_THEME.colors.textSecondary,
              margin: '0 0 24px 0',
            }}
          >
            Your account ({currentUser.email}) is registered as an <strong>Athlete / Standard User</strong>.
            The Alpha Web Portal is strictly restricted to certified Trainers, Coaches, and System
            Administrators.
            <br />
            <br />
            Please open the <strong>Alpha Mobile Application</strong> to access your workouts, nutrition plans,
            and personal performance dashboards.
          </p>

          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Log Out & Return
          </button>
        </div>
      </div>
    );
  }

  // Authenticated & Privileged -> Render Dashboard
  return <>{children(currentUser, handleLogout)}</>;
};
