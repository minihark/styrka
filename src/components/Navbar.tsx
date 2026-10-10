import React from 'react';
import { Language, UserProfile, Program } from '../types';
import {
  Dumbbell,
  BookOpen,
  Calendar,
  Cloud,
  Check,
  Languages,
  User,
  Flame,
  Layers,
} from 'lucide-react';
import { playClick } from '../utils/audio';

interface NavbarProps {
  currentProgram: Program;
  profile: UserProfile;
  activeView: 'workout' | 'history';
  onViewChange: (view: 'workout' | 'history') => void;
  onOpenProgramSelector: () => void;
  onOpenSyncModal: () => void;
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
  onLanguageChange,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-iron-800/80 bg-iron-950/90 backdrop-blur-md w-full select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-lg shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30 flex-shrink-0">
            🏋️
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-400 bg-clip-text text-transparent">
                Styrka
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hidden sm:inline-block">
                5x5
              </span>
            </div>
            <p className="text-[11px] text-iron-400 hidden md:block truncate">
              {lang === 'sv'
                ? 'Taktil träningsdagbok för skivstång & hantlar'
                : 'Tactile 5x5 journal for barbells & dumbbells'}
            </p>
          </div>
        </div>

        {/* Center / Program Badge (1-click program switch) */}
        <button
          onClick={() => {
            playClick();
            onOpenProgramSelector();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-iron-700 bg-iron-900/80 hover:bg-iron-850 hover:border-amber-500/40 text-xs font-bold text-slate-200 transition cursor-pointer max-w-[160px] sm:max-w-xs truncate"
          title={lang === 'sv' ? 'Byt eller anpassa träningsprogram' : 'Switch or customize program'}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate">
            {lang === 'sv' ? currentProgram.nameSv : currentProgram.name}
          </span>
          <span className="text-[10px] text-iron-500 hidden sm:inline font-normal">▾</span>
        </button>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Switcher: Workout vs History */}
          <div className="flex items-center p-1 bg-iron-900 border border-iron-800 rounded-xl">
            <button
              onClick={() => {
                playClick();
                onViewChange('workout');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeView === 'workout'
                  ? 'bg-amber-500 text-iron-950 shadow-sm font-black'
                  : 'text-iron-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'sv' ? 'Pass' : 'Workout'}</span>
            </button>
            <button
              onClick={() => {
                playClick();
                onViewChange('history');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeView === 'history'
                  ? 'bg-amber-500 text-iron-950 shadow-sm font-black'
                  : 'text-iron-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'sv' ? 'Historik' : 'History'}</span>
            </button>
          </div>

          {/* Profile & Cloud Sync Button */}
          <button
            onClick={() => {
              playClick();
              onOpenSyncModal();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              profile.isCloudSynced
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-iron-900 border-iron-800 text-iron-300 hover:border-amber-500/40 hover:text-white'
            }`}
            title={profile.isCloudSynced ? 'Synkad till databas' : 'Lokal lagring (Klicka för att synka/byta profil)'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                profile.isCloudSynced ? 'bg-emerald-400 animate-pulse' : 'bg-iron-500'
              }`}
            />
            <span className="hidden sm:inline truncate max-w-[80px]">
              {profile.displayName || profile.username || (lang === 'sv' ? 'Profil' : 'Profile')}
            </span>
            <User className="w-3.5 h-3.5 sm:hidden" />
          </button>

          {/* Language Switch */}
          <button
            onClick={() => {
              playClick();
              onLanguageChange(lang === 'sv' ? 'en' : 'sv');
            }}
            className="px-2 py-1.5 rounded-xl border border-iron-800 bg-iron-900 hover:bg-iron-850 text-iron-300 hover:text-white text-xs font-bold transition flex items-center gap-1"
            title="Byt språk / Switch Language"
          >
            <span>{lang === 'sv' ? '🇸🇪' : '🇬🇧'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
