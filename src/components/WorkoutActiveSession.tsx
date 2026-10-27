import React, { useState, useEffect } from 'react';
import {
  Program,
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
} from '../utils/storage';
import { playIronClick, playWorkoutComplete, playClick } from '../utils/audio';
import confetti from 'canvas-confetti';
import { AddExerciseModal } from './AddExerciseModal';
import {
  BookOpen,
  Disc3,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Clock,
  Trash2,
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
}) => {
  const currentWorkout = program.workouts[activeWorkoutIndex] || program.workouts[0];
  const alternateSquatDeadlift = profile?.alternateSquatDeadlift ?? true;

  const [exercisesState, setExercisesState] = useState<WorkoutExerciseState[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [swapMenuOpenExerciseId, setSwapMenuOpenExerciseId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [swapTargetIndex, setSwapTargetIndex] = useState<number | null>(null);

  // Initialize exercises state when workout changes
  useEffect(() => {
    let exerciseList = [...currentWorkout.exerciseIds];

    if (alternateSquatDeadlift && (program.id.includes('stronglifts') || program.id.includes('5x5'))) {
      if (currentWorkout.dayTag === 'B' || currentWorkout.id.includes('b')) {
        const hasSquat = exerciseList.includes('barbell-squat');
        const hasDeadlift = exerciseList.includes('deadlift');
        if (hasSquat && hasDeadlift) {
          exerciseList = exerciseList.filter((id) => id !== 'barbell-squat');
          if (!exerciseList.includes('pull-ups')) {
            exerciseList.push('pull-ups');
          }
        }
      }
    }

    const initialized: WorkoutExerciseState[] = exerciseList.map((exId) => {
      const insight = getExerciseHistoryInsight(exId);
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
  }, [currentWorkout.id, alternateSquatDeadlift, program.id]);

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
      const setsCopy = [...ex.sets];
      const set = { ...setsCopy[setIndex] };

      if (!set.isCompleted) {
        set.isCompleted = true;
        set.actualReps = set.targetReps;
        onTriggerRestTimer(ex.restSeconds || 120);
      } else if (set.actualReps !== null && set.actualReps > 1) {
        set.actualReps -= 1;
      } else {
        set.isCompleted = false;
        set.actualReps = null;
      }

      setsCopy[setIndex] = set;
      ex.sets = setsCopy;
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

  // Swap exercise
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

  const handleDeleteExercise = (exIndex: number) => {
    playClick();
    setExercisesState((prev) => prev.filter((_, idx) => idx !== exIndex));
  };

  const handleAddExerciseToWorkout = (newExerciseId: string) => {
    playIronClick();
    const insight = getExerciseHistoryInsight(newExerciseId);
    const ex = EXERCISE_CATALOG.find((e) => e.id === newExerciseId);
    const initialWeight = insight.suggestedWeightKg;

    const newExState: WorkoutExerciseState = {
      exerciseId: newExerciseId,
      sets: Array.from({ length: 5 }, (_, i) => ({
        setIndex: i + 1,
        targetReps: ex?.category === 'deadlift' ? 5 : 5,
        actualReps: null,
        weightKg: initialWeight,
        isCompleted: false,
      })),
      restSeconds: 120,
    };

    setExercisesState((prev) => [...prev, newExState]);
  };

  // Live totals
  const totalSetsCount = exercisesState.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSetsCount = exercisesState.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length,
    0
  );
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

    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#FF5500', '#F5F3EF', '#9A978E'],
      });
    } catch (e) {}

    const nextIdx = (activeWorkoutIndex + 1) % program.workouts.length;
    onWorkoutIndexChange(nextIdx);
    onWorkoutFinished();
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto select-none">
      {/* COMPACT CHALKBOARD WORKOUT STRIP */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 border-[#262626] pb-4">
        <div className="space-y-1.5">
          {/* Workout Cycle Switcher (Pass A / Pass B) */}
          <div className="flex items-center gap-1.5">
            {program.workouts.map((w, idx) => {
              const isSelected = activeWorkoutIndex === idx;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    playClick();
                    onWorkoutIndexChange(idx);
                  }}
                  className={`px-2.5 py-0.5 rounded-sm font-display font-extrabold uppercase tracking-wider text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF5500] text-[#111111]'
                      : 'bg-[#181818] border border-[#282828] text-[#9A978E] hover:text-[#F5F3EF]'
                  }`}
                >
                  {lang === 'sv' ? `PASS ${w.dayTag}` : `DAY ${w.dayTag}`}
                </button>
              );
            })}
            <span className="text-[11px] font-mono text-[#6E6C65] pl-1">
              {completedSetsCount}/{totalSetsCount} SET
            </span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wide text-[#F5F3EF] leading-none">
            {lang === 'sv' ? currentWorkout.nameSv : currentWorkout.name}
          </h1>
        </div>

        {/* Right: Quiet Session Clock + Plate Math Drawer Trigger */}
        <div className="flex items-center gap-3 self-start sm:self-end">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181818] border border-[#282828] font-mono text-xs text-[#9A978E]">
            <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className="text-[#F5F3EF] font-bold">{formatElapsed(elapsedSeconds)}</span>
            {totalVolumeKg > 0 && (
              <>
                <span className="text-[#363636]">|</span>
                <span className="text-[#FF5500] font-bold">{totalVolumeKg} kg</span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              playClick();
              const firstBarbellWeight = exercisesState[0]?.sets[0]?.weightKg ?? 60;
              onOpenPlateCalc(firstBarbellWeight, (newW) => {
                if (exercisesState.length > 0) handleSetWeight(0, newW);
              });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181818] border border-[#282828] hover:border-[#FF5500] text-xs font-mono text-[#9A978E] hover:text-[#F5F3EF] transition cursor-pointer"
            title={lang === 'sv' ? 'Öppna skivstångskalkylator' : 'Open plate calculator'}
          >
            <Disc3 className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>{lang === 'sv' ? 'Skivor' : 'Plates'}</span>
          </button>
        </div>
      </section>

      {/* THE 3 MAIN LIFTS — 85% VISUAL WEIGHT */}
      <section className="space-y-4">
        {exercisesState.map((exState, exIndex) => {
          const ex = EXERCISE_CATALOG.find((e) => e.id === exState.exerciseId);
          if (!ex) return null;

          const insight = getExerciseHistoryInsight(ex.id);
          const currentWeight = exState.sets[0]?.weightKg ?? 20;
          const isBarbell = ex.equipment === 'barbell';
          const completedInEx = exState.sets.filter((s) => s.isCompleted).length;
          const allDone = completedInEx === exState.sets.length && exState.sets.length > 0;
          const anyDone = completedInEx > 0;

          const alternatives = ex.alternatives
            .map((id) => EXERCISE_CATALOG.find((e) => e.id === id))
            .filter(Boolean) as Exercise[];

          const stepKg = ex.weightIncrementKg || 2.5;

          return (
            <article
              key={`${ex.id}-${exIndex}`}
              className={`relative bg-[#181818] border border-[#282828] rounded-lg p-4 sm:p-6 transition-colors border-l-4 ${
                allDone
                  ? 'border-l-[#F5F3EF]'
                  : anyDone
                  ? 'border-l-[#FF5500]'
                  : 'border-l-[#363636]'
              }`}
            >
              {/* ROW 1: Exercise Name + Quiet Drawer Links (Left) & Tactile Barbell Weight Stepper (Right) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242424]">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="font-display font-black text-xl sm:text-2xl text-[#FF5500] leading-none">
                      0{exIndex + 1}
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wide text-[#F5F3EF] leading-none">
                      {lang === 'sv' ? ex.nameSv : ex.name}
                    </h2>

                    {insight.allSetsHitLastTime && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-[#FF5500]/15 border border-[#FF5500]/40 text-[#FF5500] font-mono text-[10px] font-bold">
                        <TrendingUp className="w-3 h-3" />+{stepKg}kg
                      </span>
                    )}
                  </div>

                  {/* Quiet Drawer Triggers: Form Guide, Swap, Remove */}
                  <div className="flex items-center gap-3 text-xs text-[#9A978E] pt-0.5">
                    <span className="font-mono text-[11px] uppercase text-[#6E6C65]">
                      {exState.sets.length}×{exState.sets[0]?.targetReps ?? 5}
                    </span>
                    <span className="text-[#282828]">•</span>

                    <button
                      onClick={() => onOpenGuide(ex)}
                      className="hover:text-[#F5F3EF] underline decoration-[#363636] underline-offset-4 transition flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3 text-[#FF5500]" />
                      <span>{lang === 'sv' ? 'Teknik' : 'Form'}</span>
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => {
                          playClick();
                          setSwapMenuOpenExerciseId(
                            swapMenuOpenExerciseId === ex.id ? null : ex.id
                          );
                        }}
                        className="hover:text-[#F5F3EF] underline decoration-[#363636] underline-offset-4 transition flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{lang === 'sv' ? 'Byt övning' : 'Swap'}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {swapMenuOpenExerciseId === ex.id && (
                        <div className="absolute left-0 top-6 z-30 w-60 bg-[#111111] border border-[#363636] rounded p-1.5 shadow-2xl space-y-1">
                          {alternatives.map((alt) => (
                            <button
                              key={alt.id}
                              onClick={() => handleSwapExercise(exIndex, alt.id)}
                              className="w-full px-2.5 py-1.5 rounded-sm text-left text-xs font-medium text-[#F5F3EF] hover:bg-[#1F1F1F] hover:text-[#FF5500] transition flex items-center justify-between cursor-pointer"
                            >
                              <span>{lang === 'sv' ? alt.nameSv : alt.name}</span>
                              <span className="text-[10px] text-[#6E6C65] font-mono uppercase">
                                {alt.equipment === 'dumbbell' ? 'DB' : 'BAR'}
                              </span>
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              playClick();
                              setSwapMenuOpenExerciseId(null);
                              setSwapTargetIndex(exIndex);
                              setIsAddModalOpen(true);
                            }}
                            className="w-full px-2.5 py-1.5 mt-1 rounded-sm text-left text-xs font-bold text-[#FF5500] hover:bg-[#1F1F1F] transition flex items-center gap-1.5 border-t border-[#262626] cursor-pointer"
                          >
                            <Search className="w-3 h-3" />
                            <span>
                              {lang === 'sv' ? 'Alla övningar...' : 'All exercises...'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {exercisesState.length > 1 && (
                      <button
                        onClick={() => handleDeleteExercise(exIndex)}
                        className="text-[#6E6C65] hover:text-[#FF5500] transition ml-auto sm:ml-0 cursor-pointer"
                        title={lang === 'sv' ? 'Ta bort övning' : 'Remove exercise'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Unified Barbell Weight Stepper & 1-Tap Plate Drawer Trigger */}
                <div className="flex items-center gap-1.5 bg-[#111111] border border-[#282828] p-1 rounded self-start sm:self-center">
                  <button
                    onClick={() => handleAdjustWeight(exIndex, -stepKg)}
                    className="w-9 h-9 rounded-sm bg-[#181818] hover:bg-[#242424] active:scale-95 text-[#9A978E] hover:text-[#F5F3EF] font-mono text-xs font-bold flex items-center justify-center transition cursor-pointer"
                    title={`-${stepKg} kg`}
                  >
                    -{stepKg}
                  </button>

                  <button
                    onClick={() => {
                      if (isBarbell) {
                        playClick();
                        onOpenPlateCalc(currentWeight, (newW) =>
                          handleSetWeight(exIndex, newW)
                        );
                      }
                    }}
                    className="px-3 py-1 text-center group cursor-pointer"
                    title={
                      isBarbell
                        ? lang === 'sv'
                          ? 'Tryck för att se skivladdning (20kg stång)'
                          : 'Tap for plate loading breakdown'
                        : undefined
                    }
                  >
                    <div className="font-mono font-extrabold text-xl sm:text-2xl text-[#F5F3EF] group-hover:text-[#FF5500] transition-colors leading-none">
                      {currentWeight} <span className="text-xs font-normal text-[#9A978E]">kg</span>
                    </div>
                    {isBarbell && currentWeight >= 20 && (
                      <div className="text-[10px] font-mono text-[#6E6C65] group-hover:text-[#FF5500] transition-colors mt-0.5">
                        {((currentWeight - 20) / 2).toFixed(1).replace(/\.0$/, '')} kg/sida ▸
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleAdjustWeight(exIndex, stepKg)}
                    className="w-9 h-9 rounded-sm bg-[#181818] hover:bg-[#242424] active:scale-95 text-[#9A978E] hover:text-[#F5F3EF] font-mono text-xs font-bold flex items-center justify-center transition cursor-pointer"
                    title={`+${stepKg} kg`}
                  >
                    +{stepKg}
                  </button>
                </div>
              </div>

              {/* ROW 2: GIANT THUMB-FRIENDLY 5×5 SET CIRCLES */}
              <div className="pt-4 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                  {exState.sets.map((set, sIdx) => {
                    const isDone = set.isCompleted;
                    const reps = set.actualReps;
                    const hitTarget = reps !== null && reps >= set.targetReps;

                    return (
                      <div key={sIdx} className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleToggleSet(exIndex, sIdx)}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${
                            isDone
                              ? hitTarget
                                ? 'bg-[#FF5500] text-[#111111] border-2 border-[#FF5500] shadow-[0_0_0_3px_rgba(255,85,0,0.22)]'
                                : 'bg-[#1F1F1F] text-[#F5F3EF] border-2 border-[#F5F3EF]'
                              : 'bg-[#111111] text-[#6E6C65] border-2 border-[#2E2E2E] hover:border-[#FF5500]/60 hover:text-[#F5F3EF]'
                          }`}
                          title={
                            isDone
                              ? `${reps} reps (Tryck igen för att minska reps eller nollställa)`
                              : `Markera Set ${set.setIndex} (${set.targetReps} reps)`
                          }
                        >
                          <span className="font-display font-black text-2xl sm:text-3xl leading-none">
                            {isDone ? reps : set.targetReps}
                          </span>
                        </button>
                        <span
                          className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                            isDone
                              ? hitTarget
                                ? 'text-[#FF5500]'
                                : 'text-[#F5F3EF]'
                              : 'text-[#6E6C65]'
                          }`}
                        >
                          {isDone ? (hitTarget ? `S${set.setIndex} ✓` : `${reps}/${set.targetReps}`) : `SET ${set.setIndex}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Quiet Set Count Adjusters (+ / -) */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {exState.sets.length > 1 && (
                    <button
                      onClick={() => handleRemoveSet(exIndex)}
                      className="w-8 h-8 rounded-full border border-dashed border-[#2E2E2E] hover:border-[#6E6C65] text-[#6E6C65] hover:text-[#F5F3EF] flex items-center justify-center transition cursor-pointer"
                      title={lang === 'sv' ? 'Ta bort sista setet' : 'Remove last set'}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleAddSet(exIndex)}
                    className="w-8 h-8 rounded-full border border-dashed border-[#2E2E2E] hover:border-[#FF5500] text-[#6E6C65] hover:text-[#FF5500] flex items-center justify-center transition cursor-pointer"
                    title={lang === 'sv' ? 'Lägg till extra set' : 'Add extra set'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* BOTTOM ACTION BAR: Quiet Add Link + Single High-Contrast Primary CTA */}
      <section className="pt-2 pb-16 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          onClick={() => {
            playClick();
            setSwapTargetIndex(null);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded border border-dashed border-[#363636] hover:border-[#FF5500] text-[#9A978E] hover:text-[#F5F3EF] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>{lang === 'sv' ? 'Lägg till övning' : 'Add Exercise'}</span>
        </button>

        <button
          onClick={handleFinishWorkout}
          className="flex-1 sm:flex-initial sm:min-w-[280px] px-7 py-4 rounded bg-[#FF5500] hover:bg-[#E64D00] active:scale-[0.99] text-[#111111] font-display font-black text-xl uppercase tracking-wider transition flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>
            {lang === 'sv'
              ? `Logga & Avsluta Pass (${completedSetsCount}/${totalSetsCount})`
              : `Finish & Log Workout (${completedSetsCount}/${totalSetsCount})`}
          </span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </section>

      {/* Add / Swap Exercise Drawer */}
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
            ? lang === 'sv'
              ? 'Byt övning'
              : 'Swap Exercise'
            : undefined
        }
      />
    </div>
  );
};
