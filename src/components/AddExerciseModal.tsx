import React, { useState, useMemo } from 'react';
import { Exercise, Language, ExerciseCategory } from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import { X, Search, Plus, Dumbbell, Sparkles, Check } from 'lucide-react';
import { playClick, playIronClick } from '../utils/audio';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
  currentExerciseIds?: string[];
  lang: Language;
  title?: string;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
  currentExerciseIds = [],
  lang,
  title,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: { id: string; labelEn: string; labelSv: string }[] = [
    { id: 'all', labelEn: 'All', labelSv: 'Alla' },
    { id: 'squat', labelEn: 'Squat', labelSv: 'Knäböj' },
    { id: 'deadlift', labelEn: 'Deadlift', labelSv: 'Marklyft' },
    { id: 'bench', labelEn: 'Bench Press', labelSv: 'Bänkpress' },
    { id: 'overhead', labelEn: 'Overhead Press', labelSv: 'Militärpress' },
    { id: 'row', labelEn: 'Rows', labelSv: 'Rodd' },
    { id: 'accessories', labelEn: 'Pull-ups / Dips', labelSv: 'Chins / Dips' },
    { id: 'arms', labelEn: 'Arms', labelSv: 'Armar' },
  ];

  const filteredExercises = useMemo(() => {
    return EXERCISE_CATALOG.filter((ex) => {
      // Category filter
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName =
          ex.name.toLowerCase().includes(query) ||
          ex.nameSv.toLowerCase().includes(query) ||
          ex.primaryMuscles.toLowerCase().includes(query) ||
          ex.primaryMusclesSv.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      return true;
    });
  }, [selectedCategory, searchTerm]);

  if (!isOpen) return null;

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
        <div className="px-6 py-5 border-b border-iron-800 flex items-center justify-between bg-iron-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {title || (lang === 'sv' ? 'Lägg till övning' : 'Add Exercise')}
              </h2>
              <p className="text-xs text-iron-400">
                {lang === 'sv'
                  ? 'Välj en övning ur katalogen för dagens pass'
                  : 'Choose an exercise from the catalog for today’s session'}
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

        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-iron-800/80 space-y-3 bg-iron-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-iron-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                lang === 'sv'
                  ? 'Sök efter övning eller muskelgrupp...'
                  : 'Search exercise or muscle group...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-iron-900 border border-iron-700 focus:border-amber-500 text-sm text-white placeholder-iron-500 outline-none transition"
              autoFocus
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-iron-950 shadow-md'
                    : 'bg-iron-800/90 hover:bg-iron-750 text-iron-300 hover:text-white'
                }`}
              >
                {lang === 'sv' ? cat.labelSv : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2 flex-1">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-iron-500 space-y-2">
              <Dumbbell className="w-10 h-10 mx-auto text-iron-600 opacity-60" />
              <p className="text-sm font-semibold">
                {lang === 'sv' ? 'Inga övningar matchade sökningen' : 'No exercises found'}
              </p>
            </div>
          ) : (
            filteredExercises.map((ex) => {
              const isAlreadyInWorkout = currentExerciseIds.includes(ex.id);

              return (
                <div
                  key={ex.id}
                  onClick={() => {
                    playIronClick();
                    onSelectExercise(ex.id);
                    onClose();
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isAlreadyInWorkout
                      ? 'bg-iron-950/60 border-iron-800/80 opacity-75 hover:opacity-100'
                      : 'bg-iron-950/90 border-iron-800 hover:border-amber-500/60 hover:bg-iron-900/90 shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                        {lang === 'sv' ? ex.nameSv : ex.name}
                      </h3>

                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-iron-800 text-iron-300 border border-iron-700">
                        {ex.equipment === 'barbell'
                          ? (lang === 'sv' ? 'Stång' : 'Barbell')
                          : ex.equipment === 'dumbbell'
                          ? (lang === 'sv' ? 'Hantel' : 'Dumbbell')
                          : (lang === 'sv' ? 'Kroppsvikt' : 'Bodyweight')}
                      </span>

                      {isAlreadyInWorkout && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-iron-800 text-iron-400">
                          {lang === 'sv' ? 'I passet' : 'In workout'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-iron-400">
                      {lang === 'sv' ? ex.primaryMusclesSv : ex.primaryMuscles} • Standard:{' '}
                      <span className="text-iron-300 font-mono font-bold">{ex.defaultSetsReps}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-iron-950 text-xs font-bold transition flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'sv' ? 'Välj' : 'Add'}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-iron-800 bg-iron-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-iron-800 hover:bg-iron-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {lang === 'sv' ? 'Avbryt' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
