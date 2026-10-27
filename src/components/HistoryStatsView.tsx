import React, { useState } from 'react';
import { WorkoutSessionLog, Language } from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import {
  Calendar,
  Trophy,
  Dumbbell,
  Trash2,
  TrendingUp,
  Sparkles,
  Disc3,
} from 'lucide-react';
import { playClick } from '../utils/audio';

interface HistoryStatsViewProps {
  logs: WorkoutSessionLog[];
  onDeleteLog: (id: string) => void;
  onOpenPlateCalc: (weightKg: number) => void;
  lang: Language;
}

const CHART_LIFTS = [
  { id: 'barbell-squat', labelSv: 'Knäböj', labelEn: 'Squat', default1RM: 100 },
  { id: 'barbell-bench', labelSv: 'Bänkpress', labelEn: 'Bench Press', default1RM: 80 },
  { id: 'deadlift', labelSv: 'Marklyft', labelEn: 'Deadlift', default1RM: 130 },
  { id: 'overhead-press', labelSv: 'Militärpress', labelEn: 'Overhead Press', default1RM: 52.5 },
  { id: 'barbell-row', labelSv: 'Skivstångsrodd', labelEn: 'Barbell Row', default1RM: 70 },
];

export const HistoryStatsView: React.FC<HistoryStatsViewProps> = ({
  logs,
  onDeleteLog,
  onOpenPlateCalc,
  lang,
}) => {
  const [selectedLiftId, setSelectedLiftId] = useState<string>('barbell-squat');

  const totalWorkouts = logs.length;
  const totalVolumeKg = logs.reduce((sum, l) => sum + (l.totalVolumeKg || 0), 0);

  // Calculate all-time PRs (Epley 1RM)
  const keyExercises = ['barbell-squat', 'barbell-bench', 'deadlift', 'overhead-press', 'barbell-row'];
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
      prs[id] = {
        weightKg: bestWeight,
        reps: bestReps,
        estimated1RM: Math.round(best1RM),
      };
    }
  });

  // Build chronological time-series for selectedLiftId
  const liftSeries = [...logs]
    .reverse()
    .map((log) => {
      const exState = log.exercises.find((e) => e.exerciseId === selectedLiftId);
      if (!exState) return null;
      const completed = exState.sets.filter((s) => s.isCompleted && (s.actualReps ?? 0) > 0);
      if (completed.length === 0) return null;

      let sessionBest1RM = 0;
      let sessionTopWeight = 0;
      let sessionTopReps = 0;

      completed.forEach((s) => {
        const reps = s.actualReps ?? 0;
        const epley = s.weightKg * (1 + reps / 30);
        if (epley > sessionBest1RM) {
          sessionBest1RM = epley;
          sessionTopWeight = s.weightKg;
          sessionTopReps = reps;
        }
      });

      return {
        date: new Date(log.completedAt).toLocaleDateString(
          lang === 'sv' ? 'sv-SE' : 'en-US',
          { month: 'short', day: 'numeric' }
        ),
        workWeightKg: sessionTopWeight,
        reps: sessionTopReps,
        est1RM: Math.round(sessionBest1RM),
      };
    })
    .filter((pt): pt is NonNullable<typeof pt> => pt !== null);

  const selectedLiftMeta =
    CHART_LIFTS.find((l) => l.id === selectedLiftId) || CHART_LIFTS[0];
  const active1RM =
    prs[selectedLiftId]?.estimated1RM || selectedLiftMeta.default1RM;

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

  // SVG Chart Geometry
  const chartW = 640;
  const chartH = 190;
  const padL = 42;
  const padR = 24;
  const padT = 24;
  const padB = 32;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const allValues =
    liftSeries.length > 0
      ? liftSeries.flatMap((d) => [d.est1RM, d.workWeightKg])
      : [60, 100];
  const minVal = Math.max(0, Math.floor((Math.min(...allValues) - 10) / 5) * 5);
  const maxVal = Math.ceil((Math.max(...allValues) + 10) / 5) * 5;
  const valSpan = Math.max(10, maxVal - minVal);

  const getX = (idx: number, total: number) =>
    total <= 1 ? padL + plotW / 2 : padL + (idx / (total - 1)) * plotW;
  const getY = (val: number) =>
    padT + plotH - ((val - minVal) / valSpan) * plotH;

  const oneRmPoints = liftSeries
    .map((d, i) => `${getX(i, liftSeries.length)},${getY(d.est1RM)}`)
    .join(' ');
  const workWeightPoints = liftSeries
    .map((d, i) => `${getX(i, liftSeries.length)},${getY(d.workWeightKg)}`)
    .join(' ');

  const delta1RM =
    liftSeries.length >= 2
      ? liftSeries[liftSeries.length - 1].est1RM - liftSeries[0].est1RM
      : 0;

  const repMaxRows = [
    { pct: 100, reps: '1 RM', factor: 1.0 },
    { pct: 92, reps: '3 RM', factor: 0.92 },
    { pct: 86, reps: '5 RM (5×5)', factor: 0.86 },
    { pct: 79, reps: '8 RM', factor: 0.79 },
    { pct: 74, reps: '10 RM', factor: 0.74 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Genomförda pass' : 'Workouts'}
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {totalWorkouts}
          </div>
        </div>

        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Total volym' : 'Total Volume'}
          </span>
          <div className="text-2xl font-black font-mono text-amber-400">
            {totalVolumeKg >= 1000
              ? `${(totalVolumeKg / 1000).toFixed(1)} ton`
              : `${totalVolumeKg} kg`}
          </div>
        </div>

        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Bästa Knäböj (1RM)' : 'Squat PR (1RM)'}
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {prs['barbell-squat']
              ? `${prs['barbell-squat'].estimated1RM} kg`
              : '—'}
          </div>
        </div>

        <div className="bg-iron-900/80 border border-iron-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Bästa Bänk (1RM)' : 'Bench PR (1RM)'}
          </span>
          <div className="text-2xl font-black font-mono text-sky-400">
            {prs['barbell-bench']
              ? `${prs['barbell-bench'].estimated1RM} kg`
              : '—'}
          </div>
        </div>
      </div>

      {/* PR Showcase Cards with 1-Click Plate Calculator */}
      <div className="bg-iron-900/85 border border-iron-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>
              {lang === 'sv'
                ? 'Personbästan (Estimerad 1RM)'
                : 'Personal Records (Est. 1RM)'}
            </span>
          </div>
          <button
            onClick={() => {
              playClick();
              onOpenPlateCalc(active1RM);
            }}
            className="px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>
              {lang === 'sv' ? 'Öppna Skivkalkylator' : 'Open Plate Loader'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CHART_LIFTS.slice(0, 4).map((item) => {
            const data = prs[item.id];
            return (
              <div
                key={item.id}
                onClick={() => {
                  playClick();
                  setSelectedLiftId(item.id);
                  if (data) onOpenPlateCalc(data.estimated1RM);
                }}
                className="p-3.5 rounded-2xl bg-iron-950 border border-iron-800/80 hover:border-amber-500/50 space-y-1 text-center cursor-pointer transition group"
                title={
                  lang === 'sv'
                    ? 'Klicka för att visa graf och skivladdning'
                    : 'Click to view chart and plate loading'
                }
              >
                <div className="text-xs font-bold text-iron-300 group-hover:text-amber-300 transition">
                  {lang === 'sv' ? item.labelSv : item.labelEn}
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {data ? `${data.estimated1RM} kg` : '—'}
                </div>
                {data ? (
                  <div className="text-[10px] font-mono text-iron-400 flex items-center justify-center gap-1">
                    <span>
                      {data.weightKg}kg × {data.reps}
                    </span>
                    <Disc3 className="w-3 h-3 text-amber-400 opacity-80" />
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-iron-600">
                    {lang === 'sv' ? 'Ej loggad' : 'No logs'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 1RM Progress Chart & Rep-Max Plate Table */}
      <div className="bg-iron-900/85 border border-iron-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>
                {lang === 'sv'
                  ? '1RM-Utveckling & Rep-Max Tabell'
                  : '1RM Progress Chart & Rep-Max Table'}
              </span>
            </div>
            <p className="text-xs text-iron-400">
              {lang === 'sv'
                ? 'Välj basövning för att se styrketrend och ladda exakta skivor på stången'
                : 'Select lift to inspect strength trend and exact barbell plate loading'}
            </p>
          </div>

          {delta1RM !== 0 && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                delta1RM > 0
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-iron-800 text-iron-300'
              }`}
            >
              {delta1RM > 0 ? `+${delta1RM} kg` : `${delta1RM} kg`} 1RM
            </span>
          )}
        </div>

        {/* Lift Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CHART_LIFTS.map((lift) => (
            <button
              key={lift.id}
              onClick={() => {
                playClick();
                setSelectedLiftId(lift.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedLiftId === lift.id
                  ? 'bg-amber-500 text-iron-950 font-black shadow-sm'
                  : 'bg-iron-950 text-iron-300 hover:text-white border border-iron-800'
              }`}
            >
              {lang === 'sv' ? lift.labelSv : lift.labelEn}
            </button>
          ))}
        </div>

        {/* SVG Chart */}
        {liftSeries.length > 0 ? (
          <div className="bg-iron-950 rounded-2xl p-3 sm:p-4 border border-iron-800">
            <div className="flex items-center justify-end gap-4 text-[11px] font-mono mb-2">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                {lang === 'sv' ? 'Estimerad 1RM (kg)' : 'Est. 1RM (kg)'}
              </span>
              <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                {lang === 'sv' ? 'Arbetsvikt (kg)' : 'Work Weight (kg)'}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-44 sm:h-48 overflow-visible"
            >
              {/* Horizontal Grid Lines */}
              {[0, 0.5, 1].map((t, idx) => {
                const val = Math.round(minVal + t * valSpan);
                const y = getY(val);
                return (
                  <g key={idx}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="#27272a"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-zinc-500 text-[10px] font-mono"
                    >
                      {val}kg
                    </text>
                  </g>
                );
              })}

              {/* Lines */}
              {liftSeries.length > 1 && (
                <>
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={workWeightPoints}
                  />
                  <polyline
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={oneRmPoints}
                  />
                </>
              )}

              {/* Data Points */}
              {liftSeries.map((pt, i) => {
                const cx = getX(i, liftSeries.length);
                const cy1RM = getY(pt.est1RM);
                const cyWork = getY(pt.workWeightKg);
                return (
                  <g key={i}>
                    <circle
                      cx={cx}
                      cy={cyWork}
                      r={4}
                      className="fill-sky-400 stroke-iron-950 stroke-2 cursor-pointer"
                      onClick={() => onOpenPlateCalc(pt.workWeightKg)}
                    />
                    <circle
                      cx={cx}
                      cy={cy1RM}
                      r={5}
                      className="fill-amber-400 stroke-iron-950 stroke-2 cursor-pointer"
                      onClick={() => onOpenPlateCalc(pt.est1RM)}
                    />
                    <text
                      x={cx}
                      y={cy1RM - 9}
                      textAnchor="middle"
                      className="fill-amber-300 text-[10px] font-mono font-bold"
                    >
                      {pt.est1RM}
                    </text>
                    <text
                      x={cx}
                      y={chartH - 8}
                      textAnchor="middle"
                      className="fill-zinc-400 text-[10px] font-mono"
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="bg-iron-950/70 rounded-2xl p-4 border border-iron-800/80 text-center space-y-1">
            <p className="text-xs font-bold text-slate-300">
              {lang === 'sv'
                ? `Inga loggade pass för ${selectedLiftMeta.labelSv} ännu — visar referenstabell utifrån ${active1RM} kg 1RM nedan.`
                : `No logged sessions for ${selectedLiftMeta.labelEn} yet — showing reference table for ${active1RM} kg 1RM below.`}
            </p>
            <p className="text-[11px] text-iron-500">
              {lang === 'sv'
                ? 'Klicka på valfri rad nedan för att öppna skivkalkylatorn!'
                : 'Tap any row below to launch the barbell plate loader!'}
            </p>
          </div>
        )}

        {/* Rep-Max & Percentage Table with 1-Click Plate Loader */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {repMaxRows.map((row) => {
            const targetKg =
              Math.round((active1RM * row.factor) / 2.5) * 2.5;
            return (
              <button
                key={row.pct}
                onClick={() => {
                  playClick();
                  onOpenPlateCalc(targetKg);
                }}
                className="p-3 rounded-2xl bg-iron-950 hover:bg-iron-900 border border-iron-800 hover:border-amber-500/50 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-iron-400">
                  <span>{row.pct}%</span>
                  <Disc3 className="w-3 h-3 text-amber-400 opacity-75 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-base font-black font-mono text-white mt-0.5">
                  {targetKg} kg
                </div>
                <div className="text-[10px] font-bold text-amber-400">
                  {row.reps}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout History List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-iron-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>
            {lang === 'sv' ? 'Tidigare Träningspass' : 'Workout History'}
          </span>
        </h3>

        {logs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-iron-900/50 border border-dashed border-iron-800 text-center space-y-2">
            <Dumbbell className="w-8 h-8 text-iron-600 mx-auto" />
            <h4 className="font-bold text-sm text-iron-300">
              {lang === 'sv'
                ? 'Inga pass loggade än'
                : 'No workouts logged yet'}
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
                      <span className="font-black text-base text-white">
                        {log.workoutName}
                      </span>
                      <span className="text-[11px] font-mono text-iron-400">
                        • {formatDate(log.completedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-iron-400 font-mono">
                      <span>Volym: {log.totalVolumeKg} kg</span>
                      {log.durationSeconds > 0 && (
                        <span>
                          Tid: {Math.round(log.durationSeconds / 60)} min
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          lang === 'sv'
                            ? 'Vill du radera detta pass?'
                            : 'Delete this workout?'
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
                    const repsStr = completed
                      .map((s) => s.actualReps ?? 0)
                      .join('/');
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (weight >= 20) {
                            playClick();
                            onOpenPlateCalc(weight);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-iron-950/70 border border-iron-800/80 hover:border-amber-500/40 text-xs space-y-0.5 cursor-pointer transition"
                      >
                        <div className="font-bold text-slate-200 truncate">
                          {getExerciseName(exState.exerciseId)}
                        </div>
                        <div className="font-mono text-amber-400 font-bold">
                          {weight} kg{' '}
                          <span className="text-iron-400 font-normal">
                            ({repsStr})
                          </span>
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
                      {lang === 'sv'
                        ? 'Nytt personbästa i passet!'
                        : 'Personal record set!'}
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
