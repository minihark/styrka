import React, { useState, useEffect } from 'react';
import { calculateBarbellPlates } from '../utils/storage';
import { Language } from '../types';
import { X, Disc3, Flame } from 'lucide-react';
import { playClick } from '../utils/audio';

interface PlateCalculatorModalProps {
  initialWeightKg: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyWeight?: (weightKg: number) => void;
  lang: Language;
}

const STANDARD_PLATES = [20, 15, 10, 5, 2.5, 1.25];
const COMPETITION_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeightKg,
  isOpen,
  onClose,
  onApplyWeight,
  lang,
}) => {
  const [weight, setWeight] = useState(initialWeightKg || 60);
  const [barWeight, setBarWeight] = useState(20);
  const [include25Kg, setInclude25Kg] = useState(false);

  useEffect(() => {
    if (initialWeightKg && initialWeightKg > 0) {
      setWeight(initialWeightKg);
    }
  }, [initialWeightKg]);

  if (!isOpen) return null;

  const activePlates = include25Kg ? COMPETITION_PLATES : STANDARD_PLATES;
  const result = calculateBarbellPlates(weight, barWeight, activePlates);

  const adjustWeight = (delta: number) => {
    playClick();
    setWeight((prev) => Math.max(barWeight, Number((prev + delta).toFixed(2))));
  };

  const roundToNearest25 = (w: number) =>
    Math.max(barWeight, Math.round(w / 2.5) * 2.5);

  const warmupSteps =
    weight > barWeight + 5
      ? [
          {
            label: lang === 'sv' ? 'Set 1 (Stång)' : 'Set 1 (Bar)',
            reps: '2×5',
            weightKg: barWeight,
          },
          ...(weight >= 45
            ? [
                {
                  label: 'Set 2 (40%)',
                  reps: '1×5',
                  weightKg: roundToNearest25(weight * 0.4),
                },
              ]
            : []),
          ...(weight >= 55
            ? [
                {
                  label: 'Set 3 (60%)',
                  reps: '1×3',
                  weightKg: roundToNearest25(weight * 0.6),
                },
              ]
            : []),
          ...(weight >= 65
            ? [
                {
                  label: 'Set 4 (80%)',
                  reps: '1×2',
                  weightKg: roundToNearest25(weight * 0.8),
                },
              ]
            : []),
          {
            label: lang === 'sv' ? 'Arbetsset' : 'Work Sets',
            reps: '5×5',
            weightKg: weight,
            isWork: true,
          },
        ]
      : [];

  const getPlateColorClass = (w: number) => {
    if (w >= 25) return 'bg-red-600 text-white border-red-400';
    if (w >= 20) return 'bg-blue-600 text-white border-blue-400';
    if (w >= 15) return 'bg-amber-400 text-slate-950 border-amber-300';
    if (w >= 10) return 'bg-emerald-600 text-white border-emerald-400';
    if (w >= 5) return 'bg-slate-100 text-slate-900 border-white';
    if (w >= 2.5) return 'bg-zinc-800 text-slate-100 border-zinc-500';
    return 'bg-amber-700 text-amber-100 border-amber-500';
  };

  const getPlateHeightClass = (w: number) => {
    if (w >= 25) return 'h-28 w-8 sm:w-9 text-xs';
    if (w >= 20) return 'h-24 w-8 sm:w-9 text-xs';
    if (w >= 15) return 'h-20 w-7 sm:w-8 text-[11px]';
    if (w >= 10) return 'h-16 w-6 sm:w-7 text-[10px]';
    if (w >= 5) return 'h-14 w-5 sm:w-6 text-[9px]';
    if (w >= 2.5) return 'h-11 w-4 sm:w-5 text-[8px]';
    return 'h-9 w-3.5 sm:w-4 text-[7px]';
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-iron-900 border border-iron-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-iron-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {lang === 'sv'
                  ? 'Viktskivskalkylator (20–1.25 kg)'
                  : 'Barbell Plate Loader (20–1.25 kg)'}
              </h3>
              <p className="text-xs text-iron-400">
                {lang === 'sv'
                  ? 'Exakta skivor per sida + uppvärmningstrappa'
                  : 'Exact plates per side + warmup ramp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-iron-400 hover:text-white hover:bg-iron-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Weight Input & Quick Adjusters */}
        <div className="bg-iron-950 p-4 rounded-2xl border border-iron-800 space-y-3 text-center">
          <span className="text-[10px] uppercase font-bold text-iron-400 tracking-wider">
            {lang === 'sv' ? 'Totalvikt på stången' : 'Total Barbell Weight'}
          </span>

          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => adjustWeight(-5)}
              className="px-2.5 py-2 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              -5
            </button>
            <button
              onClick={() => adjustWeight(-2.5)}
              className="px-2.5 py-2 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              -2.5
            </button>

            <div className="flex items-baseline gap-1 font-mono px-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                {weight}
              </span>
              <span className="text-sm font-bold text-iron-400">kg</span>
            </div>

            <button
              onClick={() => adjustWeight(2.5)}
              className="px-2.5 py-2 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              +2.5
            </button>
            <button
              onClick={() => adjustWeight(5)}
              className="px-2.5 py-2 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              +5
            </button>
          </div>

          {/* Quick Weight Presets */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {[40, 60, 80, 100, 120, 140, 160].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  playClick();
                  setWeight(preset);
                }}
                className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer ${
                  weight === preset
                    ? 'bg-amber-500/25 border border-amber-400 text-amber-300'
                    : 'bg-iron-900 text-iron-400 hover:text-white border border-iron-800'
                }`}
              >
                {preset}kg
              </button>
            ))}
          </div>

          {/* Bar Weight & Plate Set Toggle */}
          <div className="pt-2 border-t border-iron-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-iron-400">
                {lang === 'sv' ? 'Stång:' : 'Bar:'}
              </span>
              {[20, 15, 10].map((bw) => (
                <button
                  key={bw}
                  onClick={() => {
                    playClick();
                    setBarWeight(bw);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold font-mono transition cursor-pointer ${
                    barWeight === bw
                      ? 'bg-amber-500 text-iron-950 shadow-sm'
                      : 'bg-iron-900 text-iron-400 hover:text-white'
                  }`}
                >
                  {bw}kg
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playClick();
                setInclude25Kg((prev) => !prev);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition cursor-pointer ${
                include25Kg
                  ? 'bg-red-500/20 border-red-400 text-red-200'
                  : 'bg-iron-900 border-iron-800 text-iron-400 hover:text-white'
              }`}
              title={
                lang === 'sv'
                  ? 'Växla mellan 20/15/10/5/2.5/1.25 kg och 25 kg tävlingsskivor'
                  : 'Toggle 25 kg competition plates'
              }
            >
              {include25Kg
                ? '25/20/15/10/5/2.5/1.25'
                : '20/15/10/5/2.5/1.25 kg'}
            </button>
          </div>
        </div>

        {/* Visual Bar Sleeve Diagram */}
        <div className="bg-iron-950/70 p-4 rounded-2xl border border-iron-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-iron-300">
              {lang === 'sv' ? 'Ladda per sida:' : 'Load per side:'}
            </span>
            <span className="text-amber-400 font-mono text-sm">
              {result.weightPerSideKg.toFixed(2)} kg /{' '}
              {lang === 'sv' ? 'sida' : 'side'}
            </span>
          </div>

          {/* Sleeve & Plates Graphics */}
          <div className="py-3 flex items-center justify-center overflow-x-auto">
            {/* Barbell shaft & collar */}
            <div className="h-4 w-10 sm:w-12 bg-iron-700 rounded-l-md border-r-4 border-iron-500 shadow-inner flex-shrink-0" />
            <div className="h-10 w-3.5 bg-iron-600 border-r-2 border-iron-400 rounded-sm flex-shrink-0" />

            {/* Plates array */}
            <div className="flex items-center gap-1 pl-1">
              {result.platesPerSide.flatMap((p, i) =>
                Array.from({ length: p.count }).map((_, cIdx) => (
                  <div
                    key={`${i}-${cIdx}`}
                    className={`rounded-md border-2 font-mono font-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 select-none flex-shrink-0 ${getPlateColorClass(
                      p.weight
                    )} ${getPlateHeightClass(p.weight)}`}
                    title={`${p.weight} kg`}
                  >
                    <span className="transform -rotate-90 whitespace-nowrap">
                      {p.weight}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Bar sleeve extending */}
            <div className="h-4 flex-1 min-w-[24px] max-w-[56px] bg-iron-700 rounded-r-md border-l-2 border-iron-800 shadow-inner flex-shrink-0" />
          </div>

          {/* Exact Plate Inventory Breakdown (20 / 15 / 10 / 5 / 2.5 / 1.25 kg) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
            {STANDARD_PLATES.map((plateW) => {
              const found = result.platesPerSide.find(
                (p) => p.weight === plateW
              );
              const count = found ? found.count : 0;
              return (
                <div
                  key={plateW}
                  className={`p-2 rounded-xl border text-center font-mono transition ${
                    count > 0
                      ? 'bg-iron-900 border-amber-500/50 text-white shadow-sm'
                      : 'bg-iron-950/60 border-iron-800/60 text-iron-600'
                  }`}
                >
                  <div className="text-[10px] font-bold">{plateW} kg</div>
                  <div
                    className={`text-sm font-black ${
                      count > 0 ? 'text-amber-400' : 'text-iron-600'
                    }`}
                  >
                    ×{count}
                  </div>
                </div>
              );
            })}
          </div>

          {result.remainderKg > 0 && (
            <p className="text-[11px] text-amber-400/90 text-center font-mono">
              {lang === 'sv'
                ? `Obs: ${result.remainderKg.toFixed(2)} kg rest (kräver mikro-skivor 0.5 kg)`
                : `Note: ${result.remainderKg.toFixed(2)} kg remainder (requires micro-plates)`}
            </p>
          )}
        </div>

        {/* Warmup Ramp Calculator */}
        {warmupSteps.length > 0 && (
          <div className="bg-iron-950/70 p-4 rounded-2xl border border-iron-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>
                {lang === 'sv'
                  ? 'Rekommenderad Uppvärmningstrappa'
                  : 'Recommended Warmup Ramp'}
              </span>
            </div>
            <div className="space-y-1.5">
              {warmupSteps.map((step, idx) => {
                const stepPlates = calculateBarbellPlates(
                  step.weightKg,
                  barWeight,
                  activePlates
                );
                const plateSummary =
                  stepPlates.platesPerSide.length === 0
                    ? lang === 'sv'
                      ? 'Tom stång'
                      : 'Empty bar'
                    : stepPlates.platesPerSide
                        .map((p) => `${p.count}×${p.weight}`)
                        .join(' + ') + ' kg/sida';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      playClick();
                      setWeight(step.weightKg);
                    }}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono cursor-pointer transition ${
                      step.isWork
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold'
                        : 'bg-iron-900/70 border-iron-800 text-slate-300 hover:border-iron-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{step.label}</span>
                      <span className="text-iron-400">({step.reps})</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-iron-400">
                        {plateSummary}
                      </span>
                      <span className="font-black text-white">
                        {step.weightKg} kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-iron-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-iron-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            {lang === 'sv' ? 'Stäng' : 'Close'}
          </button>

          {onApplyWeight && (
            <button
              onClick={() => {
                onApplyWeight(weight);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-iron-950 font-black text-xs shadow-md transition cursor-pointer"
            >
              {lang === 'sv' ? `Använd ${weight} kg` : `Use ${weight} kg`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
