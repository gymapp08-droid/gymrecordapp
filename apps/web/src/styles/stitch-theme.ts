import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ALPHA DESIGN SYSTEM — STITCH THEME v2.0
// Premium enterprise token system. Do not add one-off values outside this file.
// ─────────────────────────────────────────────────────────────────────────────

export const STITCH_THEME = {
  // ── Color Palette ──────────────────────────────────────────────────────────
  colors: {
    // Backgrounds — depth layering: primary → secondary → card → elevated
    bgPrimary:       '#070910',   // deepest bg, page canvas
    bgSecondary:     '#0C1018',   // sidebar, header surfaces
    bgCard:          '#101520',   // card / panel base
    bgCardElevated:  '#141A26',   // modals, popovers, elevated panels
    bgHover:         'rgba(255, 255, 255, 0.03)',

    // Borders
    borderSubtle:    'rgba(255, 255, 255, 0.07)',
    borderMedium:    'rgba(255, 255, 255, 0.12)',
    borderActive:    'rgba(0, 240, 255, 0.35)',

    // Shadows
    shadowCard:      '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
    shadowModal:     '0 8px 40px rgba(0,0,0,0.7)',
    glowCyan:        '0 0 16px rgba(0, 240, 255, 0.2)',
    glowViolet:      '0 0 16px rgba(121, 40, 202, 0.2)',

    // Text — hierarchy
    textPrimary:     '#F1F5F9',   // main readable text
    textSecondary:   '#8B99B3',   // secondary labels
    textMuted:       '#546177',   // hints, captions, placeholders
    textDisabled:    '#3A4352',

    // Accent palette
    accentCyan:      '#00E5FF',   // primary brand accent
    accentCyanDim:   'rgba(0, 229, 255, 0.12)',
    accentViolet:    '#7928CA',
    accentVioletDim: 'rgba(121, 40, 202, 0.12)',
    accentEmerald:   '#10B981',
    accentEmeraldDim:'rgba(16, 185, 129, 0.12)',
    accentAmber:     '#F59E0B',
    accentAmberDim:  'rgba(245, 158, 11, 0.12)',
    accentCrimson:   '#EF4444',
    accentCrimsonDim:'rgba(239, 68, 68, 0.12)',
    accentRose:      '#FF0055',
    accentRoseDim:   'rgba(255, 0, 85, 0.12)',
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  typography: {
    fontSans: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontMono: "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",

    // Scale (px)
    size: {
      xs:   '10px',
      sm:   '11px',
      base: '13px',
      md:   '14px',
      lg:   '16px',
      xl:   '18px',
      '2xl':'22px',
      '3xl':'28px',
      '4xl':'36px',
    },

    weight: {
      normal:    400,
      medium:    500,
      semibold:  600,
      bold:      700,
      extrabold: 800,
    },

    lineHeight: {
      tight:  1.3,
      base:   1.5,
      relaxed:1.7,
    },

    letterSpacing: {
      tight:   '-0.02em',
      normal:  '0',
      wide:    '0.04em',
      wider:   '0.08em',
      widest:  '0.12em',
    },
  },

  // ── Spacing scale (multiples of 4px) ──────────────────────────────────────
  space: {
    0:   '0px',
    1:   '4px',
    2:   '8px',
    3:   '12px',
    4:   '16px',
    5:   '20px',
    6:   '24px',
    7:   '28px',
    8:   '32px',
    10:  '40px',
    12:  '48px',
    16:  '64px',
  },

  // ── Border Radius ──────────────────────────────────────────────────────────
  radius: {
    sm:     '6px',
    md:     '10px',
    lg:     '14px',
    xl:     '18px',
    modal:  '20px',
    pill:   '999px',
    circle: '50%',
  },

  // ── Transitions ────────────────────────────────────────────────────────────
  transition: {
    fast:   'all 0.1s ease',
    base:   'all 0.15s ease',
    slow:   'all 0.25s ease',
    spring: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // ── Reusable style objects ─────────────────────────────────────────────────
  styles: {
    // Cards
    card: {
      backgroundColor: '#101520',
      border: '1px solid rgba(255, 255, 255, 0.07)',
      borderRadius: '12px',
    } as React.CSSProperties,

    glassCard: {
      backgroundColor: 'rgba(16, 21, 32, 0.9)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.07)',
      borderRadius: '12px',
    } as React.CSSProperties,

    glassCardElevated: {
      backgroundColor: 'rgba(20, 26, 38, 0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      borderRadius: '14px',
    } as React.CSSProperties,

    // Buttons
    primaryButton: {
      background: 'linear-gradient(135deg, #00E5FF 0%, #0070F3 100%)',
      color: '#000000',
      fontWeight: 600,
      fontSize: '13px',
      letterSpacing: '0.01em',
      padding: '9px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,

    secondaryButton: {
      background: 'transparent',
      color: '#F1F5F9',
      fontWeight: 500,
      fontSize: '13px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,

    dangerButton: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#EF4444',
      fontWeight: 500,
      fontSize: '13px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.15s ease',
    } as React.CSSProperties,

    // Form elements
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '9px 12px',
      color: '#F1F5F9',
      fontSize: '13px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s ease',
      width: '100%',
    } as React.CSSProperties,

    select: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '9px 12px',
      color: '#F1F5F9',
      fontSize: '13px',
      outline: 'none',
      cursor: 'pointer',
    } as React.CSSProperties,

    // Accessibility
    accessibleTouchTarget: {
      minWidth: '44px',
      minHeight: '44px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,

    focusVisibleRing: {
      outline: '2px solid #00E5FF',
      outlineOffset: '2px',
      boxShadow: '0 0 12px rgba(0, 229, 255, 0.4)',
    } as React.CSSProperties,

    visuallyHidden: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: '0',
    } as React.CSSProperties,
  },
};
