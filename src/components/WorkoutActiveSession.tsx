import React, { useState, useEffect } from 'react';
import {
  Program,
  ProgramWorkoutTemplate,
  WorkoutExerciseState,
  WorkoutSet,
  WorkoutSessionLog,
  Exercise,
  Language,
  UserProfile,
} from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import {
  getExerciseHistoryInsight,
  saveWorkoutLog,
  getUserProfile,
  saveUserProfile,
} from '../utils/storage';
import { playIronClick, playWorkoutComplete, playClick } from '../utils/audio';
import confetti from 'canvas-confetti';
import { AddExerciseModal } from './AddExerciseModal';
import {
  Dumbbell,
  BookOpen,
  Disc3,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
  Flame,
  Clock,
  Layers,
  Trash2,
  Repeat,
  Search,
} from 'lucide-react';

interface WorkoutActiveSessionProps {
  program: Program;
  activeWorkoutIndex: number;
  onWorkoutIndexChange: (idx: number) => void;
  onOpenGuide: (exercise: Exercise) => void;
  onOpenPlateCalc: (weightKg: number, onApply: (w: number) => void) => void;
  onTriggerRestTimer: (seconds: number) => void;
  onWorkoutFinished: () => void;
  lang: Language;
  profile?: UserProfile;
  onProfileChange?: (p: UserProfile) => void;
}

