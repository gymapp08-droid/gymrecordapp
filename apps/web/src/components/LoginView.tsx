import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { IAuthUser } from '@alpha/types';

interface LoginViewProps {
  onLoginSuccess: (user: IAuthUser, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Connect to Alpha backend API auth endpoint
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new Error(json.error?.message || json.message || 'Invalid email or password. Please verify credentials.');
      }

      const payload = json.data || json;
      const accessToken = payload.tokens?.accessToken || payload.accessToken;
      const user = payload.user;

      // Store token and user
      if (accessToken && user) {
        if (rememberMe) {
          localStorage.setItem('alpha_auth_token', accessToken);
          localStorage.setItem('alpha_auth_user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('alpha_auth_token', accessToken);
          sessionStorage.setItem('alpha_auth_user', JSON.stringify(user));
          localStorage.removeItem('alpha_auth_token');
          localStorage.removeItem('alpha_auth_user');
        }
        onLoginSuccess(user, accessToken);
      } else {
        throw new Error('Malformed authentication response from server.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
          width: '100%',
          maxWidth: '400px',
          backgroundColor: STITCH_THEME.colors.bgSecondary,
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          borderRadius: '14px',
          padding: '36px 32px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00E5FF 0%, #7928CA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '20px',
              color: '#000000',
              marginBottom: '16px',
            }}
          >
            α
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              margin: '0 0 6px 0',
              color: STITCH_THEME.colors.textPrimary,
            }}
          >
            ALPHA
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: STITCH_THEME.colors.accentCyan,
              margin: 0,
              fontFamily: STITCH_THEME.typography.fontMono,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Enterprise Control Center
          </p>
        </div>

        {/* Security Notice */}
        <div
          style={{
            backgroundColor: STITCH_THEME.colors.accentCyanDim,
            border: `1px solid rgba(0, 229, 255, 0.2)`,
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: STITCH_THEME.colors.accentCyan,
            lineHeight: 1.5,
          }}
        >
          Role-based governance active. Athletes execute on Alpha Mobile OS.
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(255, 0, 85, 0.1)',
              border: `1px solid rgba(255, 0, 85, 0.25)`,
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: STITCH_THEME.colors.accentRose,
              lineHeight: 1.4,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: STITCH_THEME.colors.textSecondary,
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@alpha.io or coach@alpha.io"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = STITCH_THEME.colors.accentCyan)}
              onBlur={(e) => (e.target.style.borderColor = STITCH_THEME.colors.borderSubtle)}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: STITCH_THEME.colors.textSecondary,
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  color: STITCH_THEME.colors.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = STITCH_THEME.colors.accentCyan)}
                onBlur={(e) => (e.target.style.borderColor = STITCH_THEME.colors.borderSubtle)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: showPassword ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  lineHeight: 1,
                  userSelect: 'none',
                  transition: 'color 0.15s ease',
                }}
              >
                {showPassword ? (
                  /* Eye Slash (Hide) */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  /* Eye (Show) */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Session & Forgot Password row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: STITCH_THEME.colors.textSecondary, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: STITCH_THEME.colors.accentCyan }}
              />
              Remember session
            </label>
            <a
              href="#forgot-password"
              onClick={(e) => {
                e.preventDefault();
                alert('Please contact your platform superuser or system administrator for credential recovery.');
              }}
              style={{ color: STITCH_THEME.colors.accentCyan, textDecoration: 'none' }}
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isLoading ? STITCH_THEME.colors.borderSubtle : STITCH_THEME.colors.accentCyan,
              color: '#000000',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.02em',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
          ALPHA Performance OS • Production-grade server RBAC
        </div>
      </div>
    </div>
  );
};
