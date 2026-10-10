import { WorkoutSessionLog, Program, UserProfile } from '../types';
import { DEFAULT_PROGRAMS } from '../data/programs';
import { EXERCISE_CATALOG } from '../data/exercises';

const STORAGE_KEY_LOGS = 'styrka_logs_v1';
const STORAGE_KEY_PROGRAMS = 'styrka_custom_programs_v1';
const STORAGE_KEY_ACTIVE_PROGRAM = 'styrka_active_program_id_v1';
const STORAGE_KEY_PROFILE = 'styrka_user_profile_v1';

// Default guest profile
const DEFAULT_PROFILE: UserProfile = {
  id: 'guest',
  username: 'viktor',
  displayName: 'Viktor',
  isCloudSynced: false,
  activeProgramId: DEFAULT_PROGRAMS[0].id,
  nextWorkoutIndex: 0,
  restTimerSeconds: 120, // 2 minutes standard for 5x5
  soundEnabled: true,
  unit: 'kg',
};

// ==================== WORKOUT LOGS ====================

export function getWorkoutLogs(): WorkoutSessionLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveWorkoutLog(log: WorkoutSessionLog): void {
  try {
    const logs = getWorkoutLogs();
    const updated = [log, ...logs.filter((l) => l.id !== log.id)];
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));

    // If cloud synced, dispatch background sync
    syncToServerInBackground();
  } catch (e) {}
}

export function deleteWorkoutLog(id: string): void {
  try {
    const logs = getWorkoutLogs();
    const updated = logs.filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    syncToServerInBackground();
  } catch (e) {}
}

// ==================== PROGRAMS ====================

export function getAllPrograms(): Program[] {
  if (typeof window === 'undefined') return DEFAULT_PROGRAMS;
  try {
    const rawCustom = localStorage.getItem(STORAGE_KEY_PROGRAMS);
    const custom: Program[] = rawCustom ? JSON.parse(rawCustom) : [];
    return [...DEFAULT_PROGRAMS, ...custom];
  } catch (e) {}
  return DEFAULT_PROGRAMS;
}

export function getActiveProgramId(): string {
  if (typeof window === 'undefined') return DEFAULT_PROGRAMS[0].id;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PROGRAM);
    if (saved) return saved;
  } catch (e) {}
  return DEFAULT_PROGRAMS[0].id;
}

export function setActiveProgramId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROGRAM, id);
    const profile = getUserProfile();
    profile.activeProgramId = id;
    saveUserProfile(profile);
  } catch (e) {}
}

export function saveCustomProgram(program: Program): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRAMS);
    const current: Program[] = raw ? JSON.parse(raw) : [];
    const updated = [...current.filter((p) => p.id !== program.id), program];
    localStorage.setItem(STORAGE_KEY_PROGRAMS, JSON.stringify(updated));
    syncToServerInBackground();
  } catch (e) {}
}

// ==================== AUTOMATIC WORKOUT CYCLING ====================

export function getNextWorkoutIndex(program: Program): number {
  const logs = getWorkoutLogs();
  const programLogs = logs.filter((l) => l.programId === program.id);

  if (programLogs.length === 0) {
    return 0; // Start with Workout A (index 0)
  }

  // Find most recent log
  const lastLog = programLogs[0];
  const lastIndex = program.workouts.findIndex((w) => w.id === lastLog.workoutId);

  if (lastIndex === -1) return 0;

  // Cycle to next workout in sequence
  return (lastIndex + 1) % program.workouts.length;
}

// ==================== PROGRESSION & RECENT WEIGHTS ====================

export interface ExerciseHistoryInsight {
  lastWeightKg: number | null;
  suggestedWeightKg: number;
  allSetsHitLastTime: boolean;
  lastRepsSummary?: string;
  personalRecord1RMKg?: number;
}