export const WorkoutActiveSession: React.FC<WorkoutActiveSessionProps> = ({
  program,
  activeWorkoutIndex,
  onWorkoutIndexChange,
  onOpenGuide,
  onOpenPlateCalc,
  onTriggerRestTimer,
  onWorkoutFinished,
  lang,
  profile,
  onProfileChange,
}) => {
  const currentWorkout = program.workouts[activeWorkoutIndex] || program.workouts[0];

  // Alternating Squat / Deadlift mode preference
  const [alternateSquatDeadlift, setAlternateSquatDeadlift] = useState<boolean>(() => {
    return profile?.alternateSquatDeadlift ?? true;
  });

  // Active exercises state in current session
  const [exercisesState, setExercisesState] = useState<WorkoutExerciseState[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [swapMenuOpenExerciseId, setSwapMenuOpenExerciseId] = useState<string | null>(null);

  // Add Exercise / Swap Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [swapTargetIndex, setSwapTargetIndex] = useState<number | null>(null);

  // Initialize exercises state when workout changes
  useEffect(() => {
    let exerciseList = [...currentWorkout.exerciseIds];

    // If alternating squats and deadlifts is active and this is a classic 5x5 routine:
    // If Workout B has both squat and deadlift, drop squat so deadlift takes center stage!
    if (alternateSquatDeadlift && (program.id.includes('stronglifts') || program.id.includes('5x5'))) {
      if (currentWorkout.dayTag === 'B' || currentWorkout.id.includes('b')) {
        const hasSquat = exerciseList.includes('barbell-squat');
        const hasDeadlift = exerciseList.includes('deadlift');
        if (hasSquat && hasDeadlift) {
          // Drop squat from B day and ensure deadlift + pull-ups are in place
          exerciseList = exerciseList.filter((id) => id !== 'barbell-squat');
          if (!exerciseList.includes('pull-ups')) {
            exerciseList.push('pull-ups');
          }
        }
      }
    }

    const initialized: WorkoutExerciseState[] = exerciseList.map((exId) => {
      const insight = getExerciseHistoryInsight(exId);
      const ex = EXERCISE_CATALOG.find((e) => e.id === exId);
      const overrides = currentWorkout.customSetOverrides?.[exId];

      const numSets = overrides?.sets ?? currentWorkout.targetSets ?? 5;
      const targetReps = overrides?.reps ?? currentWorkout.targetReps ?? 5;
      const initialWeight = insight.suggestedWeightKg;

      const sets: WorkoutSet[] = Array.from({ length: numSets }, (_, i) => ({
        setIndex: i + 1,
        targetReps,
        actualReps: null,
        weightKg: initialWeight,
        isCompleted: false,
      }));

      return {
        exerciseId: exId,
        sets,
        restSeconds: 120,
      };
    });

    setExercisesState(initialized);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  }, [currentWorkout.id, alternateSquatDeadlift]);

  // Session elapsed timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Toggle set completion: null -> targetReps -> -1 -> -2 -> ... -> 0 -> reset
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    playIronClick();
    setExercisesState((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      const set = { ...ex.sets[setIndex] };

      if (!set.isCompleted) {
        // Complete with full target reps
        set.isCompleted = true;
        set.actualReps = set.targetReps;
        // Trigger auto rest timer
        onTriggerRestTimer(ex.restSeconds || 120);
      } else if (set.actualReps !== null && set.actualReps > 0) {
        // Drop by 1 rep (e.g. 5 -> 4 -> 3)
        set.actualReps -= 1;
      } else {
        // Reset set
        set.isCompleted = false;
        set.actualReps = null;
      }

      ex.sets[setIndex] = set;
      updated[exIndex] = ex;
      return updated;
    });
  };

  // Adjust weight for all sets in an exercise
  const handleAdjustWeight = (exIndex: number, delta: number) => {
    playClick();
    setExercisesState((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      ex.sets = ex.sets.map((s) => ({
        ...s,
        weightKg: Math.max(0, Number((s.weightKg + delta).toFixed(2))),
      }));
      updated[exIndex] = ex;
      return updated;
    });
  };

  // Set explicit weight for an exercise
  const handleSetWeight = (exIndex: number, newWeight: number) => {
    setExercisesState((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      ex.sets = ex.sets.map((s) => ({
        ...s,
        weightKg: Math.max(0, Number(newWeight.toFixed(2))),
      }));
      updated[exIndex] = ex;
      return updated;
    });
  };

  // Swap exercise (e.g. Barbell Squat -> Goblet Squat)
  const handleSwapExercise = (exIndex: number, newExerciseId: string) => {
    playIronClick();
    const insight = getExerciseHistoryInsight(newExerciseId);
    setExercisesState((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      ex.exerciseId = newExerciseId;
      ex.sets = ex.sets.map((s) => ({
        ...s,
        weightKg: insight.suggestedWeightKg,
        isCompleted: false,
        actualReps: null,
      }));
      updated[exIndex] = ex;
      return updated;
    });
    setSwapMenuOpenExerciseId(null);
    setSwapTargetIndex(null);
  };

  // Add / remove sets
  const handleAddSet = (exIndex: number) => {
    playClick();
    setExercisesState((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: WorkoutSet = {
        setIndex: ex.sets.length + 1,
        targetReps: lastSet?.targetReps ?? 5,
        actualReps: null,
        weightKg: lastSet?.weightKg ?? 20,
        isCompleted: false,
      };
      ex.sets = [...ex.sets, newSet];
      updated[exIndex] = ex;
      return updated;
    });
  };

  const handleRemoveSet = (exIndex: number) => {
    playClick();
    setExercisesState((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      if (ex.sets.length > 1) {
        ex.sets = ex.sets.slice(0, -1);
      }
      updated[exIndex] = ex;
      return updated;
    });
  };

  // Remove exercise from today's workout
  const handleDeleteExercise = (exIndex: number) => {
    playClick();
    setExercisesState((prev) => prev.filter((_, idx) => idx !== exIndex));
  };

  // Move exercise up or down in order
  const handleMoveExercise = (exIndex: number, direction: 'up' | 'down') => {
    playClick();
    setExercisesState((prev) => {
      const targetIndex = direction === 'up' ? exIndex - 1 : exIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[exIndex];
      copy[exIndex] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Add new exercise to session from catalog
  const handleAddExerciseToWorkout = (newExerciseId: string) => {
    playIronClick();
    const insight = getExerciseHistoryInsight(newExerciseId);
    const ex = EXERCISE_CATALOG.find((e) => e.id === newExerciseId);
    const initialWeight = insight.suggestedWeightKg;

    const newExState: WorkoutExerciseState = {
      exerciseId: newExerciseId,
      sets: Array.from({ length: 3 }, (_, i) => ({
        setIndex: i + 1,
        targetReps: ex?.category === 'deadlift' ? 5 : 8,
        actualReps: null,
        weightKg: initialWeight,
        isCompleted: false,
      })),
      restSeconds: 120,
    };

    setExercisesState((prev) => [...prev, newExState]);
  };

  // Toggle Alternating Squats & Deadlifts
  const handleToggleAlternateSquatDeadlift = () => {
    playIronClick();
    const nextVal = !alternateSquatDeadlift;
    setAlternateSquatDeadlift(nextVal);

    // Save to user profile
    const currentProfile = profile || getUserProfile();
    const updatedProfile: UserProfile = {
      ...currentProfile,
      alternateSquatDeadlift: nextVal,
    };
    saveUserProfile(updatedProfile);
    if (onProfileChange) {
      onProfileChange(updatedProfile);
    }
  };

  // Calculate live volume
  const totalVolumeKg = exercisesState.reduce((sum, ex) => {
    return (
      sum +
      ex.sets.reduce((sSum, s) => {
        if (s.isCompleted && s.actualReps !== null) {
          return sSum + s.weightKg * s.actualReps;
        }
        return sSum;
      }, 0)
    );
  }, 0);

  // Finish and save workout
  const handleFinishWorkout = () => {
    playWorkoutComplete();

    // Check PRs achieved
    const prsAchieved: { exerciseId: string; weightKg: number; reps: number; label: string }[] = [];
    exercisesState.forEach((ex) => {
      const insight = getExerciseHistoryInsight(ex.exerciseId);
      const completedSets = ex.sets.filter((s) => s.isCompleted && (s.actualReps ?? 0) > 0);
      completedSets.forEach((s) => {
        const epley = s.weightKg * (1 + (s.actualReps ?? 0) / 30);
        if (insight.personalRecord1RMKg && epley > insight.personalRecord1RMKg) {
          prsAchieved.push({
            exerciseId: ex.exerciseId,
            weightKg: s.weightKg,
            reps: s.actualReps ?? 0,
            label: `${s.weightKg} kg × ${s.actualReps} reps`,
          });
        }
      });
    });

    const log: WorkoutSessionLog = {
      id: `workout-${Date.now()}`,
      programId: program.id,
      workoutId: currentWorkout.id,
      workoutName: lang === 'sv' ? currentWorkout.nameSv : currentWorkout.name,
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      exercises: exercisesState,
      totalVolumeKg,
      prsAchieved,
    };

    saveWorkoutLog(log);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24', '#ffffff'],
      });
    } catch (e) {}

    // Cycle to next workout for next session
    const nextIdx = (activeWorkoutIndex + 1) % program.workouts.length;
    onWorkoutIndexChange(nextIdx);

    onWorkoutFinished();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* WORKOUT HEADER BANNER & CYCLING CONTROLS */}
      <section className="bg-iron-900/85 border border-iron-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Amber glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Workout Title & Cycle Indicator */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {lang === 'sv' ? `Cykeldag ${currentWorkout.dayTag}` : `Cycle Day ${currentWorkout.dayTag}`}
              </span>

              {/* Cycle Auto-suggestion pill */}
              <span className="text-xs text-iron-400 font-medium">
                {lang === 'sv'
                  ? `Automatiskt förvald baserat på din cykel (${activeWorkoutIndex + 1}/${program.workouts.length})`
                  : `Next in program cycle (${activeWorkoutIndex + 1}/${program.workouts.length})`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {lang === 'sv' ? currentWorkout.nameSv : currentWorkout.name}
            </h1>

            {/* Quick Switcher between Pass A / Pass B in the cycle */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-iron-400 mr-1">
                {lang === 'sv' ? 'Byt pass:' : 'Switch workout:'}
              </span>
              {program.workouts.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => {
                    playClick();
                    onWorkoutIndexChange(idx);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeWorkoutIndex === idx
                      ? 'bg-amber-500 text-iron-950 font-black shadow-md'
                      : 'bg-iron-950 border border-iron-800 text-iron-300 hover:text-white hover:bg-iron-850'
                  }`}
                >
                  {w.dayTag}: {lang === 'sv' ? w.nameSv.split(' ')[0] : w.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Alternating Squat & Deadlift Quick Toggle */}
            <div className="pt-2">
              <button
                onClick={handleToggleAlternateSquatDeadlift}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                  alternateSquatDeadlift
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-iron-950 border-iron-800 text-iron-400 hover:text-iron-200 hover:bg-iron-850'
                }`}
                title={
                  lang === 'sv'
                    ? 'Växla mellan att alternera Knäböj & Marklyft eller köra Knäböj varje pass'
                    : 'Toggle between alternating Squats & Deadlifts or Squatting every workout'
                }
              >
                <Repeat className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {alternateSquatDeadlift
                    ? (lang === 'sv'
                        ? 'Underkropp: Alternerar Knäböj & Marklyft'
                        : 'Lower Body: Alternating Squats & Deadlifts')
                    : (lang === 'sv'
                        ? 'Underkropp: Knäböj Varje Pass (Klassisk)'
                        : 'Lower Body: Squat Every Workout (Classic)')}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    alternateSquatDeadlift ? 'bg-amber-500/30 text-amber-200' : 'bg-iron-800 text-iron-400'
                  }`}
                >
                  {alternateSquatDeadlift ? (lang === 'sv' ? 'PÅ' : 'ON') : (lang === 'sv' ? 'AV' : 'OFF')}
                </span>
              </button>
            </div>
          </div>

          {/* Live Workout Stats: Timer & Volume */}
          <div className="flex items-center gap-3 bg-iron-950/80 border border-iron-800 rounded-2xl p-3.5 self-start md:self-auto flex-shrink-0">
            {/* Elapsed Time */}
            <div className="px-3 border-r border-iron-800 space-y-0.5 text-center min-w-[70px]">
              <span className="text-[9px] uppercase font-bold text-iron-500 tracking-wider flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-iron-400" />
                {lang === 'sv' ? 'Tid' : 'Time'}
              </span>
              <div className="text-base font-black font-mono text-white">
                {formatElapsed(elapsedSeconds)}
              </div>
            </div>

            {/* Total Volume */}
            <div className="px-3 space-y-0.5 text-center min-w-[85px]">
              <span className="text-[9px] uppercase font-bold text-iron-500 tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                {lang === 'sv' ? 'Volym' : 'Volume'}
              </span>
              <div className="text-base font-black font-mono text-amber-400">
                {totalVolumeKg} <span className="text-xs text-iron-400 font-bold">kg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXERCISE CARDS LIST */}
      <section className="space-y-5">
        {exercisesState.map((exState, exIndex) => {
          const ex = EXERCISE_CATALOG.find((e) => e.id === exState.exerciseId);
          if (!ex) return null;

          const insight = getExerciseHistoryInsight(ex.id);
          const currentWeight = exState.sets[0]?.weightKg ?? 20;
          const isBarbell = ex.equipment === 'barbell';
          const alternatives = ex.alternatives
            .map((id) => EXERCISE_CATALOG.find((e) => e.id === id))
            .filter(Boolean) as Exercise[];

          return (
            <div
              key={`${ex.id}-${exIndex}`}
              className="bg-iron-900/90 border border-iron-800 hover:border-iron-700/80 rounded-3xl p-5 sm:p-6 shadow-xl transition-all space-y-4"
            >
              {/* Exercise Card Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-iron-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Equipment badge */}
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-iron-800 text-iron-300 border border-iron-700">
                      {ex.equipment === 'barbell'
                        ? (lang === 'sv' ? 'Skivstång' : 'Barbell')
                        : ex.equipment === 'dumbbell'
                        ? (lang === 'sv' ? 'Hantlar' : 'Dumbbell')
                        : (lang === 'sv' ? 'Kroppsvikt' : 'Bodyweight')}
                    </span>

                    {/* Muscle focus */}
                    <span className="text-xs text-iron-400 font-medium">
                      {lang === 'sv' ? ex.primaryMusclesSv : ex.primaryMuscles}
                    </span>

                    {/* Progressive overload badge */}
                    {insight.allSetsHitLastTime && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{ex.weightIncrementKg} kg</span>
                      </span>
                    )}
                  </div>

                  {/* Exercise Title & Swap Dropdown */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {lang === 'sv' ? ex.nameSv : ex.name}
                    </h2>

                    {/* Swap to Alternative dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          playClick();
                          setSwapMenuOpenExerciseId(
                            swapMenuOpenExerciseId === ex.id ? null : ex.id
                          );
                        }}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-amber-400 hover:text-amber-300 bg-iron-950 border border-iron-800 hover:border-amber-500/40 transition flex items-center gap-1 cursor-pointer"
                        title={lang === 'sv' ? 'Byt övningsvariant' : 'Swap exercise variation'}
                      >
                        <span>{lang === 'sv' ? 'Byt' : 'Swap'}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {/* Swap Menu Popover */}
                      {swapMenuOpenExerciseId === ex.id && (
                        <div className="absolute left-0 top-8 z-30 w-64 bg-iron-950 border border-iron-700 rounded-2xl p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                          <span className="text-[10px] uppercase font-bold text-iron-500 px-2 py-1 block">
                            {lang === 'sv' ? 'Snabba varianter:' : 'Quick variations:'}
                          </span>
                          {alternatives.map((alt) => (
                            <button
                              key={alt.id}
                              onClick={() => handleSwapExercise(exIndex, alt.id)}
                              className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-slate-200 hover:bg-iron-850 hover:text-amber-300 transition flex items-center justify-between"
                            >
                              <span>{lang === 'sv' ? alt.nameSv : alt.name}</span>
                              <span className="text-[10px] text-iron-500 uppercase font-mono">
                                {alt.equipment === 'dumbbell'
                                  ? (lang === 'sv' ? 'Hantel' : 'DB')
                                  : (lang === 'sv' ? 'Stång' : 'Bar')}
                              </span>
                            </button>
                          ))}

                          {/* Browse entire catalog */}
                          <button
                            onClick={() => {
                              playClick();
                              setSwapMenuOpenExerciseId(null);
                              setSwapTargetIndex(exIndex);
                              setIsAddModalOpen(true);
                            }}
                            className="w-full px-2.5 py-2 mt-1 rounded-xl text-left text-xs font-bold text-amber-400 hover:bg-iron-850 hover:text-amber-300 transition flex items-center gap-1.5 border-t border-iron-800/80"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'sv' ? 'Bläddra i hela katalogen...' : 'Browse entire catalog...'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons: Reorder, Guide, Plate Calculator, Remove */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Reorder Up / Down */}
                  <div className="flex items-center bg-iron-950/80 border border-iron-800 rounded-xl p-0.5">
                    <button
                      onClick={() => handleMoveExercise(exIndex, 'up')}
                      disabled={exIndex === 0}
                      className="p-1 rounded-lg text-iron-400 hover:text-white disabled:opacity-20 transition cursor-pointer"
                      title={lang === 'sv' ? 'Flytta upp' : 'Move up'}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveExercise(exIndex, 'down')}
                      disabled={exIndex === exercisesState.length - 1}
                      className="p-1 rounded-lg text-iron-400 hover:text-white disabled:opacity-20 transition cursor-pointer"
                      title={lang === 'sv' ? 'Flytta ner' : 'Move down'}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Discreet Guide button */}
                  <button
                    onClick={() => onOpenGuide(ex)}
                    className="px-3 py-1.5 rounded-xl bg-iron-950 border border-iron-800 hover:border-amber-500/50 hover:bg-iron-850 text-iron-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title={lang === 'sv' ? 'Visa teknikinstruktioner och formtips' : 'View form cues and guide'}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">
                      {lang === 'sv' ? 'Instruktioner' : 'Form Guide'}
                    </span>
                    <span className="sm:hidden">{lang === 'sv' ? 'Guide' : 'Guide'}</span>
                  </button>

                  {/* Olympic Barbell Plate Calculator */}
                  {isBarbell && (
                    <button
                      onClick={() =>
                        onOpenPlateCalc(currentWeight, (newWeight) =>
                          handleSetWeight(exIndex, newWeight)
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-iron-950 border border-iron-800 hover:border-amber-500/50 hover:bg-iron-850 text-iron-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title={lang === 'sv' ? 'Kalkylator för skivstångsvikter' : 'Olympic plate calculator'}
                    >
                      <Disc3 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">
                        {lang === 'sv' ? 'Vikter' : 'Plates'}
                      </span>
                    </button>
                  )}

                  {/* Delete Exercise button */}
                  <button
                    onClick={() => handleDeleteExercise(exIndex)}
                    className="p-2 rounded-xl text-iron-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title={lang === 'sv' ? 'Ta bort övning från dagens pass' : 'Remove exercise from workout'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weight Adjustment Controller Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-iron-950/60 p-3 rounded-2xl border border-iron-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-iron-500 tracking-wider">
                    {lang === 'sv' ? 'Arbetsvikt:' : 'Work Weight:'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      step={ex.weightIncrementKg}
                      value={currentWeight}
                      onChange={(e) =>
                        handleSetWeight(exIndex, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 rounded-xl bg-iron-900 border border-iron-700 text-lg font-black font-mono text-white text-center focus:border-amber-500 outline-none"
                    />
                    <span className="text-xs font-extrabold text-iron-400">kg</span>
                  </div>
                </div>

                {/* Quick Increment buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustWeight(exIndex, -5)}
                    className="px-2 py-1 rounded-lg bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjustWeight(exIndex, -ex.weightIncrementKg)}
                    className="px-2 py-1 rounded-lg bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
                  >
                    -{ex.weightIncrementKg}
                  </button>
                  <button
                    onClick={() => handleAdjustWeight(exIndex, ex.weightIncrementKg)}
                    className="px-2 py-1 rounded-lg bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
                  >
                    +{ex.weightIncrementKg}
                  </button>
                  <button
                    onClick={() => handleAdjustWeight(exIndex, 5)}
                    className="px-2 py-1 rounded-lg bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Set Bubbles Grid (Tactile, Big Tap Targets!) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-iron-400 uppercase tracking-wider px-1">
                  <span>
                    {lang === 'sv'
                      ? `Set & Reps (${exState.sets.length} set)`
                      : `Sets & Reps (${exState.sets.length} sets)`}
                  </span>
                  <span>
                    {lang === 'sv' ? 'Klicka på cirkeln för att bocka av set' : 'Tap bubble to check set'}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                  {exState.sets.map((set, sIdx) => {
                    const isDone = set.isCompleted;
                    const reps = set.actualReps;
                    const hitTarget = reps !== null && reps >= set.targetReps;

                    return (
                      <button
                        key={sIdx}
                        onClick={() => handleToggleSet(exIndex, sIdx)}
                        className={`h-16 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                          isDone
                            ? hitTarget
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/30'
                              : 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/25'
                            : 'bg-iron-950/80 border-iron-800 hover:border-iron-700 text-iron-300 hover:text-white'
                        }`}
                        title={
                          isDone
                            ? `${reps} reps klara! Klicka för att justera`
                            : `Klicka för att bocka av ${set.targetReps} reps`
                        }
                      >
                        <span className="text-[10px] font-mono font-bold uppercase opacity-80">
                          Set {set.setIndex}
                        </span>

                        <span className="text-xl sm:text-2xl font-black font-mono">
                          {isDone ? reps : set.targetReps}
                        </span>

                        <span className="text-[9px] font-mono font-bold opacity-70">
                          {isDone ? (hitTarget ? '✓ Klar' : `${reps} reps`) : `${set.targetReps} reps`}
                        </span>
                      </button>
                    );
                  })}

                  {/* Add / Remove Set buttons */}
                  <div className="flex gap-1.5 h-16 sm:h-20">
                    <button
                      onClick={() => handleAddSet(exIndex)}
                      className="flex-1 rounded-2xl border border-dashed border-iron-800 hover:border-iron-700 text-iron-500 hover:text-iron-300 flex flex-col items-center justify-center transition cursor-pointer"
                      title={lang === 'sv' ? 'Lägg till ett extra set' : 'Add a set'}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-0.5">+ Set</span>
                    </button>

                    {exState.sets.length > 1 && (
                      <button
                        onClick={() => handleRemoveSet(exIndex)}
                        className="flex-1 rounded-2xl border border-dashed border-iron-850 hover:border-rose-900/50 text-iron-600 hover:text-rose-400 flex flex-col items-center justify-center transition cursor-pointer"
                        title={lang === 'sv' ? 'Ta bort sista setet' : 'Remove last set'}
                      >
                        <Minus className="w-4 h-4" />
                        <span className="text-[10px] font-bold mt-0.5">- Set</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Exercise to Current Workout Button */}
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={() => {
              playClick();
              setSwapTargetIndex(null);
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-iron-900 border border-dashed border-iron-700 hover:border-amber-500/70 hover:bg-iron-850 text-iron-300 hover:text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{lang === 'sv' ? 'Lägg till övning i passet' : 'Add Exercise to Workout'}</span>
          </button>
        </div>
      </section>

      {/* FINISH WORKOUT BUTTON (Bottom Bar) */}
      <div className="pt-4 pb-12 flex items-center justify-center">
        <button
          onClick={handleFinishWorkout}
          className="w-full sm:w-auto px-8 py-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-95 text-iron-950 font-black text-base shadow-2xl shadow-amber-500/30 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-iron-950" />
          <span>{lang === 'sv' ? 'Avsluta & Spara Passet' : 'Finish & Save Workout'}</span>
          <ArrowRight className="w-5 h-5 text-iron-950" />
        </button>
      </div>

      {/* Add / Swap Exercise Modal */}
      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSwapTargetIndex(null);
        }}
        onSelectExercise={(newExId) => {
          if (swapTargetIndex !== null) {
            handleSwapExercise(swapTargetIndex, newExId);
          } else {
            handleAddExerciseToWorkout(newExId);
          }
        }}
        currentExerciseIds={exercisesState.map((e) => e.exerciseId)}
        lang={lang}
        title={
          swapTargetIndex !== null
            ? (lang === 'sv' ? 'Byt till övning' : 'Swap Exercise')
            : undefined
        }
      />
    </div>
  );
};
