export type ExerciseCategory =
  | 'squat'
  | 'bench'
  | 'overhead'
  | 'deadlift'
  | 'row'
  | 'arms'
  | 'core'
  | 'accessories';

export type EquipmentType = 'barbell' | 'dumbbell' | 'bodyweight' | 'cable';

export interface ExerciseGuide {
  setup: string[];
  execution: string[];
  cues: string[];
  commonMistakes: string[];
  dumbbellTip?: string;
  setupSv: string[];
  executionSv: string[];
  cuesSv: string[];
  commonMistakesSv: string[];
  dumbbellTipSv?: string;
}

export interface Exercise {
  id: string;
  name: string;
  nameSv: string;
  category: ExerciseCategory;
  equipment: EquipmentType;
  primaryMuscles: string;
  primaryMusclesSv: string;
  barbellWeightKg: number; // 20 for standard bar, 0 for dumbbells
  weightIncrementKg: number; // 2.5kg standard, 5.0kg for deadlift
  defaultSetsReps: string; // "5x5", "1x5", "3x8"
  alternatives: string[]; // IDs of swap alternatives (e.g. barbell vs dumbbell)
  guide: ExerciseGuide;
}

export interface WorkoutSet {
  setIndex: number;
  targetReps: number;
  actualReps: number | null;
  weightKg: number;
  isCompleted: boolean;
  isWarmup?: boolean;
}

export interface WorkoutExerciseState {
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
  restSeconds?: number;
}

export interface ProgramWorkoutTemplate {
  id: string;
  name: string;
  nameSv: string;
  dayTag: string; // "A", "B", "Push", "Pull", etc.
  exerciseIds: string[];
  targetSets: number;
  targetReps: number;
  customSetOverrides?: Record<string, { sets: number; reps: number }>; // e.g. deadlift 1x5
}

export interface Program {
  id: string;
  name: string;
  nameSv: string;
  description: string;
  descriptionSv: string;
  isCustom?: boolean;
  cycleType: 'ab_alternating' | 'linear_split';
  workouts: ProgramWorkoutTemplate[];
}

export interface WorkoutSessionLog {
  id: string;
  programId: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  exercises: WorkoutExerciseState[];
  totalVolumeKg: number;
  prsAchieved: { exerciseId: string; weightKg: number; reps: number; label: string }[];
  notes?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  isCloudSynced: boolean;
  activeProgramId: string;
  nextWorkoutIndex: number;
  restTimerSeconds: number;
  soundEnabled: boolean;
  unit: 'kg' | 'lbs';
}

export type Language = 'sv' | 'en';
