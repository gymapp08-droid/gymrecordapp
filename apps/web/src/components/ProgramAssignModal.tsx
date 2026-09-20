import React, { useState } from 'react';
import { IPortalClientSummary, IProgramDetail } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface ProgramAssignModalProps {
  client: IPortalClientSummary;
  availablePrograms: IProgramDetail[];
  onAssign: (programId: string, startDate: string) => void;
  onClose: () => void;
}

export const ProgramAssignModal: React.FC<ProgramAssignModalProps> = ({
  client,
  availablePrograms,
  onAssign,
  onClose,
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState(
    availablePrograms[0]?.id || '',
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] || '');

  const hasActiveProgram = Boolean(client.currentProgramTitle);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div style={{ ...STITCH_THEME.styles.glassCardElevated, width: '480px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
            Assign Workout Program
          </div>
          <button onClick={onClose} style={{ ...STITCH_THEME.styles.secondaryButton, padding: '4px 8px' }}>
            ✕
          </button>
        </div>

        <div style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, marginBottom: '20px' }}>
          Assigning workout program to <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{client.fullName}</span>
        </div>

        {/* If athlete has active program, show replacement alert */}
        {hasActiveProgram && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: STITCH_THEME.colors.accentAmber,
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            ⚠️ <span style={{ fontWeight: 700 }}>Active Program Detected:</span> Athlete is currently on{' '}
            <span style={{ fontWeight: 600, color: '#F8FAFC' }}>"{client.currentProgramTitle}"</span>. Assigning a new
            program will smoothly transition them starting from the effective date. Past completed workouts remain 100%
            preserved.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
              Select Program
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {availablePrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (v{p.version}) • {p.weeksCount} weeks
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
              Effective Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={STITCH_THEME.styles.secondaryButton}>
            Cancel
          </button>
          <button
            onClick={() => onAssign(selectedProgramId, new Date(startDate).toISOString())}
            style={STITCH_THEME.styles.primaryButton}
          >
            Confirm & Assign
          </button>
        </div>
      </div>
    </div>
  );
};
