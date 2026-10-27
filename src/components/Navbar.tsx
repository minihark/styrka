import React from 'react';
import { Language, UserProfile, Program } from '../types';
import { SlidersHorizontal } from 'lucide-react';
import { playClick } from '../utils/audio';

interface NavbarProps {
  currentProgram: Program;
  profile: UserProfile;
  activeView: 'workout' | 'history';
  onViewChange: (view: 'workout' | 'history') => void;
  onOpenProgramSelector: () => void;
  onOpenSyncModal: () => void;
  onOpenPlateCalc: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProgram,
  profile,
  activeView,
  onViewChange,
  onOpenProgramSelector,
  onOpenSyncModal,
  lang,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#262626] bg-[#111111]/95 backdrop-blur-sm w-full select-none">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: Stenciled Gym Brand & Active Program Trigger */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              playClick();
              onViewChange('workout');
            }}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <span className="px-1.5 py-0.5 bg-[#FF5500] text-[#111111] font-display font-black text-sm tracking-wider uppercase leading-none">
              5×5
            </span>
            <span className="font-display font-black text-2xl tracking-wider uppercase text-[#F5F3EF] group-hover:text-[#FF5500] transition-colors leading-none">
              STYRKA
            </span>
          </button>

          <span className="text-[#363636] hidden sm:inline">/</span>

          <button
            onClick={() => {
              playClick();
              onOpenProgramSelector();
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#9A978E] hover:text-[#F5F3EF] transition cursor-pointer truncate max-w-[200px]"
            title={lang === 'sv' ? 'Byt träningsprogram eller inställningar' : 'Change program or settings'}
          >
            <span className="truncate">
              {lang === 'sv' ? currentProgram.nameSv : currentProgram.name}
            </span>
            <span className="text-[10px] text-[#FF5500]">▾</span>
          </button>
        </div>

        {/* Right: Segmented Pass/Loggbok Switch + Quiet Settings Drawer Trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#181818] border border-[#282828] p-0.5 rounded">
            <button
              onClick={() => {
                playClick();
                onViewChange('workout');
              }}
              className={`px-3 py-1 rounded-sm font-display font-bold uppercase tracking-wider text-sm transition cursor-pointer ${
                activeView === 'workout'
                  ? 'bg-[#FF5500] text-[#111111]'
                  : 'text-[#9A978E] hover:text-[#F5F3EF]'
              }`}
            >
              {lang === 'sv' ? 'Dagens Pass' : 'Workout'}
            </button>
            <button
              onClick={() => {
                playClick();
                onViewChange('history');
              }}
              className={`px-3 py-1 rounded-sm font-display font-bold uppercase tracking-wider text-sm transition cursor-pointer ${
                activeView === 'history'
                  ? 'bg-[#FF5500] text-[#111111]'
                  : 'text-[#9A978E] hover:text-[#F5F3EF]'
              }`}
            >
              {lang === 'sv' ? 'Loggbok & 1RM' : 'Logbook'}
            </button>
          </div>

          <button
            onClick={() => {
              playClick();
              onOpenProgramSelector();
            }}
            className="p-2 rounded bg-[#181818] border border-[#282828] hover:border-[#FF5500] text-[#9A978E] hover:text-[#F5F3EF] transition cursor-pointer relative"
            title={lang === 'sv' ? 'Program, Profil & Inställningar' : 'Program, Profile & Settings'}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {profile.isCloudSynced && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] absolute top-1 right-1" />
            )}
          </button>

          <button
            onClick={() => {
              playClick();
              onOpenSyncModal();
            }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#181818] border border-[#282828] hover:border-[#FF5500] text-xs font-mono text-[#9A978E] hover:text-[#F5F3EF] transition cursor-pointer"
            title={lang === 'sv' ? 'Molnsynk & Profil' : 'Cloud Sync & Profile'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                profile.isCloudSynced ? 'bg-[#FF5500]' : 'bg-[#6E6C65]'
              }`}
            />
            <span className="truncate max-w-[76px]">
              {profile.displayName || profile.username || (lang === 'sv' ? 'Synk' : 'Sync')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
