import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  Circle,
  G,
  Rect,
} from 'react-native-svg';

interface AlphaLogoProps {
  size?: number;
  glow?: boolean;
}

export const AlphaLogo: React.FC<AlphaLogoProps> = ({ size = 68, glow = true }) => {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
        glow && styles.glowEffect,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          {/* Neon Cyan to Electric Blue gradient */}
          <LinearGradient id="alphaNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00F0FF" stopOpacity="1" />
            <Stop offset="50%" stopColor="#3B82F6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#6366F1" stopOpacity="1" />
          </LinearGradient>

          {/* Accent Gold/Emerald kinetic glow */}
          <LinearGradient id="alphaBarGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#10B981" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00F0FF" stopOpacity="0.8" />
          </LinearGradient>

          {/* Glass shield gradient */}
          <LinearGradient id="alphaShieldGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#0B132B" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#050811" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* Outer Athletic Hexagon Shield */}
        <Polygon
          points="50,4 92,25 92,75 50,96 8,75 8,25"
          fill="url(#alphaShieldGrad)"
          stroke="url(#alphaNeonGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner Tech Accent Hexagon */}
        <Polygon
          points="50,11 85,29 85,71 50,89 15,71 15,29"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="0.8"
          strokeDasharray="4 3"
          opacity="0.4"
        />

        <G>
          {/* Athletic Apex Alpha A - Left Wing */}
          <Path
            d="M 50 20 L 26 76 L 35 76 L 43 57 L 50 39 L 57 57 L 65 76 L 74 76 Z"
            fill="url(#alphaNeonGrad)"
          />

          {/* Barbell / Gym Performance Core Bar */}
          <Rect
            x="20"
            y="54"
            width="60"
            height="5"
            rx="2.5"
            fill="url(#alphaBarGrad)"
          />

          {/* Left Barbell Plate */}
          <Rect
            x="17"
            y="49"
            width="4"
            height="15"
            rx="1.5"
            fill="#00F0FF"
          />

          {/* Right Barbell Plate */}
          <Rect
            x="79"
            y="49"
            width="4"
            height="15"
            rx="1.5"
            fill="#00F0FF"
          />

          {/* Center Precision Power Diamond */}
          <Polygon
            points="50,49 54,56.5 50,64 46,56.5"
            fill="#050811"
            stroke="#00F0FF"
            strokeWidth="1.5"
          />

          {/* Diamond Power Core Light */}
          <Circle cx="50" cy="56.5" r="1.8" fill="#00F0FF" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
});
