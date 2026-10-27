import React, { useState } from 'react';
import { WorkoutSessionLog, Language } from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import {
  Dumbbell,
  Trash2,
  TrendingUp,
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
  const prs: Record<string, { weightKg: number; reps: number; estimated1RM: number }> = {};

  CHART_LIFTS.forEach(({ id }) => {
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
  const chartH = 180;
  const padL = 42;
  const padR = 24;
  const padT = 22;
  const padB = 30;
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

  const repMaxRows = [
    { pct: 100, reps: '1 RM', factor: 1.0 },
    { pct: 92, reps: '3 RM', factor: 0.92 },
    { pct: 86, reps: '5 RM (5×5)', factor: 0.86 },
    { pct: 79, reps: '8 RM', factor: 0.79 },
    { pct: 74, reps: '10 RM', factor: 0.74 },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto select-none">
      {/* Header Strip */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 border-[#262626] pb-4">
        <div>
          <div className="text-[11px] font-mono uppercase text-[#FF5500] font-bold tracking-wider">
            {lang === 'sv' ? 'STYRKEPROGRESSION & HISTORIK' : 'STRENGTH PROGRESSION & LOGBOOK'}
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wide text-[#F5F3EF] leading-none mt-1">
            {lang === 'sv' ? 'Loggbok & Estimerad 1RM' : 'Logbook & Est. 1RM'}
          </h1>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs text-[#9A978E]">
          <div>
            <span className="text-[#6E6C65] uppercase">Pass: </span>
            <strong className="text-[#F5F3EF]">{totalWorkouts}</strong>
          </div>
          <div>
            <span className="text-[#6E6C65] uppercase">Volym: </span>
            <strong className="text-[#FF5500]">
              {totalVolumeKg >= 1000
                ? `${(totalVolumeKg / 1000).toFixed(1)} t`
                : `${totalVolumeKg} kg`}
            </strong>
          </div>
        </div>
      </section>

      {/* 1RM Selector & Chart Card */}
      <section className="bg-[#181818] border border-[#282828] rounded p-4 sm:p-6 space-y-4">
        {/* Lift Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242424] pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {CHART_LIFTS.map((lift) => {
              const isSelected = selectedLiftId === lift.id;
              const prVal = prs[lift.id]?.estimated1RM;
              return (
                <button
                  key={lift.id}
                  onClick={() => {
                    playClick();
                    setSelectedLiftId(lift.id);
                  }}
                  className={`px-3 py-1 rounded-sm font-display font-bold uppercase tracking-wider text-sm transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF5500] text-[#111111]'
                      : 'bg-[#111111] border border-[#282828] text-[#9A978E] hover:text-[#F5F3EF]'
                  }`}
                >
                  <span>{lang === 'sv' ? lift.labelSv : lift.labelEn}</span>
                  {prVal && (
                    <span className="ml-1.5 font-mono text-xs opacity-80">
                      {prVal}kg
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              playClick();
              onOpenPlateCalc(active1RM);
            }}
            className="px-2.5 py-1 rounded bg-[#111111] border border-[#282828] hover:border-[#FF5500] text-xs font-mono text-[#9A978E] hover:text-[#F5F3EF] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Disc3 className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>{active1RM} kg Skivor</span>
          </button>
        </div>

        {/* SVG Chart */}
        {liftSeries.length > 0 ? (
          <div className="bg-[#111111] rounded p-3 border border-[#242424]">
            <div className="flex items-center justify-between text-[11px] font-mono mb-2">
              <span className="text-[#9A978E] uppercase">
                {lang === 'sv' ? selectedLiftMeta.labelSv : selectedLiftMeta.labelEn} — 1RM: <strong className="text-[#FF5500]">{active1RM} kg</strong>
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[#FF5500] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#FF5500] inline-block" />
                  1RM
                </span>
                <span className="flex items-center gap-1.5 text-[#9A978E] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#9A978E] inline-block" />
                  {lang === 'sv' ? 'Arbetsvikt' : 'Work Weight'}
                </span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-40 sm:h-44 overflow-visible"
            >
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
                      stroke="#242424"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#6E6C65] text-[10px] font-mono"
                    >
                      {val}kg
                    </text>
                  </g>
                );
              })}

              {liftSeries.length > 1 && (
                <>
                  <polyline
                    fill="none"
                    stroke="#9A978E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={workWeightPoints}
                  />
                  <polyline
                    fill="none"
                    stroke="#FF5500"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={oneRmPoints}
                  />
                </>
              )}

              {liftSeries.map((pt, i) => {
                const cx = getX(i, liftSeries.length);
                const cy1RM = getY(pt.est1RM);
                const cyWork = getY(pt.workWeightKg);
                return (
                  <g key={i}>
                    <circle
                      cx={cx}
                      cy={cyWork}
                      r={3.5}
                      className="fill-[#9A978E] stroke-[#111111] stroke-2 cursor-pointer"
                      onClick={() => onOpenPlateCalc(pt.workWeightKg)}
                    />
                    <circle
                      cx={cx}
                      cy={cy1RM}
                      r={4.5}
                      className="fill-[#FF5500] stroke-[#111111] stroke-2 cursor-pointer"
                      onClick={() => onOpenPlateCalc(pt.est1RM)}
                    />
                    <text
                      x={cx}
                      y={cy1RM - 8}
                      textAnchor="middle"
                      className="fill-[#F5F3EF] text-[10px] font-mono font-bold"
                    >
                      {pt.est1RM}
                    </text>
                    <text
                      x={cx}
                      y={chartH - 6}
                      textAnchor="middle"
                      className="fill-[#6E6C65] text-[10px] font-mono"
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="bg-[#111111] rounded p-3.5 border border-[#242424] flex items-center justify-between text-xs text-[#9A978E]">
            <span>
              {lang === 'sv'
                ? `Referenstabell för ${selectedLiftMeta.labelSv} (${active1RM} kg 1RM) — tryck på en vikt för skivladdning:`
                : `Reference table for ${selectedLiftMeta.labelEn} (${active1RM} kg 1RM) — tap any weight for plate loading:`}
            </span>
            <TrendingUp className="w-4 h-4 text-[#FF5500] shrink-0" />
          </div>
        )}

        {/* Rep-Max Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {repMaxRows.map((row) => {
            const targetKg = Math.round((active1RM * row.factor) / 2.5) * 2.5;
            return (
              <button
                key={row.pct}
                onClick={() => {
                  playClick();
                  onOpenPlateCalc(targetKg);
                }}
                className="p-2.5 rounded bg-[#111111] hover:bg-[#1F1F1F] border border-[#282828] hover:border-[#FF5500] text-left transition cursor-pointer"
              >
                <div className="text-[10px] font-mono text-[#6E6C65]">{row.pct}% • {row.reps}</div>
                <div className="font-mono font-extrabold text-base text-[#F5F3EF] mt-0.5">
                  {targetKg} <span className="text-xs font-normal text-[#9A978E]">kg</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Chronological Workout Logbook */}
      <section className="space-y-3 pb-12">
        <h2 className="font-display font-bold text-lg uppercase tracking-wider text-[#9A978E]">
          {lang === 'sv' ? 'Loggade Träningspass' : 'Logged Workouts'}
        </h2>

        {logs.length === 0 ? (
          <div className="p-8 rounded bg-[#181818] border border-dashed border-[#282828] text-center space-y-2">
            <Dumbbell className="w-7 h-7 text-[#6E6C65] mx-auto" />
            <div className="font-display font-bold text-lg uppercase text-[#F5F3EF]">
              {lang === 'sv' ? 'Inga pass loggade ännu' : 'No workouts logged yet'}
            </div>
            <p className="text-xs text-[#9A978E] max-w-sm mx-auto">
              {lang === 'sv'
                ? 'Bocka av dina 5×5 set under Dagens Pass och tryck på Logga & Avsluta Pass.'
                : 'Check off your 5×5 sets on Today’s Workout and tap Finish & Log Workout.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-[#181818] border border-[#282828] rounded p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-xl uppercase tracking-wide text-[#F5F3EF]">
                        {log.workoutName}
                      </span>
                      <span className="text-xs font-mono text-[#6E6C65]">
                        • {formatDate(log.completedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9A978E] font-mono mt-0.5">
                      <span>Volym: <strong className="text-[#FF5500]">{log.totalVolumeKg} kg</strong></span>
                      {log.durationSeconds > 0 && (
                        <span>Tid: {Math.max(1, Math.round(log.durationSeconds / 60))} min</span>
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
                    className="p-1.5 rounded text-[#6E6C65] hover:text-[#FF5500] transition cursor-pointer"
                    title="Radera pass"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#242424]">
                  {log.exercises.map((exState, idx) => {
                    const completed = exState.sets.filter((s) => s.isCompleted);
                    const weight = completed[0]?.weightKg ?? 0;
                    const repsStr = completed.map((s) => s.actualReps ?? 0).join('/');
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (weight >= 20) {
                            playClick();
                            onOpenPlateCalc(weight);
                          }
                        }}
                        className="p-2.5 rounded-sm bg-[#111111] border border-[#242424] hover:border-[#FF5500] text-xs space-y-0.5 cursor-pointer transition"
                      >
                        <div className="font-bold text-[#F5F3EF] truncate">
                          {getExerciseName(exState.exerciseId)}
                        </div>
                        <div className="font-mono text-[#FF5500] font-bold">
                          {weight} kg{' '}
                          <span className="text-[#6E6C65] font-normal">({repsStr || '—'})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
