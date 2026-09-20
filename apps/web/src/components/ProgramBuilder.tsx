import React, { useState } from 'react';
import { UserRole, ProgramStatus } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface ProgramBuilderProps {
  currentRole: UserRole;
  onSaveProgram: (programData: any) => void;
  onClose: () => void;
}

const BUILTIN_EXERCISES = [
  { id: 'ex_squat', name: 'Barbell Back Squat', muscle: 'Quadriceps' },
  { id: 'ex_bench', name: 'Barbell Bench Press', muscle: 'Chest' },
  { id: 'ex_deadlift', name: 'Conventional Deadlift', muscle: 'Hamstrings' },
  { id: 'ex_overhead_press', name: 'Overhead Barbell Press', muscle: 'Deltoids' },
  { id: 'ex_pullup', name: 'Weighted Pull-Up', muscle: 'Lats' },
  { id: 'ex_rdl', name: 'Romanian Deadlift', muscle: 'Hamstrings' },
  { id: 'ex_barbell_row', name: 'Barbell Bent Over Row', muscle: 'Back' },
  { id: 'ex_lateral_raise', name: 'Dumbbell Lateral Raise', muscle: 'Deltoids' },
];

export const ProgramBuilder: React.FC<ProgramBuilderProps> = ({
  currentRole,
  onSaveProgram,
  onClose,
}) => {
  const [programName, setProgramName] = useState('');
  const [description, setDescription] = useState('');
  const [weeksCount, setWeeksCount] = useState(4);
  const [days, setDays] = useState([
    {
      dayOfWeek: 1,
      title: 'Monday: Lower Strength',
      exercises: [
        { exerciseId: 'ex_squat', targetSets: 4, targetReps: 6, restSeconds: 120, targetRpe: 8, notes: 'Focus on depth' },
        { exerciseId: 'ex_rdl', targetSets: 3, targetReps: 8, restSeconds: 90, targetRpe: 8, notes: 'Hinge back' },
      ],
    },
    {
      dayOfWeek: 3,
      title: 'Wednesday: Upper Power',
      exercises: [
        { exerciseId: 'ex_bench', targetSets: 4, targetReps: 6, restSeconds: 120, targetRpe: 8, notes: 'Control eccentric' },
        { exerciseId: 'ex_pullup', targetSets: 3, targetReps: 8, restSeconds: 90, targetRpe: 8, notes: 'Full extension' },
      ],
    },
  ]);

  const isNutritionist = currentRole === UserRole.NUTRITIONIST;

  const handleAddDay = () => {
    const nextDayOfWeek = (days.length % 7) + 1;
    setDays([
      ...days,
      {
        dayOfWeek: nextDayOfWeek,
        title: `Day ${days.length + 1}: Split Workout`,
        exercises: [{ exerciseId: 'ex_squat', targetSets: 3, targetReps: 10, restSeconds: 90, targetRpe: 7, notes: '' }],
      },
    ]);
  };

  const handleAddExercise = (dayIdx: number) => {
    const updated = [...days];
    updated[dayIdx]?.exercises.push({
      exerciseId: 'ex_lateral_raise',
      targetSets: 3,
      targetReps: 12,
      restSeconds: 60,
      targetRpe: 8,
      notes: '',
    });
    setDays(updated);
  };

  const handleSubmit = (status: ProgramStatus) => {
    if (!programName.trim()) {
      alert('Please enter a program name');
      return;
    }
    onSaveProgram({
      name: programName,
      description,
      weeksCount,
      status,
      version: 1,
      days,
    });
  };

  return (
    <div style={{ ...STITCH_THEME.styles.glassCardElevated, padding: '28px', maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
            Workout Program Builder
          </div>
          <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
            Create structured multi-day splits with precise sets, reps, and RPE prescriptions
          </div>
        </div>
        <button onClick={onClose} style={{ ...STITCH_THEME.styles.secondaryButton, padding: '4px 10px' }}>
          ✕ Close
        </button>
      </div>

      {/* Role Restriction Banner if Nutritionist */}
      {isNutritionist && (
        <div
          style={{
            padding: '14px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: STITCH_THEME.colors.accentCrimson,
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          ⚠️ Access Denied: Nutritionist role cannot create or assign workout programs. Switch role to Coach or Trainer to proceed.
        </div>
      )}

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', opacity: isNutritionist ? 0.4 : 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
              Program Name *
            </label>
            <input
              type="text"
              disabled={isNutritionist}
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g. 12-Week Hypertrophy & Power Phase I"
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
              Duration (Weeks)
            </label>
            <input
              type="number"
              disabled={isNutritionist}
              value={weeksCount}
              onChange={(e) => setWeeksCount(parseInt(e.target.value) || 4)}
              min={1}
              max={52}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
            Description / Overview
          </label>
          <textarea
            disabled={isNutritionist}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Focusing on progressive overload, volume progression, and mechanical tension..."
            rows={2}
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              borderRadius: '8px',
              color: STITCH_THEME.colors.textPrimary,
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Days & Split Prescriptions */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
              WEEKLY SPLIT SCHEDULE ({days.length} Days)
            </span>
            <button
              disabled={isNutritionist}
              onClick={handleAddDay}
              style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '11px', padding: '5px 10px' }}
            >
              + Add Split Day
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="text"
                    disabled={isNutritionist}
                    value={day.title}
                    onChange={(e) => {
                      const updated = [...days];
                      if (updated[dayIdx]) updated[dayIdx].title = e.target.value;
                      setDays(updated);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      color: STITCH_THEME.colors.accentCyan,
                      fontWeight: 700,
                      fontSize: '14px',
                      padding: '4px 0',
                      outline: 'none',
                      width: '60%',
                    }}
                  />
                  <button
                    disabled={isNutritionist}
                    onClick={() => handleAddExercise(dayIdx)}
                    style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '10px', padding: '4px 8px' }}
                  >
                    + Add Exercise
                  </button>
                </div>

                {/* Exercises list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {day.exercises.map((ex, exIdx) => {
                    return (
                      <div
                        key={exIdx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                          gap: '8px',
                          alignItems: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.25)',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <select
                          disabled={isNutritionist}
                          value={ex.exerciseId}
                          onChange={(e) => {
                            const updated = [...days];
                            if (updated[dayIdx]?.exercises[exIdx]) {
                              updated[dayIdx]!.exercises[exIdx]!.exerciseId = e.target.value;
                              setDays(updated);
                            }
                          }}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                            color: STITCH_THEME.colors.textPrimary,
                            borderRadius: '4px',
                            padding: '4px',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          {BUILTIN_EXERCISES.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.muscle})
                            </option>
                          ))}
                        </select>

                        <div>
                          <span style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted }}>Sets: </span>
                          <input
                            type="number"
                            disabled={isNutritionist}
                            value={ex.targetSets}
                            onChange={(e) => {
                              const updated = [...days];
                              if (updated[dayIdx]?.exercises[exIdx]) {
                                updated[dayIdx]!.exercises[exIdx]!.targetSets = parseInt(e.target.value) || 1;
                                setDays(updated);
                              }
                            }}
                            min={1}
                            max={10}
                            style={{ width: '40px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', borderRadius: '3px', padding: '2px 4px' }}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted }}>Reps: </span>
                          <input
                            type="number"
                            disabled={isNutritionist}
                            value={ex.targetReps}
                            onChange={(e) => {
                              const updated = [...days];
                              if (updated[dayIdx]?.exercises[exIdx]) {
                                updated[dayIdx]!.exercises[exIdx]!.targetReps = parseInt(e.target.value) || 1;
                                setDays(updated);
                              }
                            }}
                            min={1}
                            max={100}
                            style={{ width: '40px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', borderRadius: '3px', padding: '2px 4px' }}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted }}>Rest: </span>
                          <input
                            type="number"
                            disabled={isNutritionist}
                            value={ex.restSeconds}
                            onChange={(e) => {
                              const updated = [...days];
                              if (updated[dayIdx]?.exercises[exIdx]) {
                                updated[dayIdx]!.exercises[exIdx]!.restSeconds = parseInt(e.target.value) || 0;
                                setDays(updated);
                              }
                            }}
                            min={0}
                            max={300}
                            style={{ width: '45px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', borderRadius: '3px', padding: '2px 4px' }}
                          />
                          <span style={{ fontSize: '9px', color: STITCH_THEME.colors.textMuted }}>s</span>
                        </div>

                        <div>
                          <span style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted }}>RPE: </span>
                          <input
                            type="number"
                            disabled={isNutritionist}
                            value={ex.targetRpe}
                            onChange={(e) => {
                              const updated = [...days];
                              if (updated[dayIdx]?.exercises[exIdx]) {
                                updated[dayIdx]!.exercises[exIdx]!.targetRpe = parseFloat(e.target.value) || 7;
                                setDays(updated);
                              }
                            }}
                            min={5}
                            max={10}
                            step={0.5}
                            style={{ width: '40px', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#F8FAFC', borderRadius: '3px', padding: '2px 4px' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button
            disabled={isNutritionist}
            onClick={() => handleSubmit(ProgramStatus.DRAFT)}
            style={STITCH_THEME.styles.secondaryButton}
          >
            Save as Draft
          </button>
          <button
            disabled={isNutritionist}
            onClick={() => handleSubmit(ProgramStatus.PUBLISHED)}
            style={STITCH_THEME.styles.primaryButton}
          >
            Publish Program
          </button>
        </div>
      </div>
    </div>
  );
};
