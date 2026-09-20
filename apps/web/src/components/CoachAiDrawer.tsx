import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { CoachAiDraftType, ICoachAiDraft } from '@alpha/types';

interface CoachAiDrawerProps {
  isOpen: boolean;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onGenerateDraft: (clientId: string, draftType: CoachAiDraftType, instructions?: string) => Promise<ICoachAiDraft>;
  onApplyDraft: (draftId: string) => Promise<void>;
  onInsertIntoChat?: (text: string) => void;
}

export const CoachAiDrawer: React.FC<CoachAiDrawerProps> = ({
  isOpen,
  clientId,
  clientName,
  onClose,
  onGenerateDraft,
  onApplyDraft,
  onInsertIntoChat,
}) => {
  const [draftType, setDraftType] = useState<CoachAiDraftType>('PERFORMANCE_SUMMARY');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<ICoachAiDraft | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setApplied(false);
    try {
      const draft = await onGenerateDraft(clientId, draftType, instructions);
      setCurrentDraft(draft);
    } catch (err) {
      console.error('Failed to generate draft', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!currentDraft) return;
    setLoading(true);
    try {
      await onApplyDraft(currentDraft.id);
      setApplied(true);
    } catch (err) {
      console.error('Failed to apply draft', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '520px',
          maxWidth: '100%',
          height: '100%',
          backgroundColor: STITCH_THEME.colors.bgSecondary,
          borderLeft: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.8)',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(12, 16, 24, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00F0FF 0%, #7928CA 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                Coach AI Assistant
              </div>
              <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                Athlete: {clientName} • Non-Authoritative Intelligence
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: STITCH_THEME.colors.textMuted,
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {/* Intelligence Type Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: STITCH_THEME.colors.textSecondary, textTransform: 'uppercase' }}>
              Intelligence Action Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {[
                { id: 'PERFORMANCE_SUMMARY', label: '📊 Weekly Summary', desc: 'Volume, adherence & PR trends' },
                { id: 'WORKOUT_ADJUSTMENT', label: '🏋️ Workout Proposal', desc: 'Fatigue / overload calibration' },
                { id: 'NUTRITION_ADJUSTMENT', label: '🥗 Nutrition Proposal', desc: 'Macro & calorie adjustments' },
                { id: 'CHECKIN_MESSAGE', label: '💬 Draft Check-In', desc: 'Personalized message draft' },
              ].map((t) => {
                const isSelected = draftType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setDraftType(t.id as CoachAiDraftType);
                      setCurrentDraft(null);
                      setApplied(false);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected
                        ? `1px solid ${STITCH_THEME.colors.borderActive}`
                        : `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textPrimary }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginTop: '2px' }}>
                      {t.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coach Custom Instructions */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: STITCH_THEME.colors.textSecondary, textTransform: 'uppercase' }}>
              Specific Directives (Optional)
            </label>
            <textarea
              placeholder="e.g. Focus on hamstring fatigue, or emphasize hitting protein target..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                marginTop: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                color: STITCH_THEME.colors.textPrimary,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              ...STITCH_THEME.styles.primaryButton,
              justifyContent: 'center',
              padding: '12px',
            }}
          >
            {loading ? 'Synthesizing Athlete Context...' : '⚡ Generate AI Proposal'}
          </button>

          {/* Generated Result Card */}
          {currentDraft && (
            <div
              style={{
                ...STITCH_THEME.styles.glassCard,
                padding: '20px',
                border: `1px solid ${STITCH_THEME.colors.borderActive}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 240, 255, 0.15)',
                    color: STITCH_THEME.colors.accentCyan,
                    fontWeight: 700,
                  }}
                >
                  STATUS: {applied ? 'APPLIED' : currentDraft.status}
                </span>
                <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                  AI Confidence: HIGH
                </span>
              </div>

              {/* Content Preview */}
              <div
                style={{
                  fontSize: '13px',
                  color: STITCH_THEME.colors.textPrimary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                }}
              >
                {currentDraft.content}
              </div>

              {/* Structured Action Proposal if present */}
              {currentDraft.actionProposal && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: STITCH_THEME.colors.accentEmerald, marginBottom: '6px' }}>
                    PROPOSED PRESCRIPTION MUTATION
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: STITCH_THEME.colors.textSecondary,
                      fontFamily: STITCH_THEME.typography.fontMono,
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(currentDraft.actionProposal, null, 2)}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {currentDraft.actionProposal && !applied && (
                  <button
                    onClick={handleApply}
                    disabled={loading}
                    style={{
                      ...STITCH_THEME.styles.primaryButton,
                      fontSize: '11px',
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    }}
                  >
                    ✓ Apply Prescription
                  </button>
                )}

                {onInsertIntoChat && (
                  <button
                    onClick={() => {
                      onInsertIntoChat(currentDraft.content);
                      onClose();
                    }}
                    style={{
                      ...STITCH_THEME.styles.secondaryButton,
                      fontSize: '11px',
                      padding: '8px 14px',
                      borderColor: STITCH_THEME.colors.accentCyan,
                      color: STITCH_THEME.colors.accentCyan,
                    }}
                  >
                    💬 Insert into Chat
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
