import React, { useState, useEffect } from 'react';
import { IEnterpriseExercise, UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface ExerciseManagementViewProps {
  currentRole: UserRole;
}

export const ExerciseManagementView: React.FC<ExerciseManagementViewProps> = ({ currentRole: _currentRole }) => {
  const [exercises, setExercises] = useState<IEnterpriseExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedMovementPattern, setSelectedMovementPattern] = useState('');
  const [selectedExerciseType, setSelectedExerciseType] = useState('');

  // Selected exercise for detail dossier modal
  const [activeDossierExercise, setActiveDossierExercise] = useState<IEnterpriseExercise | null>(null);

  // Form modal state (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Partial<IEnterpriseExercise> | null>(null);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('alpha_auth_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedMuscle) params.append('muscle', selectedMuscle);
      if (selectedEquipment) params.append('equipment', selectedEquipment);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedMovementPattern) params.append('movementPattern', selectedMovementPattern);
      if (selectedExerciseType) params.append('exerciseType', selectedExerciseType);

      const res = await fetch(`/api/v1/workouts/exercises?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load exercises');
      const data = await res.json();
      setExercises(data);
    } catch {
      // Fallback local exercises
      setExercises([
        {
          id: 'ex_bench_press',
          name: 'Barbell Bench Press',
          category: 'Compound',
          primaryMuscle: 'Chest',
          secondaryMuscles: ['Triceps', 'Shoulders'],
          equipment: 'Barbell',
          difficulty: 'INTERMEDIATE',
          targetArea: 'Middle & Lower Pectoralis',
          movementPattern: 'PUSH',
          exerciseType: 'HYPERTROPHY',
          description: 'Foundational horizontal pressing exercise maximizing pec activation and triceps mechanical tension.',
          technique: 'Lie flat on bench, retract scapulae, lower barbell to mid-sternum under control, drive feet into the floor.',
          commonMistakes: ['Bouncing bar off chest', 'Flaring elbows past 90 degrees', 'Lifting hips off the bench'],
          safetyNotes: 'Always use collars or a spotter on maximum load attempts. Keep wrists stacked directly above forearms.',
          tempo: '3-0-1-0',
          defaultRest: 120,
          status: 'ACTIVE',
        },
        {
          id: 'ex_incline_db_press',
          name: 'Incline Dumbbell Press',
          category: 'Compound',
          primaryMuscle: 'Chest',
          secondaryMuscles: ['Shoulders', 'Triceps'],
          equipment: 'Dumbbell',
          difficulty: 'INTERMEDIATE',
          targetArea: 'Clavicular Head (Upper Chest)',
          movementPattern: 'PUSH',
          exerciseType: 'HYPERTROPHY',
          description: 'Incline bench dumbbell press targeting clavicular pectoral fibers with greater range of motion.',
          technique: 'Set bench to 30 degrees. Press dumbbells upward converging at top without touching. Control eccentric to armpit level.',
          commonMistakes: ['Bench angle set too steep (>45 deg shifting to delts)', 'Incomplete stretch at bottom'],
          safetyNotes: 'Kick dumbbells up with knees into position. Never drop weights directly to sides when fatigued.',
          tempo: '3-1-1-0',
          defaultRest: 90,
          status: 'ACTIVE',
        },
        {
          id: 'ex_squats',
          name: 'Barbell Back Squat',
          category: 'Compound',
          primaryMuscle: 'Legs',
          secondaryMuscles: ['Glutes', 'Calves', 'Core'],
          equipment: 'Barbell',
          difficulty: 'ADVANCED',
          targetArea: 'Quadriceps, Adductors & Gluteus Maximus',
          movementPattern: 'SQUAT',
          exerciseType: 'STRENGTH',
          description: 'The king of lower body development. Engages whole body musculature and neuromuscular drive.',
          technique: 'Bar rested on upper traps. Descend until hip crease is below top of knees while keeping spine neutral.',
          commonMistakes: ['Knee valgus collapse', 'Heels lifting off ground', 'Excessive forward chest lean'],
          safetyNotes: 'Set safety pins at appropriate depth in power rack. Breathe into abdomen to brace intra-abdominal pressure.',
          tempo: '3-1-1-0',
          defaultRest: 150,
          status: 'ACTIVE',
        },
        {
          id: 'ex_pullups',
          name: 'Pull-up',
          category: 'Compound',
          primaryMuscle: 'Back',
          secondaryMuscles: ['Biceps', 'Forearms'],
          equipment: 'Bodyweight',
          difficulty: 'INTERMEDIATE',
          targetArea: 'Latissimus Dorsi & Teres Major',
          movementPattern: 'PULL',
          exerciseType: 'STRENGTH',
          description: 'Elite vertical pull developing lat width, scapular depression, and grip power.',
          technique: 'Overhand grip slightly wider than shoulders. Pull chest towards bar while driving elbows down into back pockets.',
          commonMistakes: ['Kipping or swinging legs', 'Partial range of motion at bottom'],
          safetyNotes: 'Control the descent completely to protect shoulder labrum.',
          tempo: '2-1-1-0',
          defaultRest: 90,
          status: 'ACTIVE',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [search, selectedMuscle, selectedEquipment, selectedDifficulty, selectedMovementPattern, selectedExerciseType]);

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise?.name || !editingExercise?.primaryMuscle) return;

    try {
      const token = localStorage.getItem('alpha_auth_token');
      const isEdit = !!editingExercise.id;
      const url = isEdit
        ? `/api/v1/workouts/exercises/${editingExercise.id}`
        : '/api/v1/workouts/exercises';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingExercise),
      });

      if (!res.ok) throw new Error('Failed to save exercise');
      setIsFormModalOpen(false);
      setEditingExercise(null);
      fetchExercises();
    } catch {
      // Local optimistic update
      if (editingExercise.id) {
        setExercises((prev) =>
          prev.map((ex) => (ex.id === editingExercise.id ? { ...ex, ...editingExercise } as IEnterpriseExercise : ex)),
        );
      } else {
        const newEx: IEnterpriseExercise = {
          ...editingExercise,
          id: `ex_${Date.now()}`,
          category: editingExercise.category || 'Compound',
          primaryMuscle: editingExercise.primaryMuscle || 'Chest',
          secondaryMuscles: editingExercise.secondaryMuscles || [],
          equipment: editingExercise.equipment || 'Barbell',
          difficulty: editingExercise.difficulty || 'INTERMEDIATE',
          status: 'ACTIVE',
        } as IEnterpriseExercise;
        setExercises((prev) => [newEx, ...prev]);
      }
      setIsFormModalOpen(false);
      setEditingExercise(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this exercise?')) return;
    try {
      const token = localStorage.getItem('alpha_auth_token');
      await fetch(`/api/v1/workouts/exercises/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExercises();
    } catch {
      setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, status: 'ARCHIVED' } : ex)));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Exercise Library
          </h1>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
            Verified biomechanics, movement patterns, anatomical targets, and safety standards.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExercise({
              name: '',
              category: 'Compound',
              primaryMuscle: 'Chest',
              secondaryMuscles: [],
              equipment: 'Barbell',
              difficulty: 'INTERMEDIATE',
              movementPattern: 'PUSH',
              exerciseType: 'HYPERTROPHY',
              tempo: '3-0-1-0',
              defaultRest: 90,
              status: 'ACTIVE',
            });
            setIsFormModalOpen(true);
          }}
          style={STITCH_THEME.styles.primaryButton}
        >
          + Add Exercise
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search by exercise name, target area, muscle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...STITCH_THEME.styles.input,
            flex: '1 1 240px',
            minWidth: '220px',
            fontSize: '13px',
            padding: '8px 12px',
          }}
        />

        {/* Muscle Filter */}
        <select
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value)}
          style={{ ...STITCH_THEME.styles.input, width: 'auto', fontSize: '12px', padding: '8px 12px' }}
        >
          <option value="">All Muscles</option>
          <option value="Chest">Chest</option>
          <option value="Back">Back</option>
          <option value="Legs">Legs</option>
          <option value="Shoulders">Shoulders</option>
          <option value="Triceps">Triceps</option>
          <option value="Biceps">Biceps</option>
          <option value="Abs">Abs / Core</option>
        </select>

        {/* Equipment Filter */}
        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value)}
          style={{ ...STITCH_THEME.styles.input, width: 'auto', fontSize: '12px', padding: '8px 12px' }}
        >
          <option value="">All Equipment</option>
          <option value="Barbell">Barbell</option>
          <option value="Dumbbell">Dumbbell</option>
          <option value="Cable">Cable</option>
          <option value="Bodyweight">Bodyweight</option>
          <option value="Machine">Machine</option>
        </select>

        {/* Movement Pattern */}
        <select
          value={selectedMovementPattern}
          onChange={(e) => setSelectedMovementPattern(e.target.value)}
          style={{ ...STITCH_THEME.styles.input, width: 'auto', fontSize: '12px', padding: '8px 12px' }}
        >
          <option value="">All Patterns</option>
          <option value="PUSH">Push</option>
          <option value="PULL">Pull</option>
          <option value="SQUAT">Squat</option>
          <option value="HINGE">Hinge</option>
          <option value="ISOLATION">Isolation</option>
        </select>

        {/* Difficulty */}
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          style={{ ...STITCH_THEME.styles.input, width: 'auto', fontSize: '12px', padding: '8px 12px' }}
        >
          <option value="">All Difficulties</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>

        {/* Exercise Type */}
        <select
          value={selectedExerciseType}
          onChange={(e) => setSelectedExerciseType(e.target.value)}
          style={{ ...STITCH_THEME.styles.input, width: 'auto', fontSize: '12px', padding: '8px 12px' }}
        >
          <option value="">All Types</option>
          <option value="STRENGTH">Strength</option>
          <option value="HYPERTROPHY">Hypertrophy</option>
          <option value="ENDURANCE">Endurance</option>
          <option value="MOBILITY">Mobility</option>
        </select>

        {(search || selectedMuscle || selectedEquipment || selectedMovementPattern || selectedDifficulty || selectedExerciseType) && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedMuscle('');
              setSelectedEquipment('');
              setSelectedMovementPattern('');
              setSelectedDifficulty('');
              setSelectedExerciseType('');
            }}
            style={{
              ...STITCH_THEME.styles.secondaryButton,
              fontSize: '11px',
              padding: '6px 12px',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '13px' }}>
          Loading biomechanical exercises...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {exercises.map((ex) => (
          <div
            key={ex.id}
            style={{
              ...STITCH_THEME.styles.glassCard,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              transition: 'border-color 0.15s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: STITCH_THEME.typography.fontMono,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 240, 255, 0.12)',
                    color: STITCH_THEME.colors.accentCyan,
                    fontWeight: 700,
                  }}
                >
                  {ex.movementPattern || ex.category}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color:
                      ex.difficulty === 'ADVANCED'
                        ? STITCH_THEME.colors.accentRose
                        : ex.difficulty === 'INTERMEDIATE'
                        ? STITCH_THEME.colors.accentAmber
                        : STITCH_THEME.colors.accentEmerald,
                  }}
                >
                  {ex.difficulty}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '6px 0', color: STITCH_THEME.colors.textPrimary }}>
                {ex.name}
              </h3>

              <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, marginBottom: '8px' }}>
                <strong style={{ color: STITCH_THEME.colors.textPrimary }}>{ex.targetArea || ex.primaryMuscle}</strong> · {ex.equipment}
              </div>

              {ex.description && (
                <p
                  style={{
                    fontSize: '12px',
                    color: STITCH_THEME.colors.textMuted,
                    lineHeight: 1.4,
                    margin: '0 0 12px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ex.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {ex.tempo && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: STITCH_THEME.typography.fontMono,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      color: STITCH_THEME.colors.textSecondary,
                    }}
                  >
                    Tempo: {ex.tempo}
                  </span>
                )}
                {ex.defaultRest && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: STITCH_THEME.typography.fontMono,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      color: STITCH_THEME.colors.textSecondary,
                    }}
                  >
                    Rest: {ex.defaultRest}s
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              }}
            >
              <button
                onClick={() => setActiveDossierExercise(ex)}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderColor: STITCH_THEME.colors.accentCyan,
                  color: STITCH_THEME.colors.accentCyan,
                }}
              >
                View Details
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    setEditingExercise(ex);
                    setIsFormModalOpen(true);
                  }}
                  style={{
                    ...STITCH_THEME.styles.secondaryButton,
                    fontSize: '11px',
                    padding: '4px 8px',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleArchive(ex.id)}
                  style={{
                    ...STITCH_THEME.styles.secondaryButton,
                    fontSize: '11px',
                    padding: '4px 8px',
                    color: STITCH_THEME.colors.accentRose,
                  }}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Exercise Detail Coaching Dossier Modal */}
      {activeDossierExercise && (
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
          <div
            style={{
              ...STITCH_THEME.styles.glassCard,
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: STITCH_THEME.typography.fontMono,
                    color: STITCH_THEME.colors.accentCyan,
                    fontWeight: 700,
                  }}
                >
                  BIOMECHANICS DOSSIER • {activeDossierExercise.movementPattern || 'EXERCISE'}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0 0' }}>
                  {activeDossierExercise.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveDossierExercise(null)}
                style={{ background: 'none', border: 'none', color: STITCH_THEME.colors.textMuted, fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Specs Pill Row */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: STITCH_THEME.colors.textMuted }}>Target: </span>
                <strong>{activeDossierExercise.targetArea || activeDossierExercise.primaryMuscle}</strong>
              </div>
              <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: STITCH_THEME.colors.textMuted }}>Equipment: </span>
                <strong>{activeDossierExercise.equipment}</strong>
              </div>
              <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: STITCH_THEME.colors.textMuted }}>Tempo: </span>
                <strong style={{ fontFamily: STITCH_THEME.typography.fontMono }}>{activeDossierExercise.tempo || '3-0-1-0'}</strong>
              </div>
              <div style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                <span style={{ color: STITCH_THEME.colors.textMuted }}>Default Rest: </span>
                <strong style={{ fontFamily: STITCH_THEME.typography.fontMono }}>{activeDossierExercise.defaultRest || 90}s</strong>
              </div>
            </div>

            {/* Execution Technique */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0', color: STITCH_THEME.colors.accentCyan }}>
                Execution Technique
              </h4>
              <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, lineHeight: 1.5, margin: 0 }}>
                {activeDossierExercise.technique || activeDossierExercise.description || 'Standard form execution required.'}
              </p>
            </div>

            {/* Common Coaching Flaws */}
            {Boolean(activeDossierExercise.commonMistakes) && (
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: STITCH_THEME.colors.accentAmber }}>
                  Common Biomechanical Mistakes
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: STITCH_THEME.colors.textSecondary, lineHeight: 1.6 }}>
                  {(Array.isArray(activeDossierExercise.commonMistakes)
                    ? (activeDossierExercise.commonMistakes as string[])
                    : (activeDossierExercise.commonMistakes as string).split('\n').filter(Boolean)
                  ).map((m: string, i: number) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Safety & Contraindications */}
            {activeDossierExercise.safetyNotes && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 170, 0, 0.08)',
                  border: `1px solid rgba(255, 170, 0, 0.25)`,
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px 0', color: STITCH_THEME.colors.accentAmber }}>
                  Safety & Contraindications
                </h4>
                <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: 0, lineHeight: 1.4 }}>
                  {activeDossierExercise.safetyNotes}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={() => setActiveDossierExercise(null)} style={STITCH_THEME.styles.secondaryButton}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Exercise Form Modal */}
      {isFormModalOpen && editingExercise && (
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
            onSubmit={handleSaveExercise}
            style={{
              ...STITCH_THEME.styles.glassCard,
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                {editingExercise.id ? 'Edit Exercise' : 'Create Biomechanical Exercise'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                style={{ background: 'none', border: 'none', color: STITCH_THEME.colors.textMuted, fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Exercise Name *
              </label>
              <input
                type="text"
                required
                value={editingExercise.name || ''}
                onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                placeholder="e.g. Incline Dumbbell Press"
                style={{ ...STITCH_THEME.styles.input, width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Primary Muscle *
                </label>
                <select
                  value={editingExercise.primaryMuscle || 'Chest'}
                  onChange={(e) => setEditingExercise({ ...editingExercise, primaryMuscle: e.target.value })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                >
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Legs">Legs</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Triceps">Triceps</option>
                  <option value="Biceps">Biceps</option>
                  <option value="Abs">Abs</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Equipment *
                </label>
                <select
                  value={editingExercise.equipment || 'Barbell'}
                  onChange={(e) => setEditingExercise({ ...editingExercise, equipment: e.target.value })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                >
                  <option value="Barbell">Barbell</option>
                  <option value="Dumbbell">Dumbbell</option>
                  <option value="Cable">Cable</option>
                  <option value="Bodyweight">Bodyweight</option>
                  <option value="Machine">Machine</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Movement Pattern
                </label>
                <select
                  value={editingExercise.movementPattern || 'PUSH'}
                  onChange={(e) => setEditingExercise({ ...editingExercise, movementPattern: e.target.value })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                >
                  <option value="PUSH">Push</option>
                  <option value="PULL">Pull</option>
                  <option value="SQUAT">Squat</option>
                  <option value="HINGE">Hinge</option>
                  <option value="ISOLATION">Isolation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Difficulty
                </label>
                <select
                  value={editingExercise.difficulty || 'INTERMEDIATE'}
                  onChange={(e) => setEditingExercise({ ...editingExercise, difficulty: e.target.value as any })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Default Rest (sec)
                </label>
                <input
                  type="number"
                  value={editingExercise.defaultRest || 90}
                  onChange={(e) => setEditingExercise({ ...editingExercise, defaultRest: parseInt(e.target.value, 10) })}
                  style={{ ...STITCH_THEME.styles.input, width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Target Anatomical Area
              </label>
              <input
                type="text"
                value={editingExercise.targetArea || ''}
                onChange={(e) => setEditingExercise({ ...editingExercise, targetArea: e.target.value })}
                placeholder="e.g. Clavicular Head (Upper Chest)"
                style={{ ...STITCH_THEME.styles.input, width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Execution Technique Instructions
              </label>
              <textarea
                rows={3}
                value={editingExercise.technique || ''}
                onChange={(e) => setEditingExercise({ ...editingExercise, technique: e.target.value })}
                placeholder="Describe setup, eccentric cadence, grip width, and drive phase..."
                style={{ ...STITCH_THEME.styles.input, width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Safety Notes & Contraindications
              </label>
              <textarea
                rows={2}
                value={editingExercise.safetyNotes || ''}
                onChange={(e) => setEditingExercise({ ...editingExercise, safetyNotes: e.target.value })}
                placeholder="e.g. Avoid excessive elbow flare. Use spotter for maximum loads."
                style={{ ...STITCH_THEME.styles.input, width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                style={STITCH_THEME.styles.secondaryButton}
              >
                Cancel
              </button>
              <button type="submit" style={STITCH_THEME.styles.primaryButton}>
                Save Exercise
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
