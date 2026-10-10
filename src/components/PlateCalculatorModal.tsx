import React, { useState } from 'react';
import { calculateBarbellPlates } from '../utils/storage';
import { Language } from '../types';
import { X, Plus, Minus, Disc3 } from 'lucide-react';
import { playClick } from '../utils/audio';

interface PlateCalculatorModalProps {
  initialWeightKg: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyWeight?: (weightKg: number) => void;
  lang: Language;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeightKg,
  isOpen,
  onClose,
  onApplyWeight,
  lang,
}) => {
  const [weight, setWeight] = useState(initialWeightKg || 60);
  const [barWeight, setBarWeight] = useState(20);

  if (!isOpen) return null;

  const result = calculateBarbellPlates(weight, barWeight);

  const adjustWeight = (delta: number) => {
    playClick();
    setWeight((prev) => Math.max(barWeight, Number((prev + delta).toFixed(2))));
  };

  const getPlateColorClass = (w: number) => {
    if (w >= 25) return 'bg-red-600 text-white border-red-500';
    if (w >= 20) return 'bg-blue-600 text-white border-blue-500';
    if (w >= 15) return 'bg-yellow-500 text-black border-yellow-400';
    if (w >= 10) return 'bg-emerald-600 text-white border-emerald-500';
    if (w >= 5) return 'bg-slate-200 text-slate-900 border-white';
    if (w >= 2.5) return 'bg-zinc-800 text-slate-200 border-zinc-600';
    return 'bg-zinc-600 text-zinc-100 border-zinc-400';
  };

  const getPlateHeightClass = (w: number) => {
    if (w >= 20) return 'h-24 w-8 sm:w-10 text-xs';
    if (w >= 15) return 'h-20 w-7 sm:w-8 text-[11px]';
    if (w >= 10) return 'h-16 w-6 sm:w-7 text-[10px]';
    if (w >= 5) return 'h-14 w-5 sm:w-6 text-[9px]';
    if (w >= 2.5) return 'h-11 w-4 sm:w-5 text-[8px]';
    return 'h-9 w-3.5 sm:w-4 text-[7px]';
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-iron-900 border border-iron-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-iron-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'sv' ? 'Viktskivskalkylator' : 'Barbell Plate Calculator'}
              </h3>
              <p className="text-xs text-iron-400">
                {lang === 'sv'
                  ? 'Se exakt vilka viktskivor du ska ladda per sida'
                  : 'See exact plate loading configuration per side'}
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

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => adjustWeight(-5)}
              className="p-2.5 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
            >
              -5
            </button>
            <button
              onClick={() => adjustWeight(-2.5)}
              className="p-2.5 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
            >
              -2.5
            </button>

            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-4xl font-black text-amber-400 tracking-tight">{weight}</span>
              <span className="text-sm font-bold text-iron-400">kg</span>
            </div>

            <button
              onClick={() => adjustWeight(2.5)}
              className="p-2.5 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
            >
              +2.5
            </button>
            <button
              onClick={() => adjustWeight(5)}
              className="p-2.5 rounded-xl bg-iron-900 hover:bg-iron-800 text-iron-300 font-mono text-xs font-bold transition"
            >
              +5
            </button>
          </div>

          {/* Bar Weight Toggle */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs">
            <span className="text-iron-400">{lang === 'sv' ? 'Stångens vikt:' : 'Bar weight:'}</span>
            <button
              onClick={() => {
                playClick();
                setBarWeight(20);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition ${
                barWeight === 20 ? 'bg-amber-500 text-iron-950 shadow-sm' : 'bg-iron-900 text-iron-400'
              }`}
            >
              20 kg {lang === 'sv' ? '(standard)' : '(std)'}
            </button>
            <button
              onClick={() => {
                playClick();
                setBarWeight(15);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition ${
                barWeight === 15 ? 'bg-amber-500 text-iron-950 shadow-sm' : 'bg-iron-900 text-iron-400'
              }`}
            >
              15 kg
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
              {result.weightPerSideKg.toFixed(2)} kg
            </span>
          </div>

          {/* Sleeve & Plates Graphics */}
          <div className="py-4 flex items-center justify-center">
            {/* Barbell collar / collar sleeve */}
            <div className="h-4 w-12 bg-iron-700 rounded-l-md border-r-4 border-iron-500 shadow-inner" />
            <div className="h-10 w-4 bg-iron-600 border-r-2 border-iron-500 rounded-sm" />

            {/* Plates array */}
            <div className="flex items-center gap-1 pl-1">
              {result.platesPerSide.flatMap((p, i) =>
                Array.from({ length: p.count }).map((_, cIdx) => (
                  <div
                    key={`${i}-${cIdx}`}
                    className={`rounded-md border-2 font-mono font-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 select-none ${getPlateColorClass(
                      p.weight
                    )} ${getPlateHeightClass(p.weight)}`}
                    title={`${p.weight} kg`}
                  >
                    <span className="transform -rotate-90 whitespace-nowrap">{p.weight}</span>
                  </div>
                ))
              )}
            </div>

            {/* Bar sleeve extending */}
            <div className="h-4 flex-1 min-w-[24px] max-w-[60px] bg-iron-700 rounded-r-md border-l-2 border-iron-800 shadow-inner" />
          </div>

          {/* Text breakdown pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
            {result.platesPerSide.length === 0 ? (
              <span className="text-xs text-iron-500 italic">
                {lang === 'sv' ? 'Bara den tomma stången' : 'Empty bar only'}
              </span>
            ) : (
              result.platesPerSide.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-iron-900 border border-iron-700 text-xs font-mono font-bold text-white"
                >
                  {p.count} × {p.weight} kg
                </span>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-iron-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-iron-400 hover:text-white text-xs font-semibold"
          >
            {lang === 'sv' ? 'Avbryt' : 'Cancel'}
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
