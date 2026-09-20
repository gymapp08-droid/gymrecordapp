import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';

/**
 * Skip to Main Content Link for keyboard accessibility
 */
export const SkipToContentLink: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <a
      href={`#${targetId}`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        ...STITCH_THEME.styles.visuallyHidden,
        ...(isFocused
          ? {
              position: 'fixed',
              top: '12px',
              left: '12px',
              zIndex: 9999,
              width: 'auto',
              height: 'auto',
              clip: 'auto',
              backgroundColor: '#00F0FF',
              color: '#05070B',
              fontWeight: 700,
              fontSize: '14px',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 240, 255, 0.4)',
              textDecoration: 'none',
              outline: '2px solid #FFFFFF',
            }
          : {}),
      }}
    >
      Skip to main content
    </a>
  );
};

/**
 * Screen Reader Live Region for asynchronous updates & telemetry notifications
 */
export const LiveRegion: React.FC<{
  message: string;
  politeness?: 'polite' | 'assertive';
}> = ({ message, politeness = 'polite' }) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      style={STITCH_THEME.styles.visuallyHidden}
    >
      {message}
    </div>
  );
};

/**
 * Visually Hidden container for screen reader only text
 */
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span style={STITCH_THEME.styles.visuallyHidden}>{children}</span>;
};

/**
 * Accessible Button wrapper ensuring minimum 44x44px touch/click target & keyboard focus ring
 */
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescription?: string;
  highContrast?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  ariaLabel,
  ariaDescription,
  highContrast = false,
  style,
  onFocus,
  onBlur,
  disabled,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const combinedStyle: React.CSSProperties = {
    ...STITCH_THEME.styles.accessibleTouchTarget,
    ...style,
    ...(isFocused ? STITCH_THEME.styles.focusVisibleRing : {}),
    ...(highContrast
      ? {
          borderColor: '#FFFFFF',
          color: '#FFFFFF',
        }
      : {}),
    ...(disabled
      ? {
          opacity: 0.5,
          cursor: 'not-allowed',
        }
      : {}),
  };

  return (
    <button
      {...props}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-description={ariaDescription}
      aria-disabled={disabled}
      style={combinedStyle}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
    >
      {children}
    </button>
  );
};
