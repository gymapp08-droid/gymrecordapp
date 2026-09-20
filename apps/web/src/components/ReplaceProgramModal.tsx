import React, { useState } from 'react';
import { IPortalClientSummary, IProgramDetail } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface ReplaceProgramModalProps {
  client: IPortalClientSummary;
  availablePrograms: IProgramDetail[];
  onConfirmReplace: (newProgramId: string, effectiveDate: string) => void;
  onClose: () => void;
}

export const ReplaceProgramModal: React.FC<ReplaceProgramModalProps> = ({
  client,
  availablePrograms,
  onConfirmReplace,
  onClose,
}) => {
  const [selectedNewProgramId, setSelectedNewProgramId] = useState(
    availablePrograms[0]?.id || '',
  );
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0] || '',
  );
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);

  const currentProgramTitle = client.currentProgramTitle || 'Current Assigned Program';
  const newProgram = availablePrograms.find((p) => p.id === selectedNewProgramId);

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
        zIndex: 55,
      }}
    >
      <div style={{ ...STITCH_THEME.styles.glassCardElevated, width: '540px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
            Replace Active Workout Program
          </div>
          <button onClick={onClose} style={{ ...STITCH_THEME.styles.secondaryButton, padding: '4px 8px' }}>
            ✕
          </button>
        </div>

        <div style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, marginBottom: '20px' }}>
          Smooth program transition for <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{client.fullName}</span>
        </div>

        {/* Comparison Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '16px',
            borderRadius: '10px',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
              CURRENT ACTIVE
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginTop: '4px' }}>
              {currentProgramTitle}
            </div>
            <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentAmber, marginTop: '2px' }}>
              Deactivates on effective date
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: STITCH_THEME.colors.accentCyan, textTransform: 'uppercase' }}>
              NEW PROGRAM
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: STITCH_THEME.colors.accentCyan, marginTop: '4px' }}>
              {newProgram?.name || 'Selected Program'}
            </div>
            <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentEmerald, marginTop: '2px' }}>
              v{newProgram?.version || 1} • Active onwards
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
              Select Replacement Program
            </label>
            <select
              value={selectedNewProgramId}
              onChange={(e) => setSelectedNewProgramId(e.target.value)}
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
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
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

          {/* Explicit Historical Guarantee Notice */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 240, 255, 0.06)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              fontSize: '12px',
              color: STITCH_THEME.colors.textSecondary,
              lineHeight: 1.5,
            }}
          >
            🛡️ <span style={{ fontWeight: 700, color: '#F8FAFC' }}>Data Integrity Guarantee:</span> Existing completed
            workout sessions remain strictly unchanged and historically accurate. The athlete mobile app will transition to
            the new schedule automatically from the effective date.
          </div>

          {/* Confirmation Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={confirmedCheckbox}
              onChange={(e) => setConfirmedCheckbox(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: STITCH_THEME.colors.accentCyan }}
            />
            <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textPrimary }}>
              I confirm replacing the current program starting from {effectiveDate}.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={STITCH_THEME.styles.secondaryButton}>
            Cancel
          </button>
          <button
            disabled={!confirmedCheckbox}
            onClick={() => onConfirmReplace(selectedNewProgramId, new Date(effectiveDate).toISOString())}
            style={{
              ...STITCH_THEME.styles.primaryButton,
              opacity: confirmedCheckbox ? 1 : 0.4,
              cursor: confirmedCheckbox ? 'pointer' : 'not-allowed',
            }}
          >
            Confirm Replacement
          </button>
        </div>
      </div>
    </div>
  );
};
