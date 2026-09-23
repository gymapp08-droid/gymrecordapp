export const Theme = {
  colors: {
    // Background Family
    background: '#05070B',
    backgroundSecondary: '#080B10',
    backgroundTertiary: '#0D1118',
    backgroundElevated: '#111318',
    backgroundGradient: ['#080B10', '#05070B', '#020305'],

    // Glass & Surfaces
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceSubtle: 'rgba(255, 255, 255, 0.02)',
    surfaceElevated: 'rgba(17, 19, 24, 0.85)',
    surfaceActive: 'rgba(0, 240, 255, 0.08)',
    surfaceGlass: 'rgba(13, 17, 24, 0.75)',

    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderHighlight: 'rgba(56, 130, 246, 0.40)',
    borderActive: '#00F0FF',
    borderGlowCyan: 'rgba(0, 240, 255, 0.35)',

    // Primary Accents
    primaryBlue: '#3882F6',
    primaryBlueDark: '#1D4ED8',
    cyanGlow: '#00F0FF',
    emeraldSuccess: '#10B981',
    violetAi: '#8B5CF6',
    amberWarning: '#F59E0B',
    roseError: '#EF4444',
    crimsonError: '#EF4444',

    // Text & Content
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textDisabled: '#334155',
  },

  typography: {
    fontDisplay: 'Outfit',
    fontBody: 'Plus Jakarta Sans',
    fontMono: 'SF Mono',
    display: {
      fontFamily: 'Outfit',
    },
    body: {
      fontFamily: 'Plus Jakarta Sans',
    },
    telemetry: {
      fontFamily: 'SF Mono',
    },
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  a11y: {
    minTouchTarget: 44,
    maxFontSizeMultiplier: 2.0,
    highContrastBorder: '#FFFFFF',
    highContrastText: '#FFFFFF',
    focusIndicatorColor: '#00F0FF',
  },
};
