import React from 'react';
import { Exercise, Language } from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import { X, BookOpen, CheckCircle2, AlertTriangle, Dumbbell, Sparkles, ArrowRight } from 'lucide-react';
import { playClick } from '../utils/audio';

interface ExerciseGuideModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSwapToAlternative?: (alternativeId: string) => void;
  lang: Language;
}

export const ExerciseGuideModal: React.FC<ExerciseGuideModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onSwapToAlternative,
  lang,
}) => {
  if (!isOpen || !exercise) return null;

  const alternatives = exercise.alternatives
    .map((id) => EXERCISE_CATALOG.find((e) => e.id === id))
    .filter(Boolean) as Exercise[];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-iron-900 border border-iron-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-iron-800 flex items-start justify-between bg-iron-950/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {exercise.equipment === 'barbell'
                  ? (lang === 'sv' ? 'Skivstång' : 'Barbell')
                  : exercise.equipment === 'dumbbell'
                  ? (lang === 'sv' ? 'Hantlar' : 'Dumbbell')
                  : (lang === 'sv' ? 'Kroppsvikt' : 'Bodyweight')}
              </span>
              <span className="text-xs text-iron-400 font-medium">
                {lang === 'sv' ? exercise.primaryMusclesSv : exercise.primaryMuscles}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {lang === 'sv' ? exercise.nameSv : exercise.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-iron-400 hover:text-white hover:bg-iron-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Quick Dumbbell / Home Gym Tip Box */}
          {(exercise.guide.dumbbellTip || exercise.guide.dumbbellTipSv) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                <span className="font-extrabold text-amber-300 uppercase tracking-wide text-[11px] block">
                  {lang === 'sv' ? 'Hemma- & Hanteltips' : 'Home & Dumbbell Note'}
                </span>
                <p className="text-amber-100/90 leading-relaxed">
                  {lang === 'sv' ? exercise.guide.dumbbellTipSv : exercise.guide.dumbbellTip}
                </p>
              </div>
            </div>
          )}

          {/* 1. Setup */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>1. {lang === 'sv' ? 'Startposition & Setup' : 'Setup & Stance'}</span>
            </h3>
            <ul className="space-y-2 bg-iron-950/70 p-4 rounded-2xl border border-iron-800 text-xs sm:text-sm">
              {(lang === 'sv' ? exercise.guide.setupSv : exercise.guide.setup).map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-iron-800 text-amber-400 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Execution */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>2. {lang === 'sv' ? 'Utförande & Andning' : 'Execution & Breathing'}</span>
            </h3>
            <ul className="space-y-2 bg-iron-950/70 p-4 rounded-2xl border border-iron-800 text-xs sm:text-sm">
              {(lang === 'sv' ? exercise.guide.executionSv : exercise.guide.execution).map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Form Cues */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <span>3. {lang === 'sv' ? 'Korta Minnesregler (Cues)' : 'Mental Cues'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(lang === 'sv' ? exercise.guide.cuesSv : exercise.guide.cues).map((cue, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs sm:text-sm font-semibold text-sky-200 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span>"{cue}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Common Mistakes */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span>4. {lang === 'sv' ? 'Vanliga Misstag att Undvika' : 'Common Mistakes'}</span>
            </h3>
            <ul className="space-y-2 bg-rose-950/15 p-4 rounded-2xl border border-rose-500/20 text-xs sm:text-sm text-rose-200">
              {(lang === 'sv' ? exercise.guide.commonMistakesSv : exercise.guide.commonMistakes).map(
                (mistake, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{mistake}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* 5. Swap to Alternatives */}
          {alternatives.length > 0 && onSwapToAlternative && (
            <div className="space-y-2.5 pt-2 border-t border-iron-800">
              <span className="text-xs font-bold uppercase tracking-wider text-iron-400 block">
                {lang === 'sv' ? 'Byt till ett alternativ i passet:' : 'Swap exercise in workout:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alternatives.map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => {
                      playClick();
                      onSwapToAlternative(alt.id);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-iron-950 border border-iron-800 hover:border-amber-500/40 text-left flex items-center justify-between group transition cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        {lang === 'sv' ? alt.nameSv : alt.name}
                      </div>
                      <div className="text-[10px] text-iron-400">
                        {alt.equipment === 'dumbbell'
                          ? (lang === 'sv' ? 'Hantelversion' : 'Dumbbell variation')
                          : (lang === 'sv' ? 'Skivstång' : 'Barbell')}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-iron-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-iron-800 bg-iron-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-iron-800 hover:bg-iron-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {lang === 'sv' ? 'Stäng guide' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
