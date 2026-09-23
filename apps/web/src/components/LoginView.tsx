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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password. Please try again.');
      }

      // Store token and user
      if (data.tokens?.accessToken) {
        localStorage.setItem('alpha_auth_token', data.tokens.accessToken);
        localStorage.setItem('alpha_auth_user', JSON.stringify(data.user));
        onLoginSuccess(data.user, data.tokens.accessToken);
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
          maxWidth: '420px',
          backgroundColor: STITCH_THEME.colors.bgSecondary,
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00F0FF 0%, #7928CA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '24px',
              color: '#000000',
              marginBottom: '16px',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
            }}
          >
            α
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              margin: '0 0 6px 0',
              color: '#FFFFFF',
            }}
          >
            ALPHA PORTAL
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: STITCH_THEME.colors.textMuted,
              margin: 0,
            }}
          >
            Secure Trainer & Administrator Gateway
          </p>
        </div>

        {/* Security Notice */}
        <div
          style={{
            backgroundColor: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '12px',
            color: STITCH_THEME.colors.accentCyan,
            lineHeight: 1.5,
          }}
        >
          🔒 Role-based access control active. Athletes must use the Alpha Mobile Application.
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12px',
              color: STITCH_THEME.colors.accentCrimson,
              lineHeight: 1.4,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: STITCH_THEME.colors.textSecondary,
                marginBottom: '8px',
                letterSpacing: '0.02em',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@alpha.io or admin@alpha.io"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: STITCH_THEME.colors.textSecondary,
                marginBottom: '8px',
                letterSpacing: '0.02em',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: isLoading
                ? 'rgba(0, 240, 255, 0.3)'
                : 'linear-gradient(135deg, #00F0FF 0%, #0088FF 100%)',
              color: '#000000',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.03em',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(0, 240, 255, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
          ALPHA Performance OS • Zero Hardcoded Credentials
        </div>
      </div>
    </div>
  );
};
