import React from 'react';
import { WorkoutSessionLog, Language } from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import {
  Calendar,
  Trophy,
  Dumbbell,
  Clock,
  Trash2,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { playClick } from '../utils/audio';

interface HistoryStatsViewProps {
  logs: WorkoutSessionLog[];
  onDeleteLog: (id: string) => void;
  lang: Language;
}

export const HistoryStatsView: React.FC<HistoryStatsViewProps> = ({
  logs,
  onDeleteLog,
  lang,
}) => {
  const totalWorkouts = logs.length;
  const totalVolumeKg = logs.reduce((sum, l) => sum + (l.totalVolumeKg || 0), 0);

  // Calculate 1RMs
  const keyExercises = ['barbell-squat', 'barbell-bench', 'deadlift', 'overhead-press'];
  const prs: Record<string, { weightKg: number; reps: number; estimated1RM: number }> = {};

  keyExercises.forEach((id) => {
    let best1RM = 0;
    let bestWeight = 0;
    let bestReps = 0;

    logs.forEach((log) => {
      const exState = log.exercises.find((e) => e.exerciseId === id);
      if (exState) {
        exState.sets.forEach((s) => {
          if (s.isCompleted && (s.actualReps ?? 0) > 0) {
            const epley = s.weightKg * (1 + (s.actualReps ?? 0) / 30);
            if (epley > best1RM) {
              best1RM = epley;
              bestWeight = s.weightKg;
              bestReps = s.actualReps ?? 0;
            }
          }
        });
      }
    });

    if (best1RM > 0) {
      prs[id] = { weightKg: bestWeight, reps: bestReps, estimated1RM: Math.round(best1RM) };
    }
  });

  const getExerciseName = (id: string) => {
    const ex = EXERCISE_CATALOG.find((e) => e.id === id);
    if (!ex) return id;
    return lang === 'sv' ? ex.nameSv : ex.name;
  };

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Genomförda pass' : 'Workouts'}
          </span>
          <div className="text-2xl font-black font-mono text-white">{totalWorkouts}</div>
        </div>

        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Total volym' : 'Total Volume'}
          </span>
          <div className="text-2xl font-black font-mono text-amber-400">
            {totalVolumeKg >= 1000 ? `${(totalVolumeKg / 1000).toFixed(1)} ton` : `${totalVolumeKg} kg`}
          </div>
        </div>

        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Bästa Knäböj (1RM)' : 'Squat PR (1RM)'}
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {prs['barbell-squat'] ? `${prs['barbell-squat'].estimated1RM} kg` : '—'}
          </div>
        </div>

        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Bästa Bänk (1RM)' : 'Bench PR (1RM)'}
          </span>
          <div className="text-2xl font-black font-mono text-sky-400">
            {prs['barbell-bench'] ? `${prs['barbell-bench'].estimated1RM} kg` : '—'}
          </div>
        </div>
      </div>

      {/* PR Showcase Cards */}
      <div className="bg-iron-900/85 border border-iron-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{lang === 'sv' ? 'Personbästan (Estimerad 1RM)' : 'Personal Records (Est. 1RM)'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'barbell-squat', label: 'Knäböj', labelEn: 'Squat' },
            { id: 'barbell-bench', label: 'Bänkpress', labelEn: 'Bench Press' },
            { id: 'deadlift', label: 'Marklyft', labelEn: 'Deadlift' },
            { id: 'overhead-press', label: 'Militärpress', labelEn: 'Overhead Press' },
          ].map((item) => {
            const data = prs[item.id];
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-iron-950 border border-iron-800/80 space-y-1 text-center"
              >
                <div className="text-xs font-bold text-iron-300">
                  {lang === 'sv' ? item.label : item.labelEn}
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {data ? `${data.estimated1RM} kg` : '—'}
                </div>
                {data && (
                  <div className="text-[10px] font-mono text-iron-500">
                    {data.weightKg}kg × {data.reps} reps
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workout History List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-iron-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>{lang === 'sv' ? 'Tidigare Träningspass' : 'Workout History'}</span>
        </h3>

        {logs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-iron-900/50 border border-dashed border-iron-800 text-center space-y-2">
            <Dumbbell className="w-8 h-8 text-iron-600 mx-auto" />
            <h4 className="font-bold text-sm text-iron-300">
              {lang === 'sv' ? 'Inga pass loggade än' : 'No workouts logged yet'}
            </h4>
            <p className="text-xs text-iron-500 max-w-sm mx-auto">
              {lang === 'sv'
                ? 'Starta ditt första 5x5-pass på fliken "Pass" ovan och bocka av dina första set!'
                : 'Start your first 5x5 workout on the "Workout" tab above!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-iron-900/80 border border-iron-800 hover:border-iron-700 rounded-2xl p-4 sm:p-5 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-white">{log.workoutName}</span>
                      <span className="text-[11px] font-mono text-iron-400">
                        • {formatDate(log.completedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-iron-400 font-mono">
                      <span>Volym: {log.totalVolumeKg} kg</span>
                      {log.durationSeconds > 0 && (
                        <span>Tid: {Math.round(log.durationSeconds / 60)} min</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          lang === 'sv' ? 'Vill du radera detta pass?' : 'Delete this workout?'
                        )
                      ) {
                        playClick();
                        onDeleteLog(log.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-iron-500 hover:text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
                    title="Radera pass"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Exercises list in this log */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-iron-800/60">
                  {log.exercises.map((exState, idx) => {
                    const completed = exState.sets.filter((s) => s.isCompleted);
                    const weight = completed[0]?.weightKg ?? 0;
                    const repsStr = completed.map((s) => s.actualReps ?? 0).join('/');
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-iron-950/70 border border-iron-800/80 text-xs space-y-0.5"
                      >
                        <div className="font-bold text-slate-200 truncate">
                          {getExerciseName(exState.exerciseId)}
                        </div>
                        <div className="font-mono text-amber-400 font-bold">
                          {weight} kg <span className="text-iron-400 font-normal">({repsStr})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PRs achieved banner */}
                {log.prsAchieved && log.prsAchieved.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 pt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'sv' ? 'Nytt personbästa i passet!' : 'Personal record set!'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
