import React, { useState, useEffect } from 'react';
import { IStandaloneWorkoutTemplate, IEnterpriseExercise, UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface WorkoutManagementViewProps {
  currentRole: UserRole;
}

export const WorkoutManagementView: React.FC<WorkoutManagementViewProps> = ({ currentRole: _currentRole }) => {
  const [templates, setTemplates] = useState<IStandaloneWorkoutTemplate[]>([]);
  const [availableExercises, setAvailableExercises] = useState<IEnterpriseExercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<IStandaloneWorkoutTemplate> | null>(null);

  // Exercise selection state inside builder
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [newTargetSets, setNewTargetSets] = useState(3);
  const [newTargetReps, setNewTargetReps] = useState(10);
  const [newTargetRpe, setNewTargetRpe] = useState(8);
  const [newRestSeconds, setNewRestSeconds] = useState(90);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('/api/v1/workouts/templates', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load templates');
      const data = await res.json();
      setTemplates(data);
    } catch {
      // Fallback templates
      setTemplates([
        {
          id: 'tpl_push_hypertrophy',
          name: 'Push Power & Hypertrophy',
          category: 'Push',
          difficulty: 'INTERMEDIATE',
          durationMinutes: 65,
          estimatedMinutes: 65,
          notes: 'Focused on chest, front/side delts, and triceps volume with progressive overload.',
          exercises: [
            { id: 'te_1', exerciseId: 'ex_bench_press', exerciseName: 'Barbell Bench Press', orderIndex: 0, targetSets: 4, targetReps: 8, targetRpe: 8.5, restSeconds: 120 },
            { id: 'te_2', exerciseId: 'ex_incline_db_press', exerciseName: 'Incline Dumbbell Press', orderIndex: 1, targetSets: 3, targetReps: 10, targetRpe: 8, restSeconds: 90 },
            { id: 'te_3', exerciseId: 'ex_cable_flyes', exerciseName: 'Cable Chest Flyes', orderIndex: 2, targetSets: 3, targetReps: 15, targetRpe: 7.5, restSeconds: 60 },
          ],
        },
        {
          id: 'tpl_pull_density',
          name: 'Pull Heavy Density',
          category: 'Pull',
          difficulty: 'ADVANCED',
          durationMinutes: 70,
          estimatedMinutes: 70,
          notes: 'Vertical and horizontal pulling to develop dense lats, traps, and peak biceps.',
          exercises: [
            { id: 'te_4', exerciseId: 'ex_pullups', exerciseName: 'Pull-up', orderIndex: 0, targetSets: 4, targetReps: 8, targetRpe: 8.5, restSeconds: 120 },
            { id: 'te_5', exerciseId: 'ex_barbell_row', exerciseName: 'Barbell Bent-Over Row', orderIndex: 1, targetSets: 4, targetReps: 10, targetRpe: 8, restSeconds: 90 },
            { id: 'te_6', exerciseId: 'ex_bicep_curl', exerciseName: 'Barbell Bicep Curl', orderIndex: 2, targetSets: 3, targetReps: 12, targetRpe: 8, restSeconds: 60 },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('/api/v1/workouts/exercises', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableExercises(data);
      }
    } catch {
      // Fallback exercises
      setAvailableExercises([
        { id: 'ex_bench_press', name: 'Barbell Bench Press', primaryMuscle: 'Chest', equipment: 'Barbell' } as any,
        { id: 'ex_incline_db_press', name: 'Incline Dumbbell Press', primaryMuscle: 'Chest', equipment: 'Dumbbell' } as any,
        { id: 'ex_squats', name: 'Barbell Back Squat', primaryMuscle: 'Legs', equipment: 'Barbell' } as any,
        { id: 'ex_rdl', name: 'Romanian Deadlift', primaryMuscle: 'Legs', equipment: 'Barbell' } as any,
        { id: 'ex_pullups', name: 'Pull-up', primaryMuscle: 'Back', equipment: 'Bodyweight' } as any,
        { id: 'ex_barbell_row', name: 'Barbell Bent-Over Row', primaryMuscle: 'Back', equipment: 'Barbell' } as any,
        { id: 'ex_ohp', name: 'Standing Overhead Press', primaryMuscle: 'Shoulders', equipment: 'Barbell' } as any,
      ]);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchExercises();
  }, []);

  const handleOpenCreate = () => {
    setEditingTemplate({
      name: '',
      category: 'Push',
      difficulty: 'INTERMEDIATE',
      estimatedMinutes: 60,
      notes: '',
      exercises: [],
    });
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (tpl: IStandaloneWorkoutTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
    setIsBuilderOpen(true);
  };

  const handleAddExerciseToTemplate = () => {
    if (!selectedExerciseId || !editingTemplate) return;
    const ex = availableExercises.find((e) => e.id === selectedExerciseId);
    if (!ex) return;

    const newEx = {
      id: `te_${Date.now()}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      orderIndex: editingTemplate.exercises ? editingTemplate.exercises.length : 0,
      targetSets: newTargetSets,
      targetReps: newTargetReps,
      targetRpe: newTargetRpe,
      restSeconds: newRestSeconds,
    };

    setEditingTemplate({
      ...editingTemplate,
      exercises: [...(editingTemplate.exercises || []), newEx],
    });

    setSelectedExerciseId('');
  };

  const handleRemoveExercise = (idx: number) => {
    if (!editingTemplate || !editingTemplate.exercises) return;
    const updated = [...editingTemplate.exercises];
    updated.splice(idx, 1);
    setEditingTemplate({ ...editingTemplate, exercises: updated });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.name) return;

    try {
      const token = localStorage.getItem('alpha_auth_token');
      const isEdit = !!editingTemplate.id;
      const url = isEdit
        ? `/api/v1/workouts/templates/${editingTemplate.id}`
        : '/api/v1/workouts/templates';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTemplate),
      });

      if (!res.ok) throw new Error('Failed to save template');
      setIsBuilderOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch {
      // Local optimistic update
      if (editingTemplate.id) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? { ...t, ...editingTemplate } as IStandaloneWorkoutTemplate : t)),
        );
      } else {
        const newTpl: IStandaloneWorkoutTemplate = {
          ...editingTemplate,
          id: `tpl_${Date.now()}`,
          name: editingTemplate.name || 'Custom Workout',
          difficulty: editingTemplate.difficulty || 'INTERMEDIATE',
          durationMinutes: editingTemplate.durationMinutes || editingTemplate.estimatedMinutes || 60,
          estimatedMinutes: editingTemplate.estimatedMinutes || 60,
          exercises: editingTemplate.exercises || [],
        };
        setTemplates((prev) => [newTpl, ...prev]);
      }
      setIsBuilderOpen(false);
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout template?')) return;
    try {
      const token = localStorage.getItem('alpha_auth_token');
      await fetch(`/api/v1/workouts/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTemplates();
    } catch {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Workout Templates
          </h1>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
            Modular session templates, prescribed sets, reps, and RPE targets.
          </p>
        </div>
        <button onClick={handleOpenCreate} style={STITCH_THEME.styles.primaryButton}>
          + Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '13px' }}>
          Loading standalone workout templates...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {templates.map((tpl) => (
          <div
            key={tpl.id}
            style={{
              ...STITCH_THEME.styles.glassCard,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: STITCH_THEME.typography.fontMono,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 240, 255, 0.12)',
                    color: STITCH_THEME.colors.accentCyan,
                    fontWeight: 700,
                  }}
                >
                  {tpl.category || 'Hypertrophy'} • {tpl.difficulty || 'INTERMEDIATE'}
                </span>
                <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                  {tpl.estimatedMinutes || 60} min
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '8px 0', color: STITCH_THEME.colors.textPrimary }}>
                {tpl.name}
              </h3>

              {tpl.notes && (
                <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  {tpl.notes}
                </p>
              )}

              {/* Exercises List inside template */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Prescriptions ({tpl.exercises.length} Exercises)
                </div>
                {tpl.exercises.map((ex, idx) => (
                  <div
                    key={ex.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                      {idx + 1}. {ex.exerciseName}
                    </span>
                    <span style={{ fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan }}>
                      {ex.targetSets} sets × {ex.targetReps} reps {ex.targetRpe ? `@ RPE ${ex.targetRpe}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              }}
            >
              <button
                onClick={() => handleOpenEdit(tpl)}
                style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '11px', padding: '5px 12px' }}
              >
                Edit Template
              </button>
              <button
                onClick={() => handleDeleteTemplate(tpl.id)}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  fontSize: '11px',
                  padding: '5px 12px',
                  color: STITCH_THEME.colors.accentRose,
                  borderColor: 'rgba(255, 0, 85, 0.3)',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Visual Workout Builder Modal */}
      {isBuilderOpen && editingTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleSaveTemplate}
            style={{
              ...STITCH_THEME.styles.glassCard,
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan, fontWeight: 700 }}>
                  VISUAL WORKOUT BUILDER
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                  {editingTemplate.id ? 'Edit Workout Template' : 'Create Workout Template'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                style={{ background: 'none', border: 'none', color: STITCH_THEME.colors.textMuted, fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Template Core Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upper Body Volume Power"
                  value={editingTemplate.name || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={editingTemplate.category || 'Push'}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                >
                  <option value="Push">Push</option>
                  <option value="Pull">Pull</option>
                  <option value="Legs">Legs</option>
                  <option value="Upper">Upper Body</option>
                  <option value="Lower">Lower Body</option>
                  <option value="Full Body">Full Body</option>
                  <option value="Cardio">Cardio / Conditioning</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Est. Minutes
                </label>
                <input
                  type="number"
                  value={editingTemplate.estimatedMinutes || 60}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, estimatedMinutes: parseInt(e.target.value, 10) })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Coach Session Notes
              </label>
              <textarea
                rows={2}
                placeholder="Session objectives, intensity goals, or deload guidelines..."
                value={editingTemplate.notes || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, notes: e.target.value })}
                style={{ ...STITCH_THEME.styles.input, width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Exercise Prescriptions Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                  Exercise Prescriptions ({editingTemplate.exercises?.length || 0})
                </h4>
                <span style={{ fontSize: '11px', color: STITCH_THEME.colors.accentCyan }}>
                  Target vs Actual Separation Active
                </span>
              </div>

              {/* Add Exercise Selector Bar */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 240, 255, 0.04)',
                  border: `1px solid rgba(0, 240, 255, 0.15)`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label style={{ fontSize: '11px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Select Exercise to Add
                  </label>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    style={{ ...STITCH_THEME.styles.input, width: '100%', fontSize: '12px' }}
                  >
                    <option value="">Choose an exercise from library...</option>
                    {availableExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.primaryMuscle} • {ex.equipment})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, display: 'block', marginBottom: '2px' }}>
                      Target Sets
                    </label>
                    <input
                      type="number"
                      value={newTargetSets}
                      onChange={(e) => setNewTargetSets(parseInt(e.target.value, 10))}
                      style={{ ...STITCH_THEME.styles.input, width: '100%', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, display: 'block', marginBottom: '2px' }}>
                      Target Reps
                    </label>
                    <input
                      type="number"
                      value={newTargetReps}
                      onChange={(e) => setNewTargetReps(parseInt(e.target.value, 10))}
                      style={{ ...STITCH_THEME.styles.input, width: '100%', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, display: 'block', marginBottom: '2px' }}>
                      Target RPE
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newTargetRpe}
                      onChange={(e) => setNewTargetRpe(parseFloat(e.target.value))}
                      style={{ ...STITCH_THEME.styles.input, width: '100%', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, display: 'block', marginBottom: '2px' }}>
                      Rest (sec)
                    </label>
                    <input
                      type="number"
                      value={newRestSeconds}
                      onChange={(e) => setNewRestSeconds(parseInt(e.target.value, 10))}
                      style={{ ...STITCH_THEME.styles.input, width: '100%', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedExerciseId}
                  onClick={handleAddExerciseToTemplate}
                  style={{
                    ...STITCH_THEME.styles.primaryButton,
                    fontSize: '12px',
                    padding: '8px',
                    opacity: selectedExerciseId ? 1 : 0.5,
                  }}
                >
                  + Add to Prescription List
                </button>
              </div>

              {/* Added exercises table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editingTemplate.exercises && editingTemplate.exercises.length > 0 ? (
                  editingTemplate.exercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '6px',
                        border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: STITCH_THEME.colors.textPrimary, marginRight: '8px' }}>
                          {idx + 1}. {ex.exerciseName}
                        </span>
                        <span style={{ fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan, fontSize: '12px' }}>
                          {ex.targetSets} sets × {ex.targetReps} reps @ RPE {ex.targetRpe || 8} ({ex.restSeconds}s rest)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: STITCH_THEME.colors.accentRose,
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '12px' }}>
                    No exercises added yet. Use the exercise selector above to add movements.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                style={STITCH_THEME.styles.secondaryButton}
              >
                Cancel
              </button>
              <button type="submit" style={STITCH_THEME.styles.primaryButton}>
                Save Workout Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
