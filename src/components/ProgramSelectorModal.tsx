import React, { useState } from 'react';
import { Program, Language } from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import { X, Check, Layers, Sparkles, Plus, Dumbbell, ArrowRight } from 'lucide-react';
import { playClick, playIronClick } from '../utils/audio';

interface ProgramSelectorModalProps {
  programs: Program[];
  activeProgramId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectProgram: (programId: string) => void;
  lang: Language;
}

export const ProgramSelectorModal: React.FC<ProgramSelectorModalProps> = ({
  programs,
  activeProgramId,
  isOpen,
  onClose,
  onSelectProgram,
  lang,
}) => {
  if (!isOpen) return null;

  const getExerciseName = (id: string) => {
    const ex = EXERCISE_CATALOG.find((e) => e.id === id);
    if (!ex) return id;
    return lang === 'sv' ? ex.nameSv : ex.name;
  };

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
        <div className="px-6 py-5 border-b border-iron-800 flex items-center justify-between bg-iron-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {lang === 'sv' ? 'Välj Träningsprogram' : 'Choose Workout Program'}
              </h2>
              <p className="text-xs text-iron-400">
                {lang === 'sv'
                  ? 'Programmen cyklar automatiskt mellan passen varje vecka'
                  : 'Programs automatically cycle between workouts each week'}
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

        {/* Programs List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {programs.map((prog) => {
            const isActive = prog.id === activeProgramId;
            return (
              <div
                key={prog.id}
                onClick={() => {
                  playIronClick();
                  onSelectProgram(prog.id);
                  onClose();
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-left space-y-3 relative group ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-iron-950/70 border-iron-800 hover:border-iron-700 hover:bg-iron-950'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                        {lang === 'sv' ? prog.nameSv : prog.name}
                      </h3>
                      {prog.cycleType === 'ab_alternating' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-iron-800 text-amber-400">
                          A/B Cykel
                        </span>
                      )}
                      {prog.id === 'stronglifts-5x5-alternating' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {lang === 'sv' ? 'Alternerande Böj/Marklyft' : 'Alternating Squat/Deadlift'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-iron-400 leading-relaxed">
                      {lang === 'sv' ? prog.descriptionSv : prog.description}
                    </p>
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'sv' ? 'Aktivt' : 'Active'}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-iron-500 group-hover:text-amber-400 transition-colors flex items-center gap-1 flex-shrink-0">
                      <span>{lang === 'sv' ? 'Välj' : 'Select'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Workouts in this program */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {prog.workouts.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl bg-iron-900/90 border border-iron-800/80 space-y-1 text-xs"
                    >
                      <div className="font-bold text-amber-400 flex items-center justify-between">
                        <span>{lang === 'sv' ? w.nameSv : w.name}</span>
                        <span className="text-[10px] text-iron-500 font-mono">
                          {w.targetSets}×{w.targetReps}
                        </span>
                      </div>
                      <div className="text-iron-300 text-[11px] truncate">
                        {w.exerciseIds.map((id) => getExerciseName(id)).join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-iron-800 bg-iron-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-iron-800 hover:bg-iron-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {lang === 'sv' ? 'Stäng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
