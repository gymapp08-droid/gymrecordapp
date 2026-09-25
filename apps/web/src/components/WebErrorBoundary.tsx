import { Component, ErrorInfo, ReactNode } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class WebErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WebErrorBoundary] Uncaught dashboard error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Reset to overview tab if needed
    window.location.hash = '#overview';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
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
              maxWidth: '520px',
              width: '100%',
              backgroundColor: STITCH_THEME.colors.bgSecondary,
              border: `1px solid rgba(0, 229, 255, 0.3)`,
              borderRadius: '16px',
              padding: '36px 32px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: STITCH_THEME.colors.accentCyan,
                  boxShadow: `0 0 8px ${STITCH_THEME.colors.accentCyan}`,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: STITCH_THEME.typography.fontMono,
                  color: STITCH_THEME.colors.accentCyan,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                ALPHA ENTERPRISE RECOVERY SUBSYSTEM
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Interface Variance Isolated
            </h2>

            <p style={{ fontSize: '13px', lineHeight: 1.6, color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
              An isolated variance occurred while rendering this section. Your credentials, server connection,
              and background datasets remain completely secure.
            </p>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '11px',
                fontFamily: STITCH_THEME.typography.fontMono,
                color: STITCH_THEME.colors.accentCyan,
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message || 'Component render variance'}
            </div>

            <button
              onClick={this.handleReset}
              style={{
                ...STITCH_THEME.styles.primaryButton,
                width: '100%',
                padding: '12px',
                marginTop: '8px',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.02em',
              }}
            >
              Reload Dashboard & Resume
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
