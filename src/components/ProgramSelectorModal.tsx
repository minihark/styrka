import React from 'react';
import { Program, Language, UserProfile } from '../types';
import { EXERCISE_CATALOG } from '../data/exercises';
import { X, Check, Repeat, Cloud, ArrowRight } from 'lucide-react';
import { playClick, playIronClick } from '../utils/audio';
import { saveUserProfile } from '../utils/storage';

interface ProgramSelectorModalProps {
  programs: Program[];
  activeProgramId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectProgram: (programId: string) => void;
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
  profile?: UserProfile;
  onProfileChange?: (profile: UserProfile) => void;
  onOpenSyncModal?: () => void;
}

export const ProgramSelectorModal: React.FC<ProgramSelectorModalProps> = ({
  programs,
  activeProgramId,
  isOpen,
  onClose,
  onSelectProgram,
  lang,
  onLanguageChange,
  profile,
  onProfileChange,
  onOpenSyncModal,
}) => {
  if (!isOpen) return null;

  const alternateSquatDeadlift = profile?.alternateSquatDeadlift ?? true;

  const handleToggleAlternate = () => {
    if (!profile || !onProfileChange) return;
    playIronClick();
    const updated: UserProfile = {
      ...profile,
      alternateSquatDeadlift: !alternateSquatDeadlift,
    };
    saveUserProfile(updated);
    onProfileChange(updated);
  };

  const getExerciseName = (id: string) => {
    const ex = EXERCISE_CATALOG.find((e) => e.id === id);
    if (!ex) return id;
    return lang === 'sv' ? ex.nameSv : ex.name;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-xl w-full bg-[#181818] border border-[#363636] rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#282828] flex items-center justify-between bg-[#111111]">
          <div>
            <h2 className="font-display font-black text-2xl uppercase tracking-wide text-[#F5F3EF]">
              {lang === 'sv' ? 'Program & Inställningar' : 'Program & Settings'}
            </h2>
            <p className="text-xs text-[#9A978E]">
              {lang === 'sv'
                ? 'Välj träningsprogram, marklyfts-cykel och molnsynk'
                : 'Select workout program, deadlift cycle and cloud sync'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded bg-[#181818] border border-[#282828] text-[#9A978E] hover:text-[#F5F3EF] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Quick Gym Settings Strip */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#9A978E]">
              {lang === 'sv' ? 'Inställningar' : 'Preferences'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Alternating Squat / Deadlift Toggle */}
              {profile && onProfileChange && (
                <button
                  onClick={handleToggleAlternate}
                  className={`p-3 rounded border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                    alternateSquatDeadlift
                      ? 'bg-[#111111] border-[#FF5500] text-[#F5F3EF]'
                      : 'bg-[#111111] border-[#282828] text-[#9A978E]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Repeat className="w-4 h-4 text-[#FF5500] shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#F5F3EF] truncate">
                        {lang === 'sv' ? 'Alternera Böj / Mark' : 'Alternate Squat / DL'}
                      </div>
                      <div className="text-[10px] text-[#9A978E] truncate">
                        {alternateSquatDeadlift
                          ? lang === 'sv'
                            ? 'Pass B kör Marklyft + Chins'
                            : 'Day B runs Deadlift + Pull-ups'
                          : lang === 'sv'
                          ? 'Knäböj varje pass'
                          : 'Squat every session'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-bold ${
                      alternateSquatDeadlift
                        ? 'bg-[#FF5500] text-[#111111]'
                        : 'bg-[#282828] text-[#9A978E]'
                    }`}
                  >
                    {alternateSquatDeadlift ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {/* Cloud Sync & Language */}
              <div className="flex gap-2">
                {onOpenSyncModal && (
                  <button
                    onClick={() => {
                      playClick();
                      onClose();
                      onOpenSyncModal();
                    }}
                    className="flex-1 p-3 rounded bg-[#111111] border border-[#282828] hover:border-[#FF5500] text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-[#FF5500]" />
                      <div>
                        <div className="text-xs font-bold text-[#F5F3EF]">
                          {profile?.displayName || (lang === 'sv' ? 'Molnsynk' : 'Cloud Sync')}
                        </div>
                        <div className="text-[10px] text-[#9A978E]">
                          {profile?.isCloudSynced
                            ? lang === 'sv'
                              ? 'Synkad'
                              : 'Synced'
                            : lang === 'sv'
                            ? 'Lokal profil'
                            : 'Local profile'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9A978E]" />
                  </button>
                )}

                {onLanguageChange && (
                  <button
                    onClick={() => {
                      playClick();
                      onLanguageChange(lang === 'sv' ? 'en' : 'sv');
                    }}
                    className="px-3.5 rounded bg-[#111111] border border-[#282828] hover:border-[#FF5500] font-mono text-xs font-bold text-[#F5F3EF] transition cursor-pointer"
                    title="Switch Language"
                  >
                    {lang === 'sv' ? 'SV' : 'EN'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Programs List */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#9A978E]">
              {lang === 'sv' ? 'Träningsprogram' : 'Workout Programs'}
            </div>

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
                  className={`p-4 rounded border transition-all cursor-pointer text-left space-y-2.5 ${
                    isActive
                      ? 'bg-[#111111] border-2 border-[#FF5500]'
                      : 'bg-[#111111] border-[#282828] hover:border-[#6E6C65]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-black text-xl uppercase tracking-wide text-[#F5F3EF]">
                        {lang === 'sv' ? prog.nameSv : prog.name}
                      </h3>
                      <p className="text-xs text-[#9A978E] mt-0.5">
                        {lang === 'sv' ? prog.descriptionSv : prog.description}
                      </p>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-sm bg-[#FF5500] text-[#111111] font-mono text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>{lang === 'sv' ? 'Aktivt' : 'Active'}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {prog.workouts.map((w) => (
                      <div
                        key={w.id}
                        className="p-2.5 rounded-sm bg-[#181818] border border-[#242424] text-xs"
                      >
                        <div className="font-display font-bold uppercase tracking-wider text-[#FF5500] flex items-center justify-between">
                          <span>{lang === 'sv' ? w.nameSv : w.name}</span>
                          <span className="text-[10px] text-[#6E6C65] font-mono">
                            {w.targetSets}×{w.targetReps}
                          </span>
                        </div>
                        <div className="text-[#9A978E] text-[11px] truncate mt-0.5">
                          {w.exerciseIds.map((id) => getExerciseName(id)).join(' • ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