export function getExerciseHistoryInsight(exerciseId: string): ExerciseHistoryInsight {
  const logs = getWorkoutLogs();
  const ex = EXERCISE_CATALOG.find((e) => e.id === exerciseId);
  const defaultIncrement = ex?.weightIncrementKg ?? 2.5;

  let lastWeight: number | null = null;
  let allSetsHit = false;
  let lastReps: string | undefined;
  let max1RM = 0;

  // Calculate 1RM across all logs
  for (const log of logs) {
    const exState = log.exercises.find((e) => e.exerciseId === exerciseId);
    if (exState) {
      // Find last weight from most recent log
      if (lastWeight === null && exState.sets.length > 0) {
        const completedSets = exState.sets.filter((s) => s.isCompleted);
        if (completedSets.length > 0) {
          lastWeight = completedSets[0].weightKg;
          allSetsHit = completedSets.every((s) => (s.actualReps ?? 0) >= s.targetReps);
          lastReps = completedSets.map((s) => s.actualReps ?? 0).join('/');
        }
      }

      // Check PRs
      for (const set of exState.sets) {
        if (set.isCompleted && (set.actualReps ?? 0) > 0) {
          const epley = set.weightKg * (1 + (set.actualReps ?? 0) / 30);
          if (epley > max1RM) max1RM = epley;
        }
      }
    }
  }

  // Starting weight defaults if brand new
  let defaultStart = 20; // empty Olympic bar
  if (exerciseId === 'deadlift') defaultStart = 40;
  else if (ex?.equipment === 'dumbbell') defaultStart = 10;
  else if (ex?.equipment === 'bodyweight') defaultStart = 0;

  let suggested = defaultStart;
  if (lastWeight !== null) {
    if (allSetsHit) {
      suggested = Number((lastWeight + defaultIncrement).toFixed(1));
    } else {
      suggested = lastWeight; // retry same weight
    }
  }

  return {
    lastWeightKg: lastWeight,
    suggestedWeightKg: suggested,
    allSetsHitLastTime: allSetsHit,
    lastRepsSummary: lastReps,
    personalRecord1RMKg: max1RM > 0 ? Math.round(max1RM) : undefined,
  };
}

// ==================== BARBELL PLATE CALCULATOR ====================

export interface PlateCalculation {
  barWeightKg: number;
  weightPerSideKg: number;
  platesPerSide: { weight: number; count: number }[];
  remainderKg: number;
}

export function calculateBarbellPlates(
  totalWeightKg: number,
  barWeightKg = 20,
  availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25]
): PlateCalculation {
  if (totalWeightKg < barWeightKg) {
    return { barWeightKg, weightPerSideKg: 0, platesPerSide: [], remainderKg: 0 };
  }

  let sideTarget = (totalWeightKg - barWeightKg) / 2;
  const platesPerSide: { weight: number; count: number }[] = [];

  for (const plate of availablePlates) {
    if (sideTarget >= plate) {
      const count = Math.floor(sideTarget / plate);
      platesPerSide.push({ weight: plate, count });
      sideTarget = Number((sideTarget - count * plate).toFixed(3));
    }
  }

  return {
    barWeightKg,
    weightPerSideKg: (totalWeightKg - barWeightKg) / 2,
    platesPerSide,
    remainderKg: sideTarget * 2,
  };
}

// ==================== USER PROFILE & CLOUD SYNC ====================

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    syncToServerInBackground();
  } catch (e) {}
}

export async function syncToServerInBackground(): Promise<void> {
  if (typeof window === 'undefined') return;
  const profile = getUserProfile();
  if (!profile.isCloudSynced || !profile.username) return;

  try {
    const logs = getWorkoutLogs();
    const programs = getAllPrograms().filter((p) => p.isCustom);

    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: profile.username,
        profile,
        logs,
        customPrograms: programs,
      }),
    });
  } catch (e) {
    // Silent fail in background, offline resilience
  }
}

export async function syncWithCloudServer(username: string, pin: string): Promise<boolean> {
  try {
    // 1. Authenticate / Register
    const authRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
    });

    if (!authRes.ok) return false;

    // 2. Pull server data
    const syncRes = await fetch(`/api/sync?username=${encodeURIComponent(username)}`);
    if (!syncRes.ok) return false;

    const data = await syncRes.json();

    // 3. Merge server logs with local logs
    const localLogs = getWorkoutLogs();
    const serverLogs: WorkoutSessionLog[] = data.logs || [];

    const map = new Map<string, WorkoutSessionLog>();
    serverLogs.forEach((l) => map.set(l.id, l));
    localLogs.forEach((l) => map.set(l.id, l)); // local overrides if duplicate

    const mergedLogs = Array.from(map.values()).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(mergedLogs));

    // Update profile
    const currentProfile = getUserProfile();
    const updatedProfile: UserProfile = {
      ...currentProfile,
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      isCloudSynced: true,
    };
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));

    // Push merged back
    await syncToServerInBackground();

    return true;
  } catch (e) {
    console.error('Cloud sync error:', e);
    return false;
  }
}
