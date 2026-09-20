import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { IClientProgressPhoto } from '@alpha/types';

interface ProgressPhotosGalleryProps {
  athleteName: string;
  photos: IClientProgressPhoto[];
  onClose?: () => void;
}

export const ProgressPhotosGallery: React.FC<ProgressPhotosGalleryProps> = ({
  athleteName,
  photos,
  onClose,
}) => {
  const [selectedPose, setSelectedPose] = useState<'ALL' | 'FRONT' | 'SIDE' | 'BACK'>('ALL');
  const [activePhoto, setActivePhoto] = useState<IClientProgressPhoto | null>(photos[0] || null);

  const filteredPhotos = photos.filter((p) => selectedPose === 'ALL' || p.pose === selectedPose);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔒</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: STITCH_THEME.colors.textPrimary }}>
              Private Progress Photos: {athleteName}
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: '4px 0 0 0' }}>
            Authorized coach access only. Images are signed ephemerally with zero public storage URLs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Pose Filter */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '3px' }}>
            {(['ALL', 'FRONT', 'SIDE', 'BACK'] as const).map((pose) => (
              <button
                key={pose}
                onClick={() => setSelectedPose(pose)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: selectedPose === pose ? 700 : 500,
                  backgroundColor: selectedPose === pose ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                  color: selectedPose === pose ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textSecondary,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {pose}
              </button>
            ))}
          </div>

          {onClose && (
            <button onClick={onClose} style={{ ...STITCH_THEME.styles.secondaryButton, padding: '5px 10px' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 240, 255, 0.04)',
          border: `1px solid rgba(0, 240, 255, 0.2)`,
          fontSize: '12px',
          color: STITCH_THEME.colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>🛡️</span>
        <span>
          <strong>ALPHA Privacy Protection:</strong> Photos are strictly confined to authorized coaches. Client possesses full revocation authority.
        </span>
      </div>

      {/* Main Photo Layout */}
      {filteredPhotos.length === 0 ? (
        <div style={{ ...STITCH_THEME.styles.glassCard, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary }}>
            No progress photos uploaded for this angle
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Active Large View */}
          <div
            style={{
              ...STITCH_THEME.styles.glassCardElevated,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {activePhoto && (
              <>
                <div
                  style={{
                    width: '100%',
                    height: '420px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '8px',
                    border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Visual simulated watermark */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      opacity: 0.15,
                      transform: 'rotate(-30deg)',
                      fontSize: '28px',
                      fontWeight: 900,
                      letterSpacing: '0.2em',
                      color: STITCH_THEME.colors.accentCyan,
                    }}
                  >
                    ALPHA VAULT • {athleteName.toUpperCase()}
                  </div>

                  {/* Pose Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      border: `1px solid ${STITCH_THEME.colors.accentCyan}`,
                      color: STITCH_THEME.colors.accentCyan,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {activePhoto.pose} VIEW
                  </div>

                  <div style={{ textAlign: 'center', color: STITCH_THEME.colors.textMuted }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>👤</div>
                    <div style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary }}>
                      Progress Photo Artifact ({activePhoto.pose})
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Captured: {new Date(activePhoto.takenAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {activePhoto.notes && (
                  <div style={{ width: '100%', marginTop: '16px', fontSize: '13px', color: STITCH_THEME.colors.textSecondary }}>
                    <strong style={{ color: STITCH_THEME.colors.textPrimary }}>Athlete Notes:</strong> "{activePhoto.notes}"
                  </div>
                )}
              </>
            )}
          </div>

          {/* Thumbnails Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
            {filteredPhotos.map((photo) => {
              const isSelected = activePhoto?.id === photo.id;
              return (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  style={{
                    ...STITCH_THEME.styles.glassCard,
                    padding: '12px',
                    cursor: 'pointer',
                    border: isSelected
                      ? `1px solid ${STITCH_THEME.colors.accentCyan}`
                      : `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    📷
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textPrimary }}>
                      {photo.pose} View
                    </div>
                    <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                      {new Date(photo.takenAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
